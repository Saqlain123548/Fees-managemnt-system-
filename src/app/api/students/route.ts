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

// GET - Fetch all active students, optionally filtered by search query
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient(request);
    
    // Get search parameter from URL
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    let query = supabase
      .from("students")
      .select("*")
      .eq("is_active", true);

    // Apply search filter if provided
    if (search && search.trim()) {
      const searchTerm = search.trim();
      query = query.or(
        `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,contact.ilike.%${searchTerm}%`
      );
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const transformedData = (data || []).map((row: StudentRow) => transformStudent(row));
    return NextResponse.json(transformedData);
  } catch (err: any) {
    console.error("Server error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new student
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient(request);

    const body = await request.json();
    const { firstName, lastName, email, contact, joinDate } = body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "First name, last name, and email are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("students")
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: email,
        contact: contact || null,
        join_date: joinDate || new Date().toISOString().split("T")[0],
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const transformedData = transformStudent(data as StudentRow);
    return NextResponse.json(transformedData, { status: 201 });
  } catch (err: any) {
    console.error("Server error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

