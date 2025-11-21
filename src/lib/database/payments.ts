import { db, transaction } from '../db';

export interface Payment {
  PaymentID: number;
  BookingID: number;
  PaymentDate: Date;
  PaidAmount: number;
  Method: 'Credit Card' | 'Bank Transfer' | 'PayPal' | 'Cash' | 'Check' | 'Refund';
  TransactionRef?: string;
  Status: 'Pending' | 'Completed' | 'Failed' | 'Refunded';
  Notes?: string;
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface CreatePaymentData {
  BookingID: number;
  PaidAmount: number;
  Method: 'Credit Card' | 'Bank Transfer' | 'PayPal' | 'Cash' | 'Check';
  TransactionRef?: string;
  Notes?: string;
}

export class PaymentService {
  // Create a new payment
  async createPayment(data: CreatePaymentData): Promise<Payment> {
    return await transaction(async (connection) => {
      // Check if booking exists
      const booking = await db.findOne(
        'Booking',
        'BookingID = ?',
        [data.BookingID]
      );

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Generate unique transaction reference if not provided
      const transactionRef = data.TransactionRef || this.generateTransactionRef();

      const paymentData = {
        ...data,
        TransactionRef: transactionRef,
        Status: 'Completed'
      };

      // Insert payment
      const [result] = await connection.execute(
        `INSERT INTO Payment (BookingID, PaymentDate, PaidAmount, Method, TransactionRef, Status, Notes, CreatedAt)
         VALUES (?, NOW(), ?, ?, ?, ?, ?, NOW())`,
        [
          paymentData.BookingID,
          paymentData.PaidAmount,
          paymentData.Method,
          paymentData.TransactionRef,
          paymentData.Status,
          paymentData.Notes || null
        ]
      );

      const paymentId = (result as any).insertId;

      // Update booking payment status
      await this.updateBookingPaymentStatus(connection, data.BookingID);

      return this.getPaymentById(paymentId);
    });
  }

  // Get payment by ID
  async getPaymentById(id: number): Promise<Payment> {
    const payment = await db.findOne<Payment>('Payment', 'PaymentID = ?', [id]);
    if (!payment) {
      throw new Error('Payment not found');
    }
    return payment;
  }

  // Get payments by booking
  async getPaymentsByBooking(bookingId: number): Promise<Payment[]> {
    return await db.findMany<Payment>(
      'Payment',
      'BookingID = ? ORDER BY PaymentDate DESC',
      [bookingId]
    );
  }

