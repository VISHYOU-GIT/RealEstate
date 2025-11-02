import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { getProperties } from '../redux/slices/propertySlice'
import Loader from '../components/Loader'
import SearchInput from '../components/SearchInput'
import ImageWithShimmer from '../components/ImageWithShimmer'
import { FaBed, FaBath, FaRuler, FaMapMarkerAlt, FaHeart, FaTimes, FaMap, FaList, FaSearch, FaLocationArrow, FaFilter, FaSlidersH } from 'react-icons/fa'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom icon for user location
const userLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Component to handle map view changes
function MapViewController({ center, zoom }) {
  const map = useMap()
  
  useEffect(() => {
    if (center && center[0] !== 0 && center[1] !== 0) {
      map.setView(center, zoom, {
        animate: true,
        duration: 1
      })
    }
  }, [center, zoom, map])
  
  return null
}

function Properties() {
  const dispatch = useDispatch()
  const { properties, isLoading, pagination } = useSelector((state) => state.property)
  const [showMap, setShowMap] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]) // Default India center
  const [mapZoom, setMapZoom] = useState(5)
  const mapRef = useRef(null)
  
  // Applied filters (actual filters sent to API)
  const [filters, setFilters] = useState({
    search: '',
    propertyType: '',
    listingType: '',
    minPrice: '',
    maxPrice: '',
    city: '',
    bedrooms: '',
    page: 1
  })
  
  // Temporary filters (in modal, not applied yet)
  const [tempFilters, setTempFilters] = useState({
    propertyType: '',
    listingType: '',
    minPrice: '',
    maxPrice: '',
    city: '',
    bedrooms: ''
  })
  
  const isFirstRender = useRef(true)

  // Memoize active filters calculation to prevent unnecessary re-renders
  const activeFiltersArray = useMemo(() => {
    const active = []
    if (filters.propertyType) active.push({ key: 'propertyType', label: `Type: ${filters.propertyType}`, value: filters.propertyType })
    if (filters.listingType) active.push({ key: 'listingType', label: `${filters.listingType === 'rent' ? 'For Rent' : 'For Sale'}`, value: filters.listingType })
    if (filters.minPrice) active.push({ key: 'minPrice', label: `Min: ₹${filters.minPrice}`, value: filters.minPrice })
    if (filters.maxPrice) active.push({ key: 'maxPrice', label: `Max: ₹${filters.maxPrice}`, value: filters.maxPrice })
    if (filters.bedrooms) active.push({ key: 'bedrooms', label: `${filters.bedrooms}+ Beds`, value: filters.bedrooms })
    if (filters.city) active.push({ key: 'city', label: `City: ${filters.city}`, value: filters.city })
    return active
  }, [filters.propertyType, filters.listingType, filters.minPrice, filters.maxPrice, filters.bedrooms, filters.city])

  useEffect(() => {
    dispatch(getProperties(filters))
  }, [dispatch, filters])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup if needed
    }
  }, [])

  // Get user's current location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = [position.coords.latitude, position.coords.longitude]
          setUserLocation(coords)
          setMapCenter(coords)
          setMapZoom(12) // Closer zoom when user location is available
        },
        (error) => {
          console.log('Location access denied or unavailable:', error)
          // If properties exist, center on them
          if (properties.length > 0) {
            calculateMapCenter()
          }
        }
      )
    }
  }, [])

  // Update map center when properties change
  useEffect(() => {
    if (properties.length > 0 && !userLocation) {
      calculateMapCenter()
    }
  }, [properties, userLocation])

  const calculateMapCenter = useCallback(() => {
    if (properties.length === 0) return
    const avgLat = properties.reduce((sum, p) => sum + (p.location?.coordinates?.[1] || 0), 0) / properties.length
    const avgLng = properties.reduce((sum, p) => sum + (p.location?.coordinates?.[0] || 0), 0) / properties.length
    setMapCenter([avgLat, avgLng])
    setMapZoom(10)
  }, [properties])

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = [position.coords.latitude, position.coords.longitude]
          setUserLocation(coords)
          setMapCenter(coords)
          setMapZoom(13)
        },
        (error) => {
          alert('Unable to retrieve your location. Please enable location services.')
        }
      )
    } else {
      alert('Geolocation is not supported by your browser.')
    }
  }

  // Handle search from SearchInput component
  const handleSearch = useCallback((searchValue) => {
    setFilters(prev => ({
      ...prev,
      search: searchValue,
      page: 1
    }))
  }, [])

  // Handle filter changes in modal (temporary, not applied yet)
  const handleTempFilterChange = useCallback((e) => {
    setTempFilters(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }, [])

  // Apply filters when user clicks "Apply Filters" button
  const applyFilters = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      ...tempFilters,
      page: 1
    }))
    setShowFilters(false)
  }, [tempFilters])

  // Open filter modal and sync temp filters with current filters
  const openFilterModal = useCallback(() => {
    setTempFilters({
      propertyType: filters.propertyType,
      listingType: filters.listingType,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      city: filters.city,
      bedrooms: filters.bedrooms
    })
    setShowFilters(true)
  }, [filters])

  const removeFilter = useCallback((key) => {
    setFilters(prev => ({
      ...prev,
      [key]: '',
      page: 1
    }))
  }, [])

  const clearAllFilters = useCallback(() => {
    const clearedFilters = {
      propertyType: '',
      listingType: '',
      minPrice: '',
      maxPrice: '',
      city: '',
      bedrooms: ''
    }
    setTempFilters(clearedFilters)
    setFilters(prev => ({
      search: prev.search,
      ...clearedFilters,
      page: 1
    }))
    setShowFilters(false)
  }, [])

  const handlePageChange = useCallback((newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }))
    window.scrollTo(0, 0)
  }, [])

  if (isLoading) return <Loader />

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Search - Beautiful Modern Design */}
      <div className="bg-white shadow-md sticky top-0 z-40 border-b border-gray-200">
        <div className="container-custom py-6">
          {/* Main Search Row */}
          <div className="flex flex-col lg:flex-row gap-4 items-stretch">
            {/* Primary Search Bar */}
            <SearchInput 
              onSearchChange={handleSearch}
              placeholder="Search by location, title..."
            />

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Filter Button */}
              <button
                onClick={openFilterModal}
                className="px-6 py-4 rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 hover:border-purple-300 transition-all shadow-sm font-medium text-gray-700 flex items-center gap-2 relative"
              >
                <FaSlidersH className="text-purple-600" />
                <span>Filters</span>
                {activeFiltersArray.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                    {activeFiltersArray.length}
                  </span>
                )}
              </button>

              <button
                onClick={handleGetCurrentLocation}
                className="px-6 py-4 rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 hover:border-blue-300 transition-all shadow-sm font-medium text-gray-700 flex items-center gap-2"
                title="Show properties near me"
              >
                <FaLocationArrow className="text-blue-600" />
                <span>Near Me</span>
              </button>

              <button
                onClick={() => setShowMap(!showMap)}
                className={`px-6 py-4 rounded-2xl border-2 transition-all shadow-sm font-medium flex items-center gap-2 ${
                  showMap 
                    ? 'bg-gradient-to-br from-primary-600 to-green-600 text-white border-primary-600 hover:from-primary-700 hover:to-green-700' 
                    : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-primary-400 text-gray-700'
                }`}
              >
                {showMap ? <><FaMap />Map</> : <><FaList />List</>}
              </button>
            </div>
          </div>

          {/* Active Filters Chips */}
          {activeFiltersArray.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 items-center">
              <span className="text-sm text-gray-600 font-semibold">Active:</span>
              {activeFiltersArray.map((filter) => (
                <span
                  key={filter.key}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-primary-100 to-green-100 text-primary-800 rounded-xl text-sm font-medium shadow-sm border border-primary-200"
                >
                  {filter.label}
                  <button
                    onClick={() => removeFilter(filter.key)}
                    className="hover:bg-primary-200 rounded-full p-1 transition-colors"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                </span>
              ))}
              <button
                onClick={clearAllFilters}
                className="text-sm text-red-600 hover:text-red-700 font-semibold px-4 py-2 hover:bg-red-50 rounded-xl transition-colors"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Modal/Popup */}
      {showFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-green-600 text-white px-8 py-6 rounded-t-3xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaFilter className="text-2xl" />
                <h2 className="text-2xl font-bold">Filter Properties</h2>
              </div>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-6">
              {/* Property Type */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <span className="text-lg">🏠</span>
                  Property Type
                </label>
                <select 
                  name="propertyType" 
                  value={tempFilters.propertyType} 
                  onChange={handleTempFilterChange} 
                  className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 bg-gray-50 hover:bg-white hover:border-primary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer transition-all shadow-sm font-medium text-gray-700"
                >
                  <option value="">All Types</option>
                  <option value="apartment">🏢 Apartment</option>
                  <option value="house">🏠 House</option>
                  <option value="villa">🏡 Villa</option>
                  <option value="studio">🏘️ Studio</option>
                  <option value="commercial">🏬 Commercial</option>
                  <option value="land">🌳 Land</option>
                </select>
              </div>

              {/* Listing Type */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <span className="text-lg">💼</span>
                  Listing Type
                </label>
                <select 
                  name="listingType" 
                  value={tempFilters.listingType} 
                  onChange={handleTempFilterChange} 
                  className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 bg-gray-50 hover:bg-white hover:border-primary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer transition-all shadow-sm font-medium text-gray-700"
                >
                  <option value="">Rent or Sale</option>
                  <option value="rent">🔑 For Rent</option>
                  <option value="sale">💰 For Sale</option>
                </select>
              </div>

              {/* Price Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                    <span className="text-lg">💵</span>
                    Min Price
                  </label>
                  <input
                    type="number"
                    name="minPrice"
                    value={tempFilters.minPrice}
                    onChange={handleTempFilterChange}
                    placeholder="Min Price"
                    className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 bg-gray-50 hover:bg-white hover:border-primary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base font-medium"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                    <span className="text-lg">💰</span>
                    Max Price
                  </label>
                  <input
                    type="number"
                    name="maxPrice"
                    value={tempFilters.maxPrice}
                    onChange={handleTempFilterChange}
                    placeholder="Max Price"
                    className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 bg-gray-50 hover:bg-white hover:border-primary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base font-medium"
                  />
                </div>
              </div>

              {/* Bedrooms and City */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                    <span className="text-lg">🛏️</span>
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    name="bedrooms"
                    value={tempFilters.bedrooms}
                    onChange={handleTempFilterChange}
                    placeholder="Bedrooms"
                    className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 bg-gray-50 hover:bg-white hover:border-primary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base font-medium"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                    <span className="text-lg">🌆</span>
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={tempFilters.city}
                    onChange={handleTempFilterChange}
                    placeholder="City"
                    className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 bg-gray-50 hover:bg-white hover:border-primary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-8 py-6 rounded-b-3xl border-t-2 border-gray-200 flex gap-4">
              <button
                onClick={clearAllFilters}
                className="flex-1 px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-2xl font-semibold hover:bg-gray-100 transition-all shadow-sm"
              >
                Clear All
              </button>
              <button
                onClick={applyFilters}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-primary-600 to-green-600 text-white rounded-2xl font-semibold hover:from-primary-700 hover:to-green-700 transition-all shadow-md"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container-custom py-6">
        <div className="flex gap-6">
          {/* Map View */}
          {showMap && (
            <div className="hidden lg:block w-2/5 sticky top-28 h-[calc(100vh-8rem)]">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-full">
                <MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                  className="h-full w-full"
                  scrollWheelZoom={true}
                  ref={mapRef}
                >
                  <MapViewController center={mapCenter} zoom={mapZoom} />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  {/* User Location Marker */}
                  {userLocation && (
                    <Marker position={userLocation} icon={userLocationIcon}>
                      <Popup>
                        <div className="text-center">
                          <h3 className="font-semibold text-sm">📍 Your Location</h3>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                  
                  {/* Property Markers */}
                  {properties.map((property) => {
                    const coords = property.location?.coordinates
                    if (!coords || coords.length < 2) return null
                    return (
                      <Marker
                        key={property._id}
                        position={[coords[1], coords[0]]}
                      >
                        <Popup>
                          <div className="text-center">
                            <ImageWithShimmer 
                              src={property.images[0]?.url} 
                              alt={property.title}
                              className="w-32 h-20 object-cover rounded mb-2"
                            />
                            <h3 className="font-semibold text-sm">{property.title}</h3>
                            <p className="text-primary-600 font-bold">
                              ₹{property.price.toLocaleString()}
                              {property.listingType === 'rent' && '/mo'}
                            </p>
                            <Link
                              to={`/properties/${property._id}`}
                              className="text-xs text-primary-600 hover:underline"
                            >
                              View Details
                            </Link>
                          </div>
                        </Popup>
                      </Marker>
                    )
                  })}
                </MapContainer>
              </div>
            </div>
          )}

          {/* Property Listings */}
          <div className={showMap ? 'flex-1' : 'w-full'}>
            {properties.length === 0 && !isLoading ? (
              <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
                <div className="text-6xl mb-4">🏠</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">No properties found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your filters to see more results</p>
                <button
                  onClick={clearAllFilters}
                  className="btn-primary"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                {properties.map((property) => (
                  <Link
                    key={property._id}
                    to={`/properties/${property._id}`}
                    className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    {/* Image */}
                    <div className="relative overflow-hidden h-56">
                      <ImageWithShimmer
                        src={property.images[0]?.url || 'https://via.placeholder.com/400x300'}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="px-3 py-1 bg-white/95 backdrop-blur-sm text-gray-800 rounded-full text-xs font-semibold shadow-md">
                          {property.propertyType}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-md ${
                          property.listingType === 'rent' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-green-500 text-white'
                        }`}>
                          For {property.listingType === 'rent' ? 'Rent' : 'Sale'}
                        </span>
                      </div>
                      <button className="absolute top-3 right-3 p-2 bg-white/95 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-md">
                        <FaHeart className="text-gray-600 hover:text-red-500" />
                      </button>
                      
                      {/* Rating badge */}
                      {property.averageRating > 0 && (
                        <div className="absolute bottom-3 left-3 px-2 py-1 bg-white/95 backdrop-blur-sm rounded-lg text-xs font-semibold flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span>{property.averageRating}</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-1">
                        {property.title}
                      </h3>

                      <div className="flex items-center text-gray-600 mb-4">
                        <FaMapMarkerAlt className="mr-2 text-primary-600 flex-shrink-0" />
                        <span className="text-sm line-clamp-1">{property.location.city}, {property.location.state}</span>
                      </div>

                      {/* Property Details */}
                      <div className="flex items-center gap-4 text-gray-600 mb-4 pb-4 border-b">
                        {property.bedrooms > 0 && (
                          <div className="flex items-center gap-1">
                            <FaBed className="text-primary-600" />
                            <span className="text-sm font-medium">{property.bedrooms}</span>
                          </div>
                        )}
                        {property.bathrooms > 0 && (
                          <div className="flex items-center gap-1">
                            <FaBath className="text-primary-600" />
                            <span className="text-sm font-medium">{property.bathrooms}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <FaRuler className="text-primary-600" />
                          <span className="text-sm font-medium">{property.area.toLocaleString()} {property.areaUnit || 'sqft'}</span>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm text-gray-500 mb-1">
                            {property.listingType === 'rent' ? 'Rental price' : 'Sale price'}
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-gray-900">
                              ₹{property.price.toLocaleString()}
                            </span>
                            {property.listingType === 'rent' && (
                              <span className="text-sm text-gray-600">/month</span>
                            )}
                          </div>
                        </div>
                        <button className="px-6 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium">
                          View
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex justify-center mt-8 gap-2">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                      page === pagination.page
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Properties
