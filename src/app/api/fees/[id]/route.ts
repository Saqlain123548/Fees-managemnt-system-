import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// DELETE - Soft delete a fee record by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient(request);

    if (!id) {
      return NextResponse.json(
        { error: "Fee record ID is required" },
        { status: 400 }
      );
    }

    // Soft delete - set is_active to false
    const { error } = await supabase
      .from("fees_records")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      console.error("Supabase delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Fee record deleted successfully" });
  } catch (err: any) {
    console.error("Server error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

