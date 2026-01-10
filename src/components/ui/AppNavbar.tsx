"use client";

import { Button } from "@/components/ui/button";
import { Home, Users, DollarSign, FileText, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";

export function AppNavbar() {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Students", href: "/students", icon: Users },
    { name: "Fees", href: "/fees", icon: DollarSign },
    { name: "Reports", href: "/reports", icon: FileText },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="border-b bg-gradient-to-b from-white to-slate-50/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 lg:px-10 py-4 max-w-7xl mx-auto">
        {/* Logo */}
   <Link
  href="/dashboard"
  className="flex items-baseline gap-1.5 text-2xl lg:text-3xl font-black tracking-tight hover:opacity-90 transition-opacity"
>
  <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent">
    Agaicode
  </span>
  <span className="text-indigo-700/90 font-semibold text-xl lg:text-2xl">
    Technologies
  </span>
</Link>

        {/* Navigation + Search */}
        <div className="flex items-center gap-10">
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
          <div className="relative hidden sm:flex items-center min-w-[240px] lg:min-w-[320px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students, fees..."
              className="w-full pl-4 pr-12 py-2.5 bg-white border border-slate-300 rounded-full text-sm shadow-sm 
                         focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/50 
                         transition-all duration-300"
            />
            <button
              className="absolute right-2 p-2 text-slate-500 hover:text-indigo-600 
                         transition-colors duration-200 rounded-full hover:bg-indigo-50"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Logout */}
        <Button
          variant="outline"
          size="sm"
          className="border-slate-300 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 
                     transition-all duration-300 font-medium px-6"
        >
          Logout
        </Button>
      </div>
    </header>
  );
}