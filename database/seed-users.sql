-- Seed initial users for testing
-- Passwords are hashed using bcrypt with salt rounds = 10
-- All test passwords: 'password123'
-- Password hashes generated: November 24, 2025

USE travel_agency;

-- Insert test customers
INSERT INTO Customer (FirstName, LastName, Email, Phone, PasswordHash, Address, City, Country, PostalCode, Status) VALUES
('John', 'Doe', 'customer@travel.com', '+1-555-0101', '$2b$10$qRXJ7efiAZlI/XBDcmeJc.R2yZ50CfDrvIXA65WaFCSME1RNDdERu', '123 Main St', 'New York', 'USA', '10001', 'Active'),
('Jane', 'Smith', 'jane.smith@example.com', '+1-555-0102', '$2b$10$qRXJ7efiAZlI/XBDcmeJc.R2yZ50CfDrvIXA65WaFCSME1RNDdERu', '456 Oak Ave', 'Los Angeles', 'USA', '90001', 'Active'),
('Michael', 'Johnson', 'michael.j@example.com', '+1-555-0103', '$2b$10$qRXJ7efiAZlI/XBDcmeJc.R2yZ50CfDrvIXA65WaFCSME1RNDdERu', '789 Pine Rd', 'Chicago', 'USA', '60601', 'Active');

-- Insert test agents
INSERT INTO Agent (FirstName, LastName, Email, Phone, PasswordHash, Department, CommissionRate, HireDate, Status) VALUES
('Sarah', 'Williams', 'agent@travel.com', '+1-555-0201', '$2b$10$sx8rrsPn/gxAJQwv4FpJeePsSmPtvPEXWuEXz/48VLz6wfaGhr0FK', 'Sales', 10.00, '2023-01-15', 'Active'),
('David', 'Brown', 'david.brown@travel.com', '+1-555-0202', '$2b$10$sx8rrsPn/gxAJQwv4FpJeePsSmPtvPEXWuEXz/48VLz6wfaGhr0FK', 'Customer Service', 8.50, '2023-03-20', 'Active'),
('Emily', 'Davis', 'emily.davis@travel.com', '+1-555-0203', '$2b$10$sx8rrsPn/gxAJQwv4FpJeePsSmPtvPEXWuEXz/48VLz6wfaGhr0FK', 'International', 12.00, '2022-11-10', 'Active');

-- Insert test admins
INSERT INTO Admin (FirstName, LastName, Email, PasswordHash, Role, Status) VALUES
('Admin', 'User', 'admin@travel.com', '$2b$10$bXiIKp5S3k0AZUL69AWJuezeU5lMdE7X9OA3wkmxvlriW3IV4iuk2', 'SuperAdmin', 'Active'),
('Manager', 'Smith', 'manager@travel.com', '$2b$10$bXiIKp5S3k0AZUL69AWJuezeU5lMdE7X9OA3wkmxvlriW3IV4iuk2', 'Manager', 'Active');

-- Display seeded users
SELECT 'CUSTOMERS' as Type, CustomerID as ID, FirstName, LastName, Email, Status FROM Customer
UNION ALL
SELECT 'AGENTS' as Type, AgentID as ID, FirstName, LastName, Email, Status FROM Agent
UNION ALL
SELECT 'ADMINS' as Type, AdminID as ID, FirstName, LastName, Email, Status FROM Admin
ORDER BY Type, ID;

-- Test credentials for reference:
-- Customer: customer@travel.com / password123
-- Agent: agent@travel.com / password123
-- Admin: admin@travel.com / password123
