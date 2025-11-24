import { NextRequest, NextResponse } from "next/server";
import { createUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      firstName,
      lastName,
      role,
      phone,
      department,
      adminRole,
    } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Default role to customer if not specified
    const userRole = role || "customer";

    // Validate role
    if (!["customer", "agent", "admin"].includes(userRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Prepare additional data based on role
    const additionalData: Record<string, string> = {};
    if (phone) additionalData.phone = phone;
    if (userRole === "agent" && department)
      additionalData.department = department;
    if (userRole === "admin" && adminRole) additionalData.adminRole = adminRole;

    // Create user in database
    const result = await createUser(
      email,
      password,
      firstName,
      lastName,
      userRole,
      additionalData
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to create user" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: "User created successfully",
        userId: result.userId,
        role: userRole,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
