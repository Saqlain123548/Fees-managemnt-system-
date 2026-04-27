import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface ExpenseRow {
  id: string;
  expense_date: string;
  type: string;
  description: string | null;
  amount: number;
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
  isActive: boolean;
  createdAt: string;
}

const transformExpense = (row: ExpenseRow): ExpenseResponse => ({
  id: row.id,
  expenseDate: row.expense_date || "",
  type: row.type || "",
  description: row.description || "",
  amount: row.amount || 0,
  isActive: row.is_active ?? true,
  createdAt: row.created_at || "",
});

// PUT - Update expense by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient(request);
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Expense ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { expenseDate, type, description, amount } = body;

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
      .update({
        expense_date: expenseDate || null,
        type: type.trim(),
        description: description?.trim() || null,
        amount: parsedAmount,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const transformedData = transformExpense(data as ExpenseRow);
    return NextResponse.json(transformedData);
  } catch (err: any) {
    console.error("Server error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

// DELETE - Soft delete expense by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient(request);
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Expense ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("company_expenses")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      console.error("Supabase delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Expense deleted successfully" });
  } catch (err: any) {
    console.error("Server error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

