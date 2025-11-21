import { NextRequest, NextResponse } from 'next/server';
import { bookingService } from '@/lib/database/bookings';
import { testConnection } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/bookings/[id] - Get booking details
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

    const bookingId = parseInt(params.id);
    if (isNaN(bookingId)) {
      return NextResponse.json(
        { error: 'Invalid booking ID' },
        { status: 400 }
      );
    }

    const booking = await bookingService.getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to view this booking
    const hasPermission =
      session.user.role === 'admin' ||
      session.user.role === 'agent' ||
      (session.user.role === 'customer' && booking.CustomerID === parseInt(session.user.id));

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return NextResponse.json({ booking });

  } catch (error) {
    console.error('Get booking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/bookings/[id] - Update booking
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

    const bookingId = parseInt(params.id);
    if (isNaN(bookingId)) {
      return NextResponse.json(
        { error: 'Invalid booking ID' },
        { status: 400 }
      );
    }

    // Check if booking exists and user has permission
    const existingBooking = await bookingService.getBookingById(bookingId);
    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    const hasPermission =
      session.user.role === 'admin' ||
      session.user.role === 'agent' ||
      (session.user.role === 'customer' && existingBooking.CustomerID === parseInt(session.user.id));

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Only allow certain fields to be updated and only for certain roles
    let updateData: any = {};

    if (session.user.role === 'customer') {
      // Customers can only update special requests
      if (body.SpecialRequests !== undefined) {
        updateData.SpecialRequests = body.SpecialRequests;
      }
    } else if (session.user.role === 'agent' || session.user.role === 'admin') {
      // Agents and admins can update more fields, but with restrictions
      if (body.NumTravellers !== undefined) {
        updateData.NumTravellers = parseInt(body.NumTravellers);
        if (updateData.NumTravellers <= 0) {
          return NextResponse.json(
            { error: 'Number of travellers must be greater than 0' },
            { status: 400 }
          );
        }
      }

      if (body.TravelStartDate !== undefined && body.TravelEndDate !== undefined) {
        const startDate = new Date(body.TravelStartDate);
        const endDate = new Date(body.TravelEndDate);

        if (startDate >= endDate) {
          return NextResponse.json(
            { error: 'Start date must be before end date' },
            { status: 400 }
          );
        }

        updateData.TravelStartDate = startDate;
        updateData.TravelEndDate = endDate;
      }

      if (body.SpecialRequests !== undefined) {
        updateData.SpecialRequests = body.SpecialRequests;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const updatedBooking = await bookingService.updateBooking(bookingId, updateData);

    return NextResponse.json({
      message: 'Booking updated successfully',
      booking: updatedBooking
    });

  } catch (error: any) {
    console.error('Update booking error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/bookings/[id] - Cancel booking
export async function DELETE(
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

    const bookingId = parseInt(params.id);
    if (isNaN(bookingId)) {
      return NextResponse.json(
        { error: 'Invalid booking ID' },
        { status: 400 }
      );
    }

    // Check if booking exists and user has permission
    const existingBooking = await bookingService.getBookingById(bookingId);
    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    const hasPermission =
      session.user.role === 'admin' ||
      session.user.role === 'agent' ||
      (session.user.role === 'customer' && existingBooking.CustomerID === parseInt(session.user.id));

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check if booking can be cancelled (not already cancelled or completed)
    if (existingBooking.Status === 'Cancelled') {
      return NextResponse.json(
        { error: 'Booking is already cancelled' },
        { status: 400 }
      );
    }

    if (existingBooking.Status === 'Completed') {
      return NextResponse.json(
        { error: 'Cannot cancel completed booking' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const reason = body.reason;

    await bookingService.cancelBooking(bookingId, reason);

    return NextResponse.json({
      message: 'Booking cancelled successfully'
    });

  } catch (error: any) {
    console.error('Cancel booking error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}