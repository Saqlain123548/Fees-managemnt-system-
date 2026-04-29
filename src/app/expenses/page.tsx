"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Loader2, Receipt, Filter, X, Wallet, Download, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { AppNavbar } from "@/components/ui/AppNavbar";
import { toast } from "sonner";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { generateExpensesPDF } from "@/lib/pdfUtils";

const EXPENSE_TYPES = [
  "Rent", "Salary", "Utilities", "Marketing", "Maintenance",
  "Supplies", "Software", "Travel", "Insurance", "Taxes", "Other",
];

const MONTHS = [
  { value: "all", label: "All Months" },
  { value: "01", label: "January" }, { value: "02", label: "February" },
  { value: "03", label: "March" }, { value: "04", label: "April" },
  { value: "05", label: "May" }, { value: "06", label: "June" },
  { value: "07", label: "July" }, { value: "08", label: "August" },
  { value: "09", label: "September" }, { value: "10", label: "October" },
  { value: "11", label: "November" }, { value: "12", label: "December" },
];

const STATUS_OPTIONS = ["Paid", "Pending", "Due"] as const;
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PIE_COLORS = ["#4f46e5", "#7c3aed", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6", "#14b8a6", "#f97316", "#64748b"];

type ExpenseStatus = typeof STATUS_OPTIONS[number];

type Expense = {
  id: string;
  expenseDate: string;
  type: string;
  description: string;
  amount: number;
  status: ExpenseStatus;
  isActive: boolean;
  createdAt: string;
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedType, setSelectedType] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<"all" | ExpenseStatus>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [formData, setFormData] = useState({
    expenseDate: new Date().toISOString().split("T")[0],
    type: "",
    description: "",
    amount: "",
    status: "Pending" as ExpenseStatus,
  });

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    expenses.forEach((e) => {
      const year = e.expenseDate?.split("-")[0];
      if (year) years.add(year);
    });
    years.add(new Date().getFullYear().toString());
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [expenses]);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/api/expenses";
      const params = new URLSearchParams();
      if (selectedType !== "all") params.append("type", selectedType);
      if (selectedYear !== "all") params.append("year", selectedYear);
      if (selectedMonth !== "all" && selectedYear !== "all") params.append("month", selectedMonth);
      if (params.toString()) url += `?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setExpenses(data || []);
    } catch (err: any) {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedYear, selectedMonth]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + (e.amount || 0), 0), [expenses]);

  const statusCounts = useMemo(() => {
    const counts = { Paid: 0, Pending: 0, Due: 0 };
    expenses.forEach((e) => {
      if (counts[e.status as ExpenseStatus] !== undefined) counts[e.status as ExpenseStatus]++;
    });
    return counts;
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    if (selectedStatusFilter === "all") return expenses;
    return expenses.filter((e) => e.status === selectedStatusFilter);
  }, [expenses, selectedStatusFilter]);

  const monthlyChartData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      if (!e.expenseDate) return;
      const month = e.expenseDate.split("-")[1];
      if (month) {
        const idx = parseInt(month, 10) - 1;
        map[MONTH_LABELS[idx]] = (map[MONTH_LABELS[idx]] || 0) + e.amount;
      }
    });
    return MONTH_LABELS.map((m) => ({ month: m, amount: map[m] || 0 }));
  }, [expenses]);

  const typeChartData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => { map[e.type] = (map[e.type] || 0) + e.amount; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const expensesByType = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => { map[e.type] = (map[e.type] || 0) + e.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const resetForm = () => {
    setFormData({ expenseDate: new Date().toISOString().split("T")[0], type: "", description: "", amount: "", status: "Pending" });
    setEditingExpense(null);
  };

  const handleAddExpense = async () => {
    if (!formData.type.trim() || !formData.amount) { toast.error("Type and amount are required"); return; }
    const parsedAmount = parseFloat(formData.amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) { toast.error("Please enter a valid amount"); return; }
    setIsSubmitting(true);
    const loadingToast = toast.loading("Adding expense...");
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expenseDate: formData.expenseDate, type: formData.type, description: formData.description, amount: parsedAmount, status: formData.status }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Add failed"); }
      toast.success("Expense added!", { id: loadingToast });
      await fetchExpenses();
      resetForm();
      setOpen(false);
    } catch (err: any) { toast.error(err.message || "Failed to add expense", { id: loadingToast }); }
    finally { setIsSubmitting(false); }
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense) return;
    if (!formData.type.trim() || !formData.amount) { toast.error("Type and amount are required"); return; }
    const parsedAmount = parseFloat(formData.amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) { toast.error("Please enter a valid amount"); return; }
    setIsSubmitting(true);
    const loadingToast = toast.loading("Updating expense...");
    try {
      const res = await fetch(`/api/expenses/${editingExpense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expenseDate: formData.expenseDate, type: formData.type, description: formData.description, amount: parsedAmount, status: formData.status }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Update failed"); }
      toast.success("Expense updated!", { id: loadingToast });
      await fetchExpenses();
      resetForm();
      setOpen(false);
    } catch (err: any) { toast.error(err.message || "Failed to update expense", { id: loadingToast }); }
    finally { setIsSubmitting(false); }
  };

  const handleStatusChange = async (expenseId: string, newStatus: ExpenseStatus) => {
    const expense = expenses.find((e) => e.id === expenseId);
    if (!expense) return;
    try {
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expenseDate: expense.expenseDate, type: expense.type, description: expense.description, amount: expense.amount, status: newStatus }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Status update failed"); }
      toast.success(`Status updated to ${newStatus}`);
      await fetchExpenses();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const handleDelete = async (id: string) => { setExpenseToDelete(id); setDeleteDialogOpen(true); };

  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;
    const loadingToast = toast.loading("Deleting expense...");
    try {
      const res = await fetch(`/api/expenses/${expenseToDelete}`, { method: "DELETE" });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Delete failed"); }
      setExpenses((prev) => prev.filter((e) => e.id !== expenseToDelete));
      toast.success("Expense deleted", { id: loadingToast });
    } catch (err: any) { toast.error(err.message || "Failed to delete expense", { id: loadingToast }); }
  };

  const handleDownloadPDF = async () => {
    if (expenses.length === 0) { toast.error("No expenses to download"); return; }
    setIsDownloadingPDF(true);
    try {
      await generateExpensesPDF(expenses, `company-expenses-report-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF downloaded successfully");
    } catch (err: any) {
      toast.error("Failed to download PDF");
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => { setOpen(isOpen); if (!isOpen) resetForm(); };

  const startEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({ expenseDate: expense.expenseDate, type: expense.type, description: expense.description, amount: expense.amount.toString(), status: expense.status });
    setOpen(true);
  };

  const formatDate = (d: string) => {
    if (!d) return "—";
    const date = new Date(d);
    return isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const hasFilters = selectedType !== "all" || selectedYear !== "all" || selectedMonth !== "all";
  const clearFilters = () => { setSelectedType("all"); setSelectedYear("all"); setSelectedMonth("all"); };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Paid": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Pending": return "bg-amber-100 text-amber-800 border-amber-200";
      case "Due": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Paid": return <CheckCircle className="h-3.5 w-3.5" />;
      case "Pending": return <Clock className="h-3.5 w-3.5" />;
      case "Due": return <AlertTriangle className="h-3.5 w-3.5" />;
      default: return null;
    }
  };

  if (loading) return (
    <><AppNavbar /><div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div></>
  );

  return (
    <>
      <AppNavbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50/30">
        <div className="max-w-7xl mx-auto p-6 pt-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Receipt className="h-8 w-8 text-indigo-600" />Company Expenses
              </h1>
              <p className="text-sm text-gray-500 mt-1">Track and manage all company expenses</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleDownloadPDF} disabled={isDownloadingPDF} className="flex items-center gap-2">
                {isDownloadingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download PDF
              </Button>
              <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingExpense ? "Edit Expense" : "Add New Expense"}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-6 py-6 px-4">
                    <div>
                      <Label>Date *</Label>
                      <Input type="date" value={formData.expenseDate} onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })} />
                    </div>
                    <div>
                      <Label>Type *</Label>
                      <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                        <SelectTrigger><SelectValue placeholder="Select expense type" /></SelectTrigger>
                        <SelectContent>
                          {EXPENSE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Optional description" />
                    </div>
                    <div>
                      <Label>Amount (Rs) *</Label>
                      <Input type="number" min="0" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" />
                    </div>
                    <div>
                      <Label>Status *</Label>
                      <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as ExpenseStatus })}>
                        <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={editingExpense ? handleUpdateExpense : handleAddExpense} disabled={isSubmitting} className="w-full">
                      {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      {editingExpense ? "Update Expense" : "Add Expense"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Summary Card */}
          <Card className="mb-6 border-0 bg-white/80 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
              <Wallet className="h-5 w-5 text-indigo-600" />
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-2xl font-bold text-gray-900">Rs {totalExpenses.toLocaleString()}</div>
              <p className="text-xs text-gray-500">{expenses.length} expense{expenses.length !== 1 ? "s" : ""} recorded</p>
            </CardContent>
          </Card>

          {/* Status Summary */}
          <div className="flex flex-wrap items-center gap-4 mb-6 bg-white p-4 rounded-lg border">
            <span className="text-sm font-medium text-gray-700">Status Summary:</span>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <span className="text-gray-600">Paid: <span className="font-semibold text-gray-900">{statusCounts.Paid}</span></span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-gray-600">Pending: <span className="font-semibold text-gray-900">{statusCounts.Pending}</span></span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-gray-600">Due: <span className="font-semibold text-gray-900">{statusCounts.Due}</span></span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4 bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="h-4 w-4" /><span>Filters:</span>
            </div>
            <div className="w-40">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {EXPENSE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-32">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {availableYears.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={selectedYear === "all"}>
                <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {hasFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1">
                <X className="h-4 w-4" />Clear
              </Button>
            )}
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-2 mb-6">
            {(["all", "Paid", "Pending", "Due"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedStatusFilter === status
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-50 border"
                }`}
              >
                {status === "all" ? "All" : status}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="rounded-lg border bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{formatDate(expense.expenseDate)}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {expense.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-600 max-w-xs truncate">{expense.description || "—"}</TableCell>
                    <TableCell className="text-right font-semibold text-gray-900">Rs {expense.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Select value={expense.status} onValueChange={(v) => handleStatusChange(expense.id, v as ExpenseStatus)}>
                        <SelectTrigger className={`w-28 h-7 text-xs font-medium border ${getStatusBadgeClass(expense.status)}`}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(expense.status)}
                            {expense.status}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s}>
                              <span className="flex items-center gap-2">
                                {getStatusIcon(s)}
                                {s}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(expense)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredExpenses.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {expenses.length === 0
                ? "No expenses found. Click \"Add Expense\" to get started."
                : "No expenses match the selected filters."}
            </div>
          )}

          {/* Charts Section — Bottom */}
          {expenses.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 mt-8 mb-8">
              <Card className="p-6 border-0 bg-white/80">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Expenses Overview</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `Rs ${v.toLocaleString()}`} />
                    <Tooltip formatter={(value: number | string) => [`Rs ${Number(value).toLocaleString()}`, "Amount"]} />
                    <Bar dataKey="amount" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6 border-0 bg-white/80">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Expenses by Category</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={typeChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {typeChartData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number | string) => `Rs ${Number(value).toLocaleString()}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>
          ) : (
            <Card className="p-8 mt-8 mb-8 border-0 bg-white/80 text-center">
              <p className="text-gray-500 text-sm">No data yet. Add expenses to see charts.</p>
            </Card>
          )}

          {/* Breakdown by Type */}
          {expensesByType.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Breakdown by Type</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {expensesByType.map(([type, amount]) => (
                  <Card key={type} className="border-0 bg-white/80">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">{type}</span>
                        <span className="text-lg font-bold text-gray-900">Rs {amount.toLocaleString()}</span>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all"
                          style={{ width: `${totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <ConfirmationDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            title="Delete Expense"
            description="Are you sure you want to delete this expense? This action cannot be undone."
            confirmText="Delete Expense"
            cancelText="Cancel"
            onConfirm={handleConfirmDelete}
            variant="danger"
            icon="warning"
          />

        </div>
      </div>
    </>
  );
}