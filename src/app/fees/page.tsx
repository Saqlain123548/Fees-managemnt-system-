"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";
import { AppNavbar } from "@/components/ui/AppNavbar";

// Fake initial data (students with fees)
const initialFeesData = [
  { id: 1, name: "Ali Khan", totalDue: 25000, paid: 25000, balance: 0, status: "paid" },
  { id: 2, name: "Sara Ahmed", totalDue: 25000, paid: 15000, balance: 10000, status: "partial" },
  { id: 3, name: "Usman Malik", totalDue: 25000, paid: 5000, balance: 20000, status: "pending" },
  { id: 4, name: "Ayesha Siddiqui", totalDue: 25000, paid: 25000, balance: 0, status: "paid" },
];

export default function FeesPage() {
  const [feesData, setFeesData] = useState(initialFeesData);
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [payment, setPayment] = useState({
    studentId: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Filtered data based on search
  const filteredData = feesData.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddPayment = () => {
    const amount = parseFloat(payment.amount);
    if (!payment.studentId || !amount || amount <= 0) return;

    setFeesData(feesData.map((student) => {
      if (student.id.toString() === payment.studentId) {
        const newPaid = student.paid + amount;
        const newBalance = student.totalDue - newPaid;
        const newStatus = newBalance <= 0 ? "paid" : newBalance < student.totalDue ? "partial" : "pending";
        return { ...student, paid: newPaid, balance: newBalance > 0 ? newBalance : 0, status: newStatus };
      }
      return student;
    }));

    // Reset form
    setPayment({ studentId: "", amount: "", date: new Date().toISOString().split("T")[0], notes: "" });
    setOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case "partial":
        return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>;
      case "pending":
        return <Badge className="bg-red-100 text-red-800">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <>
      <AppNavbar />
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Fees Management</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 text-base">
                <Plus className="h-5 w-5" /> Add Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Record New Payment</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Student</Label>
                  <Select value={payment.studentId} onValueChange={(v) => setPayment({ ...payment, studentId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {feesData.map((student) => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.name} (Balance: ₨ {student.balance.toLocaleString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    placeholder="5000"
                    value={payment.amount}
                    onChange={(e) => setPayment({ ...payment, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={payment.date}
                    onChange={(e) => setPayment({ ...payment, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Input
                    placeholder="Cash / Bank transfer etc."
                    value={payment.notes}
                    onChange={(e) => setPayment({ ...payment, notes: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleAddPayment} className="w-full">Save Payment</Button>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Fees Table */}
        <div className="rounded-lg border bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Total Due</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>₨ {student.totalDue.toLocaleString()}</TableCell>
                  <TableCell className="text-green-600">₨ {student.paid.toLocaleString()}</TableCell>
                  <TableCell className={student.balance > 0 ? "text-red-600 font-semibold" : "text-green-600"}>
                    ₨ {student.balance.toLocaleString()}
                  </TableCell>
                  <TableCell>{getStatusBadge(student.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No students found.
          </div>
        )}
      </div>
    </>
  );
}