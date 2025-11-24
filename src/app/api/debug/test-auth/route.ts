import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";
import { RowDataPacket } from "mysql2";

interface DBUser extends RowDataPacket {
  id: number;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  status: string;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, role } = await request.json();

    const result: any = {
      timestamp: new Date().toISOString(),
      input: { email, role, hasPassword: !!password },
      steps: [],
    };

    // Step 1: Check environment variables
    result.steps.push({
      step: 1,
      name: "Environment Variables",
      data: {
        DB_HOST: process.env.DB_HOST || "NOT SET",
        DB_PORT: process.env.DB_PORT || "NOT SET",
        DB_USER: process.env.DB_USER || "NOT SET",
        DB_DATABASE: process.env.DB_DATABASE || "NOT SET",
        hasPassword: !!process.env.DB_PASSWORD,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "SET" : "NOT SET",
      },
    });

    // Step 2: Test database connection
    try {
      const [testRows] = await query("SELECT 1 as test");
      result.steps.push({
        step: 2,
        name: "Database Connection",
        status: "success",
        data: testRows,
      });
    } catch (error: any) {
      result.steps.push({
        step: 2,
        name: "Database Connection",
        status: "failed",
        error: error.message,
      });
      return NextResponse.json(result, { status: 500 });
    }

    // Step 3: Find user
    const tableName =
      role === "customer" ? "Customer" : role === "agent" ? "Agent" : "Admin";
    const idField =
      role === "customer"
        ? "CustomerID"
        : role === "agent"
        ? "AgentID"
        : "AdminID";

    const sql = `SELECT ${idField} as id, Email as email, PasswordHash as passwordHash, 
                 FirstName as firstName, LastName as lastName, Status as status 
                 FROM ${tableName} WHERE Email = ? LIMIT 1`;

    try {
      const [rows] = await query<DBUser[]>(sql, [email]);

      if (!rows || rows.length === 0) {
        result.steps.push({
          step: 3,
          name: "Find User",
          status: "not_found",
          query: sql,
          email: email,
        });
        return NextResponse.json(result, { status: 404 });
      }

      const user = rows[0];
      result.steps.push({
        step: 3,
        name: "Find User",
        status: "success",
        data: {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          status: user.status,
          hasPasswordHash: !!user.passwordHash,
          passwordHashStart: user.passwordHash?.substring(0, 20),
        },
      });

      // Step 4: Verify password
      const isValid = await bcrypt.compare(password, user.passwordHash);
      result.steps.push({
        step: 4,
        name: "Verify Password",
        status: isValid ? "success" : "failed",
        passwordMatch: isValid,
      });

      if (!isValid) {
        result.steps.push({
          step: 5,
          name: "Debug Info",
          data: {
            note: "Password does not match hash in database",
            suggestion: "Check if user was created with correct password hash",
          },
        });
      }

      result.overall = isValid ? "SUCCESS" : "PASSWORD_MISMATCH";
      return NextResponse.json(result);
    } catch (error: any) {
      result.steps.push({
        step: 3,
        name: "Find User",
        status: "error",
        error: error.message,
      });
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Test failed",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
