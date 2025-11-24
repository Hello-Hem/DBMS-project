# 🔧 Troubleshooting 401 Unauthorized Error

## Problem

Getting `401 (Unauthorized)` error when trying to login at:

```
POST http://localhost:3000/api/auth/callback/credentials
```

## Diagnosis Steps

### Step 1: Check Environment Variables

1. **Verify `.env.local` exists** in the project root

   ```cmd
   dir .env.local
   ```

2. **Check content** - Should have:

   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_DATABASE=travel_agency

   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=development-secret-change-in-production-min-32-chars-long
   ```

3. **Update DB_USER and DB_PASSWORD** with your MySQL credentials

### Step 2: Test Database Connection

Run the test script:

```cmd
node test-db-connection.js
```

**Expected output:**

```
✅ Connection successful!
✅ Customer: X records
✅ Agent: X records
✅ Admin: X records
✅ customer@travel.com exists
✅ agent@travel.com exists
✅ admin@travel.com exists
```

**If connection fails:**

- Check MySQL is running: `mysql -u root -p`
- Verify credentials
- Ensure database exists: `SHOW DATABASES;`

### Step 3: Initialize Database (if needed)

If tables or users are missing:

```cmd
mysql -u root -p < database\schema.sql
mysql -u root -p travel_agency < database\seed-users.sql
```

### Step 4: Restart Development Server

After changing `.env.local`:

```cmd
# Stop the server (Ctrl+C)
npm run dev
```

### Step 5: Check Console Logs

When you try to login, you should see in the server terminal:

```
🔌 Database configuration loaded
🔐 Authorization attempt
🔍 Looking up user
🔍 Executing database query
📊 Query result
✅ User found
✅ Password verified
```

**If you see errors:**

- `❌ Missing credentials` - Form not sending data
- `❌ User not found` - Check user exists in database
- `❌ Invalid password` - Password hash mismatch
- `❌ Error finding user` - Database connection issue

## Common Issues & Solutions

### Issue 1: Missing .env.local file

**Solution:** Copy the file I created or create manually:

```cmd
copy .env.example .env.local
```

Then edit with your MySQL credentials.

### Issue 2: Wrong database credentials

**Solution:** Test MySQL connection manually:

```cmd
mysql -u root -p
# Enter your password
USE travel_agency;
SHOW TABLES;
```

### Issue 3: Database not initialized

**Solution:** Run schema and seed files:

```cmd
mysql -u root -p < database\schema.sql
mysql -u root -p travel_agency < database\seed-users.sql
```

### Issue 4: Test users don't exist

**Solution:** Check database:

```sql
USE travel_agency;
SELECT * FROM Customer WHERE Email = 'customer@travel.com';
SELECT * FROM Agent WHERE Email = 'agent@travel.com';
SELECT * FROM Admin WHERE Email = 'admin@travel.com';
```

If empty, run seed script:

```cmd
mysql -u root -p travel_agency < database\seed-users.sql
```

### Issue 5: Password hash mismatch

**Solution:** The seed file uses password `password123` hashed with bcrypt.
If you manually created users, ensure passwords are hashed:

```javascript
const bcrypt = require("bcryptjs");
const hash = await bcrypt.hash("password123", 10);
console.log(hash);
```

### Issue 6: Missing NEXTAUTH_SECRET

**Solution:** Ensure `.env.local` has NEXTAUTH_SECRET set (any 32+ char string for development)

## Quick Test Checklist

- [ ] `.env.local` file exists
- [ ] Database credentials are correct in `.env.local`
- [ ] MySQL is running
- [ ] Database `travel_agency` exists
- [ ] Tables exist (Customer, Agent, Admin)
- [ ] Test users exist in database
- [ ] Development server restarted after `.env.local` changes
- [ ] NEXTAUTH_SECRET is set

## Manual Database Check

```sql
-- Connect to MySQL
mysql -u root -p

-- Check database exists
SHOW DATABASES;

-- Use database
USE travel_agency;

-- Check tables
SHOW TABLES;

-- Check test users
SELECT Email, FirstName, LastName, Status FROM Customer;
SELECT Email, FirstName, LastName, Status FROM Agent;
SELECT Email, FirstName, LastName, Status FROM Admin;

-- Verify specific user
SELECT * FROM Customer WHERE Email = 'customer@travel.com';
```

## Expected Login Flow

1. User enters email, password, and role
2. Server logs: `🔐 Authorization attempt`
3. Server queries database: `🔍 Executing database query`
4. User found: `✅ User found`
5. Password verified: `✅ Password verified`
6. Session created and user redirected

## If Still Not Working

1. **Check server console** for error messages
2. **Check browser console** for client errors
3. **Verify environment variables are loaded:**
   Add to `src/lib/db.ts` temporarily:

   ```typescript
   console.log("ENV:", process.env.DB_HOST);
   ```

4. **Test with curl:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/callback/credentials \
     -H "Content-Type: application/json" \
     -d '{"email":"customer@travel.com","password":"password123","role":"customer"}'
   ```

## Next Steps After Fix

Once login works:

1. Remove debug console.log statements if desired
2. Change NEXTAUTH_SECRET for production
3. Update database password from default
4. Test all three user roles

## Test Credentials (After Database Setup)

| Role     | Email               | Password    |
| -------- | ------------------- | ----------- |
| Customer | customer@travel.com | password123 |
| Agent    | agent@travel.com    | password123 |
| Admin    | admin@travel.com    | password123 |
