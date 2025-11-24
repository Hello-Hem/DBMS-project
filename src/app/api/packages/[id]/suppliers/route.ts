import { NextRequest, NextResponse } from 'next/server';

// Mock suppliers data
const mockSuppliers = [
  {
    SupplierID: 1,
    Name: 'Grand Hotel Paris',
    Type: 'Accommodation',
    Contact: '+33-1-42-68-53-00',
    Email: 'contact@grandhotelparis.fr',
    Rating: 4.5
  },
  {
    SupplierID: 2,
    Name: 'Air France',
    Type: 'Transport',
    Contact: '+33-1-42-68-53-01',
    Email: 'groups@airfrance.fr',
    Rating: 4.2
  },
  {
    SupplierID: 3,
    Name: 'Paris City Tours',
    Type: 'Activities',
    Contact: '+33-1-42-68-53-02',
    Email: 'info@pariscitytours.com',
    Rating: 4.8
  }
];

// GET /api/packages/[id]/suppliers - Get package suppliers
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

    // Return mock suppliers for now
    return NextResponse.json({ suppliers: mockSuppliers });

  } catch (error) {
    console.error('Get package suppliers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/packages/[id]/suppliers - Link supplier to package (admin only)
export async function POST(
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

    const body = await request.json();

    // Validate required fields
    if (!body.supplierId || !body.role) {
      return NextResponse.json(
        { error: 'supplierId and role are required' },
        { status: 400 }
      );
    }

    const validRoles = ['Accommodation', 'Transport', 'Activities', 'Meals', 'Guide'];
    if (!validRoles.includes(body.role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    const supplierId = parseInt(body.supplierId);
    if (isNaN(supplierId)) {
      return NextResponse.json(
        { error: 'Invalid supplier ID' },
        { status: 400 }
      );
    }

    // Mock supplier linking logic
    const mockPackageSupplierId = Math.floor(Math.random() * 1000) + 1;

    return NextResponse.json({
      message: 'Supplier linked to package successfully',
      packageSupplierId: mockPackageSupplierId
    });

  } catch (error) {
    console.error('Link supplier error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}