import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface ExpenseRow {
  id: string;
  expense_date: string;
  type: string;
  description: string | null;
  amount: number;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

interface ExpenseResponse {
  id: string;
  expenseDate: string;
  type: string;
  description: string;
  amount: number;
  status: string;
  isActive: boolean;
  createdAt: string;
}

const transformExpense = (row: ExpenseRow): ExpenseResponse => ({
  id: row.id,
  expenseDate: row.expense_date || "",
  type: row.type || "",
  description: row.description || "",
  amount: row.amount || 0,
  status: row.status || "Pending",
  isActive: row.is_active ?? true,
  createdAt: row.created_at || "",
});

// GET - Fetch all active expenses, optionally filtered by type, status, or date range
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient(request);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    let query = supabase
      .from("company_expenses")
      .select("*")
      .eq("is_active", true);

    if (type && type !== "all") {
      query = query.eq("type", type);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (year) {
      query = query.gte("expense_date", `${year}-01-01`).lte("expense_date", `${year}-12-31`);
    }

    if (month && year) {
      const start = `${year}-${month.padStart(2, "0")}-01`;
      const end = `${year}-${month.padStart(2, "0")}-31`;
      query = query.gte("expense_date", start).lte("expense_date", end);
    }

    const { data, error } = await query.order("expense_date", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const transformedData = (data || []).map((row: ExpenseRow) => transformExpense(row));
    return NextResponse.json(transformedData);
  } catch (err: any) {
    console.error("Server error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new expense
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient(request);

    const body = await request.json();
    const { expenseDate, type, description, amount, status } = body;

    if (!type || amount === undefined || amount === null) {
      return NextResponse.json(
        { error: "Type and amount are required" },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return NextResponse.json(
        { error: "Amount must be a valid non-negative number" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("company_expenses")
      .insert({
        expense_date: expenseDate || new Date().toISOString().split("T")[0],
        type: type.trim(),
        description: description?.trim() || null,
        amount: parsedAmount,
        status: status || "Pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const transformedData = transformExpense(data as ExpenseRow);
    return NextResponse.json(transformedData, { status: 201 });
  } catch (err: any) {
    console.error("Server error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
