import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/database/payments';
import { testConnection } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/payments - Get payments (with filtering based on user role)
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');

    let result;

    if (type === 'outstanding') {
      // Get outstanding payments
      if (session.user.role === 'agent') {
        result = await paymentService.getAgentOutstandingPayments(
          parseInt(session.user.id),
          page,
          limit
        );
      } else if (session.user.role === 'admin') {
        result = await paymentService.getOutstandingPayments(page, limit);
      } else {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    } else if (type === 'customer' && session.user.role === 'customer') {
      // Get customer payment history
      result = await paymentService.getCustomerPaymentHistory(
        parseInt(session.user.id),
        page,
        limit
      );
    } else if (type === 'stats' && (session.user.role === 'admin' || session.user.role === 'agent')) {
      // Get payment statistics
      let dateRange;
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      if (startDate && endDate) {
        dateRange = {
          start: new Date(startDate),
          end: new Date(endDate)
        };
      }

      const stats = await paymentService.getPaymentStats(dateRange);
      return NextResponse.json({ stats });
    } else if (type === 'date-range' && session.user.role === 'admin') {
      // Get payments by date range for reporting
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const method = searchParams.get('method');

      if (!startDate || !endDate) {
        return NextResponse.json(
          { error: 'startDate and endDate are required' },
          { status: 400 }
        );
      }

      const payments = await paymentService.getPaymentsByDateRange(
        new Date(startDate),
        new Date(endDate),
        method || undefined
      );

      return NextResponse.json({ payments });
    } else {
      return NextResponse.json(
        { error: 'Invalid request type or insufficient permissions' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Get payments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/payments - Process payment
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

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['BookingID', 'PaidAmount', 'Method'];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate payment method
    const validMethods = ['Credit Card', 'Bank Transfer', 'PayPal', 'Cash', 'Check'];
    if (!validMethods.includes(body.Method)) {
      return NextResponse.json(
        { error: `Invalid payment method. Must be one of: ${validMethods.join(', ')}` },
        { status: 400 }
      );
    }

    const paymentData = {
      BookingID: parseInt(body.BookingID),
      PaidAmount: parseFloat(body.PaidAmount),
      Method: body.Method,
      TransactionRef: body.TransactionRef,
      Notes: body.Notes
    };

    // Validate numeric values
    if (isNaN(paymentData.BookingID) || paymentData.BookingID <= 0) {
      return NextResponse.json(
        { error: 'Invalid booking ID' },
        { status: 400 }
      );
    }

    if (paymentData.PaidAmount <= 0) {
      return NextResponse.json(
        { error: 'Payment amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Check transaction reference uniqueness if provided
    if (paymentData.TransactionRef) {
      const isUnique = await paymentService.isTransactionRefUnique(paymentData.TransactionRef);
      if (!isUnique) {
        return NextResponse.json(
          { error: 'Transaction reference already exists' },
          { status: 400 }
        );
      }
    }

    // Create payment
    const newPayment = await paymentService.createPayment(paymentData);

    return NextResponse.json(
      {
        message: 'Payment processed successfully',
        payment: newPayment
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Process payment error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}