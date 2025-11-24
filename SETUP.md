# Travel Agency Website - Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- MySQL 8.0+ (optional - can run with mock data)
- Git

### Installation & Running

1. **Clone the repository**
   ```bash
   git clone <your-github-repo-url>
   cd DBMS-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   Or create `.env.local` with:
   ```
   # Database Configuration (optional for mock mode)
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=travel_agency
   DB_PASSWORD=your_secure_password_here
   DB_DATABASE=travel_agency

   # NextAuth.js Configuration (required)
   NEXTAUTH_URL=http://localhost:3001
   NEXTAUTH_SECRET=any-secure-secret-string-here

   # Application Configuration
   NODE_ENV=development
   PORT=3001
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Navigate to: http://localhost:3001

## 🔐 Login Credentials

The application comes with pre-configured test users:

### Admin Access
- **Email**: admin@travel.com
- **Password**: admin123
- **Role**: Admin

### Agent Access
- **Email**: agent@travel.com
- **Password**: agent123
- **Role**: Travel Agent

### Customer Access
- **Email**: customer@travel.com
- **Password**: customer123
- **Role**: Customer

## 🗄️ Database Setup (Optional)

The application runs with mock data by default. To use a real MySQL database:

### 1. Install MySQL
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install mysql-server

# macOS (using Homebrew)
brew install mysql

# Windows
# Download from https://dev.mysql.com/downloads/mysql/
```

### 2. Create Database and User
```sql
-- Connect to MySQL
mysql -u root -p

-- Create database
CREATE DATABASE travel_agency CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'travel_agency'@'localhost' IDENTIFIED BY 'your_secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON travel_agency.* TO 'travel_agency'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;

-- Exit
EXIT;
```

### 3. Import Database Schema
```bash
# From the project directory
mysql -u travel_agency -p travel_agency < database/schema.sql
```

### 4. Update .env.local
Make sure your `.env.local` file has the correct database credentials:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=travel_agency
DB_PASSWORD=your_secure_password_here
DB_DATABASE=travel_agency
```

## 🏗️ Application Features

### Customer Features
- Browse and search travel packages
- Create and manage bookings
- Process payments (mock)
- View booking history
- Manage personal profile

### Agent Features
- Create quick bookings for customers
- Manage customer portfolios
- Track commissions
- View performance metrics
- Access customer dashboard

### Admin Features
- System overview and analytics
- User management (customers/agents)
- Package management
- Supplier management
- Financial reporting
- System alerts and monitoring

### Key Functionalities
- ✅ Role-based authentication (Customer/Agent/Admin)
- ✅ Advanced package search and filtering
- ✅ Real-time availability checking
- ✅ Booking management system
- ✅ Payment processing (mock implementation)
- ✅ Responsive design (mobile/tablet/desktop)
- ✅ Mock data for development/testing

## 📁 Project Structure

```
DBMS-project/
├── src/
│   ├── app/                    # Next.js 16 app router
│   │   ├── api/               # API routes
│   │   ├── dashboard/         # Customer dashboard
│   │   ├── agent/             # Agent-specific pages
│   │   ├── admin/             # Admin-specific pages
│   │   ├── packages/          # Package browsing
│   │   ├── booking/           # Booking management
│   │   ├── login/             # Authentication
│   │   └── register/          # User registration
│   ├── lib/                   # Utility libraries
│   │   ├── auth.ts           # Authentication configuration
│   │   ├── db.ts             # Database connection
│   │   └── db-mock.ts        # Mock data for development
│   └── components/            # Reusable UI components
├── database/
│   └── schema.sql             # MySQL database schema
├── .env.local                # Environment variables
├── package.json
└── SETUP.md                  # This file
```

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Run type checking
npm run typecheck
```

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill existing Next.js processes
   pkill -f "next dev"
   # Or use a different port
   PORT=3002 npm run dev
   ```

2. **Database connection errors**
   - Ensure MySQL is running
   - Check database credentials in `.env.local`
   - Verify database and user exist

3. **Authentication errors**
   - Check `NEXTAUTH_SECRET` is set in `.env.local`
   - Ensure `NEXTAUTH_URL` matches your development server

4. **Build errors**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   # Clear node modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

### Switching Between Mock and Real Database

The application automatically uses mock data if the database connection fails. To force a specific mode:

1. **Mock Mode (Default)**: Works out of the box
2. **Database Mode**: Requires MySQL setup and proper credentials

## 🚀 Deployment

### Environment Setup
1. Set production environment variables
2. Configure MySQL database
3. Build the application: `npm run build`
4. Start production server: `npm start`

### Production Environment Variables
```bash
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-production-secret
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_DATABASE=your-database-name
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the code comments
3. Create an issue on GitHub

---

**Note**: This application uses mock data for development. The real database implementation is included but requires MySQL setup as described above.