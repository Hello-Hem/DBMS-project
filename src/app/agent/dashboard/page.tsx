'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Briefcase,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  Plus,
  LogOut,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye
} from 'lucide-react';

interface AgentBooking {
  BookingID: number;
  BookingReference: string;
  PackageTitle: string;
  Destination?: string;
  TravelStartDate: string;
  TravelEndDate: string;
  NumTravellers: number;
  TotalAmount: number;
  Status: string;
  outstanding_balance: number;
  FirstName: string;
  LastName: string;
  Email: string;
  CreatedAt: string;
}

interface AgentStats {
  total_bookings: number;
  total_revenue: number;
  confirmed_bookings: number;
  upcoming_trips: number;
  bookings_this_month: number;
}

export default function AgentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [bookings, setBookings] = useState<AgentBooking[]>([]);
  const [stats, setStats] = useState<AgentStats | null>(null);
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
    if (session?.user?.role !== 'agent' && session?.user?.role !== 'admin') {
      router.push('/login');
      return;
    }

    fetchDashboardData();
  }, [session, status, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Mock agent bookings data
      const mockBookings: AgentBooking[] = [
        {
          BookingID: 10001,
          BookingReference: 'TA2024001',
          PackageTitle: 'Paris Adventure',
          Destination: 'Paris, France',
          TravelStartDate: '2024-06-15',
          TravelEndDate: '2024-06-22',
          NumTravellers: 2,
          TotalAmount: 4998,
          Status: 'Confirmed',
          outstanding_balance: 0,
          FirstName: 'Alice',
          LastName: 'Johnson',
          Email: 'alice@example.com',
          CreatedAt: new Date().toISOString()
        },
        {
          BookingID: 10002,
          BookingReference: 'TA2024002',
          PackageTitle: 'Tokyo Explorer',
          Destination: 'Tokyo, Japan',
          TravelStartDate: '2024-07-10',
          TravelEndDate: '2024-07-20',
          NumTravellers: 3,
          TotalAmount: 9897,
          Status: 'Pending',
          outstanding_balance: 9897,
          FirstName: 'Bob',
          LastName: 'Smith',
          Email: 'bob@example.com',
          CreatedAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          BookingID: 10003,
          BookingReference: 'TA2024003',
          PackageTitle: 'Bali Retreat',
          Destination: 'Bali, Indonesia',
          TravelStartDate: '2024-08-05',
          TravelEndDate: '2024-08-15',
          NumTravellers: 2,
          TotalAmount: 3298,
          Status: 'Confirmed',
          outstanding_balance: 1649,
          FirstName: 'Carol',
          LastName: 'Davis',
          Email: 'carol@example.com',
          CreatedAt: new Date(Date.now() - 172800000).toISOString()
        }
      ];

      setBookings(mockBookings);

      // Calculate mock stats
      const calculatedStats: AgentStats = {
        total_bookings: mockBookings.length,
        total_revenue: mockBookings.reduce((sum, booking) => sum + booking.TotalAmount, 0),
        confirmed_bookings: mockBookings.filter(b => b.Status === 'Confirmed').length,
        upcoming_trips: mockBookings.filter(b => b.Status === 'Confirmed' && new Date(b.TravelStartDate) > new Date()).length,
        bookings_this_month: mockBookings.filter(b => new Date(b.CreatedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length
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
      case 'Confirmed':
      case 'Completed': return <CheckCircle className="w-4 h-4" />;
      case 'Pending': return <Clock className="w-4 h-4" />;
      case 'Cancelled': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.PackageTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.BookingReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (booking.Destination && booking.Destination.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         booking.FirstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.LastName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || booking.Status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
              <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                Switch to Customer View
              </Link>
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-700">
                  Agent: {session.user.name}
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
          <h1 className="text-3xl font-bold text-gray-900">Agent Dashboard</h1>
          <p className="text-lg text-gray-600">Manage bookings and track your performance</p>
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
                  <Briefcase className="h-6 w-6 text-blue-600" />
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
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-semibold text-gray-900">${stats.total_revenue.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                  <Users className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.bookings_this_month}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Confirmation Rate</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.total_bookings > 0 ? Math.round((stats.confirmed_bookings / stats.total_bookings) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/agent/booking/quick"
              className="flex items-center justify-center bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Quick Booking
            </Link>
            <Link
              href="/agent/customers"
              className="flex items-center justify-center bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 transition-colors"
            >
              <Users className="w-5 h-5 mr-2" />
              Manage Customers
            </Link>
            <Link
              href="/agent/reports"
              className="flex items-center justify-center bg-purple-600 text-white px-4 py-3 rounded-md hover:bg-purple-700 transition-colors"
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              View Reports
            </Link>
          </div>
        </div>

        {/* Bookings List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Your Bookings</h2>
              <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
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
                  <option value="Confirmed">Confirmed</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Completed">Completed</option>
                </select>
                <Link
                  href="/packages"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Create Booking
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
                    Customer
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
                    <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                      {searchTerm || statusFilter !== 'all' ? 'No bookings match your criteria' : 'No bookings found'}
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr key={booking.BookingID} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {booking.BookingReference}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.FirstName} {booking.LastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{booking.PackageTitle}</div>
                          {booking.Destination && (
                            <div className="text-sm text-gray-500">{booking.Destination}</div>
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
                          <Eye className="w-4 h-4" />
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