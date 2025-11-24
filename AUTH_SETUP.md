# Authentication Setup Guide

This guide explains how to set up and use the database-connected authentication system.

## Overview

The authentication system has been updated to connect directly to the MySQL database instead of using mock data. It supports three user roles:

- **Customer**: Regular users who can book travel packages
- **Agent**: Travel agents who can manage bookings
- **Admin**: Administrators with full system access

## Setup Steps

### 1. Database Configuration

1. Copy the `.env.example` file to `.env`:

   ```bash
   copy .env.example .env
   ```

2. Update the `.env` file with your database credentials:

   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_DATABASE=travel_agency

   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_generated_secret
   ```

3. Generate a secure NEXTAUTH_SECRET:
   ```bash
   openssl rand -base64 32
   ```

### 2. Initialize the Database

1. Create the database and tables using the schema:

   ```bash
   mysql -u your_user -p < database/schema.sql
   ```

2. Seed initial test users:
   ```bash
   mysql -u your_user -p travel_agency < database/seed-users.sql
   ```

### 3. Test Credentials

After seeding, you can log in with these test accounts:

| Role     | Email               | Password    |
| -------- | ------------------- | ----------- |
| Customer | customer@travel.com | password123 |
| Agent    | agent@travel.com    | password123 |
| Admin    | admin@travel.com    | password123 |

## Authentication Flow

### Login Process

1. User submits email, password, and role
2. System queries the appropriate database table (Customer, Agent, or Admin)
3. Password is verified using bcrypt
4. JWT token is generated with user details and role
5. User is redirected to role-specific dashboard:
   - Customers → `/dashboard`
   - Agents → `/agent/dashboard`
   - Admins → `/admin/dashboard`

### User Registration

To register new users, use the `createUser` function from `src/lib/auth.ts`:

```typescript
import { createUser } from "@/lib/auth";

const result = await createUser(
  "user@example.com",
  "password",
  "John",
  "Doe",
  "customer",
  { phone: "+1-555-0123" } // Optional additional data
);

if (result.success) {
  console.log("User created with ID:", result.userId);
} else {
  console.error("Error:", result.error);
}
```

## Database Schema

### Customer Table

- CustomerID (Primary Key)
- FirstName, LastName
- Email (Unique)
- PasswordHash
- Phone, Address, City, Country, PostalCode
- Status (Active/Inactive/Suspended)

### Agent Table

- AgentID (Primary Key)
- FirstName, LastName
- Email (Unique)
- PasswordHash
- Department, CommissionRate
- Status (Active/Inactive/Suspended)

### Admin Table

- AdminID (Primary Key)
- FirstName, LastName
- Email (Unique)
- PasswordHash
- Role (SuperAdmin/Admin/Manager)
- Status (Active/Inactive)

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt with 10 salt rounds
2. **JWT Tokens**: Session management using JWT with 24-hour expiry
3. **Status Checks**: Only Active users can log in
4. **Role-based Access**: Each user type has specific permissions
5. **Secure Sessions**: HTTPS recommended for production

## API Usage

### Checking Authentication Status

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const session = await getServerSession(authOptions);

if (session) {
  console.log("User:", session.user);
  console.log("Role:", session.user.role);
}
```

### Role-based Authorization

```typescript
import { hasRequiredRole } from "@/lib/auth";

// Check if user has required role
if (hasRequiredRole(session.user.role, "agent")) {
  // User is agent or higher (admin)
}
```

### Get Role-specific Redirect

```typescript
import { getRoleRedirectUrl } from "@/lib/auth";

const redirectUrl = getRoleRedirectUrl(session.user.role);
// Returns: '/dashboard', '/agent/dashboard', or '/admin/dashboard'
```

## Troubleshooting

### Cannot Connect to Database

1. Verify database credentials in `.env`
2. Ensure MySQL service is running
3. Check that database `travel_agency` exists
4. Verify user has proper permissions

### Login Fails

1. Check user exists in database and status is 'Active'
2. Verify password is correct
3. Ensure correct role is selected during login
4. Check browser console and server logs for errors

### JWT/Session Issues

1. Verify NEXTAUTH_SECRET is set in `.env`
2. Clear browser cookies and try again
3. Check NEXTAUTH_URL matches your application URL

## Adding New Users Manually

```sql
-- Add a new customer
INSERT INTO Customer (FirstName, LastName, Email, PasswordHash, Status)
VALUES ('First', 'Last', 'email@example.com', 'hashed_password', 'Active');

-- Generate password hash in Node.js:
-- const bcrypt = require('bcryptjs');
-- const hash = await bcrypt.hash('your_password', 10);
```

## Production Considerations

1. Use strong NEXTAUTH_SECRET (minimum 32 characters)
2. Enable HTTPS
3. Use environment-specific database credentials
4. Implement rate limiting on login attempts
5. Add email verification for new registrations
6. Set up proper backup procedures
7. Monitor failed login attempts
8. Implement password reset functionality

## Next Steps

1. Implement password reset via email
2. Add email verification for new users
3. Implement 2FA for admin accounts
4. Add account lockout after failed attempts
5. Implement session management dashboard
6. Add audit logging for authentication events
