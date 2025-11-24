# Travel Agency Management System

A comprehensive travel agency management system built with Next.js, TypeScript, and MySQL. Features include customer bookings, agent management, package creation, and secure authentication.

## 🚀 Features

- **Multi-role Authentication**: Customer, Agent, and Admin roles with role-based access control
- **Database-Connected Auth**: Secure authentication with bcrypt password hashing
- **Travel Package Management**: Create and manage travel packages with pricing and availability
- **Booking System**: Complete booking workflow with payment tracking
- **Agent Dashboard**: Tools for travel agents to manage customer bookings
- **Admin Panel**: System administration and reporting tools

## 📋 Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd DBMS-project
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   copy .env.example .env
   ```

   Edit `.env` and configure your database credentials:

   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_DATABASE=travel_agency

   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_generated_secret
   ```

4. **Initialize the database**

   ```bash
   mysql -u your_user -p < database/schema.sql
   mysql -u your_user -p travel_agency < database/seed-users.sql
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🔐 Authentication

The system supports three user roles with database-backed authentication:

### Test Credentials

| Role     | Email               | Password    | Access Level                 |
| -------- | ------------------- | ----------- | ---------------------------- |
| Customer | customer@travel.com | password123 | Book packages, view bookings |
| Agent    | agent@travel.com    | password123 | Manage customer bookings     |
| Admin    | admin@travel.com    | password123 | Full system access           |

### Authentication Features

- Secure password hashing with bcrypt
- JWT-based session management
- Role-based access control
- Active user status validation

For detailed authentication setup, see [AUTH_SETUP.md](AUTH_SETUP.md)

## 📁 Project Structure

```
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── api/          # API routes
│   │   ├── dashboard/    # Customer dashboard
│   │   ├── agent/        # Agent dashboard
│   │   ├── admin/        # Admin dashboard
│   │   └── login/        # Authentication
│   └── lib/              # Utilities and helpers
│       ├── auth.ts       # Authentication logic
│       ├── db.ts         # Database connection
│       └── database/     # Database query helpers
├── database/
│   ├── schema.sql        # Database schema
│   └── seed-users.sql    # Test user data
└── public/               # Static assets
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🗄️ Database Schema

The system uses the following main tables:

- **Customer** - Customer accounts and profiles
- **Agent** - Travel agent accounts
- **Admin** - System administrator accounts
- **Package** - Travel packages and tours
- **Booking** - Customer bookings
- **Payment** - Payment records
- **Supplier** - Hotels, airlines, and activity providers

See [database/schema.sql](database/schema.sql) for complete schema.

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/signin` - Sign in (handled by NextAuth)
- `POST /api/auth/signout` - Sign out

### Booking Endpoints

- `GET /api/bookings` - List bookings (role-based filtering)
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/[id]` - Get booking details
- `PUT /api/bookings/[id]` - Update booking

### Package Endpoints

- `GET /api/packages` - List available packages
- `GET /api/packages/[id]` - Get package details
- `POST /api/packages` - Create package (admin only)
- `PUT /api/packages/[id]` - Update package (admin only)

## 🔒 Security

- All passwords are hashed using bcrypt (10 salt rounds)
- JWT tokens with 24-hour expiry
- Environment variables for sensitive data
- SQL injection prevention with parameterized queries
- Role-based authorization on all protected routes

## 🚢 Deployment

1. Set up production database
2. Configure environment variables
3. Build the application: `npm run build`
4. Start production server: `npm run start`

For Vercel deployment:

- Connect your repository to Vercel
- Add environment variables in Vercel dashboard
- Deploy automatically on push to main branch

## 📖 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.
