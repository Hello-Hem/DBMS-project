import { db } from '../db';
import bcrypt from 'bcryptjs';

export interface Customer {
  CustomerID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone?: string;
  Address?: string;
  City?: string;
  Country?: string;
  PostalCode?: string;
  DateOfBirth?: Date;
  EmergencyContactName?: string;
  EmergencyContactPhone?: string;
  Status: 'Active' | 'Inactive' | 'Suspended';
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface CreateCustomerData {
  FirstName: string;
  LastName: string;
  Email: string;
  Phone?: string;
  Password: string;
  Address?: string;
  City?: string;
  Country?: string;
  PostalCode?: string;
  DateOfBirth?: Date;
  EmergencyContactName?: string;
  EmergencyContactPhone?: string;
}

export class CustomerService {
  // Create a new customer
  async createCustomer(data: CreateCustomerData): Promise<Customer> {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(data.Password, saltRounds);

    const customerData = {
      ...data,
      PasswordHash: passwordHash,
      Status: 'Active'
    };

    // Remove password from the data object as we're storing hash
    delete (customerData as any).Password;

    const result = await db.insert('Customer', customerData);

    // Return the created customer
    return this.getCustomerById(result.insertId);
  }

  // Get customer by ID
  async getCustomerById(id: number): Promise<Customer> {
    const customer = await db.findOne<Customer>('Customer', 'CustomerID = ?', [id]);
    if (!customer) {
      throw new Error('Customer not found');
    }
    return customer;
  }

  // Get customer by email
  async getCustomerByEmail(email: string): Promise<Customer | null> {
    return await db.findOne<Customer>('Customer', 'Email = ?', [email]);
  }

  // Update customer information
  async updateCustomer(id: number, data: Partial<CreateCustomerData>): Promise<Customer> {
    // If password is being updated, hash it
    if (data.Password) {
      const saltRounds = 10;
      (data as any).PasswordHash = await bcrypt.hash(data.Password, saltRounds);
      delete data.Password;
    }

    await db.update('Customer', data, 'CustomerID = ?', [id]);
    return this.getCustomerById(id);
  }

  // Authenticate customer
  async authenticateCustomer(email: string, password: string): Promise<Customer | null> {
    const customer = await this.getCustomerByEmail(email);
    if (!customer || customer.Status !== 'Active') {
      return null;
    }

    // Get the password hash
    const customerWithHash = await db.findOne<{ PasswordHash: string }>(
      'Customer',
      'CustomerID = ?',
      [customer.CustomerID]
    );

    if (customerWithHash && await bcrypt.compare(password, customerWithHash.PasswordHash)) {
      return customer;
    }

    return null;
  }

  // Search customers
  async searchCustomers(query: string): Promise<Customer[]> {
    const searchPattern = `%${query}%`;
    return await db.findMany<Customer>(
      'Customer',
      'Status = ? AND (FirstName LIKE ? OR LastName LIKE ? OR Email LIKE ? OR Phone LIKE ?)',
      ['Active', searchPattern, searchPattern, searchPattern, searchPattern]
    );
  }

  // Get customer bookings
  async getCustomerBookings(customerId: number) {
    const sql = `
      SELECT b.*,
             p.Title as PackageTitle,
             p.Destination,
             (b.TotalAmount - COALESCE(SUM(pay.PaidAmount), 0)) as outstanding_balance,
             COALESCE(SUM(pay.PaidAmount), 0) as total_paid,
             COUNT(pay.PaymentID) as payment_count
      FROM Booking b
      JOIN Package p ON b.PackageID = p.PackageID
      LEFT JOIN Payment pay ON b.BookingID = pay.BookingID AND pay.Status = 'Completed'
      WHERE b.CustomerID = ?
      GROUP BY b.BookingID
      ORDER BY b.CreatedAt DESC
    `;

    const [rows] = await db.query(sql, [customerId]);
    return rows;
  }

  // Get upcoming trips for a customer
  async getUpcomingTrips(customerId: number) {
    const sql = `
      SELECT b.*, p.Title as PackageTitle, p.Destination
      FROM Booking b
      JOIN Package p ON b.PackageID = p.PackageID
      WHERE b.CustomerID = ?
        AND b.Status IN ('Pending', 'Confirmed')
        AND b.TravelStartDate >= CURDATE()
      ORDER BY b.TravelStartDate ASC
    `;

    const [rows] = await db.query(sql, [customerId]);
    return rows;
  }

  // Get customer statistics
  async getCustomerStats(customerId: number) {
    const sql = `
      SELECT
        COUNT(b.BookingID) as total_bookings,
        SUM(b.TotalAmount) as total_spent,
        COUNT(CASE WHEN b.Status = 'Confirmed' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN b.TravelStartDate >= CURDATE() AND b.Status = 'Confirmed' THEN 1 END) as upcoming_trips,
        SUM(CASE WHEN b.Status NOT IN ('Cancelled', 'Refunded') THEN (b.TotalAmount - COALESCE(SUM(pay.PaidAmount), 0)) ELSE 0 END) as outstanding_balance
      FROM Booking b
      LEFT JOIN Payment pay ON b.BookingID = pay.BookingID AND pay.Status = 'Completed'
      WHERE b.CustomerID = ?
    `;

    const [rows] = await db.query(sql, [customerId]);
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  }

  // Delete customer (soft delete)
  async deleteCustomer(id: number): Promise<void> {
    await db.update('Customer', { Status: 'Inactive' }, 'CustomerID = ?', [id]);
  }
}

export const customerService = new CustomerService();