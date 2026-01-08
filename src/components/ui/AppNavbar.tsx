"use client";

import { Button } from "@/components/ui/button";
import { Home, Users, DollarSign, FileText, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export function AppNavbar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Students", href: "/students", icon: Users },
    { name: "Fees", href: "/fees", icon: DollarSign },
    { name: "Reports", href: "/reports", icon: FileText },
   
  ];

  return (
    <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-md sticky top-0 z-50">
      <div className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-12">
          <Link href="/dashboard" className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
            Agaicode Technologies
          </Link>

          <nav className="flex items-center gap-9 relative">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="relative flex items-center gap-3 text-base font-semibold text-gray-700 transition-colors duration-300"
                >
                  <Icon className="h-5 w-5 transition-colors duration-300" />
                  <span>{item.name}</span>

                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -bottom-1 left-0 right-0 h-1 bg-indigo-600 rounded-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}

                  {/* Hover scale effect */}
                  <motion.div
                    className="absolute inset-0 rounded-lg"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  />
                </Link>
              );
            })}
          </nav>
        </div>

        <Button variant="outline" size="lg" className="font-semibold px-6">
          Logout
        </Button>
      </div>
    </header>
  );
}