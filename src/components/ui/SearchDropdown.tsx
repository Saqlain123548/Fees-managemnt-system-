"use client";

import { useState, useEffect, useRef } from "react";
import { Search, User, Loader2, X } from "lucide-react";
import { supabase } from "@/lib/supabase/browser";

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

export function SearchDropdown({
  searchQuery,
  onStudentSelect,
  isOpen,
  onClose,
}: SearchDropdownProps) {
  const [results, setResults] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search students when debounced query changes
  useEffect(() => {
    const searchStudents = async () => {
      if (!debouncedQuery || debouncedQuery.trim().length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("students")
          .select("id, first_name, last_name, email, contact, join_date, is_active, created_at")
          .or(`first_name.ilike.%${debouncedQuery}%,last_name.ilike.%${debouncedQuery}%,email.ilike.%${debouncedQuery}%,contact.ilike.%${debouncedQuery}%`)
          .eq("is_active", true)
          .order("first_name")
          .limit(5);

        if (error) {
          console.error("Error searching students:", error);
          setResults([]);
        } else {
          // Transform snake_case data to camelCase
          const transformedData = (data || []).map((student: any) => ({
            id: student.id,
            firstName: student.first_name || "",
            lastName: student.last_name || "",
            email: student.email || "",
            contact: student.contact || "",
            joinDate: student.join_date || "",
            isActive: student.is_active ?? true,
            createdAt: student.created_at || "",
          }));
          setResults(transformedData);
        }
      } catch (error) {
        console.error("Error searching students:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && debouncedQuery.trim().length >= 2) {
      searchStudents();
    } else {
      setResults([]);
    }
  }, [debouncedQuery, isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50"
    >
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : results.length > 0 ? (
        <div className="max-h-80 overflow-y-auto">
          {results.map((student) => (
            <button
              key={student.id}
              onClick={() => onStudentSelect(student)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-b-0"
            >
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">
                  {student.firstName} {student.lastName}
                </p>
                <p className="text-sm text-slate-500 truncate">
                  {student.email || "No email"} • {student.contact || "No contact"}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : debouncedQuery.trim().length >= 2 ? (
        <div className="flex flex-col items-center justify-center py-6 px-4">
          <Search className="h-8 w-8 text-slate-300 mb-2" />
          <p className="text-sm text-slate-500">No students found</p>
          <p className="text-xs text-slate-400">
            Try a different search term
          </p>
        </div>
      ) : null}

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-1 hover:bg-slate-100 rounded-full transition-colors"
      >
        <X className="h-4 w-4 text-slate-400" />
      </button>
    </div>
  );
}

