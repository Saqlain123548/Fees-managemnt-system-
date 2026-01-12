import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Helper to convert snake_case to camelCase
interface FeeRecordRow {
  id: string;
  student_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

interface StudentRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface FeeRecordResponse {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  notes: string | null;
  createdAt: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

const transformFeeRecord = (record: FeeRecordRow, student: StudentRow | null): FeeRecordResponse => ({
  id: record.id,
  amount: record.amount,
  paymentDate: record.payment_date,
  paymentMethod: record.payment_method || 'cash',
  notes: record.notes,
  createdAt: record.created_at,
  student: student ? {
    id: student.id,
    firstName: student.first_name || '',
    lastName: student.last_name || '',
    email: student.email || '',
  } : null,
});

// GET - Fetch all fees records with student info
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient(request);

    // Get studentId parameter from URL
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    let query = supabase
      .from("fees_records")
      .select("*")
      .eq("is_active", true);

    // Filter by studentId if provided
    if (studentId && studentId.trim()) {
      query = query.eq("student_id", studentId.trim());
    }

    const { data: feesData, error: feesError } = await query.order("created_at", { ascending: false });

    if (feesError) {
      console.error("Supabase fees error:", feesError);
      return NextResponse.json({ error: feesError.message }, { status: 500 });
    }

    // Fetch all students
    const { data: studentsData, error: studentsError } = await supabase
      .from("students")
      .select("id, first_name, last_name, email");

    if (studentsError) {
      console.error("Supabase students error:", studentsError);
      return NextResponse.json({ error: studentsError.message }, { status: 500 });
    }

    // Create a map of students by id
    const studentsMap = new Map<string, StudentRow>();
    (studentsData || []).forEach((student: StudentRow) => {
      studentsMap.set(student.id, student);
    });

    // Transform data
    const transformedData = (feesData || []).map((record: FeeRecordRow) => {
      const student = studentsMap.get(record.student_id);
      return transformFeeRecord(record, student || null);
    });

    return NextResponse.json(transformedData);
  } catch (err: any) {
    console.error("Server error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new fee record
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient(request);

    const body = await request.json();
    const { studentId, amount, paymentDate, paymentMethod, notes } = body;

    // Validate required fields
    if (!studentId || !amount) {
      return NextResponse.json(
        { error: "Student ID and amount are required" },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    // Verify student exists
    const { data: existingStudent, error: studentError } = await supabase
      .from("students")
      .select("id, first_name, last_name, email")
      .eq("id", studentId)
      .single();

    if (studentError || !existingStudent) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Insert the fee record
    const { data: feesRecord, error } = await supabase
      .from("fees_records")
      .insert({
        student_id: studentId,
        amount: parsedAmount,
        payment_date: paymentDate || new Date().toISOString().split("T")[0],
        payment_method: paymentMethod || 'cash',
        notes: notes || null,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const transformedData = transformFeeRecord(
      feesRecord as FeeRecordRow,
      existingStudent as StudentRow
    );

    return NextResponse.json(transformedData, { status: 201 });
  } catch (err: any) {
    console.error("Server error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

