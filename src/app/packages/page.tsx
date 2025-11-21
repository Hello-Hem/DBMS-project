'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, MapPin, Calendar, Users, Star, ChevronLeft, ChevronRight } from 'lucide-react';

interface Package {
  PackageID: number;
  Title: string;
  Description?: string;
  StartDate: string;
  EndDate: string;
  Price: number;
  Destination?: string;
  Country?: string;
  ImageURL?: string;
  Featured: boolean;
  capacity_left: number;
  booked_capacity: number;
  SupplierName?: string;
}

interface PackagesResponse {
  packages: Package[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchFilters, setSearchFilters] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    minPrice: '',
    maxPrice: '',
    keyword: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchPackages = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: 'search',
        page: page.toString(),
        limit: pagination.limit.toString()
      });

      // Add search filters
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value) {
          if (key === 'minPrice' || key === 'maxPrice') {
            params.append(key, value);
          } else if (value.trim()) {
            params.append(key, value);
          }
        }
      });

      const response = await fetch(`/api/packages?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch packages');
      }

      const data: PackagesResponse = await response.json();
      setPackages(data.packages);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleSearch = () => {
    fetchPackages(1);
  };

  const handleFilterChange = (key: string, value: string) => {
    setSearchFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchPackages(newPage);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCapacityStatus = (capacityLeft: number, totalCapacity: number) => {
    const percentage = (capacityLeft / totalCapacity) * 100;
    if (percentage === 0) return { status: 'Sold Out', color: 'red' };
    if (percentage <= 25) return { status: 'Limited', color: 'orange' };
    return { status: 'Available', color: 'green' };
  };

  if (loading && packages.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading packages...</p>
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
              <Link href="/packages" className="text-blue-600 font-medium px-3 py-2 rounded-md text-sm">
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
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Travel Packages</h1>
          <p className="text-lg text-gray-600">Discover amazing destinations and create unforgettable memories</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          {/* Search Bar */}
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search destinations, keywords..."
                value={searchFilters.keyword}
                onChange={(e) => handleFilterChange('keyword', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Search className="w-5 h-5 mr-2" />
              Search
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
            >
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Destination
                </label>
                <input
                  type="text"
                  placeholder="City or country"
                  value={searchFilters.destination}
                  onChange={(e) => handleFilterChange('destination', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={searchFilters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  End Date
                </label>
                <input
                  type="date"
                  value={searchFilters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Price</label>
                <input
                  type="number"
                  placeholder="$0"
                  value={searchFilters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
                <input
                  type="number"
                  placeholder="$5000"
                  value={searchFilters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            {pagination.total} {pagination.total === 1 ? 'package' : 'packages'} found
          </p>
        </div>

        {/* Packages Grid */}
        {packages.length === 0 && !loading ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-600">No packages found matching your criteria.</p>
            <button
              onClick={() => {
                setSearchFilters({
                  destination: '',
                  startDate: '',
                  endDate: '',
                  minPrice: '',
                  maxPrice: '',
                  keyword: ''
                });
                fetchPackages(1);
              }}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {packages.map((pkg) => {
              const capacityStatus = getCapacityStatus(pkg.capacity_left, pkg.capacity_left + pkg.booked_capacity);
              return (
                <div key={pkg.PackageID} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Package Image */}
                  <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 relative">
                    {pkg.ImageURL ? (
                      <img
                        src={pkg.ImageURL}
                        alt={pkg.Title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = `
                            <div class="w-full h-full flex items-center justify-center text-6xl">✈️</div>
                          `;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        ✈️
                      </div>
                    )}
                    {pkg.Featured && (
                      <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        Featured
                      </div>
                    )}
                  </div>

                  {/* Package Details */}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-semibold text-gray-900 flex-1">{pkg.Title}</h3>
                      <div className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold text-white bg-${capacityStatus.color}-500`}>
                        {capacityStatus.status}
                      </div>
                    </div>

                    {pkg.Destination && (
                      <p className="text-gray-600 mb-2 flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {pkg.Destination}
                        {pkg.Country && `, ${pkg.Country}`}
                      </p>
                    )}

                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {pkg.Description || 'Discover this amazing destination with our carefully curated travel package.'}
                    </p>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(pkg.StartDate)} - {formatDate(pkg.EndDate)}
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        {pkg.capacity_left} spots left
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-2xl font-bold text-blue-600">${pkg.Price.toLocaleString()}</span>
                        <span className="text-gray-500 text-sm">/person</span>
                      </div>
                      <div className="space-x-2">
                        <Link
                          href={`/packages/${pkg.PackageID}`}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                        >
                          View Details
                        </Link>
                        {pkg.capacity_left > 0 && (
                          <Link
                            href={`/login?redirect=/booking/new?packageId=${pkg.PackageID}`}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
                          >
                            Book Now
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {[...Array(Math.min(5, pagination.totalPages))].map((_, index) => {
              let pageNumber;
              if (pagination.totalPages <= 5) {
                pageNumber = index + 1;
              } else if (pagination.page <= 3) {
                pageNumber = index + 1;
              } else if (pagination.page >= pagination.totalPages - 2) {
                pageNumber = pagination.totalPages - 4 + index;
              } else {
                pageNumber = pagination.page - 2 + index;
              }

              return (
                <button
                  key={index}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`px-3 py-2 rounded-md ${
                    pagination.page === pageNumber
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}