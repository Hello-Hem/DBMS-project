import { NextRequest, NextResponse } from 'next/server';
import { mockPackages } from '@/lib/db-mock';

// GET /api/packages/[id] - Get package details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const packageId = parseInt(id);
    if (isNaN(packageId)) {
      return NextResponse.json(
        { error: 'Invalid package ID' },
        { status: 400 }
      );
    }

    // Find mock package
    const packageData = mockPackages.find(p => p.PackageID === packageId);
    if (!packageData) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    const packageWithCapacity = {
      ...packageData,
      capacity_left: Math.floor(Math.random() * 15) + 5,
      booked_capacity: 20 - Math.floor(Math.random() * 15) + 5,
      availability_percentage: Math.floor(Math.random() * 50) + 25
    };

    return NextResponse.json({ package: packageWithCapacity });

  } catch (error) {
    console.error('Get package error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

