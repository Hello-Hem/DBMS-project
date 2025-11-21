import { db } from '../db';

export interface Supplier {
  SupplierID: number;
  Name: string;
  Type: 'Hotel' | 'Airline' | 'Transport' | 'Activity' | 'Restaurant' | 'Other';
  Description?: string;
  ContactPerson?: string;
  Email?: string;
  Phone?: string;
  Address?: string;
  City?: string;
  Country?: string;
  PostalCode?: string;
  Website?: string;
  Rating: number;
  Status: 'Active' | 'Inactive';
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface CreateSupplierData {
  Name: string;
  Type: 'Hotel' | 'Airline' | 'Transport' | 'Activity' | 'Restaurant' | 'Other';
  Description?: string;
  ContactPerson?: string;
  Email?: string;
  Phone?: string;
  Address?: string;
  City?: string;
  Country?: string;
  PostalCode?: string;
  Website?: string;
  Rating?: number;
}

export interface HotelRoom {
  RoomID: number;
  SupplierID: number;
  RoomNumber: string;
  RoomType: 'Single' | 'Double' | 'Twin' | 'Suite' | 'Deluxe' | 'Family';
  Capacity: number;
  PricePerNight: number;
  Amenities?: any;
  TotalRooms: number;
  Status: 'Available' | 'Unavailable' | 'Maintenance';
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface CreateHotelRoomData {
  SupplierID: number;
  RoomNumber: string;
  RoomType: 'Single' | 'Double' | 'Twin' | 'Suite' | 'Deluxe' | 'Family';
  Capacity: number;
  PricePerNight: number;
  Amenities?: any;
  TotalRooms?: number;
}

export class SupplierService {
  // Create a new supplier
  async createSupplier(data: CreateSupplierData): Promise<Supplier> {
    const supplierData = {
      ...data,
      Rating: data.Rating || 0,
      Status: 'Active'
    };

    const result = await db.insert('Supplier', supplierData);
    return this.getSupplierById(result.insertId);
  }

  // Get supplier by ID
  async getSupplierById(id: number): Promise<Supplier> {
    const supplier = await db.findOne<Supplier>('Supplier', 'SupplierID = ?', [id]);
    if (!supplier) {
      throw new Error('Supplier not found');
    }
    return supplier;
  }

  // Update supplier
  async updateSupplier(id: number, data: Partial<CreateSupplierData>): Promise<Supplier> {
    await db.update('Supplier', data, 'SupplierID = ?', [id]);
    return this.getSupplierById(id);
  }

