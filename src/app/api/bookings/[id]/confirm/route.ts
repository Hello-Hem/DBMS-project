import { NextRequest, NextResponse } from 'next/server';
import { bookingService } from '@/lib/database/bookings';
import { testConnection } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/bookings/[id]/confirm - Confirm booking
export async function POST(
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

    // Only agents and admins can confirm bookings
    if (session.user.role !== 'agent' && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const bookingId = parseInt(params.id);
    if (isNaN(bookingId)) {
      return NextResponse.json(
        { error: 'Invalid booking ID' },
        { status: 400 }
      );
    }

    // Check if booking exists
    const existingBooking = await bookingService.getBookingById(bookingId);
    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if booking is in a confirmable state
    if (existingBooking.Status === 'Confirmed') {
      return NextResponse.json(
        { error: 'Booking is already confirmed' },
        { status: 400 }
      );
    }

    if (existingBooking.Status === 'Cancelled') {
      return NextResponse.json(
        { error: 'Cannot confirm cancelled booking' },
        { status: 400 }
      );
    }

    if (existingBooking.Status === 'Completed') {
      return NextResponse.json(
        { error: 'Booking is already completed' },
        { status: 400 }
      );
    }

    await bookingService.confirmBooking(bookingId);

    return NextResponse.json({
      message: 'Booking confirmed successfully'
    });

  } catch (error: any) {
    console.error('Confirm booking error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}