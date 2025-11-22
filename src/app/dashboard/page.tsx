'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  CreditCard,
  MapPin,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  User,
  LogOut,
  Search,
  Filter
} from 'lucide-react';

interface Booking {
  BookingID: number;
  BookingReference: string;
  PackageTitle: string;
  Destination?: string;
  TravelStartDate: string;
  TravelEndDate: string;
  TotalAmount: number;
  Status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';
  outstanding_balance: number;
  total_paid: number;
  NumTravellers: number;
}

interface CustomerStats {
  total_bookings: number;
  total_spent: number;
  confirmed_bookings: number;
  upcoming_trips: number;
  outstanding_balance: number;
}

export default function CustomerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (session?.user?.role !== 'customer') {
      router.push('/login');
      return;
    }

    fetchDashboardData();
  }, [session, status, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [bookingsResponse, statsResponse] = await Promise.all([
        fetch('/api/bookings?type=customer'),
        fetch('/api/bookings?type=customer') // Using same endpoint for now
      ]);

      if (!bookingsResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const bookingsData = await bookingsResponse.json();
      const statsData = await statsResponse.json();

      setBookings(bookingsData.bookings || []);

      // Calculate stats from bookings
      const calculatedStats: CustomerStats = {
        total_bookings: bookingsData.bookings?.length || 0,
        total_spent: bookingsData.bookings?.reduce((sum: number, booking: Booking) =>
          booking.Status !== 'Cancelled' ? sum + booking.total_paid : sum, 0) || 0,
        confirmed_bookings: bookingsData.bookings?.filter((b: Booking) => b.Status === 'Confirmed').length || 0,
        upcoming_trips: bookingsData.bookings?.filter((b: Booking) =>
          b.Status === 'Confirmed' && new Date(b.TravelStartDate) > new Date()).length || 0,
        outstanding_balance: bookingsData.bookings?.reduce((sum: number, booking: Booking) =>
          booking.Status !== 'Cancelled' ? sum + booking.outstanding_balance : sum, 0) || 0
      };

      setStats(calculatedStats);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'text-green-600 bg-green-100';
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'Cancelled': return 'text-red-600 bg-red-100';
      case 'Completed': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'Pending': return <Clock className="w-4 h-4" />;
      case 'Cancelled': return <AlertCircle className="w-4 h-4" />;
      case 'Completed': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.PackageTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.BookingReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (booking.Destination && booking.Destination.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || booking.Status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const upcomingTrips = bookings.filter(booking =>
    booking.Status === 'Confirmed' && new Date(booking.TravelStartDate) > new Date()
  );

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-blue-600">TravelHub</Link>
            <nav className="flex items-center space-x-6">
              <Link href="/packages" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                Browse Packages
              </Link>
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-700">
                  Welcome, {session.user.name}
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Sign Out
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-lg text-gray-600">Manage your bookings and travel plans</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total_bookings}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Spent</p>
                  <p className="text-2xl font-semibold text-gray-900">${stats.total_spent.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                  <Users className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Upcoming Trips</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.upcoming_trips}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-100 rounded-lg p-3">
                  <CreditCard className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Outstanding Balance</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    ${stats.outstanding_balance.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Trips */}
        {upcomingTrips.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Trips</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingTrips.slice(0, 6).map((trip) => (
                  <div key={trip.BookingID} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{trip.PackageTitle}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.Status)}`}>
                        {trip.Status}
                      </span>
                    </div>
                    {trip.Destination && (
                      <p className="text-sm text-gray-600 mb-2 flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {trip.Destination}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mb-2">
                      {formatDate(trip.TravelStartDate)} - {formatDate(trip.TravelEndDate)}
                    </p>
                    <Link
                      href={`/booking/${trip.BookingID}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bookings List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-0">Your Bookings</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search bookings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Completed">Completed</option>
                </select>
                <Link
                  href="/packages"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Book New Trip
                </Link>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Package
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Travel Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Outstanding
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      {searchTerm || statusFilter !== 'all' ? 'No bookings match your criteria' : 'No bookings found'}
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr key={booking.BookingID} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {booking.BookingReference}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{booking.PackageTitle}</div>
                          {booking.Destination && (
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <MapPin className="w-3 h-3 mr-1" />
                              {booking.Destination}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(booking.TravelStartDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.Status)}`}>
                          {getStatusIcon(booking.Status)}
                          <span className="ml-1">{booking.Status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${booking.TotalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={booking.outstanding_balance > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                          ${booking.outstanding_balance.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/booking/${booking.BookingID}`}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          View
                        </Link>
                        {booking.outstanding_balance > 0 && (
                          <Link
                            href={`/booking/${booking.BookingID}/payment`}
                            className="text-green-600 hover:text-green-900"
                          >
                            Pay
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}