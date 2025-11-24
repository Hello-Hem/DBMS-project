import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
// Use mock auth for development without database
// import { db } from './db';

// Define user types
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'agent' | 'admin';
  avatar?: string;
}

// Define session type with role
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'customer' | 'agent' | 'admin';
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: 'customer' | 'agent' | 'admin';
  }
}

// Custom adapter for database authentication
class CustomAuthAdapter {
  async getUserByEmail(email: string): Promise<AuthUser | null> {
    // Check in all user tables (Customer, Agent, Admin)
    let user: any = null;
    let role: 'customer' | 'agent' | 'admin' = 'customer';

    // Check Customer table
    const customer = await db.findOne(
      'Customer',
      'Email = ? AND Status = ?',
      [email, 'Active']
    );

    if (customer) {
      user = customer;
      role = 'customer';
    } else {
      // Check Agent table
      const agent = await db.findOne(
        'Agent',
        'Email = ? AND Status = ?',
        [email, 'Active']
      );

      if (agent) {
        user = agent;
        role = 'agent';
      } else {
        // Check Admin table
        const admin = await db.findOne(
          'Admin',
          'Email = ? AND Status = ?',
          [email, 'Active']
        );

        if (admin) {
          user = admin;
          role = 'admin';
        }
      }
    }

    if (!user) return null;

    return {
      id: user.CustomerID || user.AgentID || user.AdminID?.toString(),
      email: user.Email,
      name: `${user.FirstName} ${user.LastName}`,
      role
    };
  }

  async verifyCredentials(email: string, password: string): Promise<AuthUser | null> {
    // Check Customer table first
    const customer = await db.findOne(
      'Customer',
      'Email = ? AND Status = ?',
      [email, 'Active']
    );

    if (customer) {
      const isValid = await bcrypt.compare(password, customer.PasswordHash);
      if (isValid) {
        return {
          id: customer.CustomerID.toString(),
          email: customer.Email,
          name: `${customer.FirstName} ${customer.LastName}`,
          role: 'customer'
        };
      }
    }

    // Check Agent table
    const agent = await db.findOne(
      'Agent',
      'Email = ? AND Status = ?',
      [email, 'Active']
    );

    if (agent) {
      const isValid = await bcrypt.compare(password, agent.PasswordHash);
      if (isValid) {
        return {
          id: agent.AgentID.toString(),
          email: agent.Email,
          name: `${agent.FirstName} ${agent.LastName}`,
          role: 'agent'
        };
      }
    }

    // Check Admin table
    const admin = await db.findOne(
      'Admin',
      'Email = ? AND Status = ?',
      [email, 'Active']
    );

    if (admin) {
      const isValid = await bcrypt.compare(password, admin.PasswordHash);
      if (isValid) {
        return {
          id: admin.AdminID.toString(),
          email: admin.Email,
          name: `${admin.FirstName} ${admin.LastName}`,
          role: 'admin'
        };
      }
    }

    return null;
  }
}

const adapter = new CustomAuthAdapter();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        role: { label: 'Role', type: 'select', options: ['customer', 'agent', 'admin'] }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await adapter.verifyCredentials(
          credentials.email,
          credentials.password
        );

        if (!user) {
          throw new Error('Invalid credentials');
        }

        // If role is specified, verify it matches
        if (credentials.role && user.role !== credentials.role) {
          throw new Error('Invalid role for this user');
        }

        return user;
      }
    })
  ],
  pages: {
    signIn: '/login',
    signUp: '/register',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
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
        session.user.role = token.role as 'customer' | 'agent' | 'admin';
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Helper function to get user from database
export async function getUserFromDb(userId: string, role: 'customer' | 'agent' | 'admin') {
  let table = '';
  let idField = '';

  switch (role) {
    case 'customer':
      table = 'Customer';
      idField = 'CustomerID';
      break;
    case 'agent':
      table = 'Agent';
      idField = 'AgentID';
      break;
    case 'admin':
      table = 'Admin';
      idField = 'AdminID';
      break;
  }

  return await db.findOne(`${table}`, `${idField} = ?`, [parseInt(userId)]);
}

// Helper function to check if user has required role
export function hasRequiredRole(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    'admin': 3,
    'agent': 2,
    'customer': 1
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

// Helper function to get redirect URL based on user role
export function getRoleRedirectUrl(role: 'customer' | 'agent' | 'admin'): string {
  switch (role) {
    case 'customer':
      return '/dashboard';
    case 'agent':
      return '/agent/dashboard';
    case 'admin':
      return '/admin/dashboard';
    default:
      return '/';
  }
}

// Helper functions for user registration
export async function registerCustomer(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
}) {
  // Check if customer already exists
  const existingCustomer = await db.findOne('Customer', 'Email = ?', [data.email]);
  if (existingCustomer) {
    throw new Error('Customer with this email already exists');
  }

  // Hash password
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(data.password, saltRounds);

  // Create customer
  const customerData = {
    FirstName: data.firstName,
    LastName: data.lastName,
    Email: data.email,
    Phone: data.phone || null,
    PasswordHash: passwordHash,
    Address: data.address || null,
    City: data.city || null,
    Country: data.country || null,
    PostalCode: data.postalCode || null,
    Status: 'Active'
  };

  const result = await db.insert('Customer', customerData);
  return result.insertId;
}

export async function registerAgent(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  department?: string;
  commissionRate?: number;
}) {
  // Check if agent already exists
  const existingAgent = await db.findOne('Agent', 'Email = ?', [data.email]);
  if (existingAgent) {
    throw new Error('Agent with this email already exists');
  }

  // Hash password
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(data.password, saltRounds);

  // Create agent
  const agentData = {
    FirstName: data.firstName,
    LastName: data.lastName,
    Email: data.email,
    Phone: data.phone || null,
    PasswordHash: passwordHash,
    Department: data.department || null,
    CommissionRate: data.commissionRate || 0,
    Status: 'Active',
    HireDate: new Date()
  };

  const result = await db.insert('Agent', agentData);
  return result.insertId;
}

// Password reset helper
export async function updatePassword(userId: string, role: 'customer' | 'agent' | 'admin', newPassword: string) {
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);

  let table = '';
  let idField = '';

  switch (role) {
    case 'customer':
      table = 'Customer';
      idField = 'CustomerID';
      break;
    case 'agent':
      table = 'Agent';
      idField = 'AgentID';
      break;
    case 'admin':
      table = 'Admin';
      idField = 'AdminID';
      break;
  }

  await db.update(
    table,
    { PasswordHash: passwordHash, UpdatedAt: new Date() },
    `${idField} = ?`,
    [parseInt(userId)]
  );
}