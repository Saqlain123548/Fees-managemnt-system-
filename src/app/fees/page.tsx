"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Loader2, Search } from "lucide-react";
import { AppNavbar } from "@/components/ui/AppNavbar";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/browser";

// Types
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface FeeRecord {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  notes: string | null;
  createdAt: string;
  student: Student | null;
}

// Helper function to format date safely
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Helper function to get year from date string
function getYearFromDate(dateString: string | null | undefined): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return date.getFullYear().toString();
}

// Helper function to get month from date string (0-indexed)
function getMonthFromDate(dateString: string | null | undefined): number {
  if (!dateString) return -1;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return -1;
  return date.getMonth();
}

// Helper function to format payment method
function formatPaymentMethod(method: string | null | undefined): string {
  if (!method) return "Cash";
  return method.charAt(0).toUpperCase() + method.slice(1);
}

// Helper function to get student name
function getStudentName(student: Student | null): string {
  if (!student) return "Unknown";
  const fullName = `${student.firstName || ""} ${student.lastName || ""}`.trim();
  return fullName || "Unknown";
}

// Month names for filter dropdown
const MONTHS = [
  { value: "0", label: "January" },
  { value: "1", label: "February" },
  { value: "2", label: "March" },
  { value: "3", label: "April" },
  { value: "4", label: "May" },
  { value: "5", label: "June" },
  { value: "6", label: "July" },
  { value: "7", label: "August" },
  { value: "8", label: "September" },
  { value: "9", label: "October" },
  { value: "10", label: "November" },
  { value: "11", label: "December" },
];

