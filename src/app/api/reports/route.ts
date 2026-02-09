import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_FEE_AMOUNT = 5000; // Fixed fee per student

interface StudentRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface FeeRecordRow {
  id: string;
  student_id: string;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
}

interface StudentWithTotal {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  totalPaid: number;
}

interface MonthlyData {
  month: string;
  collected: number;
}

interface RadarMetric {
  metric: string;
  value: number;
}

interface OutstandingStudent {
  name: string;
  balance: number;
  status: string;
}

interface RecentPayment {
  date: string;
  student: string;
  amount: number;
  method: string;
}

interface ReportsResponse {
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
  monthlyAreaData: MonthlyData[];
  radarData: RadarMetric[];
  outstandingStudents: OutstandingStudent[];
  recentPayments: RecentPayment[];
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient(request);

    // Get all active students
    const { data: studentsData, error: studentsError } = await supabase
      .from("students")
      .select("id, first_name, last_name, email")
      .eq("is_active", true);

    if (studentsError) {
      console.error("Students error:", studentsError);
      return NextResponse.json({ error: studentsError.message }, { status: 500 });
    }

    // Get all active fees records
    const { data: feesData, error: feesError } = await supabase
      .from("fees_records")
      .select("id, student_id, amount, payment_date, payment_method, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (feesError) {
      console.error("Fees error:", feesError);
      return NextResponse.json({ error: feesError.message }, { status: 500 });
    }

    const students = (studentsData || []) as StudentRow[];
    const fees = (feesData || []) as FeeRecordRow[];

    // Calculate total collected
    const totalCollected = fees.reduce((sum, record) => sum + record.amount, 0);

    // Calculate total students
    const totalStudents = students.length;

    // Calculate total due
    const totalDue = totalStudents * DEFAULT_FEE_AMOUNT;

    // Calculate outstanding
    const totalOutstanding = totalDue - totalCollected;

    // Create students map for quick lookup
    const studentsMap = new Map<string, StudentRow>();
    students.forEach((student) => {
      studentsMap.set(student.id, student);
    });

    // Calculate payment summary per student
    const studentTotals: Map<string, number> = new Map();
    fees.forEach((record) => {
      const current = studentTotals.get(record.student_id) || 0;
      studentTotals.set(record.student_id, current + record.amount);
    });

    // Build student breakdown data for bar chart (top 6 by outstanding)
    const studentBreakdown: StudentWithTotal[] = students.map((student) => {
      const totalPaid = studentTotals.get(student.id) || 0;
      return {
        id: student.id,
        firstName: student.first_name || '',
        lastName: student.last_name || '',
        email: student.email || '',
        totalPaid,
      };
    });

    // Sort by outstanding (descending) and take top 6
    const topStudents = studentBreakdown
      .map((s) => ({
        ...s,
        outstanding: Math.max(0, DEFAULT_FEE_AMOUNT - s.totalPaid),
      }))
      .sort((a, b) => b.outstanding - a.outstanding)
      .slice(0, 6);

    const studentBarData = topStudents.map((s) => ({
      name: `${s.firstName} ${s.lastName}`.trim(),
      due: DEFAULT_FEE_AMOUNT,
      paid: s.totalPaid,
      outstanding: s.outstanding,
    }));

    // Monthly collection data for area chart (last 12 months)
    const now = new Date();
    const monthlyDataMap = new Map<string, number>();

    // Initialize last 12 months with 0
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleString('default', { month: 'short' });
      monthlyDataMap.set(monthKey, 0);
    }

    // Sum up payments by month
    fees.forEach((record) => {
      if (record.payment_date) {
        const recordDate = new Date(record.payment_date);
        const monthKey = recordDate.toLocaleString('default', { month: 'short' });
        if (monthlyDataMap.has(monthKey)) {
          monthlyDataMap.set(monthKey, monthlyDataMap.get(monthKey)! + record.amount);
        }
      }
    });

    const monthlyAreaData: MonthlyData[] = Array.from(monthlyDataMap.entries()).map(
      ([month, collected]) => ({
        month,
        collected,
      })
    );

    // Radar chart data - performance metrics
    const paidStudents = studentBreakdown.filter(
      (s) => s.totalPaid >= DEFAULT_FEE_AMOUNT
    ).length;
    const partialStudents = studentBreakdown.filter(
      (s) => s.totalPaid > 0 && s.totalPaid < DEFAULT_FEE_AMOUNT
    ).length;
    const pendingStudents = studentBreakdown.filter((s) => s.totalPaid === 0).length;

    const studentsEnrolledPercent = Math.round((paidStudents / totalStudents) * 100);
    const feesCollectedPercent = Math.round((totalCollected / totalDue) * 100);
    const onTimePaymentsPercent = 85; // Placeholder - would need payment_date comparison
    const outstandingRecoveryPercent = Math.round(
      ((totalDue - totalOutstanding) / totalDue) * 100
    );
    const monthlyGrowthPercent = 78; // Placeholder - would need historical data
    const batchCompletionPercent = studentsEnrolledPercent;

    const radarData: RadarMetric[] = [
      { metric: "Students Enrolled", value: studentsEnrolledPercent },
      { metric: "Fees Collected %", value: feesCollectedPercent },
      { metric: "On-Time Payments", value: onTimePaymentsPercent },
      { metric: "Outstanding Recovery", value: outstandingRecoveryPercent },
      { metric: "Monthly Growth", value: monthlyGrowthPercent },
      { metric: "Batch Completion", value: batchCompletionPercent },
    ];

    // Outstanding students list (sorted by balance descending)
    const outstandingList = studentBreakdown
      .filter((s) => s.totalPaid < DEFAULT_FEE_AMOUNT)
      .map((s) => {
        const balance = DEFAULT_FEE_AMOUNT - s.totalPaid;
        return {
          name: `${s.firstName} ${s.lastName}`.trim(),
          balance,
          status: s.totalPaid === 0 ? "pending" : "partial",
        };
      })
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 10);

    // Recent payments (last 10)
    const recentPayments: RecentPayment[] = fees.slice(0, 10).map((record) => {
      const student = studentsMap.get(record.student_id);
      return {
        date: record.payment_date || record.created_at.split("T")[0],
        student: student
          ? `${student.first_name} ${student.last_name}`.trim()
          : "Unknown",
        amount: record.amount,
        method: record.payment_method || "cash",
      };
    });

    const pieData = [
      { name: "Paid", value: totalCollected, color: "#10b981" },
      { name: "Outstanding", value: Math.max(0, totalOutstanding), color: "#ef4444" },
    ];

    const response: ReportsResponse = {
      summary: {
        totalStudents,
        totalCollected,
        totalOutstanding: Math.max(0, totalOutstanding),
      },
      pieData,
      studentBarData,
      monthlyAreaData,
      radarData,
      outstandingStudents: outstandingList,
      recentPayments,
    };

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("Server error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

