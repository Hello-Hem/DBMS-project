-- Travel Agency Database Schema
-- Complete database setup for travel agency management system

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS travel_agency CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE travel_agency;

-- Customers table - stores customer information and authentication
CREATE TABLE Customer (
    CustomerID INT AUTO_INCREMENT PRIMARY KEY,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    Email VARCHAR(255) UNIQUE NOT NULL,
    Phone VARCHAR(20),
    PasswordHash VARCHAR(255) NOT NULL,
    Address TEXT,
    City VARCHAR(100),
    Country VARCHAR(100),
    PostalCode VARCHAR(20),
    DateOfBirth DATE,
    EmergencyContactName VARCHAR(100),
    EmergencyContactPhone VARCHAR(20),
    Status ENUM('Active', 'Inactive', 'Suspended') DEFAULT 'Active',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_customer_email (Email),
    INDEX idx_customer_status (Status)
);

-- Agents table - travel agent information
CREATE TABLE Agent (
    AgentID INT AUTO_INCREMENT PRIMARY KEY,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    Email VARCHAR(255) UNIQUE NOT NULL,
    Phone VARCHAR(20),
    PasswordHash VARCHAR(255) NOT NULL,
    Department VARCHAR(100),
    CommissionRate DECIMAL(5,2) DEFAULT 0.00,
    Status ENUM('Active', 'Inactive', 'Suspended') DEFAULT 'Active',
    HireDate DATE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_agent_email (Email),
    INDEX idx_agent_status (Status)
);

-- Admin table - admin users (can extend from existing auth structure)
CREATE TABLE Admin (
    AdminID INT AUTO_INCREMENT PRIMARY KEY,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    Email VARCHAR(255) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    Role ENUM('SuperAdmin', 'Admin', 'Manager') DEFAULT 'Admin',
    Permissions JSON,
    Status ENUM('Active', 'Inactive') DEFAULT 'Active',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_admin_email (Email),
    INDEX idx_admin_status (Status)
);

-- Suppliers table - external suppliers (hotels, airlines, activities)
CREATE TABLE Supplier (
    SupplierID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Type ENUM('Hotel', 'Airline', 'Transport', 'Activity', 'Restaurant', 'Other') NOT NULL,
    Description TEXT,
    ContactPerson VARCHAR(100),
    Email VARCHAR(255),
    Phone VARCHAR(20),
    Address TEXT,
    City VARCHAR(100),
    Country VARCHAR(100),
    PostalCode VARCHAR(20),
    Website VARCHAR(255),
    Rating DECIMAL(3,2) DEFAULT 0.00,
    Status ENUM('Active', 'Inactive') DEFAULT 'Active',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_supplier_type (Type),
    INDEX idx_supplier_status (Status)
);

-- Hotel rooms available from suppliers
CREATE TABLE HotelRoom (
    RoomID INT AUTO_INCREMENT PRIMARY KEY,
    SupplierID INT NOT NULL,
    RoomNumber VARCHAR(20) NOT NULL,
    RoomType ENUM('Single', 'Double', 'Twin', 'Suite', 'Deluxe', 'Family') NOT NULL,
    Capacity INT NOT NULL DEFAULT 1,
    PricePerNight DECIMAL(10,2) NOT NULL,
    Amenities JSON,
    TotalRooms INT DEFAULT 1,
    Status ENUM('Available', 'Unavailable', 'Maintenance') DEFAULT 'Available',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (SupplierID) REFERENCES Supplier(SupplierID) ON DELETE CASCADE,
    INDEX idx_hotelroom_supplier (SupplierID),
    INDEX idx_hotelroom_type (RoomType),
    INDEX idx_hotelroom_status (Status)
);

