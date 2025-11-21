import { NextRequest, NextResponse } from 'next/server';
import { bookingService } from '@/lib/database/bookings';
import { testConnection } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/bookings/[id]/itinerary - Get booking itinerary
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

    const itinerary = await bookingService.getBookingItinerary(bookingId);

    return NextResponse.json({ itinerary });

  } catch (error) {
    console.error('Get booking itinerary error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/bookings/[id]/itinerary - Add itinerary item to booking
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

    // Only agents and admins can add itinerary items
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

    // Check if booking exists and is in a modifiable state
    const existingBooking = await bookingService.getBookingById(bookingId);
    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (existingBooking.Status === 'Cancelled' || existingBooking.Status === 'Completed') {
      return NextResponse.json(
        { error: 'Cannot modify cancelled or completed booking' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['ItemType', 'Title', 'Price'];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate item type
    const validItemTypes = ['Flight', 'Hotel', 'Activity', 'Transport', 'Meal', 'Other'];
    if (!validItemTypes.includes(body.ItemType)) {
      return NextResponse.json(
        { error: `Invalid ItemType. Must be one of: ${validItemTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const itineraryItemData = {
      ItemType: body.ItemType,
      Title: body.Title,
      Description: body.Description,
      StartDate: body.StartDate ? new Date(body.StartDate) : undefined,
      EndDate: body.EndDate ? new Date(body.EndDate) : undefined,
      Location: body.Location,
      Price: parseFloat(body.Price),
      SupplierID: body.SupplierID ? parseInt(body.SupplierID) : undefined
    };

    // Validate price
    if (itineraryItemData.Price < 0) {
      return NextResponse.json(
        { error: 'Price cannot be negative' },
        { status: 400 }
      );
    }

    // Validate dates if provided
    if (itineraryItemData.StartDate && itineraryItemData.EndDate) {
      if (itineraryItemData.StartDate >= itineraryItemData.EndDate) {
        return NextResponse.json(
          { error: 'Start date must be before end date' },
          { status: 400 }
        );
      }
    }

    // Add flight segments if this is a flight item
    if (itineraryItemData.ItemType === 'Flight' && body.flightSegments) {
      if (!Array.isArray(body.flightSegments) || body.flightSegments.length === 0) {
        return NextResponse.json(
          { error: 'Flight items require at least one flight segment' },
          { status: 400 }
        );
      }

      // Validate flight segments
      for (const segment of body.flightSegments) {
        const requiredSegmentFields = ['FlightNumber', 'DepartureCity', 'ArrivalCity', 'DepartureTime', 'ArrivalTime'];
        for (const field of requiredSegmentFields) {
          if (!segment[field]) {
            return NextResponse.json(
              { error: `Flight segment ${field} is required` },
              { status: 400 }
            );
          }
        }
      }
    }

    // Add hotel room booking if this is a hotel item
    if (itineraryItemData.ItemType === 'Hotel' && body.roomBooking) {
      const requiredRoomFields = ['RoomID', 'CheckInDate', 'CheckOutDate', 'NumberOfRooms', 'PricePerNight'];
      for (const field of requiredRoomFields) {
        if (body.roomBooking[field] === undefined || body.roomBooking[field] === null) {
          return NextResponse.json(
            { error: `Room booking ${field} is required` },
            { status: 400 }
          );
        }
      }

      // Validate room booking dates
      const checkIn = new Date(body.roomBooking.CheckInDate);
      const checkOut = new Date(body.roomBooking.CheckOutDate);
      if (checkIn >= checkOut) {
        return NextResponse.json(
          { error: 'Check-in date must be before check-out date' },
          { status: 400 }
        );
      }
    }

    const itineraryItemId = await bookingService.addItineraryItem(bookingId, itineraryItemData);

    // Add flight segments if provided
    if (itineraryItemData.ItemType === 'Flight' && body.flightSegments) {
      const flightSegments = body.flightSegments.map((segment: any) => ({
        FlightNumber: segment.FlightNumber,
        Airline: segment.Airline,
        DepartureCity: segment.DepartureCity,
        DepartureAirport: segment.DepartureAirport,
        DepartureTime: new Date(segment.DepartureTime),
        ArrivalCity: segment.ArrivalCity,
        ArrivalAirport: segment.ArrivalAirport,
        ArrivalTime: new Date(segment.ArrivalTime),
        AircraftType: segment.AircraftType,
        SeatClass: segment.SeatClass || 'Economy'
      }));

      await bookingService.addFlightSegments(itineraryItemId, flightSegments);
    }

    // Add room booking if provided
    if (itineraryItemData.ItemType === 'Hotel' && body.roomBooking) {
      const roomBookingData = {
        RoomID: parseInt(body.roomBooking.RoomID),
        CheckInDate: new Date(body.roomBooking.CheckInDate),
        CheckOutDate: new Date(body.roomBooking.CheckOutDate),
        NumberOfRooms: parseInt(body.roomBooking.NumberOfRooms),
        PricePerNight: parseFloat(body.roomBooking.PricePerNight),
        GuestNames: body.roomBooking.GuestNames,
        SpecialRequests: body.roomBooking.SpecialRequests
      };

      await bookingService.addBookingRoom(itineraryItemId, roomBookingData);
    }

    // Recalculate booking total
    await bookingService.recalculateBookingTotal(bookingId);

    return NextResponse.json({
      message: 'Itinerary item added successfully',
      itineraryItemId
    });

  } catch (error: any) {
    console.error('Add itinerary item error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}