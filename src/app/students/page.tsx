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
import { Plus, Edit, Trash2 } from "lucide-react";
import { AppNavbar } from "@/components/ui/AppNavbar";

// Fake data (baad mein real data se replace karenge)
const initialStudents = [
  { id: 1, firstName: "Ali", lastName: "Khan", email: "ali@example.com", contact: "03001234567", joinDate: "2025-01-10" },
  { id: 2, firstName: "Sara", lastName: "Ahmed", email: "sara@example.com", contact: "03119876543", joinDate: "2025-02-15" },
];

export default function StudentsPage() {
  const [students, setStudents] = useState(initialStudents);
  const [open, setOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contact: "",
    joinDate: "",
  });

  const handleAddStudent = () => {
    const newId = students.length + 1;
    setStudents([...students, { id: newId, ...newStudent }]);
    setNewStudent({ firstName: "", lastName: "", email: "", contact: "", joinDate: "" });
    setOpen(false);
  };

  const handleDelete = (id: number) => {
    setStudents(students.filter((s) => s.id !== id));
  };

  return (
    <>
    <AppNavbar />
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Students</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input
                    value={newStudent.firstName}
                    onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input
                    value={newStudent.lastName}
                    onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  placeholder="student@example.com"
                />
              </div>
              <div>
                <Label>Contact</Label>
                <Input
                  value={newStudent.contact}
                  onChange={(e) => setNewStudent({ ...newStudent, contact: e.target.value })}
                  placeholder="03xxxxxxxxx"
                />
              </div>
              <div>
                <Label>Join Date</Label>
                <Input
                  type="date"
                  value={newStudent.joinDate}
                  onChange={(e) => setNewStudent({ ...newStudent, joinDate: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={handleAddStudent}>Save Student</Button>
          </DialogContent>
        </Dialog>
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
                <TableCell>{student.firstName} {student.lastName}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>{student.contact}</TableCell>
                <TableCell>{student.joinDate}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(student.id)}>
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
    </div>
    </>
  );
}