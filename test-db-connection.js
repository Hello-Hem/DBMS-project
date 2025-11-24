/**
 * Quick Database Connection Test
 * Run this to verify your database is accessible
 */

// const mysql = require("mysql2/promise");
// require("dotenv/config");
import mysql from "mysql2/promise";
import "dotenv/config";

async function testConnection() {
  console.log("\n🔍 Testing Database Connection...\n");

  const config = {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_DATABASE || "travel_agency",
  };

  console.log("Configuration:", {
    host: config.host,
    port: config.port,
    user: config.user,
    database: config.database,
    hasPassword: !!config.password,
  });

  try {
    console.log("\n📡 Attempting to connect...");
    const connection = await mysql.createConnection(config);
    console.log("✅ Connection successful!\n");

    // Test query
    console.log("🧪 Testing query...");
    const [rows] = await connection.execute("SELECT 1 as test");
    console.log("✅ Query successful:", rows);

    // Check if tables exist
    console.log("\n📋 Checking tables...");
    const tables = ["Customer", "Agent", "Admin"];

    for (const table of tables) {
      try {
        const [result] = await connection.execute(
          `SELECT COUNT(*) as count FROM ${table}`
        );
        console.log(`✅ ${table}: ${result[0].count} records`);
      } catch (error) {
        console.log(`❌ ${table}: Table not found`);
      }
    }

    // Check for test users
    console.log("\n👤 Checking test users...");
    const testUsers = [
      { email: "customer@travel.com", table: "Customer" },
      { email: "agent@travel.com", table: "Agent" },
      { email: "admin@travel.com", table: "Admin" },
    ];

    for (const { email, table } of testUsers) {
      try {
        const [rows] = await connection.execute(
          `SELECT Email FROM ${table} WHERE Email = ?`,
          [email]
        );
        if (rows.length > 0) {
          console.log(`✅ ${email} exists`);
        } else {
          console.log(`⚠️  ${email} not found`);
        }
      } catch (error) {
        console.log(`❌ Error checking ${email}:`, error.message);
      }
    }

    await connection.end();

    console.log("\n✅ All tests passed!\n");
    console.log("💡 If test users are missing, run:");
    console.log(
      "   mysql -u your_user -p travel_agency < database/seed-users.sql\n"
    );
  } catch (error) {
    console.error("\n❌ Connection failed:", error.message);
    console.error("\n💡 Common fixes:");
    console.error("   1. Check MySQL is running");
    console.error("   2. Verify credentials in .env.local");
    console.error('   3. Ensure database "travel_agency" exists');
    console.error("   4. Check user has proper permissions\n");
    process.exit(1);
  }
}

testConnection();
