"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
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
import { Plus, Edit, Trash2, Loader2, X, FileDown } from "lucide-react";
import { AppNavbar } from "@/components/ui/AppNavbar";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/browser";
import { useSearchParams } from "next/navigation";
import { generateStudentsPDF } from "@/lib/pdfUtils";

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  contact: string;
  joinDate: string;
  isActive?: boolean;
  createdAt?: string;
};

function StudentsContent() {
  const [students, setStudents] = useState<Student[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);

  const [newStudent, setNewStudent] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contact: "",
    joinDate: new Date().toISOString().split("T")[0],
  });

  // Initialize search query from URL
  useEffect(() => {
    const search = searchParams.get("search");
    if (search) {
      setSearchQuery(search);
    }
  }, [searchParams]);

  // Fetch students
  const fetchStudents = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      let url = "/api/students";
      if (search && search.trim()) {
        url += `?search=${encodeURIComponent(search.trim())}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error ${res.status}: ${text.slice(0, 200)}...`);
      }
      const data = await res.json();
      setStudents(data || []);
    } catch (err: any) {
      console.error("Fetch error:", err);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and when search query changes
  useEffect(() => {
    fetchStudents(searchQuery);
  }, [searchQuery, fetchStudents]);

  // Real-time subscription
  useEffect(() => {
    fetchStudents(searchQuery);

    const channel = supabase
      .channel("students-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "students",
        },
        (payload) => {
          console.log("Real-time change received:", payload);
          
          if (payload.eventType === "INSERT") {
            const newStudent = payload.new;
            const formattedStudent: Student = {
              id: newStudent.id,
              firstName: newStudent.first_name || "",
              lastName: newStudent.last_name || "",
              email: newStudent.email || "",
              contact: newStudent.contact || "",
              joinDate: newStudent.join_date || "",
              isActive: newStudent.is_active,
              createdAt: newStudent.created_at,
            };
            setStudents((prev) => [formattedStudent, ...prev]);
            toast.success("New student added!");
          } else if (payload.eventType === "UPDATE") {
            const updatedStudent = payload.new;
            const formattedStudent: Student = {
              id: updatedStudent.id,
              firstName: updatedStudent.first_name || "",
              lastName: updatedStudent.last_name || "",
              email: updatedStudent.email || "",
              contact: updatedStudent.contact || "",
              joinDate: updatedStudent.join_date || "",
              isActive: updatedStudent.is_active,
              createdAt: updatedStudent.created_at,
            };
            setStudents((prev) =>
              prev.map((s) => (s.id === formattedStudent.id ? formattedStudent : s))
            );
            toast.info("Student updated!");
          } else if (payload.eventType === "DELETE") {
            setStudents((prev) => prev.filter((s) => s.id !== payload.old.id));
            toast.success("Student deleted!");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStudents, searchQuery]);

  // Add student
  const handleAddStudent = async () => {
    if (
      !newStudent.firstName.trim() ||
      !newStudent.lastName.trim() ||
      !newStudent.email.trim()
    ) {
      toast.error("First name, last name, and email are required");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Adding student...");

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStudent),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Add failed");
      }

      toast.success("Student added successfully!", { id: loadingToast });
      await fetchStudents();

      setNewStudent({
        firstName: "",
        lastName: "",
        email: "",
        contact: "",
        joinDate: new Date().toISOString().split("T")[0],
      });
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to add student", { id: loadingToast });
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update student
  const handleUpdateStudent = async () => {
    if (!editingStudent) return;

    if (
      !editingStudent.firstName.trim() ||
      !editingStudent.lastName.trim() ||
      !editingStudent.email.trim()
    ) {
      toast.error("First name, last name, and email are required");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Updating student...");

    try {
      const res = await fetch(`/api/students/${editingStudent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingStudent),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Update failed");
      }

      toast.success("Student updated successfully!", { id: loadingToast });
      await fetchStudents();

      setEditingStudent(null);
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update student", { id: loadingToast });
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete student
  const handleDelete = async (id: string) => {
    setStudentToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Confirm delete student
  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;

    const loadingToast = toast.loading("Deleting student...");

    try {
      const res = await fetch(`/api/students/${studentToDelete}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }

      setStudents(students.filter((s) => s.id !== studentToDelete));
      toast.success("Student deleted successfully", { id: loadingToast });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete student", { id: loadingToast });
      console.error(err);
    }
  };

  // Open dialog for add or edit
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingStudent(null);
      setNewStudent({
        firstName: "",
        lastName: "",
        email: "",
        contact: "",
        joinDate: new Date().toISOString().split("T")[0],
      });
    }
  };

  // Start editing
  const startEdit = (student: Student) => {
    setEditingStudent(student);
    setOpen(true);
  };

  // Format date safely
  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString();
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
  };

  // Handle PDF download
  const handleDownloadPDF = async () => {
    if (students.length === 0) {
      toast.error("No students to export");
      return;
    }

    const loadingToast = toast.loading("Generating PDF...");
    try {
      await generateStudentsPDF(students, `students-list-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("PDF downloaded successfully!", { id: loadingToast });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF", { id: loadingToast });
    }
  };

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
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Students</h1>
            {searchQuery && (
              <p className="text-sm text-muted-foreground mt-1">
                Showing results for "{searchQuery}"
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {searchQuery && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearSearch}
                className="gap-1"
              >
                <X className="h-4 w-4" />
                Clear search
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              className="flex items-center gap-2"
              disabled={students.length === 0}
            >
              <FileDown className="h-4 w-4" /> Download PDF
            </Button>
            <Dialog open={open} onOpenChange={handleOpenChange}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Add Student
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingStudent ? "Edit Student" : "Add New Student"}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>First Name *</Label>
                      <Input
                        required
                        value={
                          editingStudent
                            ? editingStudent.firstName
                            : newStudent.firstName
                        }
                        onChange={(e) =>
                          editingStudent
                            ? setEditingStudent({
                                ...editingStudent,
                                firstName: e.target.value,
                              })
                            : setNewStudent({
                                ...newStudent,
                                firstName: e.target.value,
                              })
                        }
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <Label>Last Name *</Label>
                      <Input
                        required
                        value={
                          editingStudent
                            ? editingStudent.lastName
                            : newStudent.lastName
                        }
                        onChange={(e) =>
                          editingStudent
                            ? setEditingStudent({
                                ...editingStudent,
                                lastName: e.target.value,
                              })
                            : setNewStudent({
                                ...newStudent,
                                lastName: e.target.value,
                              })
                        }
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      required
                      value={
                        editingStudent ? editingStudent.email : newStudent.email
                      }
                      onChange={(e) =>
                        editingStudent
                          ? setEditingStudent({
                              ...editingStudent,
                              email: e.target.value,
                            })
                          : setNewStudent({ ...newStudent, email: e.target.value })
                      }
                      placeholder="student@example.com"
                    />
                  </div>
                  <div>
                    <Label>Contact</Label>
                    <Input
                      value={
                        editingStudent ? editingStudent.contact : newStudent.contact
                      }
                      onChange={(e) =>
                        editingStudent
                          ? setEditingStudent({
                              ...editingStudent,
                              contact: e.target.value,
                            })
                          : setNewStudent({
                              ...newStudent,
                              contact: e.target.value,
                            })
                      }
                      placeholder="03xxxxxxxxx"
                    />
                  </div>
                  <div>
                    <Label>Join Date</Label>
                    <Input
                      type="date"
                      value={
                        editingStudent
                          ? editingStudent.joinDate
                          : newStudent.joinDate
                      }
                      onChange={(e) =>
                        editingStudent
                          ? setEditingStudent({
                              ...editingStudent,
                              joinDate: e.target.value,
                            })
                          : setNewStudent({
                              ...newStudent,
                              joinDate: e.target.value,
                            })
                      }
                    />
                  </div>
                </div>
                <Button
                  onClick={
                    editingStudent ? handleUpdateStudent : handleAddStudent
                  }
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {editingStudent ? "Update Student" : "Save Student"}
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    {student.firstName} {student.lastName}
                  </TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.contact || "—"}</TableCell>
                  <TableCell>
                    {formatDate(student.joinDate)}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(student)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(student.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {students.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No students added yet. Click "Add Student" to begin.
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Student"
          description="Are you sure you want to delete this student? This action cannot be undone and all associated data will be permanently removed."
          confirmText="Delete Student"
          cancelText="Cancel"
          onConfirm={handleConfirmDelete}
          variant="danger"
          icon="warning"
        />
      </div>
    </>
  );
}

function StudentsLoading() {
  return (
    <>
      <AppNavbar />
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    </>
  );
}

export default function StudentsPage() {
  return (
    <Suspense fallback={<StudentsLoading />}>
      <StudentsContent />
    </Suspense>
  );
}

