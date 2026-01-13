"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, Wallet, AlertCircle } from "lucide-react";
import { AppNavbar } from "@/components/ui/AppNavbar";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/browser";

interface DashboardStats {
  totalStudents: number;
  totalDue: number;
  totalPaid: number;
  outstanding: number;
  monthlyData: { month: string; paid: number }[];
  pieData: { name: string; value: number; color: string }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalDue: 0,
    totalPaid: 0,
    outstanding: 0,
    monthlyData: [],
    pieData: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Set up real-time subscriptions
    const studentsSubscription = supabase
      .channel('students_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
        fetchStats();
      })
      .subscribe();

    const feesSubscription = supabase
      .channel('fees_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fees_records' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      studentsSubscription.unsubscribe();
      feesSubscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <AppNavbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50/30">
        <div className="max-w-7xl mx-auto p-6 pt-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard Overview</h1>

          {/* Super Compact Stat Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
            <Card className="py-4 px-5 hover:shadow-md transition-shadow border-0 bg-white/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-gray-600">Total Students</CardTitle>
                <Users className="h-4 w-4 text-indigo-600" />
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-2xl font-bold text-gray-900">{stats.totalStudents}</div>
                <p className="text-xs text-gray-500">Current batch</p>
              </CardContent>
            </Card>

            <Card className="py-4 px-5 hover:shadow-md transition-shadow border-0 bg-white/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-gray-600">Total Due</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-2xl font-bold text-gray-900">₨ {stats.totalDue.toLocaleString()}</div>
                <p className="text-xs text-gray-500">Overall fees</p>
              </CardContent>
            </Card>

            <Card className="py-4 px-5 hover:shadow-md transition-shadow border-0 bg-white/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-gray-600">Total Paid</CardTitle>
                <Wallet className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-2xl font-bold text-green-600">₨ {stats.totalPaid.toLocaleString()}</div>
                <p className="text-xs text-gray-500">Collected</p>
              </CardContent>
            </Card>

            <Card className="py-4 px-5 hover:shadow-md transition-shadow border-0 bg-white/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-gray-600">Outstanding</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-2xl font-bold text-red-600">₨ {stats.outstanding.toLocaleString()}</div>
                <p className="text-xs text-gray-500">Pending</p>
              </CardContent>
            </Card>
          </div>

          {/* Graphs Section */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Line Chart - Monthly Collections */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Monthly Fees Collection</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="paid" stroke="#4f46e5" strokeWidth={3} dot={{ fill: '#4f46e5' }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Pie Chart - Fees Status */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Fees Status Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <p className="text-center text-gray-600 mt-10 text-sm">
            Powerd by Agaicode Technologies &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </>
  );
}