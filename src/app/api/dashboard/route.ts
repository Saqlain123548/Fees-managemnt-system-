import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface DashboardStats {
  totalStudents: number;
  totalDue: number;
  totalPaid: number;
  outstanding: number;
  monthlyData: { month: string; paid: number }[];
  pieData: { name: string; value: number; color: string }[];
}

const DEFAULT_FEE_AMOUNT = 3000; // Fixed fee per student

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient(request);

    // Get total active students
    const { count: totalStudents, error: studentsError } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    if (studentsError) {
      console.error("Students count error:", studentsError);
      return NextResponse.json({ error: studentsError.message }, { status: 500 });
    }

    // Get all fees records
    const { data: feesData, error: feesError } = await supabase
      .from("fees_records")
      .select("amount, payment_date")
      .eq("is_active", true);

    if (feesError) {
      console.error("Fees data error:", feesError);
      return NextResponse.json({ error: feesError.message }, { status: 500 });
    }

    // Calculate totals
    // Total Due = number of students × default fee amount (3000)
    const totalDue = (totalStudents || 0) * DEFAULT_FEE_AMOUNT;
    
    // Total Paid = sum of all payment amounts
    const totalPaid = feesData.reduce((sum, record) => sum + record.amount, 0);
    
    // Outstanding = Total Due - Total Paid
    const outstanding = totalDue - totalPaid;

    // Monthly data for last 6 months
    const monthlyData = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleString('default', { month: 'short' });
      const paid = feesData
        .filter(record => {
          if (!record.payment_date) return false;
          const recordDate = new Date(record.payment_date);
          return recordDate.getMonth() === date.getMonth() && recordDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum, record) => sum + record.amount, 0);
      monthlyData.push({ month: monthKey, paid });
    }

    // Pie data
    const pieData = [
      { name: "Paid", value: totalPaid, color: "#10b981" },
      { name: "Outstanding", value: outstanding, color: "#ef4444" },
    ];

    const stats: DashboardStats = {
      totalStudents: totalStudents || 0,
      totalDue,
      totalPaid,
      outstanding,
      monthlyData,
      pieData,
    };

    return NextResponse.json(stats);
  } catch (err: any) {
    console.error("Server error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
