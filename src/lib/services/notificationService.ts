/**
 * Payment Reminder Notification Service
 * Handles sending WhatsApp (via Twilio Content Templates) and Email (via Gmail/SMTP) notifications
 */

// Types for notification
export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  contact: string | null;
  whatsappNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
}

export interface ReminderResult {
  success: boolean;
  type: 'whatsapp' | 'email';
  studentId: string;
  error?: string;
}

// Get environment variables
const getEnvVar = (key: string): string => {
  return process.env[key] || '';
};

// Message templates for Email
export const getEmailTemplate = (studentName: string, paymentDates: string = '3rd-10th'): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">IT Center Fees Management</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Dear <strong>${studentName}</strong>,</p>
    
    <p style="font-size: 16px;">This is a friendly reminder that your monthly fees payment is due.</p>
    
    <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-size: 16px; color: #856404;">
        <strong>⚠️ Please make your payment between ${paymentDates} of this month.</strong>
      </p>
    </div>
    
    <p style="font-size: 14px; color: #666;">If you have already made the payment, please disregard this reminder.</p>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
    
    <p style="font-size: 14px; color: #666;">
      Contact us if you have any questions.<br>
      <strong>Best regards,</strong><br>
      IT Center Fees Management
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
    <p>This is an automated message. Please do not reply directly to this email.</p>
  </div>
</body>
</html>
`;
};

/**
 * Send WhatsApp message via Twilio using Content Templates
 * 
 * Uses Twilio's Content Template format:
 * - ContentSid: The template SID (e.g., HXb5b62575e6e4ff6129ad7c8efe1f983e)
 * - ContentVariables: JSON with placeholders matching the template
 * 
 * Example from your curl:
 * --data-urlencode 'ContentSid=HXb5b62575e6e4ff6129ad7c8efe1f983e'
 * --data-urlencode 'ContentVariables={"1":"3/1","2":"7pm"}'
 */
export async function sendWhatsApp(
  toNumber: string,
  templateSid: string,
  contentVariables: { [key: string]: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if Twilio credentials are configured
    const accountSid = getEnvVar('TWILIO_ACCOUNT_SID');
    const authToken = getEnvVar('TWILIO_AUTH_TOKEN');
    const whatsappFrom = getEnvVar('TWILIO_WHATSAPP_NUMBER');

    if (!accountSid || !authToken || !whatsappFrom) {
      console.log('[WhatsApp] Twilio credentials not configured, logging instead');
      console.log(`[WhatsApp] To: ${toNumber}`);
      console.log(`[WhatsApp] TemplateSid: ${templateSid}`);
      console.log(`[WhatsApp] ContentVariables:`, contentVariables);
      return { success: true }; // Return success for development
    }

    // Dynamic import for Twilio (only in Node.js environment)
    const twilio = await import('twilio');
    const client = twilio.default(accountSid, authToken);

    // Format the to number for WhatsApp
    const formattedTo = toNumber.startsWith('whatsapp:') 
      ? toNumber 
      : `whatsapp:${toNumber}`;

    const result = await client.messages.create({
      from: whatsappFrom,
      to: formattedTo,
      contentSid: templateSid,
      contentVariables: JSON.stringify(contentVariables),
    });

    console.log(`[WhatsApp] Sent successfully. SID: ${result.sid}`);
    return { success: true };
  } catch (error: any) {
    console.error('[WhatsApp] Error sending WhatsApp:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send Email via Gmail/SMTP
 */
export async function sendEmail(
  toEmail: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const smtpHost = getEnvVar('SMTP_HOST');
    const smtpPort = parseInt(getEnvVar('SMTP_PORT') || '587');
    const smtpUser = getEnvVar('SMTP_USER');
    const smtpPassword = getEnvVar('SMTP_PASSWORD');

    // Check if SMTP credentials are configured
    if (!smtpHost || !smtpUser || !smtpPassword) {
      console.log('[Email] SMTP credentials not configured, logging instead');
      console.log(`[Email] To: ${toEmail}`);
      console.log(`[Email] Subject: ${subject}`);
      return { success: true }; // Return success for development
    }

    // Dynamic import for Nodemailer (only in Node.js environment)
    const nodemailer = await import('nodemailer');
    
    const transporter = nodemailer.default.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });

    const result = await transporter.sendMail({
      from: `"IT Center Fees" <${smtpUser}>`,
      to: toEmail,
      subject: subject,
      html: htmlContent,
    });

    console.log(`[Email] Sent successfully. MessageId: ${result.messageId}`);
    return { success: true };
  } catch (error: any) {
    console.error('[Email] Error sending email:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send payment reminder to a student (WhatsApp + Email only)
 */
export async function sendPaymentReminder(
  student: Student,
  options?: {
    paymentDates?: string;
    customMessage?: string;
  }
): Promise<ReminderResult[]> {
  const results: ReminderResult[] = [];
  const fullName = `${student.firstName} ${student.lastName}`;
  const paymentDates = options?.paymentDates || '3rd-10th';

  // Get Twilio Content Template SID from environment or use default
  const contentSid = getEnvVar('TWILIO_CONTENT_SID') || 'HXb5b62575e6e4ff6129ad7c8efe1f983e';

  // Send WhatsApp if enabled and contact number exists
  if (
    student.whatsappNotificationsEnabled &&
    student.contact &&
    student.contact.trim()
  ) {
    const contentVariables = {
      '1': fullName,      // Student name (first placeholder in template)
      '2': paymentDates,  // Payment dates (second placeholder in template)
    };
    
    const whatsappResult = await sendWhatsApp(
      student.contact,
      contentSid,
      contentVariables
    );
    
    results.push({
      success: whatsappResult.success,
      type: 'whatsapp',
      studentId: student.id,
      error: whatsappResult.error,
    });
  }

  // Send Email if enabled and email exists
  if (
    student.emailNotificationsEnabled &&
    student.email &&
    student.email.trim()
  ) {
    const emailSubject = 'Payment Reminder - IT Center Fees';
    const emailContent = getEmailTemplate(fullName, paymentDates);
    const emailResult = await sendEmail(student.email, emailSubject, emailContent);
    
    results.push({
      success: emailResult.success,
      type: 'email',
      studentId: student.id,
      error: emailResult.error,
    });
  }

  return results;
}

/**
 * Check if today is a reminder day (3rd-10th of every month)
 */
export function isReminderDay(): boolean {
  const today = new Date();
  const day = today.getDate();
  return day >= 3 && day <= 10;
}

/**
 * Check if a student has paid this month
 */
export function hasPaidThisMonth(
  feesRecords: { payment_date: string }[]
): boolean {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return feesRecords.some((record) => {
    const paymentDate = new Date(record.payment_date);
    return (
      paymentDate.getMonth() === currentMonth &&
      paymentDate.getFullYear() === currentYear
    );
  });
}

/**
 * Get reminder days configuration
 */
export function getReminderDays(): number[] {
  const reminderDays = process.env.REMINDER_DAYS || '3,4,5,6,7,8,9,10';
  return reminderDays.split(',').map(d => parseInt(d.trim()));
}

