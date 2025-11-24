import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { query } from "./db";
import { RowDataPacket } from "mysql2";

// Database user interface
interface DBUser extends RowDataPacket {
  id: number;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  status: string;
}

// Helper function to find user in database by email and role
async function findUserByEmailAndRole(
  email: string,
  role: "customer" | "agent" | "admin"
): Promise<DBUser | null> {
  try {
    let tableName: string;
    let idField: string;

    switch (role) {
      case "customer":
        tableName = "Customer";
        idField = "CustomerID";
        break;
      case "agent":
        tableName = "Agent";
        idField = "AgentID";
        break;
      case "admin":
        tableName = "Admin";
        idField = "AdminID";
        break;
      default:
        return null;
    }

    const sql = `SELECT ${idField} as id, Email as email, PasswordHash as passwordHash, 
                 FirstName as firstName, LastName as lastName, Status as status 
                 FROM ${tableName} WHERE Email = ? AND Status = 'Active' LIMIT 1`;

    console.log("🔍 Executing database query:", { tableName, email });

    const [rows] = await query<DBUser[]>(sql, [email]);

    console.log("📊 Query result:", { found: rows && rows.length > 0 });

    if (rows && rows.length > 0) {
      return rows[0];
    }
    return null;
  } catch (error) {
    console.error("❌ Error finding user in database:", error);
    return null;
  }
}

// Define user types
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "customer" | "agent" | "admin";
  avatar?: string;
}

// Define session type with role
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: "customer" | "agent" | "admin";
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: "customer" | "agent" | "admin";
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: {
          label: "Role",
          type: "select",
          options: ["customer", "agent", "admin"],
        },
      },
      async authorize(credentials) {
        try {
          console.log("🔐 Authorization attempt:", {
            email: credentials?.email,
            role: credentials?.role,
            hasPassword: !!credentials?.password,
          });

          if (!credentials?.email || !credentials?.password) {
            console.error("❌ Missing credentials");
            return null;
          }

          // Determine role - default to customer if not specified
          const role =
            (credentials.role as "customer" | "agent" | "admin") || "customer";

          console.log("🔍 Looking up user:", {
            email: credentials.email,
            role,
          });

          // Find user in database
          const user = await findUserByEmailAndRole(credentials.email, role);

          if (!user) {
            console.error("❌ User not found in database");
            return null;
          }

          console.log("✅ User found:", {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
          });

          // Verify password
          const isValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (!isValid) {
            console.error("❌ Invalid password");
            return null;
          }

          console.log("✅ Password verified, login successful");

          // Return user object
          return {
            id: user.id.toString(),
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: role,
          };
        } catch (error) {
          console.error("❌ Authorization error:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as "customer" | "agent" | "admin";
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Helper function to check if user has required role
export function hasRequiredRole(
  userRole: string,
  requiredRole: string
): boolean {
  const roleHierarchy: Record<string, number> = {
    admin: 3,
    agent: 2,
    customer: 1,
  };

  return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0);
}

// Helper function to get redirect URL based on user role
export function getRoleRedirectUrl(
  role: "customer" | "agent" | "admin"
): string {
  switch (role) {
    case "customer":
      return "/dashboard";
    case "agent":
      return "/agent/dashboard";
    case "admin":
      return "/admin/dashboard";
    default:
      return "/";
  }
}

// Helper function to create a new user in the database
export async function createUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: "customer" | "agent" | "admin",
  additionalData?: Record<string, any>
): Promise<{ success: boolean; userId?: number; error?: string }> {
  try {
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    let tableName: string;
    let idField: string;
    let fields = ["Email", "PasswordHash", "FirstName", "LastName"];
    let values: any[] = [email, passwordHash, firstName, lastName];

    switch (role) {
      case "customer":
        tableName = "Customer";
        idField = "CustomerID";
        if (additionalData?.phone) {
          fields.push("Phone");
          values.push(additionalData.phone);
        }
        break;
      case "agent":
        tableName = "Agent";
        idField = "AgentID";
        if (additionalData?.phone) {
          fields.push("Phone");
          values.push(additionalData.phone);
        }
        if (additionalData?.department) {
          fields.push("Department");
          values.push(additionalData.department);
        }
        break;
      case "admin":
        tableName = "Admin";
        idField = "AdminID";
        if (additionalData?.adminRole) {
          fields.push("Role");
          values.push(additionalData.adminRole);
        }
        break;
      default:
        return { success: false, error: "Invalid role" };
    }

    const placeholders = fields.map(() => "?").join(", ");
    const sql = `INSERT INTO ${tableName} (${fields.join(
      ", "
    )}) VALUES (${placeholders})`;

    const [result] = await query(sql, values);
    const insertResult = result as any;

    return { success: true, userId: insertResult.insertId };
  } catch (error: any) {
    console.error("Error creating user:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return { success: false, error: "Email already exists" };
    }
    return { success: false, error: "Failed to create user" };
  }
}
