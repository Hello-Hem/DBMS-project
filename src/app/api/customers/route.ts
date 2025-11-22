import { NextRequest, NextResponse } from 'next/server';
import { testConnection } from '@/lib/db-mock';

// Mock customers
const mockCustomers = [
  {
    CustomerID: 1001,
    FirstName: 'John',
    LastName: 'Doe',
    Email: 'customer@example.com',
    Phone: '+1234567890',
    Status: 'Active',
    CreatedAt: new Date().toISOString()
  },
  {
    CustomerID: 1002,
    FirstName: 'Jane',
    LastName: 'Smith',
    Email: 'customer2@example.com',
    Phone: '+0987654321',
    Status: 'Active',
    CreatedAt: new Date().toISOString()
  }
];

// GET /api/customers - Get customers (agent/admin only)
export async function GET(request: NextRequest) {
  try {
    // For demo purposes, return all customers
    return NextResponse.json({ customers: mockCustomers });
  } catch (error) {
    console.error('Get customers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/customers - Create new customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newCustomer = {
      CustomerID: Math.floor(Math.random() * 10000) + 2000,
      ...body,
      Status: 'Active',
      CreatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      message: 'Customer created successfully',
      customer: newCustomer
    }, { status: 201 });
  } catch (error) {
    console.error('Create customer error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}