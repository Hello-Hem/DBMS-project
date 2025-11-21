import { NextRequest, NextResponse } from 'next/server';
import { bookingService } from '@/lib/database/bookings';
import { testConnection } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/bookings - Get bookings (with filtering based on user role)
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
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type'); // customer, agent, or reference

    let result;

    if (type === 'customer' && session.user.role === 'customer') {
      // Get customer bookings
      result = await bookingService.getCustomerBookings(
        parseInt(session.user.id),
        page,
        limit
      );
    } else if (type === 'agent' && session.user.role === 'agent') {
      // Get agent bookings
      result = await bookingService.getAgentBookings(
        parseInt(session.user.id),
        page,
        limit
      );
    } else if (type === 'reference') {
      // Search by booking reference
      const reference = searchParams.get('reference');
      if (!reference) {
        return NextResponse.json(
          { error: 'Booking reference is required' },
          { status: 400 }
        );
      }
      const booking = await bookingService.getBookingByReference(reference);
      if (booking) {
        // Only return booking if it belongs to the current user or if admin/agent
        if (
          session.user.role === 'admin' ||
          session.user.role === 'agent' ||
          (session.user.role === 'customer' && booking.CustomerID === parseInt(session.user.id))
        ) {
          result = { bookings: [booking], pagination: { page, limit, total: 1, totalPages: 1 } };
        } else {
          return NextResponse.json(
            { error: 'Booking not found' },
            { status: 404 }
          );
        }
      } else {
        result = { bookings: [], pagination: { page, limit, total: 0, totalPages: 0 } };
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid request type or insufficient permissions' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Get bookings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/bookings - Create new booking
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
    const requiredFields = ['PackageID', 'NumTravellers', 'TravelStartDate', 'TravelEndDate', 'TotalAmount'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Parse and validate data
    const bookingData = {
      PackageID: parseInt(body.PackageID),
      NumTravellers: parseInt(body.NumTravellers),
      TravelStartDate: new Date(body.TravelStartDate),
      TravelEndDate: new Date(body.TravelEndDate),
      TotalAmount: parseFloat(body.TotalAmount),
      DepositAmount: body.DepositAmount ? parseFloat(body.DepositAmount) : undefined,
      SpecialRequests: body.SpecialRequests
    };

    if (isNaN(bookingData.PackageID) || bookingData.PackageID <= 0) {
      return NextResponse.json(
        { error: 'Invalid package ID' },
        { status: 400 }
      );
    }

    if (bookingData.NumTravellers <= 0) {
      return NextResponse.json(
        { error: 'Number of travellers must be greater than 0' },
        { status: 400 }
      );
    }

    if (bookingData.TravelStartDate >= bookingData.TravelEndDate) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    if (bookingData.TravelStartDate < new Date()) {
      return NextResponse.json(
        { error: 'Travel dates must be in the future' },
        { status: 400 }
      );
    }

    if (bookingData.TotalAmount <= 0) {
      return NextResponse.json(
        { error: 'Total amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Set customer ID based on session or allow agent to book for customer
    let customerId;
    if (session.user.role === 'customer') {
      customerId = parseInt(session.user.id);
    } else if (session.user.role === 'agent' || session.user.role === 'admin') {
      // Agent can book for a customer
      if (!body.CustomerID) {
        return NextResponse.json(
          { error: 'CustomerID is required for agent bookings' },
          { status: 400 }
        );
      }
      customerId = parseInt(body.CustomerID);
    } else {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Set agent ID if booking is made by agent
    const agentId = (session.user.role === 'agent' || session.user.role === 'admin')
      ? parseInt(session.user.id)
      : undefined;

    const finalBookingData = {
      CustomerID: customerId,
      AgentID: agentId,
      ...bookingData
    };

    const newBooking = await bookingService.createBooking(finalBookingData);

    return NextResponse.json(
      {
        message: 'Booking created successfully',
        booking: newBooking
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Create booking error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}