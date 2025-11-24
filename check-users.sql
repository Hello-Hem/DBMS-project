-- Quick manual test to verify users exist
-- Run: mysql -u root -p < check-users.sql
-- Password: SQL@1234

USE travel_agency;

-- Check if tables exist
SHOW TABLES;

-- Check Customer table
SELECT 'CUSTOMER TABLE' as Check_Type;
SELECT CustomerID, Email, FirstName, LastName, Status, 
       SUBSTRING(PasswordHash, 1, 20) as PasswordHash_Start
FROM Customer 
WHERE Email IN ('customer@travel.com', 'jane.smith@example.com', 'michael.j@example.com');

-- Check Agent table
SELECT 'AGENT TABLE' as Check_Type;
SELECT AgentID, Email, FirstName, LastName, Status,
       SUBSTRING(PasswordHash, 1, 20) as PasswordHash_Start
FROM Agent 
WHERE Email IN ('agent@travel.com', 'david.brown@travel.com', 'emily.davis@travel.com');

-- Check Admin table
SELECT 'ADMIN TABLE' as Check_Type;
SELECT AdminID, Email, FirstName, LastName, Status,
       SUBSTRING(PasswordHash, 1, 20) as PasswordHash_Start
FROM Admin 
WHERE Email IN ('admin@travel.com', 'manager@travel.com');
