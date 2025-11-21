import { db, transaction } from '../db';

export interface Booking {
  BookingID: number;
  CustomerID: number;
  PackageID: number;
  AgentID?: number;
  BookingReference: string;
  NumTravellers: number;
  TravelStartDate: Date;
  TravelEndDate: Date;
  TotalAmount: number;
  DepositAmount: number;
  Status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed' | 'Refunded';
  SpecialRequests?: string;
  PaymentStatus: 'Unpaid' | 'Partial' | 'Paid' | 'Refunded';
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface CreateBookingData {
  CustomerID: number;
  PackageID: number;
  AgentID?: number;
  NumTravellers: number;
  TravelStartDate: Date;
  TravelEndDate: Date;
  TotalAmount: number;
  DepositAmount?: number;
  SpecialRequests?: string;
}

export interface ItineraryItemData {
  ItemType: 'Flight' | 'Hotel' | 'Activity' | 'Transport' | 'Meal' | 'Other';
  Title: string;
  Description?: string;
  StartDate?: Date;
  EndDate?: Date;
  Location?: string;
  Price: number;
  SupplierID?: number;
}

export interface FlightSegmentData {
  FlightNumber: string;
  Airline?: string;
  DepartureCity: string;
  DepartureAirport?: string;
  DepartureTime: Date;
  ArrivalCity: string;
  ArrivalAirport?: string;
  ArrivalTime: Date;
  AircraftType?: string;
  SeatClass?: 'Economy' | 'Business' | 'First';
}

export interface BookingRoomData {
  RoomID: number;
  CheckInDate: Date;
  CheckOutDate: Date;
  NumberOfRooms: number;
  PricePerNight: number;
  GuestNames?: any;
  SpecialRequests?: string;
}

export class BookingService {
  // Generate unique booking reference
  private generateBookingReference(): string {
    const prefix = 'TA';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  // Create a new booking with transaction
  async createBooking(data: CreateBookingData): Promise<Booking> {
    return await transaction(async (connection) => {
      // Check package availability
      const availabilityCheck = await this.checkBookingConstraints(
        data.PackageID,
        data.TravelStartDate,
        data.TravelEndDate,
        data.NumTravellers
      );

      if (!availabilityCheck.isAvailable) {
        throw new Error(`Booking not available: ${availabilityCheck.reason}`);
      }

      // Create booking
      const bookingData = {
        ...data,
        BookingReference: this.generateBookingReference(),
        Status: 'Pending',
        PaymentStatus: 'Unpaid',
        DepositAmount: data.DepositAmount || data.TotalAmount * 0.1 // Default 10% deposit
      };

      const [result] = await connection.execute(
        `INSERT INTO Booking (CustomerID, PackageID, AgentID, BookingReference, NumTravellers,
         TravelStartDate, TravelEndDate, TotalAmount, DepositAmount, Status, PaymentStatus,
         SpecialRequests, CreatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          bookingData.CustomerID,
          bookingData.PackageID,
          bookingData.AgentID || null,
          bookingData.BookingReference,
          bookingData.NumTravellers,
          bookingData.TravelStartDate,
          bookingData.TravelEndDate,
          bookingData.TotalAmount,
          bookingData.DepositAmount,
          bookingData.Status,
          bookingData.PaymentStatus,
          bookingData.SpecialRequests || null
        ]
      );

      const bookingId = (result as any).insertId;
      return this.getBookingById(bookingId);
    });
  }

  // Get booking by ID with full details
  async getBookingById(id: number) {
    const sql = `
      SELECT b.*,
             c.FirstName, c.LastName, c.Email, c.Phone,
             p.Title as PackageTitle, p.Destination, p.Country,
             a.FirstName as AgentFirstName, a.LastName as AgentLastName,
             (b.TotalAmount - COALESCE(SUM(pay.PaidAmount), 0)) as outstanding_balance,
             COALESCE(SUM(pay.PaidAmount), 0) as total_paid
      FROM Booking b
      JOIN Customer c ON b.CustomerID = c.CustomerID
      JOIN Package p ON b.PackageID = p.PackageID
      LEFT JOIN Agent a ON b.AgentID = a.AgentID
      LEFT JOIN Payment pay ON b.BookingID = pay.BookingID AND pay.Status = 'Completed'
      WHERE b.BookingID = ?
      GROUP BY b.BookingID
    `;

    const [rows] = await db.query(sql, [id]);
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  }

  // Get booking by reference
  async getBookingByReference(reference: string) {
    return await db.findOne<Booking>('Booking', 'BookingReference = ?', [reference]);
  }

  // Update booking
  async updateBooking(id: number, data: Partial<CreateBookingData>) {
    await db.update('Booking', data, 'BookingID = ?', [id]);
    return this.getBookingById(id);
  }

  // Add itinerary item to booking
  async addItineraryItem(bookingId: number, itemData: ItineraryItemData) {
    const itineraryData = {
      BookingID: bookingId,
      ItemType: itemData.ItemType,
      Title: itemData.Title,
      Description: itemData.Description,
      StartDate: itemData.StartDate,
      EndDate: itemData.EndDate,
      Location: itemData.Location,
      Price: itemData.Price,
      SupplierID: itemData.SupplierID,
      Status: 'Pending'
    };

    const result = await db.insert('ItineraryItem', itineraryData);
    return result.insertId;
  }

  // Add flight segments to itinerary item
  async addFlightSegments(itineraryItemId: number, segments: FlightSegmentData[]) {
    const results = [];
    for (const segment of segments) {
      const segmentData = {
        ...segment,
        ItineraryItemID: itineraryItemId,
        Status: 'Pending'
      };
      const result = await db.insert('FlightSegment', segmentData);
      results.push(result);
    }
    return results;
  }

  // Add hotel room booking
  async addBookingRoom(itineraryItemId: number, roomData: BookingRoomData) {
    // Check room availability
    const isAvailable = await this.checkRoomAvailability(
      roomData.RoomID,
      roomData.CheckInDate,
      roomData.CheckOutDate
    );

    if (!isAvailable) {
      throw new Error('Room is not available for the selected dates');
    }

    const nights = Math.ceil(
      (roomData.CheckOutDate.getTime() - roomData.CheckInDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const bookingRoomData = {
      ItineraryItemID: itineraryItemId,
      RoomID: roomData.RoomID,
      CheckInDate: roomData.CheckInDate,
      CheckOutDate: roomData.CheckOutDate,
      NumberOfRooms: roomData.NumberOfRooms,
      PricePerNight: roomData.PricePerNight,
      TotalPrice: roomData.PricePerNight * nights * roomData.NumberOfRooms,
      GuestNames: roomData.GuestNames,
      SpecialRequests: roomData.SpecialRequests,
      Status: 'Pending'
    };

    return await db.insert('BookingRoom', bookingRoomData);
  }

  // Check room availability
  async checkRoomAvailability(roomId: number, checkInDate: Date, checkOutDate: Date): Promise<boolean> {
    const sql = `
      SELECT COUNT(*) as booked_rooms
      FROM BookingRoom br
      JOIN HotelRoom hr ON br.RoomID = hr.RoomID
      WHERE br.RoomID = ?
        AND br.Status IN ('Confirmed', 'Pending')
        AND (br.CheckInDate < ? AND br.CheckOutDate > ?)
    `;

    const [rows] = await db.query(sql, [roomId, checkOutDate, checkInDate]);
    const bookedRooms = rows[0]?.booked_rooms || 0;

    // Get room capacity
    const room = await db.findOne<{ TotalRooms: number }>('HotelRoom', 'RoomID = ?', [roomId]);
    if (!room) {
      throw new Error('Room not found');
    }

    return bookedRooms < room.TotalRooms;
  }

  // Check booking constraints (capacity, dates, etc.)
  async checkBookingConstraints(
    packageId: number,
    travelStartDate: Date,
    travelEndDate: Date,
    numTravellers: number
  ) {
    // Check if dates are valid
    if (travelStartDate >= travelEndDate) {
      return {
        isAvailable: false,
        reason: 'Start date must be before end date'
      };
    }

    // Check if dates are in the future
    if (travelStartDate < new Date()) {
      return {
        isAvailable: false,
        reason: 'Travel dates must be in the future'
      };
    }

    // Check package availability
    const sql = `
      SELECT
        p.PackageID,
        p.Capacity,
        p.Status,
        COALESCE(SUM(b.NumTravellers), 0) as booked_capacity,
        (p.Capacity - COALESCE(SUM(b.NumTravellers), 0)) as available_capacity
      FROM Package p
      LEFT JOIN Booking b ON p.PackageID = b.PackageID
        AND b.Status IN ('Pending', 'Confirmed')
        AND ((b.TravelStartDate <= ? AND b.TravelEndDate >= ?)
             OR (b.TravelStartDate <= ? AND b.TravelEndDate >= ?))
      WHERE p.PackageID = ?
      GROUP BY p.PackageID
    `;

    const [rows] = await db.query(sql, [
      travelStartDate, travelEndDate,
      travelStartDate, travelEndDate,
      packageId
    ]);

    const availability = rows[0];
    if (!availability) {
      return {
        isAvailable: false,
        reason: 'Package not found'
      };
    }

    if (availability.Status !== 'Active') {
      return {
        isAvailable: false,
        reason: 'Package is not active'
      };
    }

    if (availability.available_capacity < numTravellers) {
      return {
        isAvailable: false,
        reason: `Only ${availability.available_capacity} spots available`
      };
    }

    return {
      isAvailable: true,
      reason: 'Available'
    };
  }

  // Confirm booking
  async confirmBooking(id: number): Promise<void> {
    // Check payment status
    const booking = await this.getBookingById(id);
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.PaymentStatus === 'Unpaid') {
      throw new Error('Cannot confirm booking without payment');
    }

    await db.update('Booking',
      { Status: 'Confirmed' },
      'BookingID = ?',
      [id]
    );
  }

  // Cancel booking
  async cancelBooking(id: number, reason?: string): Promise<void> {
    const updateData = {
      Status: 'Cancelled',
      SpecialRequests: reason
    };

    // Also cancel all related itinerary items
    await db.update('ItineraryItem',
      { Status: 'Cancelled' },
      'BookingID = ?',
      [id]
    );

    await db.update('Booking', updateData, 'BookingID = ?', [id]);
  }

  // Calculate booking total
  async recalculateBookingTotal(id: number): Promise<number> {
    const sql = `
      SELECT
        b.PackageID,
        p.Price as package_price,
        COALESCE(SUM(i.Price), 0) as itinerary_total,
        COALESCE(SUM(br.TotalPrice), 0) as rooms_total
      FROM Booking b
      JOIN Package p ON b.PackageID = p.PackageID
      LEFT JOIN ItineraryItem i ON b.BookingID = i.BookingID AND i.Status != 'Cancelled'
      LEFT JOIN BookingRoom br ON i.ItineraryItemID = br.ItineraryItemID AND br.Status != 'Cancelled'
      WHERE b.BookingID = ?
      GROUP BY b.BookingID
    `;

    const [rows] = await db.query(sql, [id]);
    const result = rows[0];

    if (!result) {
      throw new Error('Booking not found');
    }

    const total = result.package_price + result.itinerary_total + result.rooms_total;

    // Update booking with new total
    await db.update('Booking', { TotalAmount: total }, 'BookingID = ?', [id]);

    return total;
  }

  // Get booking itinerary details
  async getBookingItinerary(bookingId: number) {
    const sql = `
      SELECT
        i.*,
        s.Name as SupplierName, s.Type as SupplierType,
        fs.FlightNumber, fs.Airline, fs.DepartureCity, fs.ArrivalCity,
        fs.DepartureTime, fs.ArrivalTime, fs.SeatClass,
        hr.RoomNumber, hr.RoomType,
        br.CheckInDate, br.CheckOutDate, br.NumberOfRooms, br.GuestNames
      FROM ItineraryItem i
      LEFT JOIN Supplier s ON i.SupplierID = s.SupplierID
      LEFT JOIN FlightSegment fs ON i.ItineraryItemID = fs.ItineraryItemID
      LEFT JOIN BookingRoom br ON i.ItineraryItemID = br.ItineraryItemID
      LEFT JOIN HotelRoom hr ON br.RoomID = hr.RoomID
      WHERE i.BookingID = ?
      ORDER BY i.StartDate ASC
    `;

    const [rows] = await db.query(sql, [bookingId]);
    return rows;
  }

  // Get customer bookings
  async getCustomerBookings(customerId: number, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const sql = `
      SELECT b.*,
             p.Title as PackageTitle, p.Destination, p.Country,
             (b.TotalAmount - COALESCE(SUM(pay.PaidAmount), 0)) as outstanding_balance,
             COALESCE(SUM(pay.PaidAmount), 0) as total_paid
      FROM Booking b
      JOIN Package p ON b.PackageID = p.PackageID
      LEFT JOIN Payment pay ON b.BookingID = pay.BookingID AND pay.Status = 'Completed'
      WHERE b.CustomerID = ?
      GROUP BY b.BookingID
      ORDER BY b.CreatedAt DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.query(sql, [customerId, limit, offset]);

    // Get total count
    const total = await db.count('Booking', 'CustomerID = ?', [customerId]);

    return {
      bookings: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Get agent bookings
  async getAgentBookings(agentId: number, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const sql = `
      SELECT b.*,
             c.FirstName, c.LastName, c.Email,
             p.Title as PackageTitle, p.Destination,
             (b.TotalAmount - COALESCE(SUM(pay.PaidAmount), 0)) as outstanding_balance,
             COALESCE(SUM(pay.PaidAmount), 0) as total_paid
      FROM Booking b
      JOIN Customer c ON b.CustomerID = c.CustomerID
      JOIN Package p ON b.PackageID = p.PackageID
      LEFT JOIN Payment pay ON b.BookingID = pay.BookingID AND pay.Status = 'Completed'
      WHERE b.AgentID = ?
      GROUP BY b.BookingID
      ORDER BY b.CreatedAt DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.query(sql, [agentId, limit, offset]);

    // Get total count
    const total = await db.count('Booking', 'AgentID = ?', [agentId]);

    return {
      bookings: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

export const bookingService = new BookingService();