'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  FileText,
  CreditCard,
  Edit,
  X,
  Check,
  Clock,
  AlertCircle,
  ChevronLeft,
  Loader2
} from 'lucide-react';

interface Booking {
  BookingID: number;
  BookingReference: string;
  CustomerID: number;
  PackageTitle: string;
  Destination?: string;
  TravelStartDate: string;
  TravelEndDate: string;
  NumTravellers: number;
  TotalAmount: number;
  Status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';
  PaymentStatus: 'Unpaid' | 'Partial' | 'Paid' | 'Refunded';
  SpecialRequests?: string;
  outstanding_balance: number;
  total_paid: number;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone?: string;
  AgentFirstName?: string;
  AgentLastName?: string;
  CreatedAt: string;
}

interface Payment {
  PaymentID: number;
  PaymentDate: string;
  PaidAmount: number;
  Method: string;
  TransactionRef?: string;
  Status: string;
  Notes?: string;
}

interface ItineraryItem {
  ItineraryItemID: number;
  ItemType: string;
  Title: string;
  Description?: string;
  StartDate?: string;
  EndDate?: string;
  Location?: string;
  Price: number;
  Status: string;
  FlightNumber?: string;
  DepartureCity?: string;
  ArrivalCity?: string;
  RoomNumber?: string;
  RoomType?: string;
  CheckInDate?: string;
  CheckOutDate?: string;
}

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');

  const bookingId = params?.id;

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId, status, router]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);

      // Fetch booking details
      const bookingResponse = await fetch(`/api/bookings/${bookingId}`);
      if (!bookingResponse.ok) {
        if (bookingResponse.status === 404) {
          throw new Error('Booking not found');
        }
        if (bookingResponse.status === 403) {
          throw new Error('Access denied');
        }
        throw new Error('Failed to fetch booking details');
      }

      const bookingData = await bookingResponse.json();
      setBooking(bookingData.booking);

      // Fetch payments
      const paymentsResponse = await fetch(`/api/payments?bookingId=${bookingId}`);
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setPayments(paymentsData.payments || []);
      }

      // Fetch itinerary
      const itineraryResponse = await fetch(`/api/bookings/${bookingId}/itinerary`);
      if (itineraryResponse.ok) {
        const itineraryData = await itineraryResponse.json();
        setItinerary(itineraryData.itinerary || []);
      }

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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'text-green-600 bg-green-100';
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'Cancelled': return 'text-red-600 bg-red-100';
      case 'Completed': return 'text-blue-600 bg-blue-100';
      case 'Paid': return 'text-green-600 bg-green-100';
      case 'Partial': return 'text-yellow-600 bg-yellow-100';
      case 'Unpaid': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Confirmed':
      case 'Paid':
      case 'Completed': return <Check className="w-4 h-4" />;
      case 'Pending':
      case 'Partial': return <Clock className="w-4 h-4" />;
      case 'Cancelled':
      case 'Unpaid': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleCancelBooking = async () => {
    if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'Cancelled by customer'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }

      // Refresh booking data
      await fetchBookingDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600 mb-4">{error || 'Booking not found'}</p>
            <Link href="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-700">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
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
            <Link href="/dashboard" className="flex items-center text-blue-600 hover:text-blue-700">
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back to Dashboard
            </Link>
            <div className="text-sm text-gray-600">
              Booking Reference: <span className="font-semibold">{booking.BookingReference}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Booking Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{booking.PackageTitle}</h1>
              {booking.Destination && (
                <p className="text-gray-600 flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  {booking.Destination}
                </p>
              )}
            </div>
            <div className="flex space-x-2 mt-4 sm:mt-0">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.Status)}`}>
                {getStatusIcon(booking.Status)}
                <span className="ml-1">{booking.Status}</span>
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.PaymentStatus)}`}>
                {getStatusIcon(booking.PaymentStatus)}
                <span className="ml-1">{booking.PaymentStatus}</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center text-gray-600">
              <Calendar className="w-5 h-5 mr-2" />
              <div>
                <p className="text-xs">Travel Dates</p>
                <p className="font-medium">{formatDate(booking.TravelStartDate)}</p>
              </div>
            </div>
            <div className="flex items-center text-gray-600">
              <Users className="w-5 h-5 mr-2" />
              <div>
                <p className="text-xs">Travelers</p>
                <p className="font-medium">{booking.NumTravellers}</p>
              </div>
            </div>
            <div className="flex items-center text-gray-600">
              <DollarSign className="w-5 h-5 mr-2" />
              <div>
                <p className="text-xs">Total Amount</p>
                <p className="font-medium">${booking.TotalAmount.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center text-gray-600">
              <CreditCard className="w-5 h-5 mr-2" />
              <div>
                <p className="text-xs">Outstanding</p>
                <p className={`font-medium ${booking.outstanding_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ${booking.outstanding_balance.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {['details', 'payments', 'itinerary'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500">Booking Reference</p>
                      <p className="font-medium">{booking.BookingReference}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Created Date</p>
                      <p className="font-medium">{formatDate(booking.CreatedAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Travel Dates</p>
                      <p className="font-medium">{formatDate(booking.TravelStartDate)} - {formatDate(booking.TravelEndDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Number of Travelers</p>
                      <p className="font-medium">{booking.NumTravellers}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Amount</p>
                      <p className="font-medium">${booking.TotalAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Outstanding Balance</p>
                      <p className={`font-medium ${booking.outstanding_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ${booking.outstanding_balance.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">{booking.FirstName} {booking.LastName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{booking.Email}</p>
                    </div>
                    {booking.Phone && (
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{booking.Phone}</p>
                      </div>
                    )}
                    {booking.AgentFirstName && (
                      <div>
                        <p className="text-sm text-gray-500">Travel Agent</p>
                        <p className="font-medium">{booking.AgentFirstName} {booking.AgentLastName}</p>
                      </div>
                    )}
                  </div>
                </div>

                {booking.SpecialRequests && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Special Requests</h3>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{booking.SpecialRequests}</p>
                  </div>
                )}

                {booking.Status !== 'Cancelled' && booking.Status !== 'Completed' && (
                  <div className="flex space-x-4 pt-4 border-t">
                    {booking.outstanding_balance > 0 && (
                      <Link
                        href={`/booking/${booking.BookingID}/payment`}
                        className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
                      >
                        Make Payment
                      </Link>
                    )}
                    <button
                      onClick={handleCancelBooking}
                      className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
                    >
                      Cancel Booking
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
                  {booking.outstanding_balance > 0 && (
                    <Link
                      href={`/booking/${booking.BookingID}/payment`}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Make Payment
                    </Link>
                  )}
                </div>

                {payments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No payments found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {payments.map((payment) => (
                          <tr key={payment.PaymentID}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDateTime(payment.PaymentDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {payment.Method}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              ${payment.PaidAmount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.Status)}`}>
                                {payment.Status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {payment.TransactionRef || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Paid:</span>
                    <span className="font-medium text-green-600">${booking.total_paid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-600">Outstanding Balance:</span>
                    <span className="font-medium text-red-600">${booking.outstanding_balance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t">
                    <span className="font-medium text-gray-900">Total Amount:</span>
                    <span className="font-bold text-gray-900">${booking.TotalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Itinerary Tab */}
            {activeTab === 'itinerary' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Itinerary Details</h3>
                {itinerary.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No itinerary items found</p>
                ) : (
                  <div className="space-y-4">
                    {itinerary.map((item) => (
                      <div key={item.ItineraryItemID} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">{item.Title}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.Status)}`}>
                            {item.Status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{item.Description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Type:</span> {item.ItemType}
                          </div>
                          <div>
                            <span className="text-gray-500">Price:</span> ${item.Price}
                          </div>
                          {item.Location && (
                            <div>
                              <span className="text-gray-500">Location:</span> {item.Location}
                            </div>
                          )}
                          {item.StartDate && (
                            <div>
                              <span className="text-gray-500">Date:</span> {formatDateTime(item.StartDate)}
                            </div>
                          )}
                          {item.FlightNumber && (
                            <div>
                              <span className="text-gray-500">Flight:</span> {item.FlightNumber}
                            </div>
                          )}
                          {item.RoomNumber && (
                            <div>
                              <span className="text-gray-500">Room:</span> {item.RoomNumber} ({item.RoomType})
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}