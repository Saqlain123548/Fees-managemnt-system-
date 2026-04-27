"use client";

import { useState, useEffect } from "react";
import { X, User, Mail, Phone, Calendar, DollarSign, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  contact: string;
  joinDate: string;
  isActive: boolean;
  createdAt: string;
}

interface FeeRecord {
  id: string;
  amount: number;
  payment_date: string;
  description?: string;
}

interface StudentModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

const TUITION_FEE = 3000; // Fixed tuition fee

export function StudentModal({ student, isOpen, onClose }: StudentModalProps) {
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (student && isOpen) {
      fetchFeeRecords();
    }
  }, [student, isOpen]);

  const fetchFeeRecords = async () => {
    if (!student) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/fees?studentId=${student.id}`);
      if (response.ok) {
        const data = await response.json();
        setFeeRecords(data);
      }
    } catch (error) {
      console.error("Error fetching fee records:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalPaid = feeRecords.reduce((sum, record) => sum + record.amount, 0);
  const outstanding = TUITION_FEE - totalPaid;

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  if (!isOpen || !student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-w-[95vw] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Student Details
          </DialogTitle>
        </DialogHeader>

        {/* Student Information - Scrollable Content */}
        <div className="space-y-3 overflow-y-auto flex-1 pr-2">
          <div className="flex items-center gap-3 pb-2 border-b">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {student.firstName} {student.lastName}
              </h3>
              <Badge variant={student.isActive ? "default" : "secondary"} className="mt-1">
                {student.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Mail className="h-4 w-4 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-sm font-medium text-slate-900">{student.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Phone className="h-4 w-4 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Contact</p>
                <p className="text-sm font-medium text-slate-900">{student.contact || "Not provided"}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Calendar className="h-4 w-4 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Join Date</p>
                <p className="text-sm font-medium text-slate-900">
                  {new Date(student.joinDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Fee Status */}
          <div className="border-t pt-4">
            <h4 className="flex items-center gap-2 font-semibold text-slate-900 mb-3">
              <DollarSign className="h-5 w-5" />
              Fee Status
            </h4>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-xl font-bold text-blue-600">${TUITION_FEE}</div>
                <div className="text-xs text-blue-600">Total Due</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-600">${totalPaid}</div>
                <div className="text-xs text-green-600">Total Paid</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-xl font-bold text-red-600">${outstanding}</div>
                <div className="text-xs text-red-600">Outstanding</div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
              {outstanding <= 0 ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-600">All fees paid ✓</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium text-red-600">
                    ${outstanding} remaining
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Payment History */}
          <div className="border-t pt-4">
            <h4 className="font-semibold text-slate-900 mb-3">Payment History</h4>
            
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              </div>
            ) : feeRecords.length > 0 ? (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {feeRecords.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-slate-600">
                        {new Date(record.payment_date).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="font-medium text-slate-900">
                      +${record.amount}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">No payment records found</p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

