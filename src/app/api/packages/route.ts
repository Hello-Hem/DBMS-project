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
    const body = await request.json();

    // Mock successful creation
    const newPackage = {
      PackageID: Math.floor(Math.random() * 10000) + 3000,
      ...body,
      StartDate: new Date(body.StartDate).toISOString(),
      EndDate: new Date(body.EndDate).toISOString(),
      Status: 'Active',
      CreatedAt: new Date().toISOString()
    };

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