import Link from 'next/link';
import { Search, MapPin, Calendar, Users, Star } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">TravelHub</h1>
            </div>
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
              <Link href="/register" className="border border-blue-600 text-blue-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-50">
                Register
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold sm:text-5xl md:text-6xl">
              Discover Your Next Adventure
            </h2>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-blue-100">
              Explore amazing destinations with our curated travel packages. From tropical beaches to historic cities, find your perfect getaway.
            </p>
          </div>

          {/* Search Form */}
          <div className="mt-12 max-w-3xl mx-auto bg-white rounded-lg shadow-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Destination
                </label>
                <input
                  type="text"
                  placeholder="Where to?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Check-in
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Check-out
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div className="flex items-end">
                <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center">
                  <Search className="w-5 h-5 mr-2" />
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900">Why Choose TravelHub?</h3>
            <p className="mt-4 text-lg text-gray-600">We make travel planning simple and enjoyable</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Wide Selection</h4>
              <p className="text-gray-600">Choose from hundreds of destinations and travel packages worldwide</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Expert Support</h4>
              <p className="text-gray-600">Our travel agents are here to help you plan the perfect trip</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Star className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Best Prices</h4>
              <p className="text-gray-600">Competitive pricing and exclusive deals for our customers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900">Popular Destinations</h3>
            <p className="mt-4 text-lg text-gray-600">Explore our most sought-after travel packages</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Paris, France', description: 'City of lights and romance', price: '$1,299', image: '🗼' },
              { name: 'Tokyo, Japan', description: 'Modern meets traditional', price: '$1,599', image: '🗾' },
              { name: 'Bali, Indonesia', description: 'Tropical paradise', price: '$999', image: '🏝️' },
            ].map((destination, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-6xl">
                  {destination.image}
                </div>
                <div className="p-6">
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">{destination.name}</h4>
                  <p className="text-gray-600 mb-4">{destination.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-blue-600">{destination.price}</span>
                    <Link href="/packages" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                      Explore
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/packages" className="bg-blue-600 text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-blue-700 transition-colors">
              View All Packages
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Start Your Journey?</h3>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of satisfied travelers who have discovered amazing destinations with us
          </p>
          <div className="space-x-4">
            <Link href="/register" className="bg-white text-blue-600 px-6 py-3 rounded-md text-lg font-medium hover:bg-gray-100 transition-colors">
              Get Started
            </Link>
            <Link href="/packages" className="border-2 border-white text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-blue-700 transition-colors">
              Browse Packages
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-4">TravelHub</h4>
              <p className="text-gray-400">Your trusted partner for unforgettable travel experiences.</p>
            </div>
            <div>
              <h5 className="text-sm font-semibold mb-4 uppercase tracking-wider">Quick Links</h5>
              <ul className="space-y-2">
                <li><Link href="/packages" className="text-gray-400 hover:text-white">Packages</Link></li>
                <li><Link href="/search" className="text-gray-400 hover:text-white">Search</Link></li>
                <li><Link href="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="text-sm font-semibold mb-4 uppercase tracking-wider">Support</h5>
              <ul className="space-y-2">
                <li><Link href="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
                <li><Link href="/faq" className="text-gray-400 hover:text-white">FAQ</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white">Terms</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="text-sm font-semibold mb-4 uppercase tracking-wider">Connect</h5>
              <p className="text-gray-400">Follow us for travel inspiration and deals</p>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-400">&copy; 2024 TravelHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
