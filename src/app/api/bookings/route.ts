import { NextRequest, NextResponse } from "next/server";
import { mockBookings } from "@/lib/db-mock";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/bookings - Get bookings for authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    // Return mock bookings for now
    let bookings = mockBookings;

    // Filter by user role
    if (session.user.role === "customer") {
      bookings = bookings.filter(
        (b) => b.CustomerID === parseInt(session.user.id || "1001")
      );
    } else if (session.user.role === "agent") {
      bookings = bookings.filter(
        (b) => b.AgentID === parseInt(session.user.id || "101")
      );
    }

    // Filter by booking reference if provided
    const reference = searchParams.get("reference");
    if (reference) {
      bookings = bookings.filter((b) => b.BookingReference.includes(reference));
    }

    return NextResponse.json({
      bookings,
      pagination: {
        page: 1,
        limit: 10,
        total: bookings.length,
        totalPages: 1,
      },
    });
  } catch (error) {
    console.error("Get bookings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/bookings - Create new booking
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Mock booking creation
    const newBooking = {
      BookingID: Math.floor(Math.random() * 10000) + 10000,
      BookingReference: `TA${Date.now().toString(36).toUpperCase()}`,
      CustomerID: body.CustomerID || parseInt(session.user.id || "1001"),
      PackageID: body.PackageID || 2001,
      AgentID:
        session.user.role === "agent"
          ? parseInt(session.user.id || "101")
          : null,
      NumTravellers: body.NumTravellers || 1,
      TravelStartDate: body.TravelStartDate,
      TravelEndDate: body.TravelEndDate,
      TotalAmount: body.TotalAmount || 2499,
      Status: "Pending",
      PaymentStatus: "Unpaid",
      CreatedAt: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        message: "Booking created successfully",
        booking: newBooking,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create booking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