  // Get all suppliers with optional filtering
  async getSuppliers(filters?: {
    type?: string;
    status?: string;
    city?: string;
    country?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      type,
      status = 'Active',
      city,
      country,
      search,
      page = 1,
      limit = 20
    } = filters || {};

    const offset = (page - 1) * limit;
    const conditions = [];
    const params: any[] = [];

    if (type) {
      conditions.push('Type = ?');
      params.push(type);
    }

    if (status) {
      conditions.push('Status = ?');
      params.push(status);
    }

    if (city) {
      conditions.push('City = ?');
      params.push(city);
    }

    if (country) {
      conditions.push('Country = ?');
      params.push(country);
    }

    if (search) {
      conditions.push('(Name LIKE ? OR Description LIKE ? OR ContactPerson LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT *
      FROM Supplier
      ${whereClause}
      ORDER BY Name ASC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.query(sql, [...params, limit, offset]);

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM Supplier ${whereClause}`;
    const [countRows] = await db.query(countSql, params);
    const total = countRows[0]?.total || 0;

    return {
      suppliers: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Search suppliers
  async searchSuppliers(query: string): Promise<Supplier[]> {
    const searchPattern = `%${query}%`;
    return await db.findMany<Supplier>(
      'Supplier',
      'Status = ? AND (Name LIKE ? OR Description LIKE ? OR ContactPerson LIKE ? OR City LIKE ?)',
      ['Active', searchPattern, searchPattern, searchPattern, searchPattern]
    );
  }

  // Get suppliers by type
  async getSuppliersByType(type: string): Promise<Supplier[]> {
    return await db.findMany<Supplier>(
      'Supplier',
      'Type = ? AND Status = ? ORDER BY Name ASC',
      [type, 'Active']
    );
  }

  // Delete supplier (soft delete)
  async deleteSupplier(id: number): Promise<void> {
    await db.update('Supplier', { Status: 'Inactive' }, 'SupplierID = ?', [id]);
  }

  // Create hotel room for a supplier
  async createHotelRoom(data: CreateHotelRoomData): Promise<HotelRoom> {
    const roomData = {
      ...data,
      Status: 'Available',
      TotalRooms: data.TotalRooms || 1
    };

    const result = await db.insert('HotelRoom', roomData);
    return this.getHotelRoomById(result.insertId);
  }

  // Get hotel room by ID
  async getHotelRoomById(id: number): Promise<HotelRoom> {
    const room = await db.findOne<HotelRoom>('HotelRoom', 'RoomID = ?', [id]);
    if (!room) {
      throw new Error('Hotel room not found');
    }
    return room;
  }

  // Get hotel rooms by supplier
  async getHotelRoomsBySupplier(supplierId: number, status?: string): Promise<HotelRoom[]> {
    const statusFilter = status ? `AND Status = ?` : '';
    const params = status ? [supplierId, status] : [supplierId];

    return await db.findMany<HotelRoom>(
      'HotelRoom',
      `SupplierID = ? ${statusFilter} ORDER BY RoomNumber ASC`,
      params
    );
  }

  // Update hotel room
  async updateHotelRoom(id: number, data: Partial<CreateHotelRoomData>): Promise<HotelRoom> {
    await db.update('HotelRoom', data, 'RoomID = ?', [id]);
    return this.getHotelRoomById(id);
  }

  // Update hotel room status
  async updateHotelRoomStatus(id: number, status: 'Available' | 'Unavailable' | 'Maintenance'): Promise<void> {
    await db.update('HotelRoom', { Status: status }, 'RoomID = ?', [id]);
  }

  // Check room availability for specific dates
  async checkRoomAvailability(roomId: number, checkInDate: Date, checkOutDate: Date, excludeBookingRoomId?: number) {
    let whereClause = `
      RoomID = ?
      AND Status = 'Available'
      AND TotalRooms > (
        SELECT COUNT(*)
        FROM BookingRoom br
        WHERE br.RoomID = hr.RoomID
          AND br.Status IN ('Confirmed', 'Pending')
          AND (br.CheckInDate < ? AND br.CheckOutDate > ?)
    `;

    const params: any[] = [roomId, checkOutDate, checkInDate];

    if (excludeBookingRoomId) {
      whereClause += ` AND br.BookingRoomID != ?`;
      params.push(excludeBookingRoomId);
    }

    const sql = `
      SELECT hr.*,
             (${whereClause}) as is_available,
             (SELECT COUNT(*)
              FROM BookingRoom br
              WHERE br.RoomID = hr.RoomID
                AND br.Status IN ('Confirmed', 'Pending')
                AND (br.CheckInDate < ? AND br.CheckOutDate > ?)) as booked_rooms
      FROM HotelRoom hr
      WHERE hr.RoomID = ?
    `;

    const finalParams = [...params, checkOutDate, checkInDate, roomId];
    const [rows] = await db.query(sql, finalParams);

    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  }

  // Get available rooms for date range
  async getAvailableRooms(supplierId: number, checkInDate: Date, checkOutDate: Date) {
    const sql = `
      SELECT hr.*,
             (hr.TotalRooms - COALESCE(booked.booked_count, 0)) as available_rooms
      FROM HotelRoom hr
      LEFT JOIN (
        SELECT RoomID, COUNT(*) as booked_count
        FROM BookingRoom br
        WHERE br.Status IN ('Confirmed', 'Pending')
          AND br.CheckInDate < ? AND br.CheckOutDate > ?
        GROUP BY RoomID
      ) booked ON hr.RoomID = booked.RoomID
      WHERE hr.SupplierID = ?
        AND hr.Status = 'Available'
        AND (hr.TotalRooms - COALESCE(booked.booked_count, 0)) > 0
      ORDER BY hr.RoomType, hr.PricePerNight
    `;

    const [rows] = await db.query(sql, [checkOutDate, checkInDate, supplierId]);
    return rows;
  }

  // Get room usage statistics
  async getRoomUsageStats(roomId: number, startDate?: Date, endDate?: Date) {
    let dateFilter = '';
    const params: any[] = [roomId];

    if (startDate && endDate) {
      dateFilter = 'AND br.CheckInDate BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    const sql = `
      SELECT
        COUNT(br.BookingRoomID) as total_bookings,
        SUM(br.NumberOfRooms) as total_rooms_booked,
        SUM(br.TotalPrice) as total_revenue,
        AVG(br.NumberOfRooms) as avg_rooms_per_booking,
        COUNT(CASE WHEN br.Status = 'Confirmed' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN br.Status = 'Cancelled' THEN 1 END) as cancelled_bookings
      FROM BookingRoom br
      WHERE br.RoomID = ?
        ${dateFilter}
    `;

    const [rows] = await db.query(sql, params);
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  }

  // Get supplier statistics
  async getSupplierStats(supplierId: number) {
    const sql = `
      SELECT
        COUNT(DISTINCT ps.PackageID) as linked_packages,
        COUNT(DISTINCT b.BookingID) as total_bookings,
        COUNT(DISTINCT hr.RoomID) as total_rooms,
        COALESCE(SUM(b.TotalAmount), 0) as total_revenue,
        AVG(s.Rating) as avg_rating
      FROM Supplier s
      LEFT JOIN PackageSupplier ps ON s.SupplierID = ps.SupplierID AND ps.Status = 'Active'
      LEFT JOIN ItineraryItem i ON s.SupplierID = i.SupplierID
      LEFT JOIN Booking b ON i.BookingID = b.BookingID AND b.Status = 'Confirmed'
      LEFT JOIN HotelRoom hr ON s.SupplierID = hr.SupplierID
      WHERE s.SupplierID = ?
    `;

    const [rows] = await db.query(sql, [supplierId]);
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  }

  // Update supplier rating
  async updateSupplierRating(supplierId: number): Promise<void> {
    // This would typically be called based on customer feedback
    // For now, it's a placeholder that could be extended later
    const sql = `
      UPDATE Supplier s
      SET s.Rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM (
          SELECT 4.5 as rating UNION ALL -- This would come from reviews table
          SELECT 4.0 as rating
        ) as ratings
      )
      WHERE s.SupplierID = ?
    `;

    await db.query(sql, [supplierId]);
  }

  // Delete hotel room
  async deleteHotelRoom(id: number): Promise<void> {
    // Check if room has any active bookings
    const activeBookings = await db.count(
      'BookingRoom',
      'RoomID = ? AND Status IN (\'Confirmed\', \'Pending\')',
      [id]
    );

    if (activeBookings > 0) {
      throw new Error('Cannot delete room with active bookings');
    }

    await db.update('HotelRoom', { Status: 'Unavailable' }, 'RoomID = ?', [id]);
  }
}

export const supplierService = new SupplierService();