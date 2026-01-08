"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, Wallet, AlertCircle } from "lucide-react";
import { AppNavbar } from "@/components/ui/AppNavbar";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function DashboardPage() {
  // Fake stats
  const stats = {
    totalStudents: 23,
    totalDue: 580000,
    totalPaid: 420000,
    outstanding: 160000,
  };

  // Fake data for line chart (monthly collections)
  const monthlyData = [
    { month: "Jul", paid: 50000 },
    { month: "Aug", paid: 70000 },
    { month: "Sep", paid: 65000 },
    { month: "Oct", paid: 80000 },
    { month: "Nov", paid: 95000 },
    { month: "Dec", paid: 120000 },
  ];

  // Fake data for pie chart
  const pieData = [
    { name: "Paid", value: stats.totalPaid, color: "#10b981" },
    { name: "Outstanding", value: stats.outstanding, color: "#ef4444" },
  ];

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
                <LineChart data={monthlyData}>
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
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
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
            Smooth sailing for your tech batch! 🚀
          </p>
        </div>
      </div>
    </>
  );
}