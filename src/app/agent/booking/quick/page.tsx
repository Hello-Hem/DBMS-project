'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  MapPin,
  Calendar,
  DollarSign,
  Search,
  Plus,
  CheckCircle,
  Plane,
  Users,
  Clock,
  AlertCircle
} from 'lucide-react';

interface Package {
  PackageID: number;
  Title: string;
  Destination: string;
  Duration: number;
  Price: number;
  MaxCapacity: number;
  CurrentBookings: number;
  Status: string;
}

interface Customer {
  CustomerID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
}

export default function QuickBookingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [travelStartDate, setTravelStartDate] = useState('');
  const [travelEndDate, setTravelEndDate] = useState('');
  const [numTravellers, setNumTravellers] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');

  // Search states
  const [packageSearch, setPackageSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  // Data
  const [packages, setPackages] = useState<Package[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated' || session?.user?.role !== 'agent') {
      router.push('/login');
      return;
    }

    fetchData();
  }, [session, status, router]);

  const fetchData = async () => {
    try {
      // Mock packages data
      const mockPackages: Package[] = [
        {
          PackageID: 2001,
          Title: 'Paris Adventure',
          Destination: 'Paris, France',
          Duration: 7,
          Price: 2499,
          MaxCapacity: 20,
          CurrentBookings: 15,
          Status: 'Available'
        },
        {
          PackageID: 2002,
          Title: 'Tokyo Explorer',
          Destination: 'Tokyo, Japan',
          Duration: 10,
          Price: 3299,
          MaxCapacity: 15,
          CurrentBookings: 8,
          Status: 'Available'
        },
        {
          PackageID: 2003,
          Title: 'Bali Retreat',
          Destination: 'Bali, Indonesia',
          Duration: 5,
          Price: 1649,
          MaxCapacity: 25,
          CurrentBookings: 23,
          Status: 'Limited'
        }
      ];

      // Mock customers data
      const mockCustomers: Customer[] = [
        {
          CustomerID: 1001,
          FirstName: 'John',
          LastName: 'Doe',
          Email: 'john@example.com',
          Phone: '+1234567890'
        },
        {
          CustomerID: 1002,
          FirstName: 'Jane',
          LastName: 'Smith',
          Email: 'jane@example.com',
          Phone: '+0987654321'
        }
      ];

      setPackages(mockPackages);
      setCustomers(mockCustomers);
      setLoading(false);
    } catch (err) {
      setError('Failed to load data');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPackage || !selectedCustomer || !travelStartDate || !travelEndDate) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          CustomerID: selectedCustomer.CustomerID,
          PackageID: selectedPackage.PackageID,
          NumTravellers: numTravellers,
          TravelStartDate: travelStartDate,
          TravelEndDate: travelEndDate,
          TotalAmount: selectedPackage.Price * numTravellers,
          SpecialRequests: specialRequests
        })
      });

      if (response.ok) {
        setSuccess(true);
        const data = await response.json();
        setTimeout(() => {
          router.push(`/booking/${data.booking.BookingID}`);
        }, 2000);
      } else {
        throw new Error('Failed to create booking');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Created!</h2>
            <p className="text-gray-600 mb-6">
              The booking has been created successfully. You will be redirected to the booking details.
            </p>
            <Link
              href="/agent/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const filteredPackages = packages.filter(pkg =>
    pkg.Title.toLowerCase().includes(packageSearch.toLowerCase()) ||
    pkg.Destination.toLowerCase().includes(packageSearch.toLowerCase())
  );

  const filteredCustomers = customers.filter(customer =>
    customer.FirstName.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.LastName.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.Email.toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/agent/dashboard" className="flex items-center text-blue-600 hover:text-blue-800">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Quick Booking</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Package Selection */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Plane className="w-5 h-5 mr-2" />
                Select Package
              </h2>
            </div>
            <div className="p-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search packages..."
                  value={packageSearch}
                  onChange={(e) => setPackageSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 max-h-64 overflow-y-auto">
                {filteredPackages.map((pkg) => (
                  <div
                    key={pkg.PackageID}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedPackage?.PackageID === pkg.PackageID
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPackage(pkg)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{pkg.Title}</h3>
                        <p className="text-sm text-gray-600">{pkg.Destination}</p>
                        <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                          <span>{pkg.Duration} days</span>
                          <span>${pkg.Price} per person</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          pkg.Status === 'Available' ? 'text-green-600 bg-green-100' :
                          pkg.Status === 'Limited' ? 'text-yellow-600 bg-yellow-100' :
                          'text-red-600 bg-red-100'
                        }`}>
                          {pkg.Status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {pkg.CurrentBookings}/{pkg.MaxCapacity} booked
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Customer Selection */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Select Customer
              </h2>
            </div>
            <div className="p-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 max-h-64 overflow-y-auto">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.CustomerID}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedCustomer?.CustomerID === customer.CustomerID
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {customer.FirstName} {customer.LastName}
                        </h3>
                        <p className="text-sm text-gray-600">{customer.Email}</p>
                        <p className="text-sm text-gray-500">{customer.Phone}</p>
                      </div>
                      {selectedCustomer?.CustomerID === customer.CustomerID && (
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Booking Details</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="travelStartDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Travel Start Date
                  </label>
                  <input
                    type="date"
                    id="travelStartDate"
                    value={travelStartDate}
                    onChange={(e) => setTravelStartDate(e.target.value)}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="travelEndDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Travel End Date
                  </label>
                  <input
                    type="date"
                    id="travelEndDate"
                    value={travelEndDate}
                    onChange={(e) => setTravelEndDate(e.target.value)}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="numTravellers" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Travellers
                </label>
                <input
                  type="number"
                  id="numTravellers"
                  value={numTravellers}
                  onChange={(e) => setNumTravellers(parseInt(e.target.value) || 1)}
                  min="1"
                  max="10"
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="specialRequests" className="block text-sm font-medium text-gray-700 mb-2">
                  Special Requests (Optional)
                </label>
                <textarea
                  id="specialRequests"
                  rows={3}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any special requests or requirements..."
                />
              </div>

              {selectedPackage && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-900">Total Amount:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ${(selectedPackage.Price * numTravellers).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !selectedPackage || !selectedCustomer}
              className="flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Booking...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Create Booking
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
