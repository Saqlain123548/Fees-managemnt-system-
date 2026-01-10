"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, AlertCircle, TrendingUp } from "lucide-react";
import { AppNavbar } from "@/components/ui/AppNavbar";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";

// Fake data for heavy charts
const summary = {
  totalStudents: 23,
  totalCollected: 420000,
  totalOutstanding: 160000,
};

// Donut Pie Chart Data
const pieData = [
  { name: "Paid", value: summary.totalCollected, color: "#10b981" },
  { name: "Outstanding", value: summary.totalOutstanding, color: "#ef4444" },
];

// Stacked Bar Chart - Student-wise Breakdown (fake top 6 students)
const studentBarData = [
  { name: "Ali Khan", due: 25000, paid: 25000, outstanding: 0 },
  { name: "Sara Ahmed", due: 25000, paid: 15000, outstanding: 10000 },
  { name: "Usman Malik", due: 25000, paid: 5000, outstanding: 20000 },
  { name: "Ayesha S.", due: 25000, paid: 25000, outstanding: 0 },
  { name: "Ahmed R.", due: 25000, paid: 20000, outstanding: 5000 },
  { name: "Fatima Z.", due: 25000, paid: 18000, outstanding: 7000 },
];

// Area Chart - Monthly Trend
const monthlyAreaData = [
  { month: "Jul", collected: 50000 },
  { month: "Aug", collected: 70000 },
  { month: "Sep", collected: 65000 },
  { month: "Oct", collected: 80000 },
  { month: "Nov", collected: 95000 },
  { month: "Dec", collected: 120000 },
  { month: "Jan", collected: 85000 },
];

// Radar Chart - Performance Overview
const radarData = [
  { metric: "Students Enrolled", value: 92 },
  { metric: "Fees Collected %", value: 72 },
  { metric: "On-Time Payments", value: 85 },
  { metric: "Outstanding Recovery", value: 60 },
  { metric: "Monthly Growth", value: 78 },
  { metric: "Batch Completion", value: 88 },
];

const outstandingStudents = [
  { name: "Sara Ahmed", balance: 10000, status: "partial" },
  { name: "Usman Malik", balance: 20000, status: "pending" },
];

const recentPayments = [
  { date: "2026-01-08", student: "Ali Khan", amount: 5000, method: "Cash" },
  { date: "2026-01-07", student: "Ayesha Siddiqui", amount: 25000, method: "Bank Transfer" },
  { date: "2026-01-05", student: "Sara Ahmed", amount: 10000, method: "Cash" },
];

export default function ReportsPage() {
  const getStatusBadge = (status: string) => {
    return status === "paid" ? (
      <Badge className="bg-green-100 text-green-800">Paid</Badge>
    ) : status === "partial" ? (
      <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Pending</Badge>
    );
  };

  return (
    <>
      <AppNavbar />
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Advanced Reports</h1>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-12">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-5 w-5 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalStudents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
              <DollarSign className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ₨ {summary.totalCollected.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
              <AlertCircle className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ₨ {summary.totalOutstanding.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Heavy Charts Section - 4 Charts for Premium Feel */}
        <div className="grid gap-8 md:grid-cols-2 mb-12">
          {/* Donut Pie Chart */}
          <Card className="p-6">
            <CardTitle className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Fees Status Overview
            </CardTitle>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  dataKey="value"
                  paddingAngle={8}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => typeof value === 'number' ? `₨ ${value.toLocaleString()}` : '₨ 0'} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Stacked Bar Chart - Student Breakdown */}
          <Card className="p-6">
            <CardTitle className="mb-4">Student Fees Breakdown (Top 6)</CardTitle>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={studentBarData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => typeof value === 'number' ? `₨ ${value.toLocaleString()}` : '₨ 0'} />
                <Legend />
                <Bar dataKey="due" stackId="a" fill="#6366f1" />
                <Bar dataKey="paid" stackId="a" fill="#10b981" />
                <Bar dataKey="outstanding" stackId="a" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Area Chart - Monthly Trend */}
          <Card className="p-6">
            <CardTitle className="mb-4">Monthly Collection Growth</CardTitle>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={monthlyAreaData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => typeof value === 'number' ? `₨ ${value.toLocaleString()}` : '₨ 0'} />
                <Area type="monotone" dataKey="collected" stroke="#8b5cf6" fill="#c4b5fd" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Radar Chart - Performance Metrics */}
          <Card className="p-6">
            <CardTitle className="mb-4">Overall Batch Performance</CardTitle>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Current Batch" dataKey="value" stroke="#f59e0b" fill="#fbbf24" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Tables Section */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Outstanding Table */}
          <Card>
            <CardHeader>
              <CardTitle>Outstanding Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outstandingStudents.map((student, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell className="text-red-600 font-semibold">
                        ₨ {student.balance.toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(student.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPayments.map((payment, i) => (
                    <TableRow key={i}>
                      <TableCell>{payment.date}</TableCell>
                      <TableCell>{payment.student}</TableCell>
                      <TableCell className="text-green-600">₨ {payment.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}