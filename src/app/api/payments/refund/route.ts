import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/database/payments';
import { testConnection } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/payments/refund - Process refund
export async function POST(request: NextRequest) {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins and agents can process refunds
    if (session.user.role !== 'admin' && session.user.role !== 'agent') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.BookingID || !body.Amount) {
      return NextResponse.json(
        { error: 'BookingID and Amount are required' },
        { status: 400 }
      );
    }

    const refundData = {
      BookingID: parseInt(body.BookingID),
      Amount: parseFloat(body.Amount),
      Reason: body.Reason
    };

    // Validate values
    if (isNaN(refundData.BookingID) || refundData.BookingID <= 0) {
      return NextResponse.json(
        { error: 'Invalid booking ID' },
        { status: 400 }
      );
    }

    if (refundData.Amount <= 0) {
      return NextResponse.json(
        { error: 'Refund amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Process refund
    const refundPayment = await paymentService.processRefund(
      refundData.BookingID,
      refundData.Amount,
      refundData.Reason
    );

    return NextResponse.json({
      message: 'Refund processed successfully',
      refund: refundPayment
    });

  } catch (error: any) {
    console.error('Process refund error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}