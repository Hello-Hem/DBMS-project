/**
 * Database Connection Test Utility
 * Run this script to verify database connectivity and authentication setup
 */

import { testConnection, query } from "./db";
import { RowDataPacket } from "mysql2";

interface UserCount extends RowDataPacket {
  role: string;
  count: number;
}

async function testDatabaseConnection() {
  console.log("🔍 Testing database connection...\n");

  try {
    // Test basic connection
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error("❌ Database connection failed!");
      console.error("Please check your .env configuration:");
      console.error("  - DB_HOST");
      console.error("  - DB_PORT");
      console.error("  - DB_USER");
      console.error("  - DB_PASSWORD");
      console.error("  - DB_DATABASE");
      return false;
    }

    console.log("✅ Database connection successful!\n");

    // Check if required tables exist
    console.log("📋 Checking required tables...");
    const tables = ["Customer", "Agent", "Admin"];
    for (const table of tables) {
      try {
        const [rows] = await query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = (rows as any)[0].count;
        console.log(`  ✓ ${table} table exists (${count} records)`);
      } catch (error) {
        console.error(`  ❌ ${table} table not found or inaccessible`);
        console.error(`     Run: mysql -u your_user -p < database/schema.sql`);
        return false;
      }
    }

    console.log("\n📊 User Statistics:");

    // Get user counts by role
    const [customers] = await query(
      'SELECT COUNT(*) as count FROM Customer WHERE Status = "Active"'
    );
    const [agents] = await query(
      'SELECT COUNT(*) as count FROM Agent WHERE Status = "Active"'
    );
    const [admins] = await query(
      'SELECT COUNT(*) as count FROM Admin WHERE Status = "Active"'
    );

    console.log(`  👥 Active Customers: ${(customers as any)[0].count}`);
    console.log(`  🎫 Active Agents: ${(agents as any)[0].count}`);
    console.log(`  🔐 Active Admins: ${(admins as any)[0].count}`);

    // Check for test users
    console.log("\n🧪 Checking test users...");
    const testEmails = [
      { email: "customer@travel.com", role: "Customer", table: "Customer" },
      { email: "agent@travel.com", role: "Agent", table: "Agent" },
      { email: "admin@travel.com", role: "Admin", table: "Admin" },
    ];

    let allTestUsersExist = true;
    for (const { email, role, table } of testEmails) {
      const [rows] = await query(`SELECT Email FROM ${table} WHERE Email = ?`, [
        email,
      ]);
      if ((rows as any[]).length > 0) {
        console.log(`  ✓ ${role} test user exists (${email})`);
      } else {
        console.log(`  ⚠️  ${role} test user not found (${email})`);
        allTestUsersExist = false;
      }
    }

    if (!allTestUsersExist) {
      console.log("\n💡 To create test users, run:");
      console.log(
        "   mysql -u your_user -p travel_agency < database/seed-users.sql"
      );
    }

    console.log("\n✅ Database setup is complete and ready!");
    console.log("\n📖 For more information, see AUTH_SETUP.md");

    return true;
  } catch (error) {
    console.error("\n❌ Error testing database:", error);
    return false;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testDatabaseConnection()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

export { testDatabaseConnection };
