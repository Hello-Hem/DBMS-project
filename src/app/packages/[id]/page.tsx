'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  Calendar,
  Users,
  Star,
  Clock,
  Check,
  X,
  ChevronLeft,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface Package {
  PackageID: number;
  Title: string;
  Description?: string;
  StartDate: string;
  EndDate: string;
  Price: number;
  Capacity: number;
  Destination?: string;
  Country?: string;
  ImageURL?: string;
  Featured: boolean;
  Inclusions?: any;
  Exclusions?: any;
  ItineraryTemplate?: any;
  capacity_left: number;
  booked_capacity: number;
  availability_percentage: number;
}

interface Supplier {
  SupplierName: string;
  SupplierType: string;
  Role: string;
  Notes?: string;
}

export default function PackageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const packageId = params?.id;

  const [packageData, setPackageData] = useState<Package | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingDates, setBookingDates] = useState({
    startDate: '',
    endDate: '',
    numTravellers: '1'
  });
  const [availability, setAvailability] = useState<any>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    if (packageId) {
      fetchPackageDetails();
    }
  }, [packageId]);

  const fetchPackageDetails = async () => {
    try {
      setLoading(true);
      const [packageResponse, suppliersResponse] = await Promise.all([
        fetch(`/api/packages/${packageId}?includeCapacity=true`),
        fetch(`/api/packages/${packageId}/suppliers`)
      ]);

      if (!packageResponse.ok) {
        throw new Error('Package not found');
      }

      const packageData = await packageResponse.json();
      const suppliersData = await suppliersResponse.json();

      setPackageData(packageData.package);
      setSuppliers(suppliersData.suppliers || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load package details');
    } finally {
      setLoading(false);
    }
  };

  const checkAvailability = async () => {
    if (!packageData || !bookingDates.startDate || !bookingDates.endDate) {
      return;
    }

    try {
      setCheckingAvailability(true);
      const response = await fetch(`/api/packages/${packageId}/availability?${new URLSearchParams({
        travelStartDate: bookingDates.startDate,
        travelEndDate: bookingDates.endDate,
        numTravellers: bookingDates.numTravellers
      })}`);

      if (!response.ok) {
        throw new Error('Failed to check availability');
      }

      const data = await response.json();
      setAvailability(data.availability);
    } catch (err) {
      console.error('Error checking availability:', err);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateForInput = (dateString: string) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  const getAvailabilityColor = (percentage: number) => {
    if (percentage === 0) return 'text-red-600';
    if (percentage <= 25) return 'text-orange-600';
    if (percentage <= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const handleBookNow = () => {
    router.push(`/login?redirect=/booking/new?packageId=${packageId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <Loader2 className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="mt-4 text-gray-600">Loading package details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !packageData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">Package Not Found</h2>
            <p className="text-red-600 mb-4">{error || 'The package you are looking for does not exist.'}</p>
            <Link href="/packages" className="inline-flex items-center text-blue-600 hover:text-blue-700">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Packages
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
            <Link href="/" className="text-2xl font-bold text-blue-600">TravelHub</Link>
            <nav className="flex space-x-8">
              <Link href="/packages" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                Packages
              </Link>
              <Link href="/search" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                Search
              </Link>
              <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                Sign In
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8">
          <Link href="/packages" className="text-gray-600 hover:text-gray-900">
            Packages
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-900">{packageData.Title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Package Header */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              {/* Hero Image */}
              <div className="h-96 bg-gradient-to-br from-blue-400 to-blue-600 relative">
                {packageData.ImageURL ? (
                  <img
                    src={packageData.ImageURL}
                    alt={packageData.Title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center text-8xl">✈️</div>
                      `;
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-8xl">
                    ✈️
                  </div>
                )}
                {packageData.Featured && (
                  <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Featured Package
                  </div>
                )}
              </div>

              {/* Package Info */}
              <div className="p-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{packageData.Title}</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-5 h-5 mr-2" />
                    {packageData.Destination || 'Various Locations'}
                    {packageData.Country && `, ${packageData.Country}`}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-5 h-5 mr-2" />
                    {formatDate(packageData.StartDate)} - {formatDate(packageData.EndDate)}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="w-5 h-5 mr-2" />
                    {packageData.capacity_left} spots left
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">About This Package</h2>
                  <p className="text-gray-600 leading-relaxed">
                    {packageData.Description || 'Experience an unforgettable journey with our carefully curated travel package. This adventure offers the perfect blend of culture, relaxation, and exploration, creating memories that will last a lifetime.'}
                  </p>
                </div>

                {/* Inclusions */}
                {packageData.Inclusions && Object.keys(packageData.Inclusions).length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">What's Included</h2>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <ul className="space-y-2">
                        {Array.isArray(packageData.Inclusions) ? (
                          packageData.Inclusions.map((item: string, index: number) => (
                            <li key={index} className="flex items-start">
                              <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{item}</span>
                            </li>
                          ))
                        ) : (
                          Object.entries(packageData.Inclusions).map(([key, value]) => (
                            <li key={key} className="flex items-start">
                              <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{String(value)}</span>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Exclusions */}
                {packageData.Exclusions && Object.keys(packageData.Exclusions).length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">What's Not Included</h2>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <ul className="space-y-2">
                        {Array.isArray(packageData.Exclusions) ? (
                          packageData.Exclusions.map((item: string, index: number) => (
                            <li key={index} className="flex items-start">
                              <X className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{item}</span>
                            </li>
                          ))
                        ) : (
                          Object.entries(packageData.Exclusions).map(([key, value]) => (
                            <li key={key} className="flex items-start">
                              <X className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{String(value)}</span>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Suppliers */}
                {suppliers.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">Our Trusted Partners</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {suppliers.map((supplier, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center mb-2">
                            <Star className="w-5 h-5 text-yellow-500 mr-2" />
                            <h3 className="font-semibold text-gray-900">{supplier.SupplierName}</h3>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{supplier.SupplierType}</p>
                          <p className="text-sm text-blue-600 font-medium">{supplier.Role}</p>
                          {supplier.Notes && (
                            <p className="text-sm text-gray-500 mt-2">{supplier.Notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Booking Card */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-4">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Booking</h2>
                  <div className={`text-lg font-semibold ${getAvailabilityColor(packageData.availability_percentage)}`}>
                    {packageData.capacity_left} spots left
                  </div>
                </div>

                <div className="text-3xl font-bold text-blue-600 mb-6">
                  ${packageData.Price.toLocaleString()}
                  <span className="text-lg font-normal text-gray-500">/person</span>
                </div>

                {/* Availability Check */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Travel Start Date
                    </label>
                    <input
                      type="date"
                      min={formatDateForInput(packageData.StartDate)}
                      max={formatDateForInput(packageData.EndDate)}
                      value={bookingDates.startDate}
                      onChange={(e) => setBookingDates(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Travel End Date
                    </label>
                    <input
                      type="date"
                      min={formatDateForInput(packageData.StartDate)}
                      max={formatDateForInput(packageData.EndDate)}
                      value={bookingDates.endDate}
                      onChange={(e) => setBookingDates(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Travelers
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={Math.min(10, packageData.capacity_left)}
                      value={bookingDates.numTravellers}
                      onChange={(e) => setBookingDates(prev => ({ ...prev, numTravellers: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Check Availability Button */}
                <button
                  onClick={checkAvailability}
                  disabled={!bookingDates.startDate || !bookingDates.endDate || checkingAvailability}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mb-4"
                >
                  {checkingAvailability ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 mr-2" />
                      Check Availability
                    </>
                  )}
                </button>

                {/* Availability Result */}
                {availability && (
                  <div className={`p-3 rounded-md mb-4 ${
                    availability.isAvailable ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center">
                      {availability.isAvailable ? (
                        <Check className="w-5 h-5 text-green-600 mr-2" />
                      ) : (
                        <X className="w-5 h-5 text-red-600 mr-2" />
                      )}
                      <span className={`font-medium ${
                        availability.isAvailable ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {availability.reason}
                      </span>
                    </div>
                  </div>
                )}

                {/* Book Now Button */}
                {availability?.isAvailable && (
                  <button
                    onClick={handleBookNow}
                    className="w-full bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors font-semibold"
                  >
                    Book Now
                  </button>
                )}

                {!availability && (
                  <div className="text-center text-sm text-gray-500">
                    Check availability to proceed with booking
                  </div>
                )}

                {/* Package Stats */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Capacity</span>
                      <span className="font-semibold">{packageData.Capacity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Booked</span>
                      <span className="font-semibold">{packageData.booked_capacity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Available</span>
                      <span className={`font-semibold ${getAvailabilityColor(packageData.availability_percentage)}`}>
                        {packageData.capacity_left}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          packageData.availability_percentage <= 25 ? 'bg-red-500' :
                          packageData.availability_percentage <= 50 ? 'bg-yellow-500' :
                          packageData.availability_percentage <= 75 ? 'bg-blue-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${packageData.availability_percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}