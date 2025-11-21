import { NextRequest, NextResponse } from 'next/server';
import { packageService } from '@/lib/database/packages';
import { testConnection } from '@/lib/db';

// GET /api/packages - Get packages with filtering
export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const isConnected = await testConnection();
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const filters = {
      destination: searchParams.get('destination') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      minCapacity: searchParams.get('minCapacity') ? parseInt(searchParams.get('minCapacity')!) : undefined,
      keyword: searchParams.get('keyword') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 12
    };

    // Handle different query types
    const type = searchParams.get('type');

    if (type === 'featured') {
      const limit = filters.limit || 6;
      const packages = await packageService.getFeaturedPackages(limit);
      return NextResponse.json({ packages });
    }

    if (type === 'search') {
      const result = await packageService.searchPackages(filters);
      return NextResponse.json(result);
    }

    // Default: get featured packages
    const packages = await packageService.getFeaturedPackages(filters.limit);
    return NextResponse.json({ packages });

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