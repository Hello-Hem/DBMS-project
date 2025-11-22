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

// PUT /api/packages/[id] - Update package (admin only)
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

    const packageId = parseInt(params.id);
    if (isNaN(packageId)) {
      return NextResponse.json(
        { error: 'Invalid package ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Check if package exists
    const existingPackage = await packageService.getPackageById(packageId);
    if (!existingPackage) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    // Validate dates if provided
    if (body.StartDate || body.EndDate) {
      const startDate = body.StartDate ? new Date(body.StartDate) : existingPackage.StartDate;
      const endDate = body.EndDate ? new Date(body.EndDate) : existingPackage.EndDate;

      if (startDate >= endDate) {
        return NextResponse.json(
          { error: 'Start date must be before end date' },
          { status: 400 }
        );
      }

      if (startDate < new Date() && startDate !== existingPackage.StartDate) {
        return NextResponse.json(
          { error: 'Cannot change start date to past' },
          { status: 400 }
        );
      }

      body.StartDate = startDate;
      body.EndDate = endDate;
    }

    // Validate capacity and price if provided
    if (body.Capacity !== undefined && body.Capacity <= 0) {
      return NextResponse.json(
        { error: 'Capacity must be greater than 0' },
        { status: 400 }
      );
    }

    if (body.Price !== undefined && body.Price <= 0) {
      return NextResponse.json(
        { error: 'Price must be greater than 0' },
        { status: 400 }
      );
    }

    const updateData = {
      Title: body.Title,
      Description: body.Description,
      StartDate: body.StartDate,
      EndDate: body.EndDate,
      Price: body.Price ? parseFloat(body.Price) : undefined,
      Capacity: body.Capacity ? parseInt(body.Capacity) : undefined,
      Destination: body.Destination,
      Country: body.Country,
      ImageURL: body.ImageURL,
      Inclusions: body.Inclusions,
      Exclusions: body.Exclusions,
      ItineraryTemplate: body.ItineraryTemplate,
      Featured: body.Featured
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const updatedPackage = await packageService.updatePackage(packageId, updateData);

    return NextResponse.json({
      message: 'Package updated successfully',
      package: updatedPackage
    });

  } catch (error) {
    console.error('Update package error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/packages/[id] - Delete package (admin only)
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

    const packageId = parseInt(params.id);
    if (isNaN(packageId)) {
      return NextResponse.json(
        { error: 'Invalid package ID' },
        { status: 400 }
      );
    }

    // Check if package exists
    const existingPackage = await packageService.getPackageById(packageId);
    if (!existingPackage) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    await packageService.deletePackage(packageId);

    return NextResponse.json({
      message: 'Package deleted successfully'
    });

  } catch (error) {
    console.error('Delete package error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}