import { NextRequest, NextResponse } from 'next/server';
import { testConnection, mockPackages } from '@/lib/db-mock';

// GET /api/packages - Get packages with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 12;

    // Return mock packages for now
    let packages = mockPackages.map(p => ({
      ...p,
      capacity_left: Math.floor(Math.random() * 15) + 5,
      booked_capacity: 20 - Math.floor(Math.random() * 15) + 5
    }));

    // If featured type, only return featured packages
    if (type === 'featured') {
      packages = packages.filter(p => p.Featured).slice(0, limit);
    }

    return NextResponse.json({
      packages,
      pagination: {
        page: 1,
        limit,
        total: packages.length,
        totalPages: 1
      }
    });

  } catch (error) {
    console.error('Packages API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/packages - Create new package (admin only)
export async function POST(request: NextRequest) {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['Title', 'StartDate', 'EndDate', 'Price', 'Capacity'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate dates
    const startDate = new Date(body.StartDate);
    const endDate = new Date(body.EndDate);

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    if (startDate < new Date()) {
      return NextResponse.json(
        { error: 'Start date must be in the future' },
        { status: 400 }
      );
    }

    // Validate capacity and price
    if (body.Capacity <= 0) {
      return NextResponse.json(
        { error: 'Capacity must be greater than 0' },
        { status: 400 }
      );
    }

    if (body.Price <= 0) {
      return NextResponse.json(
        { error: 'Price must be greater than 0' },
        { status: 400 }
      );
    }

    const packageData = {
      Title: body.Title,
      Description: body.Description,
      StartDate: startDate,
      EndDate: endDate,
      Price: parseFloat(body.Price),
      Capacity: parseInt(body.Capacity),
      Destination: body.Destination,
      Country: body.Country,
      ImageURL: body.ImageURL,
      Inclusions: body.Inclusions,
      Exclusions: body.Exclusions,
      ItineraryTemplate: body.ItineraryTemplate,
      Featured: body.Featured || false
    };

    const newPackage = await packageService.createPackage(packageData);

    return NextResponse.json(
      {
        message: 'Package created successfully',
        package: newPackage
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Create package error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}