  // Generate unique transaction reference
  private generateTransactionRef(): string {
    const prefix = 'PAY';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  // Update booking payment status
  private async updateBookingPaymentStatus(connection: any, bookingId: number): Promise<void> {
    const sql = `
      UPDATE Booking b
      SET
        PaymentStatus = CASE
          WHEN (b.TotalAmount - COALESCE(SUM(p.PaidAmount), 0)) <= 0 THEN 'Paid'
          WHEN (b.TotalAmount - COALESCE(SUM(p.PaidAmount), 0)) < b.TotalAmount THEN 'Partial'
          ELSE 'Unpaid'
        END,
        Status = CASE
          WHEN b.Status = 'Pending' AND (b.TotalAmount - COALESCE(SUM(p.PaidAmount), 0)) <= b.DepositAmount THEN 'Confirmed'
          ELSE b.Status
        END
      FROM Booking b
      LEFT JOIN Payment p ON b.BookingID = p.BookingID AND p.Status = 'Completed'
      WHERE b.BookingID = ?
    `;

    await connection.execute(sql, [bookingId]);
  }

  // Process refund
  async processRefund(bookingId: number, amount: number, reason?: string): Promise<Payment> {
    return await transaction(async (connection) => {
      // Check if booking exists and get total paid
      const bookingResult = await connection.execute(
        `SELECT b.*, COALESCE(SUM(p.PaidAmount), 0) as total_paid
         FROM Booking b
         LEFT JOIN Payment p ON b.BookingID = p.BookingID AND p.Status = 'Completed' AND p.Method != 'Refund'
         WHERE b.BookingID = ? AND b.Status IN ('Confirmed', 'Pending')
         GROUP BY b.BookingID`,
        [bookingId]
      );

      const booking = bookingResult[0][0];
      if (!booking) {
        throw new Error('Booking not found or cannot be refunded');
      }

      if (amount > booking.total_paid) {
        throw new Error('Refund amount cannot exceed total paid amount');
      }

      // Create refund payment
      const transactionRef = this.generateTransactionRef() + '_REF';
      const [result] = await connection.execute(
        `INSERT INTO Payment (BookingID, PaymentDate, PaidAmount, Method, TransactionRef, Status, Notes, CreatedAt)
         VALUES (?, NOW(), ?, 'Refund', ?, 'Completed', ?, NOW())`,
        [bookingId, -amount, transactionRef, reason || 'Refund processed']
      );

      // Update booking status if fully refunded
      if (amount >= booking.total_paid) {
        await connection.execute(
          'UPDATE Booking SET Status = ?, PaymentStatus = ? WHERE BookingID = ?',
          ['Refunded', 'Refunded', bookingId]
        );
      }

      return this.getPaymentById((result as any).insertId);
    });
  }

  // Get outstanding payments for all bookings
  async getOutstandingPayments(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const sql = `
      SELECT
        b.BookingID,
        b.BookingReference,
        b.TotalAmount,
        b.TravelStartDate,
        b.Status as booking_status,
        c.FirstName, c.LastName, c.Email, c.Phone,
        p.Title as PackageTitle,
        (b.TotalAmount - COALESCE(SUM(pay.PaidAmount), 0)) as outstanding_balance,
        COALESCE(SUM(pay.PaidAmount), 0) as paid_amount,
        COALESCE(SUM(pay.PaidAmount), 0) / b.TotalAmount * 100 as payment_percentage
      FROM Booking b
      JOIN Customer c ON b.CustomerID = c.CustomerID
      JOIN Package p ON b.PackageID = p.PackageID
      LEFT JOIN Payment pay ON b.BookingID = pay.BookingID AND pay.Status = 'Completed' AND pay.Method != 'Refund'
      WHERE b.Status NOT IN ('Cancelled', 'Refunded')
        AND (b.TotalAmount - COALESCE(SUM(pay.PaidAmount), 0)) > 0
      GROUP BY b.BookingID
      ORDER BY outstanding_balance DESC, b.TravelStartDate ASC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.query(sql, [limit, offset]);

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total
      FROM Booking b
      WHERE b.Status NOT IN ('Cancelled', 'Refunded')
        AND (b.TotalAmount - (SELECT COALESCE(SUM(PaidAmount), 0)
                             FROM Payment
                             WHERE BookingID = b.BookingID AND Status = 'Completed' AND Method != 'Refund')) > 0
    `;

    const [countRows] = await db.query(countSql);
    const total = countRows[0]?.total || 0;

    return {
      payments: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Get outstanding payments for agent's bookings
  async getAgentOutstandingPayments(agentId: number, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const sql = `
      SELECT
        b.BookingID,
        b.BookingReference,
        b.TotalAmount,
        b.TravelStartDate,
        c.FirstName, c.LastName, c.Email,
        p.Title as PackageTitle,
        (b.TotalAmount - COALESCE(SUM(pay.PaidAmount), 0)) as outstanding_balance,
        COALESCE(SUM(pay.PaidAmount), 0) as paid_amount
      FROM Booking b
      JOIN Customer c ON b.CustomerID = c.CustomerID
      JOIN Package p ON b.PackageID = p.PackageID
      LEFT JOIN Payment pay ON b.BookingID = pay.BookingID AND pay.Status = 'Completed' AND pay.Method != 'Refund'
      WHERE b.AgentID = ?
        AND b.Status NOT IN ('Cancelled', 'Refunded')
        AND (b.TotalAmount - COALESCE(SUM(pay.PaidAmount), 0)) > 0
      GROUP BY b.BookingID
      ORDER BY outstanding_balance DESC, b.TravelStartDate ASC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.query(sql, [agentId, limit, offset]);

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total
      FROM Booking b
      WHERE b.AgentID = ?
        AND b.Status NOT IN ('Cancelled', 'Refunded')
        AND (b.TotalAmount - (SELECT COALESCE(SUM(PaidAmount), 0)
                             FROM Payment
                             WHERE BookingID = b.BookingID AND Status = 'Completed' AND Method != 'Refund')) > 0
    `;

    const [countRows] = await db.query(countSql, [agentId]);
    const total = countRows[0]?.total || 0;

    return {
      payments: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Get payment statistics
  async getPaymentStats(dateRange?: { start: Date; end: Date }) {
    let dateFilter = '';
    const params: any[] = [];

    if (dateRange) {
      dateFilter = 'WHERE pay.PaymentDate BETWEEN ? AND ?';
      params.push(dateRange.start, dateRange.end);
    }

    const sql = `
      SELECT
        COUNT(pay.PaymentID) as total_payments,
        SUM(pay.PaidAmount) as total_amount,
        COUNT(CASE WHEN pay.Method = 'Credit Card' THEN 1 END) as credit_card_payments,
        COUNT(CASE WHEN pay.Method = 'Bank Transfer' THEN 1 END) as bank_transfer_payments,
        COUNT(CASE WHEN pay.Method = 'PayPal' THEN 1 END) as paypal_payments,
        COUNT(CASE WHEN pay.Method = 'Cash' THEN 1 END) as cash_payments,
        COUNT(CASE WHEN pay.Method = 'Refund' THEN 1 END) as refunds,
        AVG(pay.PaidAmount) as avg_payment_amount
      FROM Payment pay
      ${dateFilter}
    `;

    const [rows] = await db.query(sql, params);
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  }

  // Get customer payment history
  async getCustomerPaymentHistory(customerId: number, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const sql = `
      SELECT
        pay.*,
        b.BookingReference,
        p.Title as PackageTitle
      FROM Payment pay
      JOIN Booking b ON pay.BookingID = b.BookingID
      JOIN Package p ON b.PackageID = p.PackageID
      WHERE b.CustomerID = ?
      ORDER BY pay.PaymentDate DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.query(sql, [customerId, limit, offset]);

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total
      FROM Payment pay
      JOIN Booking b ON pay.BookingID = b.BookingID
      WHERE b.CustomerID = ?
    `;

    const [countRows] = await db.query(countSql, [customerId]);
    const total = countRows[0]?.total || 0;

    return {
      payments: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Update payment status (e.g., mark as failed)
  async updatePaymentStatus(paymentId: number, status: 'Pending' | 'Completed' | 'Failed' | 'Refunded', notes?: string): Promise<void> {
    const updateData: any = { Status: status };
    if (notes) {
      updateData.Notes = notes;
    }

    await db.update('Payment', updateData, 'PaymentID = ?', [paymentId]);

    // If payment failed, update booking payment status
    if (status === 'Failed') {
      const payment = await this.getPaymentById(paymentId);
      await this.updateBookingPaymentStatus(null, payment.BookingID);
    }
  }

  // Check for duplicate transaction references
  async isTransactionRefUnique(transactionRef: string, excludePaymentId?: number): Promise<boolean> {
    const whereClause = excludePaymentId
      ? 'TransactionRef = ? AND PaymentID != ?'
      : 'TransactionRef = ?';
    const params = excludePaymentId
      ? [transactionRef, excludePaymentId]
      : [transactionRef];

    const count = await db.count('Payment', whereClause, params);
    return count === 0;
  }

  // Get payments by date range for reporting
  async getPaymentsByDateRange(startDate: Date, endDate: Date, method?: string) {
    let sql = `
      SELECT
        pay.*,
        b.BookingReference,
        c.FirstName, c.LastName,
        p.Title as PackageTitle
      FROM Payment pay
      JOIN Booking b ON pay.BookingID = b.BookingID
      JOIN Customer c ON b.CustomerID = c.CustomerID
      JOIN Package p ON b.PackageID = p.PackageID
      WHERE pay.PaymentDate BETWEEN ? AND ?
    `;

    const params: any[] = [startDate, endDate];

    if (method) {
      sql += ' AND pay.Method = ?';
      params.push(method);
    }

    sql += ' ORDER BY pay.PaymentDate DESC';

    const [rows] = await db.query(sql, params);
    return rows;
  }
}

export const paymentService = new PaymentService();