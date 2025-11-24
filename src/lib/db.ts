import mysql from "mysql2/promise";
import { FieldPacket, RowDataPacket } from "mysql2";

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_DATABASE || "travel_agency",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
};

console.log("🔌 Database configuration loaded:", {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database,
  hasPassword: !!dbConfig.password,
});

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Database query wrapper
export async function query<T = RowDataPacket[]>(
  sql: string,
  params?: any[]
): Promise<[T, FieldPacket[]]> {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows, fields] = await connection.execute<T>(sql, params);
      return [rows, fields];
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

// Transaction helper
export async function transaction<T>(
  callback: (connection: mysql.Connection) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const [rows] = await query("SELECT 1 as test");
    return Array.isArray(rows) && rows.length > 0;
  } catch (error) {
    console.error("Database connection test failed:", error);
    return false;
  }
}

// Helper functions for common operations
export const db = {
  // Get single record
  async findOne<T>(
    table: string,
    where: string,
    params: any[] = []
  ): Promise<T | null> {
    const sql = `SELECT * FROM ${table} WHERE ${where} LIMIT 1`;
    const [rows] = await query<T>(sql, params);
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  },

  // Get multiple records
  async findMany<T>(
    table: string,
    where: string = "1=1",
    params: any[] = []
  ): Promise<T[]> {
    const sql = `SELECT * FROM ${table} WHERE ${where}`;
    const [rows] = await query<T>(sql, params);
    return Array.isArray(rows) ? rows : [];
  },

  // Insert record
  async insert(
    table: string,
    data: Record<string, any>
  ): Promise<mysql.ResultSetHeader> {
    const fields = Object.keys(data).join(", ");
    const placeholders = Object.keys(data)
      .map(() => "?")
      .join(", ");
    const values = Object.values(data);
    const sql = `INSERT INTO ${table} (${fields}) VALUES (${placeholders})`;
    const [result] = await query<mysql.ResultSetHeader>(sql, values);
    return result;
  },

  // Update record
  async update(
    table: string,
    data: Record<string, any>,
    where: string,
    params: any[] = []
  ): Promise<mysql.ResultSetHeader> {
    const fields = Object.keys(data)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = [...Object.values(data), ...params];
    const sql = `UPDATE ${table} SET ${fields} WHERE ${where}`;
    const [result] = await query<mysql.ResultSetHeader>(sql, values);
    return result;
  },

  // Delete record
  async delete(
    table: string,
    where: string,
    params: any[] = []
  ): Promise<mysql.ResultSetHeader> {
    const sql = `DELETE FROM ${table} WHERE ${where}`;
    const [result] = await query<mysql.ResultSetHeader>(sql, params);
    return result;
  },

  // Count records
  async count(
    table: string,
    where: string = "1=1",
    params: any[] = []
  ): Promise<number> {
    const sql = `SELECT COUNT(*) as count FROM ${table} WHERE ${where}`;
    const [rows] = await query<{ count: number }>(sql, params);
    return rows[0]?.count || 0;
  },
};

// Close connection pool (for cleanup)
export async function closeConnection(): Promise<void> {
  await pool.end();
}

export default pool;