-- Packages table - travel packages with capacity and pricing
CREATE TABLE Package (
    PackageID INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(255) NOT NULL,
    Description TEXT,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    Capacity INT NOT NULL,
    Destination VARCHAR(255),
    Country VARCHAR(100),
    ImageURL VARCHAR(500),
    Inclusions JSON,
    Exclusions JSON,
    ItineraryTemplate JSON,
    Featured BOOLEAN DEFAULT FALSE,
    Status ENUM('Active', 'Inactive', 'SoldOut', 'Cancelled') DEFAULT 'Active',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (Destination) REFERENCES Country(Country),
    INDEX idx_package_dates (StartDate, EndDate),
    INDEX idx_package_status (Status),
    INDEX idx_package_destination (Destination),
    INDEX idx_package_featured (Featured)
);

-- Countries table for destinations
CREATE TABLE Country (
    Country VARCHAR(100) PRIMARY KEY,
    CountryName VARCHAR(100) NOT NULL,
    Continent VARCHAR(50),
    Currency VARCHAR(10),
    Language VARCHAR(100),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PackageSupplier table - link packages to suppliers
CREATE TABLE PackageSupplier (
    PackageSupplierID INT AUTO_INCREMENT PRIMARY KEY,
    PackageID INT NOT NULL,
    SupplierID INT NOT NULL,
    Role ENUM('Accommodation', 'Transport', 'Activities', 'Meals', 'Guide') NOT NULL,
    Notes TEXT,
    CostPerPerson DECIMAL(10,2),
    Status ENUM('Active', 'Inactive') DEFAULT 'Active',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (PackageID) REFERENCES Package(PackageID) ON DELETE CASCADE,
    FOREIGN KEY (SupplierID) REFERENCES Supplier(SupplierID) ON DELETE CASCADE,
    INDEX idx_packagesupplier_package (PackageID),
    INDEX idx_packagesupplier_supplier (SupplierID),
    UNIQUE KEY unique_package_supplier_role (PackageID, SupplierID, Role)
);

-- Bookings table - customer bookings with status tracking
CREATE TABLE Booking (
    BookingID INT AUTO_INCREMENT PRIMARY KEY,
    CustomerID INT NOT NULL,
    PackageID INT NOT NULL,
    AgentID INT,
    BookingReference VARCHAR(20) UNIQUE NOT NULL,
    NumTravellers INT NOT NULL,
    TravelStartDate DATE NOT NULL,
    TravelEndDate DATE NOT NULL,
    TotalAmount DECIMAL(10,2) NOT NULL,
    DepositAmount DECIMAL(10,2) DEFAULT 0.00,
    Status ENUM('Pending', 'Confirmed', 'Cancelled', 'Completed', 'Refunded') DEFAULT 'Pending',
    SpecialRequests TEXT,
    PaymentStatus ENUM('Unpaid', 'Partial', 'Paid', 'Refunded') DEFAULT 'Unpaid',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID) ON DELETE RESTRICT,
    FOREIGN KEY (PackageID) REFERENCES Package(PackageID) ON DELETE RESTRICT,
    FOREIGN KEY (AgentID) REFERENCES Agent(AgentID) ON DELETE SET NULL,
    INDEX idx_booking_customer (CustomerID),
    INDEX idx_booking_package (PackageID),
    INDEX idx_booking_agent (AgentID),
    INDEX idx_booking_status (Status),
    INDEX idx_booking_dates (TravelStartDate, TravelEndDate),
    INDEX idx_booking_reference (BookingReference)
);

-- Payment table - payment records with transaction references
CREATE TABLE Payment (
    PaymentID INT AUTO_INCREMENT PRIMARY KEY,
    BookingID INT NOT NULL,
    PaymentDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PaidAmount DECIMAL(10,2) NOT NULL,
    Method ENUM('Credit Card', 'Bank Transfer', 'PayPal', 'Cash', 'Check', 'Refund') NOT NULL,
    TransactionRef VARCHAR(100),
    Status ENUM('Pending', 'Completed', 'Failed', 'Refunded') DEFAULT 'Completed',
    Notes TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (BookingID) REFERENCES Booking(BookingID) ON DELETE CASCADE,
    INDEX idx_payment_booking (BookingID),
    INDEX idx_payment_method (Method),
    INDEX idx_payment_status (Status),
    INDEX idx_payment_transaction (TransactionRef)
);

