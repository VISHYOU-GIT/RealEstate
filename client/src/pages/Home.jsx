import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { getProperties } from '../redux/slices/propertySlice'
import { motion } from 'framer-motion'
import { Splide, SplideSlide } from "@splidejs/react-splide";
import "@splidejs/react-splide/css";
import { AutoScroll } from "@splidejs/splide-extension-auto-scroll";
import {
  FaSearch, FaMapMarkerAlt, FaHome, FaBed, FaBath, 
  FaRulerCombined, FaArrowRight, FaCheckCircle, 
  FaUsers, FaBuilding, FaHandshake,
  FaCalendar, FaKey, FaFileContract
} from 'react-icons/fa'

const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.8 }
  }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
}

const scaleIn = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { duration: 0.5 }
  }
}

function Home() {
  const dispatch = useDispatch()
  const { properties } = useSelector((state) => state.property)
  const [searchData, setSearchData] = useState({
    location: '',
    propertyType: '',
    priceRange: '',
    bedrooms: ''
  })

  useEffect(() => {
    dispatch(getProperties())
  }, [dispatch])

  const rentedProperties = properties.filter(p => p.status === 'approved' && p.listingType === 'rent')
  const saleProperties = properties.filter(p => p.status === 'approved' && p.listingType === 'sale')

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchData.location) params.append('location', searchData.location)
    if (searchData.propertyType) params.append('propertyType', searchData.propertyType)
    window.location.href = `/properties?${params.toString()}`
  }

  const stats = [
    { number: '2,300+', label: 'Successful Ventures', icon: FaCheckCircle },
    { number: '4,600+', label: 'Satisfied Investors', icon: FaUsers },
    { number: '3,100+', label: 'Overseas Properties', icon: FaBuilding },
    { number: '5,200+', label: 'Bespoke Strategies', icon: FaHandshake }
  ]

  const workSteps = [
    { icon: FaSearch, title: 'Discover Properties', description: 'Explore our curated selection of homes designed just for you' },
    { icon: FaCalendar, title: 'Schedule a Tour', description: 'Select your ideal time to visit and arrange a preview viewing' },
    { icon: FaKey, title: 'Tour the Space', description: 'Experience the property firsthand, explore what truly matters' },
    { icon: FaFileContract, title: 'Finalize Purchase', description: 'We simplify your buying journey, ensuring a seamless transaction' }
  ]

  const testimonials = [
    { name: 'Jamie R.', role: 'Happy Homeowner', text: 'Nestrix made buying my first home a breeze. Their team was supportive and responsive every step of the way.', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop' },
    { name: 'Sarah M.', role: 'Property Investor', text: 'The best real estate platform I have used. Found multiple investment properties with ease.', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop' },
    { name: 'Michael Chen', role: 'First-Time Buyer', text: 'Outstanding service! The team guided me through every detail of my home purchase.', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop' }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <motion.section 
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="relative bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 pt-20 pb-32 overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute transform rotate-45 -right-20 top-20 w-96 h-96 bg-primary-600 rounded-full blur-3xl"></div>
          <div className="absolute transform -rotate-45 -left-20 bottom-20 w-96 h-96 bg-green-600 rounded-full blur-3xl"></div>
        </div>

        <div className="container-custom relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div variants={fadeInUp} className="space-y-8">
              <div>
                <motion.h1 
                  variants={fadeInUp}
                  className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight"
                >
                  Your Perfect Home Awaits.
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-green-600 mt-2">
                    Simple, Effective, Secure
                  </span>
                </motion.h1>
                <motion.p 
                  variants={fadeInUp}
                  className="mt-6 text-lg text-gray-600"
                >
                  Find your dream home with Nestrix. Our expert agents and exclusive listings make it easy to buy, sell, or rent.
                </motion.p>
              </div>

              <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
                <Link 
                  to="/properties"
                  className="btn btn-primary px-8 py-4 text-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                  Get Started
                  <FaArrowRight />
                </Link>
                <a 
                  href="#how-it-works"
                  className="btn bg-white text-primary-600 border-2 border-primary-600 px-8 py-4 text-lg hover:bg-primary-50 transition-all"
                >
                  How it works
                </a>
              </motion.div>
            </motion.div>

            {/* Right Content - Search Card */}
            <motion.div 
              variants={scaleIn}
              className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-sm bg-opacity-95"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Find Your Dream Home
              </h2>
              
              <form onSubmit={handleSearch} className="space-y-4">
                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City or Neighborhood
                  </label>
                  <div className="relative">
                    <FaMapMarkerAlt className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Enter location..."
                      value={searchData.location}
                      onChange={(e) => setSearchData({...searchData, location: e.target.value})}
                      className="input pl-12 w-full"
                    />
                  </div>
                </div>

                {/* Property Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Type
                  </label>
                  <div className="relative">
                    <FaHome className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <select
                      value={searchData.propertyType}
                      onChange={(e) => setSearchData({...searchData, propertyType: e.target.value})}
                      className="input pl-12 w-full"
                    >
                      <option value="">Select type</option>
                      <option value="apartment">Apartment</option>
                      <option value="house">House</option>
                      <option value="villa">Villa</option>
                      <option value="condo">Condo</option>
                    </select>
                  </div>
                </div>

                {/* Rent/Sale Toggle */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    className="flex-1 py-3 rounded-lg font-medium transition-all border-2 border-primary-600 text-primary-600 hover:bg-primary-50"
                  >
                    Rent
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-3 rounded-lg font-medium transition-all bg-primary-600 text-white hover:bg-primary-700"
                  >
                    Buy
                  </button>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Any Price
                  </label>
                  <select
                    value={searchData.priceRange}
                    onChange={(e) => setSearchData({...searchData, priceRange: e.target.value})}
                    className="input w-full"
                  >
                    <option value="">Select range</option>
                    <option value="0-100000">₹0 - $100k</option>
                    <option value="100000-300000">₹100k - $300k</option>
                    <option value="300000-500000">₹300k - $500k</option>
                    <option value="500000+">₹500k+</option>
                  </select>
                </div>

                <button 
                  type="submit"
                  className="btn btn-primary w-full py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Discover Homes
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={staggerContainer}
        className="py-16 bg-gradient-to-r from-primary-600 to-green-600"
      >
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div 
                key={index}
                variants={fadeInUp}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-4">
                  <stat.icon className="text-3xl text-white" />
                </div>
                <h3 className="text-4xl font-bold text-white mb-2">{stat.number}</h3>
                <p className="text-white text-opacity-90">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Top Rented Properties - Infinite Scroll Left to Right */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeInUp}
        className="py-20 bg-gray-50"
      >
        <div className="container-custom mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-3">
                Top Rented Properties
              </h2>
              <p className="text-lg text-gray-600">
                Discover our most popular rental properties
              </p>
            </div>
            <Link 
              to="/properties?type=rent" 
              className="btn btn-primary flex items-center gap-2"
            >
              View All <FaArrowRight />
            </Link>
          </div>
        </div>

        {rentedProperties.length > 0 ? (
          <Splide
            options={{
              type: 'loop',
              drag: 'free',
              focus: 'center',
              perPage: 3,
              autoScroll: {
                speed: 0.5,
                pauseOnHover: true,
                pauseOnFocus: false,
              },
              arrows: false,
              pagination: false,
              gap: '2rem',
              breakpoints: {
                1024: { perPage: 2 },
                640: { perPage: 1 }
              }
            }}
            extensions={{ AutoScroll }}
          >
            {rentedProperties.map((property) => (
              <SplideSlide key={property._id}>
                <PropertyCard property={property} />
              </SplideSlide>
            ))}
          </Splide>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No rental properties available at the moment.</p>
          </div>
        )}
      </motion.section>

      {/* How It Works Section */}
      <motion.section 
        id="how-it-works"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
        className="py-20 bg-white"
      >
        <div className="container-custom">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover how we help clients achieve their property dreams. Explore testimonials that highlight your ideal platform in excellence and client satisfaction.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {workSteps.map((step, index) => (
              <motion.div 
                key={index}
                variants={fadeInUp}
                className="text-center group"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-green-500 rounded-2xl mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <step.icon className="text-3xl text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Top Sale Properties - Infinite Scroll Right to Left */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeInUp}
        className="py-20 bg-gray-50"
      >
        <div className="container-custom mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-3">
                Top Properties for Sale
              </h2>
              <p className="text-lg text-gray-600">
                Explore premium properties available for purchase
              </p>
            </div>
            <Link 
              to="/properties?type=sale" 
              className="btn btn-primary flex items-center gap-2"
            >
              View All <FaArrowRight />
            </Link>
          </div>
        </div>

        {saleProperties.length > 0 ? (
          <Splide
            options={{
              type: 'loop',
              drag: 'free',
              focus: 'center',
              perPage: 3,
              direction: 'rtl',
              autoScroll: {
                speed: 0.5,
                pauseOnHover: true,
                pauseOnFocus: false,
              },
              arrows: false,
              pagination: false,
              gap: '2rem',
              breakpoints: {
                1024: { perPage: 2 },
                640: { perPage: 1 }
              }
            }}
            extensions={{ AutoScroll }}
          >
            {saleProperties.map((property) => (
              <SplideSlide key={property._id}>
                <PropertyCard property={property} />
              </SplideSlide>
            ))}
          </Splide>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No properties for sale available at the moment.</p>
          </div>
        )}
      </motion.section>

      {/* Testimonials */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeInUp}
        className="py-20 bg-white"
      >
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Real Success Stories
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover how we help clients achieve their property dreams. Explore testimonials that highlight your ideal platform in excellence and client satisfaction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div 
                key={index}
                variants={scaleIn}
                className="bg-gray-50 rounded-2xl p-8 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center gap-4 mb-6">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic leading-relaxed">
                  &ldquo;{testimonial.text}&rdquo;
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
        className="py-20 bg-gradient-to-br from-primary-600 to-green-600 text-white"
      >
        <div className="container-custom text-center">
          <motion.div variants={fadeInUp} className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Eager to Discover Your Ideal Home?
            </h2>
            <p className="text-xl mb-8 text-white text-opacity-90">
              We&apos;re here to guide you. Explore listings, book tours, and find your dream home with experts today.
            </p>
            <Link 
              to="/register"
              className="btn bg-white text-primary-600 px-10 py-4 text-lg font-semibold hover:bg-gray-100 transition-all inline-flex items-center gap-2 shadow-xl"
            >
              Begin Here
              <FaArrowRight />
            </Link>
          </motion.div>
        </div>
      </motion.section>
    </div>
  )
}

// Property Card Component
function PropertyCard({ property }) {
  return (
    <Link 
      to={`/properties/${property._id}`}
      className="block bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group"
    >
      <div className="relative h-64 overflow-hidden">
        <img 
          src={property.images?.[0]?.url || 'https://via.placeholder.com/400x300'} 
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-4 left-4">
          <span className={`px-4 py-2 rounded-full text-sm font-semibold text-white ${
            property.type === 'rent' ? 'bg-blue-500' : 'bg-green-500'
          }`}>
            For {property.type === 'rent' ? 'Rent' : 'Sale'}
          </span>
        </div>
        <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded-full shadow-lg">
          <span className="font-bold text-primary-600">
            ${property.price?.toLocaleString()}
            {property.type === 'rent' && <span className="text-sm">/mo</span>}
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
          {property.title}
        </h3>
        <p className="text-gray-600 flex items-center gap-2 mb-4">
          <FaMapMarkerAlt className="text-primary-600" />
          {property.location?.city}, {property.location?.state}
        </p>
        
        <div className="flex items-center gap-6 text-gray-600">
          <div className="flex items-center gap-2">
            <FaBed className="text-primary-600" />
            <span className="text-sm">{property.bedrooms} Bedrooms</span>
          </div>
          <div className="flex items-center gap-2">
            <FaBath className="text-primary-600" />
            <span className="text-sm">{property.bathrooms} Bathrooms</span>
          </div>
        </div>
        
        {property.area && (
          <div className="mt-4 pt-4 border-t flex items-center gap-2 text-gray-600">
            <FaRulerCombined className="text-primary-600" />
            <span className="text-sm">{property.area} sq ft</span>
          </div>
        )}
      </div>
    </Link>
  )
}

export default Home
