import { NextRequest, NextResponse } from 'next/server';
import { packageService } from '@/lib/database/packages';
import { testConnection } from '@/lib/db';

// GET /api/packages/[id]/availability - Check package availability
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

    const packageId = parseInt(params.id);
    if (isNaN(packageId)) {
      return NextResponse.json(
        { error: 'Invalid package ID' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const travelStartDate = searchParams.get('travelStartDate');
    const travelEndDate = searchParams.get('travelEndDate');
    const numTravellers = searchParams.get('numTravellers');

    if (!travelStartDate || !travelEndDate) {
      return NextResponse.json(
        { error: 'travelStartDate and travelEndDate are required' },
        { status: 400 }
      );
    }

    const startDate = new Date(travelStartDate);
    const endDate = new Date(travelEndDate);
    const travellers = numTravellers ? parseInt(numTravellers) : 1;

    // Validate dates
    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    if (startDate < new Date()) {
      return NextResponse.json(
        { error: 'Travel dates must be in the future' },
        { status: 400 }
      );
    }

    if (travellers <= 0) {
      return NextResponse.json(
        { error: 'Number of travellers must be greater than 0' },
        { status: 400 }
      );
    }

    const availability = await packageService.checkAvailability(
      packageId,
      startDate,
      endDate,
      travellers
    );

    if (!availability) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      availability: {
        isAvailable: availability.is_available,
        capacityLeft: availability.available_capacity,
        totalCapacity: availability.capacity,
        bookedCapacity: availability.booked_capacity,
        reason: availability.reason || (availability.is_available ? 'Available' : 'Not available')
      }
    });

  } catch (error) {
    console.error('Check availability error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}