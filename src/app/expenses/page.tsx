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
import { Plus, Edit, Trash2, Loader2, Receipt, Filter, X, Wallet } from "lucide-react";
import { AppNavbar } from "@/components/ui/AppNavbar";
import { toast } from "sonner";

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

type Expense = {
  id: string;
  expenseDate: string;
  type: string;
  description: string;
  amount: number;
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    expenseDate: new Date().toISOString().split("T")[0],
    type: "",
    description: "",
    amount: "",
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

  const expensesByType = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => { map[e.type] = (map[e.type] || 0) + e.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const resetForm = () => {
    setFormData({ expenseDate: new Date().toISOString().split("T")[0], type: "", description: "", amount: "" });
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
        body: JSON.stringify({ expenseDate: formData.expenseDate, type: formData.type, description: formData.description, amount: parsedAmount }),
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
        body: JSON.stringify({ expenseDate: formData.expenseDate, type: formData.type, description: formData.description, amount: parsedAmount }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Update failed"); }
      toast.success("Expense updated!", { id: loadingToast });
      await fetchExpenses();
      resetForm();
      setOpen(false);
    } catch (err: any) { toast.error(err.message || "Failed to update expense", { id: loadingToast }); }
    finally { setIsSubmitting(false); }
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

  const handleOpenChange = (isOpen: boolean) => { setOpen(isOpen); if (!isOpen) resetForm(); };
  const startEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({ expenseDate: expense.expenseDate, type: expense.type, description: expense.description, amount: expense.amount.toString() });
    setOpen(true);
  };
  const formatDate = (d: string) => {
    if (!d) return "—";
    const date = new Date(d);
    return isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };
  const hasFilters = selectedType !== "all" || selectedYear !== "all" || selectedMonth !== "all";
  const clearFilters = () => { setSelectedType("all"); setSelectedYear("all"); setSelectedMonth("all"); };

  if (loading) return (
    <><AppNavbar /><div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div></>
  );

  return (
    <>
      <AppNavbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50/30">
        <div className="max-w-6xl mx-auto p-6 pt-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Receipt className="h-8 w-8 text-indigo-600" />Company Expenses
              </h1>
              <p className="text-sm text-gray-500 mt-1">Track and manage all company expenses</p>
            </div>
            <Dialog open={open} onOpenChange={handleOpenChange}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingExpense ? "Edit Expense" : "Add New Expense"}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
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
                  <Button onClick={editingExpense ? handleUpdateExpense : handleAddExpense} disabled={isSubmitting} className="w-full">
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {editingExpense ? "Update Expense" : "Add Expense"}
                  </Button>
                </div>{/* ← closes grid gap-4 py-4 */}
              </DialogContent>
            </Dialog>
          </div>{/* ← closes header flex div */}

          {/* Summary Card */}
          <Card className="mb-8 border-0 bg-white/80 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
              <Wallet className="h-5 w-5 text-indigo-600" />
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-2xl font-bold text-gray-900">Rs {totalExpenses.toLocaleString()}</div>
              <p className="text-xs text-gray-500">{expenses.length} expense{expenses.length !== 1 ? "s" : ""} recorded</p>
            </CardContent>
          </Card>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6 bg-white p-4 rounded-lg border">
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

          {/* Table */}
          <div className="rounded-lg border bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{formatDate(expense.expenseDate)}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {expense.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-600 max-w-xs truncate">{expense.description || "—"}</TableCell>
                    <TableCell className="text-right font-semibold text-gray-900">Rs {expense.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(expense)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {expenses.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No expenses found. Click &quot;Add Expense&quot; to get started.
            </div>
          )}

          {/* Breakdown by Type */}
          {expensesByType.length > 0 && (
            <div className="mt-10">
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
          )}{/* ← closes expensesByType conditional */}

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