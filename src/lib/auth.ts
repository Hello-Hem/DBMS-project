import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

// Mock user data with pre-hashed passwords
const mockUsers = [
  {
    id: '1',
    email: 'admin@travel.com',
    password: '$2b$10$ZJyGnLavIHjia7Wd13TYq.PM0s//uU4GeXLCvELdlpZNz7YZIOn96', // 'admin123'
    name: 'Admin User',
    role: 'admin' as const
  },
  {
    id: '2',
    email: 'agent@travel.com',
    password: '$2b$10$GT5dOgh0/AvFSwL2R1f4EuWTPoRSdIbJGTvPRrIUjHo7s2DDv8v/G', // 'agent123'
    name: 'Agent Smith',
    role: 'agent' as const
  },
  {
    id: '3',
    email: 'customer@travel.com',
    password: '$2b$10$Jt6HwFmdmJrCuogbRfHt/uBZv4nuCU4QqlT19gGWCEYTHeV8TneKS', // 'customer123'
    name: 'John Doe',
    role: 'customer' as const
  }
];

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

        // Find user by email
        const user = mockUsers.find(u => u.email === credentials.email);

        if (!user) {
          throw new Error('User not found');
        }

        // Verify password
        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Invalid password');
        }

        // If role is specified, verify it matches
        if (credentials.role && user.role !== credentials.role) {
          throw new Error(`User exists but with different role: ${user.role}`);
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        };
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

// Export mock users for testing
export const mockCredentials = {
  admin: { email: 'admin@travel.com', password: 'admin123' },
  agent: { email: 'agent@travel.com', password: 'agent123' },
  customer: { email: 'customer@travel.com', password: 'customer123' }
};