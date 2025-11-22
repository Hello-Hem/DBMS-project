import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/nextjs';
import { authOptions } from '@/lib/auth';

// Mock payment data
const mockPayments = [
  {
    PaymentID: 1,
    BookingID: 10001,
    PaymentDate: new Date().toISOString(),
    PaidAmount: 2499,
    Method: 'Credit Card',
    TransactionRef: 'TXN123456',
    Status: 'Completed',
    Notes: 'Full payment'
  },
  {
    PaymentID: 2,
    BookingID: 10002,
    PaymentDate: new Date(Date.now() - 86400000).toISOString(),
    PaidAmount: 500,
    Method: 'Bank Transfer',
    TransactionRef: 'TXN789012',
    Status: 'Completed',
    Notes: 'Partial payment'
  }
];

// GET /api/payments - Get payments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'outstanding') {
      // Return mock outstanding payments
      return NextResponse.json({
        payments: mockPayments.filter(p => p.Status === 'Completed')
      });
    }

    return NextResponse.json({ payments: mockPayments });
  } catch (error) {
    console.error('Get payments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/payments - Process payment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const newPayment = {
      PaymentID: Math.floor(Math.random() * 10000) + 1000,
      BookingID: body.BookingID,
      PaymentDate: new Date().toISOString(),
      PaidAmount: body.PaidAmount,
      Method: body.Method,
      TransactionRef: `TXN${Math.random().toString(36).substr(2, 9)}`,
      Status: 'Completed',
      Notes: body.Notes
    };

    return NextResponse.json({
      message: 'Payment processed successfully',
      payment: newPayment
    }, { status: 201 });
  } catch (error) {
    console.error('Process payment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}