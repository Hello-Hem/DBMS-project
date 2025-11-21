import { db } from '../db';

export interface Package {
  PackageID: number;
  Title: string;
  Description?: string;
  StartDate: Date;
  EndDate: Date;
  Price: number;
  Capacity: number;
  Destination?: string;
  Country?: string;
  ImageURL?: string;
  Inclusions?: any;
  Exclusions?: any;
  ItineraryTemplate?: any;
  Featured: boolean;
  Status: 'Active' | 'Inactive' | 'SoldOut' | 'Cancelled';
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface CreatePackageData {
  Title: string;
  Description?: string;
  StartDate: Date;
  EndDate: Date;
  Price: number;
  Capacity: number;
  Destination?: string;
  Country?: string;
  ImageURL?: string;
  Inclusions?: any;
  Exclusions?: any;
  ItineraryTemplate?: any;
  Featured?: boolean;
}

export class PackageService {
  // Create a new package
  async createPackage(data: CreatePackageData): Promise<Package> {
    const packageData = {
      ...data,
      Status: 'Active',
      Featured: data.Featured || false
    };

    const result = await db.insert('Package', packageData);
    return this.getPackageById(result.insertId);
  }

  // Get package by ID
  async getPackageById(id: number): Promise<Package> {
    const packageRow = await db.findOne<Package>('Package', 'PackageID = ?', [id]);
    if (!packageRow) {
      throw new Error('Package not found');
    }
    return packageRow;
  }

  // Get package with capacity information
  async getPackageWithCapacity(id: number) {
    const sql = `
      SELECT p.*,
             (p.Capacity - COALESCE(SUM(b.NumTravellers), 0)) as capacity_left,
             COALESCE(SUM(b.NumTravellers), 0) as booked_capacity,
             ROUND(((p.Capacity - COALESCE(SUM(b.NumTravellers), 0)) / p.Capacity) * 100, 2) as availability_percentage
      FROM Package p
      LEFT JOIN Booking b ON p.PackageID = b.PackageID
        AND b.Status IN ('Pending', 'Confirmed')
        AND b.TravelStartDate BETWEEN p.StartDate AND p.EndDate
      WHERE p.PackageID = ?
      GROUP BY p.PackageID
    `;

    const [rows] = await db.query(sql, [id]);
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  }

  // Update package
  async updatePackage(id: number, data: Partial<CreatePackageData>): Promise<Package> {
    await db.update('Package', data, 'PackageID = ?', [id]);
    return this.getPackageById(id);
  }

  // Get featured packages
  async getFeaturedPackages(limit: number = 6) {
    const sql = `
      SELECT p.*,
             (p.Capacity - COALESCE(SUM(b.NumTravellers), 0)) as capacity_left,
             COALESCE(SUM(b.NumTravellers), 0) as booked_capacity
      FROM Package p
      LEFT JOIN Booking b ON p.PackageID = b.PackageID
        AND b.Status IN ('Pending', 'Confirmed')
        AND b.TravelStartDate BETWEEN p.StartDate AND p.EndDate
      WHERE p.Status = 'Active'
        AND p.StartDate >= CURDATE()
        AND (p.Featured = 1 OR p.StartDate <= DATE_ADD(CURDATE(), INTERVAL 30 DAY))
      GROUP BY p.PackageID
      ORDER BY p.Featured DESC, p.StartDate ASC
      LIMIT ?
    `;

    const [rows] = await db.query(sql, [limit]);
    return rows;
  }

