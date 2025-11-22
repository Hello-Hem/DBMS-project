// Mock database for development without actual database connection
export async function testConnection(): Promise<boolean> {
  return true; // Mock successful connection
}

// Mock query function
export async function query<T = any>(
  sql: string,
  params?: any[]
): Promise<[T[], any]> {
  // Return empty arrays for now
  return [[], []];
}

// Mock customer data
export const mockCustomers = [
  {
    CustomerID: 1001,
    FirstName: 'John',
    LastName: 'Doe',
    Email: 'john.doe@example.com',
    Phone: '+1234567890',
    Status: 'Active',
    CreatedAt: new Date().toISOString()
  },
  {
    CustomerID: 1002,
    FirstName: 'Jane',
    LastName: 'Smith',
    Email: 'jane.smith@example.com',
    Phone: '+0987654321',
    Status: 'Active',
    CreatedAt: new Date().toISOString()
  }
];

// Mock package data
export const mockPackages = [
  {
    PackageID: 2001,
    Title: 'Paris Adventure',
    Description: 'Experience the city of lights with our comprehensive Paris package',
    StartDate: '2024-06-15',
    EndDate: '2024-06-22',
    Price: 2499,
    Capacity: 20,
    Destination: 'Paris, France',
    Country: 'France',
    ImageURL: null,
    Featured: true,
    Status: 'Active',
    CreatedAt: new Date().toISOString()
  },
  {
    PackageID: 2002,
    Title: 'Tokyo Explorer',
    Description: 'Discover the perfect blend of modern and traditional Japan',
    StartDate: '2024-07-10',
    EndDate: '2024-07-20',
    Price: 3299,
    Capacity: 15,
    Destination: 'Tokyo, Japan',
    Country: 'Japan',
    ImageURL: null,
    Featured: false,
    Status: 'Active',
    CreatedAt: new Date().toISOString()
  }
];

// Mock booking data
export const mockBookings = [
  {
    BookingID: 10001,
    BookingReference: 'TA2024001',
    CustomerID: 1001,
    PackageID: 2001,
    PackageTitle: 'Paris Adventure',
    Destination: 'Paris, France',
    TravelStartDate: '2024-06-15',
    TravelEndDate: '2024-06-22',
    NumTravellers: 2,
    TotalAmount: 4998,
    Status: 'Confirmed',
    PaymentStatus: 'Paid',
    outstanding_balance: 0,
    total_paid: 4998,
    FirstName: 'John',
    LastName: 'Doe',
    Email: 'john.doe@example.com',
    CreatedAt: new Date().toISOString()
  }
];

export const db = {
  findOne: async <T>(table: string, where: string, params: any[] = []): Promise<T | null> => {
    if (table === 'Customer' && where.includes('Email = ?')) {
      const email = params[0];
      const customer = mockCustomers.find(c => c.Email === email);
      return customer as T || null;
    }
    return null;
  },

  findMany: async <T>(table: string, where: string = '1=1', params: any[] = []): Promise<T[]> => {
    if (table === 'Customer') {
      return mockCustomers as T[];
    }
    if (table === 'Package') {
      return mockPackages.map(p => ({
        ...p,
        capacity_left: Math.floor(Math.random() * 10) + 5,
        booked_capacity: 15 - Math.floor(Math.random() * 10) + 5
      })) as T[];
    }
    return [];
  },

  insert: async (table: string, data: Record<string, any>): Promise<{ insertId: number }> => {
    return { insertId: Math.floor(Math.random() * 10000) + 1000 };
  },

  update: async (table: string, data: Record<string, any>, where: string, params: any[] = []): Promise<{ affectedRows: number }> => {
    return { affectedRows: 1 };
  },

  count: async (table: string, where: string = '1=1', params: any[] = []): Promise<number> => {
    if (table === 'Customer') return mockCustomers.length;
    if (table === 'Package') return mockPackages.length;
    if (table === 'Booking') return mockBookings.length;
    return 0;
  }
};