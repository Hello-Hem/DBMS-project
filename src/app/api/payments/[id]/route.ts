import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/database/payments';
import { testConnection } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/payments/[id] - Get payment details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const paymentId = parseInt(params.id);
    if (isNaN(paymentId)) {
      return NextResponse.json(
        { error: 'Invalid payment ID' },
        { status: 400 }
      );
    }

    const payment = await paymentService.getPaymentById(paymentId);

    // Check if user has permission to view this payment
    // This would require checking the booking associated with the payment
    // For now, we'll allow agents and admins to view all payments
    const hasPermission = session.user.role === 'admin' || session.user.role === 'agent';

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return NextResponse.json({ payment });

  } catch (error) {
    console.error('Get payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/payments/[id] - Update payment status (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Only admins can update payment status
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const paymentId = parseInt(params.id);
    if (isNaN(paymentId)) {
      return NextResponse.json(
        { error: 'Invalid payment ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate status
    const validStatuses = ['Pending', 'Completed', 'Failed', 'Refunded'];
    if (!body.status || !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    await paymentService.updatePaymentStatus(
      paymentId,
      body.status,
      body.notes
    );

    return NextResponse.json({
      message: 'Payment status updated successfully'
    });

  } catch (error: any) {
    console.error('Update payment error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}