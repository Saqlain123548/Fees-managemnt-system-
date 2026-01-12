/**
 * Payment Reminders API Route
 * Handles sending payment reminders to students via WhatsApp + Email
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClientWithoutCookies } from '@/lib/supabase/admin';
import { 
  sendPaymentReminder, 
  isReminderDay, 
  hasPaidThisMonth,
  getReminderDays
} from '@/lib/services/notificationService';

// Types
interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  contact: string | null;
  whatsapp_notifications_enabled: boolean;
  email_notifications_enabled: boolean;
}

interface ReminderLog {
  id: string;
  student_id: string;
  reminder_type: string;
  status: string;
  message: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

// GET - Check reminder status and settings
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClientWithoutCookies();
    
    // Get current date info
    const today = new Date();
    const currentDay = today.getDate();
    const isTodayReminderDay = currentDay >= 3 && currentDay <= 10;

    // Get reminder settings
    const { data: settings, error: settingsError } = await supabase
      .from('reminder_settings')
      .select('*')
      .limit(1)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Error fetching settings:', settingsError);
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      );
    }

    // Get students who haven't paid this month
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .eq('is_active', true);

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return NextResponse.json(
        { error: 'Failed to fetch students' },
        { status: 500 }
      );
    }

    // Filter students who haven't paid this month
    const unpaidStudents = [];
    for (const student of (students || [])) {
      const { data: feesRecords } = await supabase
        .from('fees_records')
        .select('payment_date')
        .eq('student_id', student.id);

      if (!hasPaidThisMonth(feesRecords || [])) {
        unpaidStudents.push(student);
      }
    }

    // Count students with WhatsApp and Email enabled
    const whatsappEnabled = unpaidStudents.filter(s => s.whatsapp_notifications_enabled).length;
    const emailEnabled = unpaidStudents.filter(s => s.email_notifications_enabled).length;

    return NextResponse.json({
      currentDate: today.toISOString().split('T')[0],
      currentDay,
      isReminderDay: isTodayReminderDay,
      reminderEnabled: settings?.is_enabled ?? true,
      totalStudents: students?.length ?? 0,
      unpaidStudentsCount: unpaidStudents.length,
      whatsappEnabledCount: whatsappEnabled,
      emailEnabledCount: emailEnabled,
    });
  } catch (err: any) {
    console.error('Error in reminders GET:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Send reminders to all eligible students (WhatsApp + Email only)
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClientWithoutCookies();
    
    // Check authorization (cron job secret key) - only for automated calls
    const authHeader = request.headers.get('authorization');
    const cronKey = process.env.SUPABASE_CRON_KEY;
    const isManualTrigger = request.nextUrl.searchParams.get('manual') === 'true';
    
    // Allow manual trigger without auth, require auth only for cron jobs
    if (cronKey && !isManualTrigger && authHeader !== `Bearer ${cronKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get reminder settings
    const { data: settings, error: settingsError } = await supabase
      .from('reminder_settings')
      .select('*')
      .limit(1)
      .single();

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
      return NextResponse.json(
        { error: 'Failed to fetch reminder settings' },
        { status: 500 }
      );
    }

    // Check if reminders are enabled
    if (!settings?.is_enabled) {
      return NextResponse.json({
        message: 'Reminders are disabled',
        sent: 0,
        failed: 0,
        skipped: 0,
      });
    }

    // Check if today is a reminder day
    const today = new Date();
    const currentDay = today.getDate();
    const reminderDays = settings?.reminder_days?.map((d: string) => parseInt(d)) || getReminderDays();
    
    // Allow manual trigger even if not in reminder days
    if (!isManualTrigger && !reminderDays.includes(currentDay)) {
      return NextResponse.json({
        message: `Today (day ${currentDay}) is not a reminder day. Reminder days: ${reminderDays.join(', ')}`,
        sent: 0,
        failed: 0,
        skipped: 0,
      });
    }

    // Get all active students
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .eq('is_active', true);

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return NextResponse.json(
        { error: 'Failed to fetch students' },
        { status: 500 }
      );
    }

    let sent = 0;
    let failed = 0;
    let skipped = 0;
    const results: Array<{
      studentId: string;
      studentName: string;
      success: boolean;
      type?: string;
      error?: string;
    }> = [];

    for (const student of (students || [])) {
      const typedStudent = student as Student;

      // Check if student has paid this month
      const { data: feesRecords } = await supabase
        .from('fees_records')
        .select('payment_date')
        .eq('student_id', student.id);

      if (hasPaidThisMonth(feesRecords || [])) {
        skipped++;
        continue;
      }

      // Check if notifications are enabled for this student (WhatsApp + Email only)
      if (
        !typedStudent.whatsapp_notifications_enabled &&
        !typedStudent.email_notifications_enabled
      ) {
        skipped++;
        continue;
      }

      // Send reminder
      const studentFullName = `${typedStudent.first_name} ${typedStudent.last_name}`;
      
      try {
        const reminderResults = await sendPaymentReminder(
          {
            id: typedStudent.id,
            firstName: typedStudent.first_name,
            lastName: typedStudent.last_name,
            email: typedStudent.email,
            contact: typedStudent.contact,
            whatsappNotificationsEnabled: typedStudent.whatsapp_notifications_enabled,
            emailNotificationsEnabled: typedStudent.email_notifications_enabled,
          },
          {
            paymentDates: settings?.payment_dates || '3rd-10th',
          }
        );

        // Log each notification attempt
        for (const result of reminderResults) {
          const message = result.type === 'whatsapp'
            ? `WhatsApp reminder sent to ${typedStudent.contact || 'N/A'}`
            : `Email reminder sent to ${typedStudent.email}`;

          const { error: logError } = await supabase
            .from('payment_reminders')
            .insert({
              student_id: typedStudent.id,
              reminder_type: result.type,
              status: result.success ? 'sent' : 'failed',
              message: message,
              error_message: result.error || null,
              sent_at: result.success ? new Date().toISOString() : null,
            });

          if (logError) {
            console.error('Error logging reminder:', logError);
          }

          if (result.success) {
            sent++;
            results.push({
              studentId: typedStudent.id,
              studentName: studentFullName,
              success: true,
              type: result.type,
            });
          } else {
            failed++;
            results.push({
              studentId: typedStudent.id,
              studentName: studentFullName,
              success: false,
              type: result.type,
              error: result.error,
            });
          }
        }
      } catch (error: any) {
        console.error(`Error sending reminder to ${studentFullName}:`, error);
        failed++;
        results.push({
          studentId: typedStudent.id,
          studentName: studentFullName,
          success: false,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      message: `Reminders processed: ${sent} sent, ${failed} failed, ${skipped} skipped`,
      sent,
      failed,
      skipped,
      isManualTrigger,
      results: results.slice(0, 10), // Return first 10 results for debugging
      totalResults: results.length,
    });
  } catch (err: any) {
    console.error('Error sending reminders:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

