"use client";

import { useState, useEffect, useRef } from "react";
import { Search, User, Mail, Phone } from "lucide-react";

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

interface SearchDropdownProps {
  searchQuery: string;
  onStudentSelect: (student: Student) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function SearchDropdown({ searchQuery, onStudentSelect, isOpen, onClose }: SearchDropdownProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setStudents([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/students?search=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setStudents(data.slice(0, 5)); // Limit to 5 results
        }
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchStudents, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (!isOpen || (!loading && students.length === 0 && searchQuery.length >= 2)) {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
    >
      {loading ? (
        <div className="p-4 text-center text-slate-500">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
            Searching...
          </div>
        </div>
      ) : students.length > 0 ? (
        <div className="py-2">
          {students.map((student) => (
            <button
              key={student.id}
              onClick={() => {
                onStudentSelect(student);
                onClose();
              }}
              className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors duration-150 border-b border-slate-100 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 truncate">
                    {student.firstName} {student.lastName}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{student.email}</span>
                    </div>
                    {student.contact && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{student.contact}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : searchQuery.length >= 2 ? (
        <div className="p-4 text-center text-slate-500">
          No students found
        </div>
      ) : null}
    </div>
  );
}