export default function FeesPage() {
  const [feesRecords, setFeesRecords] = useState<FeeRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsSummary, setStudentsSummary] = useState<{
    [key: string]: { name: string; totalPaid: number };
  }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);

  // Filter state for Payment History
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  // Payment form state
  const [payment, setPayment] = useState({
    studentId: "",
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "cash",
    notes: "",
  });

  const DEFAULT_FEE_AMOUNT = 5000; // Default total fee per student

  // Fetch fees records
  const fetchFeesRecords = useCallback(async () => {
    try {
      const res = await fetch("/api/fees");
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error ${res.status}: ${text.slice(0, 200)}...`);
      }
      const data = await res.json();
      setFeesRecords(data || []);
    } catch (err: any) {
      console.error("Fetch fees error:", err);
      toast.error("Failed to load fees records");
    }
  }, []);

  // Fetch students for dropdown
  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch("/api/students");
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error ${res.status}: ${text.slice(0, 200)}...`);
      }
      const data = await res.json();
      setStudents(data || []);
    } catch (err: any) {
      console.error("Fetch students error:", err);
      toast.error("Failed to load students");
    }
  }, []);

  // Calculate payment summary per student
  const calculateSummary = useCallback(() => {
    const summary: {
      [key: string]: { name: string; totalPaid: number };
    } = {};

    // Initialize with all students
    students.forEach((student) => {
      summary[student.id] = {
        name: `${student.firstName} ${student.lastName}`,
        totalPaid: 0,
      };
    });

    // Sum up payments per student
    feesRecords.forEach((record) => {
      if (record.student) {
        if (summary[record.student.id]) {
          summary[record.student.id].totalPaid += record.amount;
        }
      }
    });

    setStudentsSummary(summary);
  }, [students, feesRecords]);

  // Initial data fetch
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchFeesRecords(), fetchStudents()]);
      setLoading(false);
    };
    initData();
  }, [fetchFeesRecords, fetchStudents]);

  // Recalculate summary when data changes
  useEffect(() => {
    calculateSummary();
  }, [feesRecords, students, calculateSummary]);

  // Real-time subscription for fees
  useEffect(() => {
    const channel = supabase
      .channel("fees-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "fees_records",
        },
        (payload) => {
          console.log("Real-time fee change received:", payload);

          if (payload.eventType === "INSERT") {
            fetchFeesRecords();
            toast.success("New payment recorded!");
          } else if (payload.eventType === "DELETE") {
            setFeesRecords((prev) =>
              prev.filter((r) => r.id !== payload.old.id)
            );
            toast.success("Payment record deleted");
          } else if (payload.eventType === "UPDATE") {
            fetchFeesRecords();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchFeesRecords]);

  // Get available years from payment records
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    feesRecords.forEach((record) => {
      const year = getYearFromDate(record.paymentDate);
      if (year) years.add(year);
    });
    // Add current year
    const currentYear = new Date().getFullYear().toString();
    years.add(currentYear);
    // Sort years in descending order
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [feesRecords]);

  // Filtered data based on search
  const filteredSummary = Object.entries(studentsSummary).filter(([_, data]) =>
    data.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtered payment records based on year and month selection
  const filteredPaymentRecords = useMemo(() => {
    return feesRecords.filter((record) => {
      // Filter by year
      if (selectedYear !== "all") {
        const recordYear = getYearFromDate(record.paymentDate);
        if (recordYear !== selectedYear) return false;
      }
      
      // Filter by month
      if (selectedMonth !== "all") {
        const recordMonth = getMonthFromDate(record.paymentDate);
        if (recordMonth !== parseInt(selectedMonth)) return false;
      }
      
      return true;
    });
  }, [feesRecords, selectedYear, selectedMonth]);

  // Get status based on balance
  const getStatus = (totalPaid: number) => {
    if (totalPaid >= DEFAULT_FEE_AMOUNT) {
      return { badge: "Paid", className: "bg-green-100 text-green-800" };
    } else if (totalPaid > 0) {
      return { badge: "Partial", className: "bg-yellow-100 text-yellow-800" };
    } else {
      return { badge: "Pending", className: "bg-red-100 text-red-800" };
    }
  };

  // Handle add payment
  const handleAddPayment = async () => {
    if (!payment.studentId || !payment.amount) {
      toast.error("Please select a student and enter amount");
      return;
    }

    const parsedAmount = parseFloat(payment.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Recording payment...");

    try {
      const res = await fetch("/api/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: payment.studentId,
          amount: parsedAmount,
          paymentDate: payment.paymentDate,
          paymentMethod: payment.paymentMethod,
          notes: payment.notes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Payment failed");
      }

      toast.success("Payment recorded successfully!", {
        id: loadingToast,
      });

      // Reset form
      setPayment({
        studentId: "",
        amount: "",
        paymentDate: new Date().toISOString().split("T")[0],
        paymentMethod: "cash",
        notes: "",
      });
      setOpen(false);

      // Refresh data
      await fetchFeesRecords();
    } catch (err: any) {
      toast.error(err.message || "Failed to record payment", {
        id: loadingToast,
      });
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete payment
  const handleDeletePayment = async (id: string) => {
    setPaymentToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Confirm delete payment
  const handleConfirmDeletePayment = async () => {
    if (!paymentToDelete) return;

    const loadingToast = toast.loading("Deleting payment...");

    try {
      const res = await fetch(`/api/fees/${paymentToDelete}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }

      toast.success("Payment deleted successfully", { id: loadingToast });
      await fetchFeesRecords();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete payment", {
        id: loadingToast,
      });
      console.error(err);
    }
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setSelectedYear("all");
    setSelectedMonth("all");
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <AppNavbar />
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Fees Management</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 text-base">
                <Plus className="h-5 w-5" /> Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Record New Payment</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Student *</Label>
                  <Select
                    value={payment.studentId}
                    onValueChange={(v) =>
                      setPayment({ ...payment, studentId: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.firstName} {student.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount (₨) *</Label>
                    <Input
                      type="number"
                      placeholder="5000"
                      value={payment.amount}
                      onChange={(e) =>
                        setPayment({ ...payment, amount: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={payment.paymentDate}
                      onChange={(e) =>
                        setPayment({ ...payment, paymentDate: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select
                    value={payment.paymentMethod}
                    onValueChange={(v) =>
                      setPayment({ ...payment, paymentMethod: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input
                    placeholder="Optional notes"
                    value={payment.notes}
                    onChange={(e) =>
                      setPayment({ ...payment, notes: e.target.value })
                    }
                  />
                </div>
              </div>
              <Button
                onClick={handleAddPayment}
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save Payment
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search by student name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Fees Summary Table */}
        <div className="rounded-lg border bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Total Due</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSummary.map(([studentId, data]) => {
                const balance = DEFAULT_FEE_AMOUNT - data.totalPaid;
                const status = getStatus(data.totalPaid);
                const student = students.find((s) => s.id === studentId);
                return (
                  <TableRow key={studentId}>
                    <TableCell className="font-medium">{data.name}</TableCell>
                    <TableCell className="text-gray-500">
                      {student?.email || "—"}
                    </TableCell>
                    <TableCell>₨ {DEFAULT_FEE_AMOUNT.toLocaleString()}</TableCell>
                    <TableCell className="text-green-600">
                      ₨ {data.totalPaid.toLocaleString()}
                    </TableCell>
                    <TableCell
                      className={
                        balance > 0 ? "text-red-600 font-semibold" : "text-green-600"
                      }
                    >
                      ₨ {balance.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-sm ${status.className}`}>
                        {status.badge}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Payment History Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Payment History
          </h2>
          
          {/* Filters Row */}
          <div className="flex flex-wrap gap-4 mb-4">
            {/* Year Filter */}
            <div className="w-40">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Month Filter */}
            <div className="w-44">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Clear Filters Button */}
            {(selectedYear !== "all" || selectedMonth !== "all") && (
              <Button variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}
          </div>

          <div className="rounded-lg border bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPaymentRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{formatDate(record.paymentDate)}</TableCell>
                    <TableCell className="font-medium">
                      {getStudentName(record.student)}
                    </TableCell>
                    <TableCell className="text-green-600 font-medium">
                      ₨ {record.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="capitalize">
                      {formatPaymentMethod(record.paymentMethod)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePayment(record.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredPaymentRecords.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {feesRecords.length === 0 
                ? "No payment records found. Add a payment to get started." 
                : "No payment records match the selected filters."}
            </div>
          )}
        </div>

        {filteredSummary.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No students found. Add students first to manage fees.
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Payment"
          description="Are you sure you want to delete this payment record? This action cannot be undone."
          confirmText="Delete Payment"
          cancelText="Cancel"
          onConfirm={handleConfirmDeletePayment}
          variant="danger"
          icon="warning"
        />
      </div>
    </>
  );
}