-- Itinerary items for bookings
CREATE TABLE ItineraryItem (
    ItineraryItemID INT AUTO_INCREMENT PRIMARY KEY,
    BookingID INT NOT NULL,
    ItemType ENUM('Flight', 'Hotel', 'Activity', 'Transport', 'Meal', 'Other') NOT NULL,
    Title VARCHAR(255) NOT NULL,
    Description TEXT,
    StartDate DATETIME,
    EndDate DATETIME,
    Location VARCHAR(255),
    Price DECIMAL(10,2) DEFAULT 0.00,
    SupplierID INT,
    Status ENUM('Confirmed', 'Pending', 'Cancelled') DEFAULT 'Pending',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (BookingID) REFERENCES Booking(BookingID) ON DELETE CASCADE,
    FOREIGN KEY (SupplierID) REFERENCES Supplier(SupplierID) ON DELETE SET NULL,
    INDEX idx_itinerary_booking (BookingID),
    INDEX idx_itinerary_type (ItemType),
    INDEX idx_itinerary_status (Status),
    INDEX idx_itinerary_supplier (SupplierID)
);

-- Flight segments for detailed flight information
CREATE TABLE FlightSegment (
    FlightSegmentID INT AUTO_INCREMENT PRIMARY KEY,
    ItineraryItemID INT NOT NULL,
    FlightNumber VARCHAR(20) NOT NULL,
    Airline VARCHAR(100),
    DepartureCity VARCHAR(255),
    DepartureAirport VARCHAR(10),
    DepartureTime DATETIME NOT NULL,
    ArrivalCity VARCHAR(255),
    ArrivalAirport VARCHAR(10),
    ArrivalTime DATETIME NOT NULL,
    AircraftType VARCHAR(100),
    SeatClass ENUM('Economy', 'Business', 'First') DEFAULT 'Economy',
    Status ENUM('Confirmed', 'Pending', 'Cancelled') DEFAULT 'Pending',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ItineraryItemID) REFERENCES ItineraryItem(ItineraryItemID) ON DELETE CASCADE,
    INDEX idx_flightsegment_itinerary (ItineraryItemID),
    INDEX idx_flightsegment_departure (DepartureTime),
    INDEX idx_flightsegment_arrival (ArrivalTime)
);

-- Room reservations for bookings
CREATE TABLE BookingRoom (
    BookingRoomID INT AUTO_INCREMENT PRIMARY KEY,
    ItineraryItemID INT NOT NULL,
    RoomID INT NOT NULL,
    CheckInDate DATE NOT NULL,
    CheckOutDate DATE NOT NULL,
    NumberOfRooms INT DEFAULT 1,
    PricePerNight DECIMAL(10,2) NOT NULL,
    TotalPrice DECIMAL(10,2) NOT NULL,
    GuestNames JSON,
    SpecialRequests TEXT,
    Status ENUM('Confirmed', 'Pending', 'Cancelled') DEFAULT 'Pending',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ItineraryItemID) REFERENCES ItineraryItem(ItineraryItemID) ON DELETE CASCADE,
    FOREIGN KEY (RoomID) REFERENCES HotelRoom(RoomID) ON DELETE RESTRICT,
    INDEX idx_bookingroom_itinerary (ItineraryItemID),
    INDEX idx_bookingroom_room (RoomID),
    INDEX idx_bookingroom_dates (CheckInDate, CheckOutDate),
    INDEX idx_bookingroom_status (Status)
);

-- Create useful views for reporting

-- View for package availability with capacity calculations
CREATE VIEW view_PackageAvailability AS
SELECT
    p.PackageID,
    p.Title,
    p.StartDate,
    p.EndDate,
    p.Price,
    p.Capacity,
    p.Status,
    COALESCE(SUM(b.NumTravellers), 0) as booked_capacity,
    (p.Capacity - COALESCE(SUM(b.NumTravellers), 0)) as available_capacity,
    ROUND(((p.Capacity - COALESCE(SUM(b.NumTravellers), 0)) / p.Capacity) * 100, 2) as availability_percentage
