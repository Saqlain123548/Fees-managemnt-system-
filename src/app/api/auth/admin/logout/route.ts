import { NextRequest, NextResponse } from 'next/server';
import { clearAdminSession } from '@/lib/adminSession';

export async function POST(request: NextRequest) {
  try {
    // Clear admin session and return response
    const response = clearAdminSession();
    
    return response;
  } catch (error) {
    console.error('Admin logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

