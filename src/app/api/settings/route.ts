/**
 * Settings API Route
 * Handles default settings creation using admin client (bypasses RLS)
 */

import { NextResponse } from 'next/server';
import { createSupabaseAdminClientWithoutCookies } from '@/lib/supabase/admin';

export async function POST() {
  try {
    const supabase = createSupabaseAdminClientWithoutCookies();
    
    // Check if settings already exist
    const { data: existingSettings } = await supabase
      .from('reminder_settings')
      .select('id')
      .limit(1)
      .single();

    if (existingSettings) {
      // Get the full settings
      const { data: settings } = await supabase
        .from('reminder_settings')
        .select('*')
        .limit(1)
        .single();

      return NextResponse.json({ settings, created: false });
    }

    // Create default settings using admin client (bypasses RLS)
    const { data: newSettings, error: insertError } = await supabase
      .from('reminder_settings')
      .insert({
        is_enabled: true,
        reminder_days: ['3', '4', '5', '6', '7', '8', '9', '10'],
        email_enabled: true,
        payment_dates: '3rd-10th',
        message_template: 'Dear {student_name}, This is a friendly reminder that your monthly fees payment is due. Please make your payment between 3rd-10th of this month. Contact us if you have any questions. Best regards, Agaicode Tech Fees Management',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating default settings:', insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ settings: newSettings, created: true });
  } catch (err: any) {
    console.error('Error in settings POST:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = createSupabaseAdminClientWithoutCookies();
    
    const { data: settings, error } = await supabase
      .from('reminder_settings')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching settings:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ settings });
  } catch (err: any) {
    console.error('Error in settings GET:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

