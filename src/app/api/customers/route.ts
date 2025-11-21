import { NextRequest, NextResponse } from 'next/server';
import { customerService } from '@/lib/database/customers';
import { testConnection } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/customers - Get customers (admin and agent only)
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

    // Only agents and admins can view customers
    if (session.user.role !== 'admin' && session.user.role !== 'agent') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let customers;

    if (search) {
      // Search customers
      customers = await customerService.searchCustomers(search);

      // Apply pagination to search results
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedCustomers = customers.slice(startIndex, endIndex);

      return NextResponse.json({
        customers: paginatedCustomers,
        pagination: {
          page,
          limit,
          total: customers.length,
          totalPages: Math.ceil(customers.length / limit)
        }
      });
    } else {
      // Get all customers with pagination
      const db = await import('@/lib/db');
      const offset = (page - 1) * limit;

      const [rows] = await db.db.query(
        'SELECT * FROM Customer WHERE Status = ? ORDER BY LastName, FirstName LIMIT ? OFFSET ?',
        ['Active', limit, offset]
      );

      const [countRows] = await db.db.query(
        'SELECT COUNT(*) as total FROM Customer WHERE Status = ?',
        ['Active']
      );

      const total = countRows[0]?.total || 0;

      return NextResponse.json({
        customers: rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    }

  } catch (error) {
    console.error('Get customers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create new customer
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
    const requiredFields = ['FirstName', 'LastName', 'Email', 'Password'];
    for (const field of requiredFields) {
      if (!body[field] || body[field].trim() === '') {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.Email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (body.Password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Validate phone format if provided
    if (body.Phone && !/^[\d\s\-\+\(\)]+$/.test(body.Phone)) {
      return NextResponse.json(
        { error: 'Invalid phone format' },
        { status: 400 }
      );
    }

    const customerData = {
      FirstName: body.FirstName.trim(),
      LastName: body.LastName.trim(),
      Email: body.Email.toLowerCase().trim(),
      Phone: body.Phone ? body.Phone.trim() : null,
      Password: body.Password,
      Address: body.Address ? body.Address.trim() : null,
      City: body.City ? body.City.trim() : null,
      Country: body.Country ? body.Country.trim() : null,
      PostalCode: body.PostalCode ? body.PostalCode.trim() : null,
      DateOfBirth: body.DateOfBirth ? new Date(body.DateOfBirth) : null,
      EmergencyContactName: body.EmergencyContactName ? body.EmergencyContactName.trim() : null,
      EmergencyContactPhone: body.EmergencyContactPhone ? body.EmergencyContactPhone.trim() : null
    };

    // Check if customer already exists
    const existingCustomer = await customerService.getCustomerByEmail(customerData.Email);
    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Customer with this email already exists' },
        { status: 409 }
      );
    }

    // Create customer
    const newCustomer = await customerService.createCustomer(customerData);

    // Remove password hash from response
    const { PasswordHash, ...customerResponse } = newCustomer as any;

    return NextResponse.json(
      {
        message: 'Customer created successfully',
        customer: customerResponse
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Create customer error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}