"use client";

import { Button } from "@/components/ui/button";
import { Home, Users, DollarSign, FileText, Search, Bell, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { SearchDropdown } from "./SearchDropdown";
import { StudentModal } from "./StudentModal";
import { logout } from "@/app/auth/actions";

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

export function AppNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Students", href: "/students", icon: Users },
    { name: "Fees", href: "/fees", icon: DollarSign },
    { name: "Reminders", href: "/reminders", icon: Bell },
    { name: "Reports", href: "/reports", icon: FileText },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const handleInputFocus = () => {
    if (searchQuery.trim().length >= 2) {
      setIsDropdownOpen(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsDropdownOpen(value.trim().length >= 2);
  };

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
    setIsDropdownOpen(false);
    setSearchQuery("");
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  const handleSearch = () => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      toast.error("Please enter a search term");
      return;
    }
    setIsSearching(true);
    router.push(`/students?search=${encodeURIComponent(trimmedQuery)}`);
    setIsSearching(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
    }
  };

  return (
    <>
      <header className="border-b bg-gradient-to-b from-white to-slate-50/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 lg:px-10 py-4 max-w-7xl mx-auto">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="flex items-baseline gap-1.5 text-lg lg:text-xl font-bold tracking-tight hover:opacity-90 transition-opacity"
          >
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent">
              Agaicode
            </span>
            <span className="text-indigo-700/90 font-medium text-base lg:text-lg">
              Technologies
            </span>
          </Link>

          {/* Navigation + Search */}
          <div className="flex items-center gap-6">
            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      relative flex items-center gap-2.5 text-[15px] font-medium transition-all duration-300
                      ${
                        active
                          ? "text-indigo-700 font-semibold"
                          : "text-slate-700 hover:text-indigo-600"
                      }
                    `}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    <span>{item.name}</span>

                    {/* Active underline */}
                    {active && (
                      <motion.div
                        layoutId="activeNavLine"
                        className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Search Bar */}
            <div className="relative hidden sm:flex items-center min-w-[180px] lg:min-w-[240px]">
              <input
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onKeyPress={handleKeyPress}
                placeholder="Search students..."
                className="w-full pl-4 pr-12 py-2.5 bg-white border border-slate-300 rounded-full text-sm shadow-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/50 transition-all duration-300"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="absolute right-2 p-2 text-slate-500 hover:text-indigo-600 transition-colors duration-200 rounded-full hover:bg-indigo-50 disabled:opacity-50"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>
              <SearchDropdown
                searchQuery={searchQuery}
                onStudentSelect={handleStudentSelect}
                isOpen={isDropdownOpen}
                onClose={() => setIsDropdownOpen(false)}
              />
            </div>

            {/* Logout */}
            <Button
              variant="default"
              size="sm"
              onClick={handleLogout}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm
                         transition-all duration-300 font-medium px-5 flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Student Modal */}
      <StudentModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        student={selectedStudent}
      />
    </>
  );
}
