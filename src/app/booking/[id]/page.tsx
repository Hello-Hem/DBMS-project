'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  MapPin,
  Calendar,
  DollarSign,
  CreditCard,
  FileText,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  Plane,
  Users,
  Phone,
  Mail,
  Print,
  Download
} from 'lucide-react';

interface BookingDetails {
  BookingID: number;
  BookingReference: string;
  CustomerName: string;
  CustomerEmail: string;
  CustomerPhone: string;
  AgentName?: string;
  PackageTitle: string;
  Destination?: string;
  TravelStartDate: string;
  TravelEndDate: string;
  NumTravellers: number;
  TotalAmount: number;
  PaidAmount: number;
  OutstandingBalance: number;
  Status: string;
  SpecialRequests?: string;
  CreatedAt: string;
}

export default function BookingDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (params.id) {
      fetchBookingDetails(params.id as string);
    }
  }, [session, status, router, params.id]);

  const fetchBookingDetails = async (bookingId: string) => {
    try {
      setLoading(true);

      // Mock booking data for now
      const mockBooking: BookingDetails = {
        BookingID: parseInt(bookingId),
        BookingReference: `TA${bookingId.padStart(4, '0')}`,
        CustomerName: 'John Doe',
        CustomerEmail: 'john@example.com',
        CustomerPhone: '+1234567890',
        AgentName: 'Sarah Johnson',
        PackageTitle: 'Paris Adventure',
        Destination: 'Paris, France',
        TravelStartDate: '2024-06-15',
        TravelEndDate: '2024-06-22',
        NumTravellers: 2,
        TotalAmount: 4998,
        PaidAmount: 2499,
        OutstandingBalance: 2499,
        Status: 'Confirmed',
        SpecialRequests: 'Vegetarian meals requested',
        CreatedAt: new Date().toISOString()
      };

      setBooking(mockBooking);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h1>
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center text-blue-600 hover:text-blue-800">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.print()}
                className="flex items-center text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium"
              >
                <Print className="w-4 h-4 mr-1" />
                Print
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Booking Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Booking #{booking.BookingReference}
              </h1>
              <div className="flex items-center space-x-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.Status)}`}>
                  {getStatusIcon(booking.Status)}
                  <span className="ml-1">{booking.Status}</span>
                </span>
                <span className="text-gray-500">Created on {formatDate(booking.CreatedAt)}</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {booking.OutstandingBalance > 0 && (
                <Link
                  href={`/booking/${booking.BookingID}/payment`}
                  className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Make Payment
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-xl font-semibold text-gray-900">{formatCurrency(booking.TotalAmount)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Paid Amount</p>
                <p className="text-xl font-semibold text-green-600">{formatCurrency(booking.PaidAmount)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Outstanding Balance</p>
                <p className="text-xl font-semibold text-yellow-600">{formatCurrency(booking.OutstandingBalance)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Package Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Plane className="w-5 h-5 mr-2" />
                Package Details
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{booking.PackageTitle}</h3>
                  {booking.Destination && (
                    <div className="flex items-center text-gray-600 mt-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      {booking.Destination}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Start Date</p>
                      <p className="text-gray-900">{formatDate(booking.TravelStartDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">End Date</p>
                      <p className="text-gray-900">{formatDate(booking.TravelEndDate)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Special Requests */}
            {booking.SpecialRequests && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Special Requests</h2>
                <p className="text-gray-600">{booking.SpecialRequests}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Customer Information
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Name</p>
                  <p className="text-gray-900">{booking.CustomerName}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-900">{booking.CustomerEmail}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-900">{booking.CustomerPhone}</p>
                </div>
              </div>
            </div>

            {/* Agent Information */}
            {booking.AgentName && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Agent Information
                </h2>
                <p className="text-gray-900">{booking.AgentName}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