FROM Package p
LEFT JOIN Booking b ON p.PackageID = b.PackageID
    AND b.Status IN ('Pending', 'Confirmed')
    AND b.TravelStartDate BETWEEN p.StartDate AND p.EndDate
WHERE p.Status = 'Active'
GROUP BY p.PackageID;

-- View for booking outstanding payments
CREATE VIEW view_BookingOutstanding AS
SELECT
    b.BookingID,
    b.BookingReference,
    b.CustomerID,
    b.PackageID,
    b.TotalAmount,
    COALESCE(SUM(p.PaidAmount), 0) as total_paid,
    (b.TotalAmount - COALESCE(SUM(p.PaidAmount), 0)) as outstanding_balance,
    CASE
        WHEN (b.TotalAmount - COALESCE(SUM(p.PaidAmount), 0)) <= 0 THEN 'Fully Paid'
        WHEN (b.TotalAmount - COALESCE(SUM(p.PaidAmount), 0)) <= (b.TotalAmount * 0.1) THEN 'Nearly Paid'
        WHEN (b.TotalAmount - COALESCE(SUM(p.PaidAmount), 0)) <= (b.DepositAmount) THEN 'Deposit Due'
        ELSE 'Payment Outstanding'
    END as payment_status,
    b.Status as booking_status
FROM Booking b
LEFT JOIN Payment p ON b.BookingID = p.BookingID AND p.Status = 'Completed'
WHERE b.Status NOT IN ('Cancelled', 'Refunded')
GROUP BY b.BookingID;

-- Insert initial data
INSERT INTO Country (Country, CountryName, Continent, Currency, Language) VALUES
('US', 'United States', 'North America', 'USD', 'English'),
('GB', 'United Kingdom', 'Europe', 'GBP', 'English'),
('FR', 'France', 'Europe', 'EUR', 'French'),
('IT', 'Italy', 'Europe', 'EUR', 'Italian'),
('ES', 'Spain', 'Europe', 'EUR', 'Spanish'),
('JP', 'Japan', 'Asia', 'JPY', 'Japanese'),
('AU', 'Australia', 'Oceania', 'AUD', 'English'),
('CA', 'Canada', 'North America', 'CAD', 'English'),
('DE', 'Germany', 'Europe', 'EUR', 'German'),
('TH', 'Thailand', 'Asia', 'THB', 'Thai');

-- Create default admin user (password: admin123)
INSERT INTO Admin (FirstName, LastName, Email, PasswordHash, Role, Permissions) VALUES
('System', 'Administrator', 'admin@travelagency.com', '$2a$10$9lVXQjw7xKJ4Q5FyBq.oKOeZ5qF5qF5qF5qF5qF5qF5qF5qF5qF5qF5', 'SuperAdmin', '{"all": true}');

-- Add indexes for performance optimization
CREATE INDEX idx_booking_travel_dates ON Booking(TravelStartDate, TravelEndDate);
CREATE INDEX idx_booking_created_date ON Booking(CreatedAt);
CREATE INDEX idx_payment_date ON Payment(PaymentDate);
CREATE INDEX idx_itinerary_dates ON ItineraryItem(StartDate, EndDate);
CREATE INDEX idx_package_destination_search ON Package(Destination, Country);

-- Set up auto-increment starting values
ALTER TABLE Customer AUTO_INCREMENT = 1000;
ALTER TABLE Agent AUTO_INCREMENT = 100;
ALTER TABLE Admin AUTO_INCREMENT = 10;
ALTER TABLE Supplier AUTO_INCREMENT = 500;
ALTER TABLE Package AUTO_INCREMENT = 2000;
ALTER TABLE Booking AUTO_INCREMENT = 10000;