  // Search packages with filters
  async searchPackages(filters: {
    destination?: string;
    startDate?: Date;
    endDate?: Date;
    minPrice?: number;
    maxPrice?: number;
    minCapacity?: number;
    keyword?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      destination,
      startDate,
      endDate,
      minPrice,
      maxPrice,
      minCapacity,
      keyword,
      page = 1,
      limit = 12
    } = filters;

    const offset = (page - 1) * limit;
    const conditions = ['p.Status = ?', 'p.StartDate >= CURDATE()'];
    const params: any[] = ['Active'];

    if (destination) {
      conditions.push('(p.Destination LIKE ? OR p.Country LIKE ?)');
      params.push(`%${destination}%`, `%${destination}%`);
    }

    if (startDate) {
      conditions.push('p.StartDate >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('p.EndDate <= ?');
      params.push(endDate);
    }

    if (minPrice) {
      conditions.push('p.Price >= ?');
      params.push(minPrice);
    }

    if (maxPrice) {
      conditions.push('p.Price <= ?');
      params.push(maxPrice);
    }

    if (minCapacity) {
      conditions.push('p.Capacity >= ?');
      params.push(minCapacity);
    }

    if (keyword) {
      conditions.push('(p.Title LIKE ? OR p.Description LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const whereClause = conditions.join(' AND ');

    // Get packages with capacity
    const sql = `
      SELECT p.*,
             (p.Capacity - COALESCE(SUM(b.NumTravellers), 0)) as capacity_left,
             COALESCE(SUM(b.NumTravellers), 0) as booked_capacity,
             s.Name as SupplierName
      FROM Package p
      LEFT JOIN Booking b ON p.PackageID = b.PackageID
        AND b.Status IN ('Pending', 'Confirmed')
        AND b.TravelStartDate BETWEEN p.StartDate AND p.EndDate
      LEFT JOIN PackageSupplier ps ON p.PackageID = ps.PackageID
      LEFT JOIN Supplier s ON ps.SupplierID = s.SupplierID
      WHERE ${whereClause}
      GROUP BY p.PackageID
      ORDER BY p.StartDate ASC, p.Featured DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.query(sql, [...params, limit, offset]);

    // Get total count for pagination
    const countSql = `
      SELECT COUNT(DISTINCT p.PackageID) as total
      FROM Package p
      LEFT JOIN Booking b ON p.PackageID = b.PackageID
        AND b.Status IN ('Pending', 'Confirmed')
        AND b.TravelStartDate BETWEEN p.StartDate AND p.EndDate
      WHERE ${whereClause}
    `;

    const [countRows] = await db.query(countSql, params);
    const total = countRows[0]?.total || 0;

    return {
      packages: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Check package availability
  async checkAvailability(packageId: number, travelStartDate: Date, travelEndDate: Date, numTravellers: number = 1) {
    const sql = `
      SELECT
        p.PackageID,
        p.Capacity,
        p.Status,
        COALESCE(SUM(b.NumTravellers), 0) as booked_capacity,
        (p.Capacity - COALESCE(SUM(b.NumTravellers), 0)) as available_capacity,
        CASE
          WHEN p.Status != 'Active' THEN false
          WHEN (p.Capacity - COALESCE(SUM(b.NumTravellers), 0)) >= ? THEN true
          ELSE false
        END as is_available
      FROM Package p
      LEFT JOIN Booking b ON p.PackageID = b.PackageID
        AND b.Status IN ('Pending', 'Confirmed')
        AND ((b.TravelStartDate <= ? AND b.TravelEndDate >= ?)
             OR (b.TravelStartDate <= ? AND b.TravelEndDate >= ?)
             OR (b.TravelStartDate >= ? AND b.TravelEndDate <= ?))
      WHERE p.PackageID = ?
      GROUP BY p.PackageID
    `;

    const [rows] = await db.query(sql, [
      numTravellers,
      travelStartDate, travelEndDate,
      travelStartDate, travelEndDate,
      travelStartDate, travelEndDate,
      packageId
    ]);

    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  }

  // Get package suppliers
  async getPackageSuppliers(packageId: number) {
    const sql = `
      SELECT ps.*, s.Name, s.Type, s.ContactPerson, s.Email, s.Phone
      FROM PackageSupplier ps
      JOIN Supplier s ON ps.SupplierID = s.SupplierID
      WHERE ps.PackageID = ? AND ps.Status = 'Active'
      ORDER BY ps.Role
    `;

    const [rows] = await db.query(sql, [packageId]);
    return rows;
  }

  // Link supplier to package
  async linkSupplierToPackage(packageId: number, supplierId: number, role: string, notes?: string, costPerPerson?: number) {
    const data = {
      PackageID: packageId,
      SupplierID: supplierId,
      Role: role,
      Notes: notes,
      CostPerPerson: costPerPerson
    };

    return await db.insert('PackageSupplier', data);
  }

  // Get package statistics
  async getPackageStats(packageId: number) {
    const sql = `
      SELECT
        COUNT(b.BookingID) as total_bookings,
        SUM(b.NumTravellers) as total_travellers,
        SUM(b.TotalAmount) as total_revenue,
        AVG(b.NumTravellers) as avg_travellers_per_booking,
        COUNT(CASE WHEN b.Status = 'Confirmed' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN b.Status = 'Cancelled' THEN 1 END) as cancelled_bookings
      FROM Booking b
      WHERE b.PackageID = ?
    `;

    const [rows] = await db.query(sql, [packageId]);
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  }

  // Update package status (e.g., mark as SoldOut)
  async updatePackageStatus(id: number, status: 'Active' | 'Inactive' | 'SoldOut' | 'Cancelled'): Promise<void> {
    await db.update('Package', { Status: status }, 'PackageID = ?', [id]);
  }

  // Delete package (soft delete)
  async deletePackage(id: number): Promise<void> {
    await db.update('Package', { Status: 'Inactive' }, 'PackageID = ?', [id]);
  }
}

export const packageService = new PackageService();