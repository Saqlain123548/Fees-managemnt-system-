"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Button } from "@/components/ui/button";
import { Users, DollarSign, AlertCircle, TrendingUp, RefreshCw, Loader2, FileDown } from "lucide-react";
import { AppNavbar } from "@/components/ui/AppNavbar";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/browser";
import { generateReportsPDF } from "@/lib/pdfUtils";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";

// Types
interface ReportsData {
  summary: {
    totalStudents: number;
    totalCollected: number;
    totalOutstanding: number;
  };
  pieData: { name: string; value: number; color: string }[];
  studentBarData: {
    name: string;
    due: number;
    paid: number;
    outstanding: number;
  }[];
  monthlyAreaData: { month: string; collected: number }[];
  radarData: { metric: string; value: number }[];
  outstandingStudents: {
    name: string;
    balance: number;
    status: string;
  }[];
  recentPayments: {
    date: string;
    student: string;
    amount: number;
    method: string;
  }[];
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch reports data
  const fetchReportsData = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/reports");
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error ${res.status}: ${text.slice(0, 200)}...`);
      }
      
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      console.error("Fetch reports error:", err);
      setError(err.message || "Failed to load reports data");
      toast.error("Failed to load reports data");
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await fetchReportsData();
      setLoading(false);
    };
    initData();
  }, [fetchReportsData]);

  // Real-time subscription for reports
  useEffect(() => {
    const channel = supabase
      .channel("reports-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "fees_records",
        },
        (payload) => {
          console.log("Real-time fee change received:", payload);
          fetchReportsData();
          toast.success("Reports data updated!");
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "students",
        },
        (payload) => {
          console.log("Real-time student change received:", payload);
          fetchReportsData();
          toast.success("Reports data updated!");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReportsData]);

  const getStatusBadge = (status: string) => {
    return status === "paid" ? (
      <Badge className="bg-green-100 text-green-800">Paid</Badge>
    ) : status === "partial" ? (
      <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Pending</Badge>
    );
  };

  // Handle refresh
  const handleRefresh = async () => {
    setLoading(true);
    await fetchReportsData();
    setLoading(false);
    toast.success("Reports data refreshed");
  };

  // Handle PDF download
  const handleDownloadPDF = async () => {
    if (!data) {
      toast.error("No data to export");
      return;
    }

    const loadingToast = toast.loading("Generating PDF...");
    try {
      await generateReportsPDF(data, `reports-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("PDF downloaded successfully!", { id: loadingToast });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF", { id: loadingToast });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <>
        <AppNavbar />
        <div className="p-8 max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-red-500 mb-4">{error || "Failed to load data"}</p>
            <Button onClick={handleRefresh} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" /> Retry
            </Button>
          </div>
        </div>
      </>
    );
  }

  const { summary, pieData, studentBarData, monthlyAreaData, radarData, outstandingStudents, recentPayments } = data;

  return (
    <>
      <AppNavbar />
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Advanced Reports</h1>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={handleDownloadPDF}
              className="flex items-center gap-2"
              disabled={!data}
            >
              <FileDown className="h-4 w-4" /> Download PDF
            </Button>
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>

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
                  {outstandingStudents.length > 0 ? (
                    outstandingStudents.map((student, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell className="text-red-600 font-semibold">
                          ₨ {student.balance.toLocaleString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(student.status)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                        No outstanding payments
                      </TableCell>
                    </TableRow>
                  )}
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
                  {recentPayments.length > 0 ? (
                    recentPayments.map((payment, i) => (
                      <TableRow key={i}>
                        <TableCell>{payment.date}</TableCell>
                        <TableCell>{payment.student}</TableCell>
                        <TableCell className="text-green-600">₨ {payment.amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                        No recent payments
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

