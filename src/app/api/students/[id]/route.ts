import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Helper to convert snake_case to camelCase
interface StudentRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  contact: string | null;
  join_date: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

interface StudentResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  contact: string;
  joinDate: string;
  isActive: boolean;
  createdAt: string;
}

const transformStudent = (row: StudentRow): StudentResponse => ({
  id: row.id,
  firstName: row.first_name || '',
  lastName: row.last_name || '',
  email: row.email || '',
  contact: row.contact || '',
  joinDate: row.join_date || '',
  isActive: row.is_active ?? true,
  createdAt: row.created_at || '',
});

// DELETE - Soft delete student by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient(request);
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("students")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      console.error("Supabase delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Student deleted successfully" });
  } catch (err: any) {
    console.error("Server error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

// PUT - Update student by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient(request);
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, email, contact, joinDate } = body;

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "First name, last name, and email are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("students")
      .update({
        first_name: firstName,
        last_name: lastName,
        email: email,
        contact: contact || null,
        join_date: joinDate || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const transformedData = transformStudent(data as StudentRow);
    return NextResponse.json(transformedData);
  } catch (err: any) {
    console.error("Server error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

