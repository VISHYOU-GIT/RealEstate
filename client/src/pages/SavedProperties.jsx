import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { getProperties, toggleSaveProperty } from '../redux/slices/propertySlice'
import Loader from '../components/Loader'
import ImageWithShimmer from '../components/ImageWithShimmer'
import { FaHeart, FaMapMarkerAlt, FaBed, FaBath, FaRulerCombined } from 'react-icons/fa'

function SavedProperties() {
  const dispatch = useDispatch()
  const { properties, isLoading } = useSelector((state) => state.property)
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    // Fetch properties saved by user
    dispatch(getProperties({}))
  }, [dispatch])

  const handleUnsave = async (propertyId) => {
    try {
      await dispatch(toggleSaveProperty(propertyId)).unwrap()
    } catch (error) {
      console.error('Unsave error:', error)
    }
  }

  // Filter properties saved by current user
  const savedProperties = properties.filter(property =>
    property.savedBy?.some(id => id === user?.id || id === user?._id)
  )

  if (isLoading) return <Loader />

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Saved Properties</h1>
          <p className="text-gray-600">Properties you've saved for later</p>
        </div>

        {savedProperties.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-gray-400 mb-4">
              <FaHeart className="text-6xl mx-auto" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No saved properties yet</h3>
            <p className="text-gray-600 mb-6">
              Start exploring properties and save your favorites
            </p>
            <Link to="/properties" className="btn btn-primary inline-flex items-center">
              Browse Properties
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedProperties.map((property) => (
              <div key={property._id} className="card group hover:shadow-xl transition-shadow">
                {/* Property Image */}
                <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden -m-6 mb-4">
                  {property.images && property.images.length > 0 ? (
                    <ImageWithShimmer
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
                      <FaMapMarkerAlt className="text-6xl text-white opacity-50" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => handleUnsave(property._id)}
                      className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <FaHeart className="text-lg" />
                    </button>
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      property.listingType === 'sale'
                        ? 'bg-blue-500 text-white'
                        : 'bg-green-500 text-white'
                    }`}>
                      For {property.listingType === 'sale' ? 'Sale' : 'Rent'}
                    </span>
                  </div>
                </div>

                {/* Property Info */}
                <div className="mb-4">
                  <h3 className="text-lg font-bold mb-2 line-clamp-2">{property.title}</h3>
                  <p className="text-gray-600 text-sm mb-2 flex items-center">
                    <FaMapMarkerAlt className="mr-1" />
                    {property.location?.city}, {property.location?.state}
                  </p>
                  <p className="text-2xl font-bold text-primary-600">
                    ${property.price?.toLocaleString()}
                    {property.listingType === 'rent' && <span className="text-sm text-gray-600">/month</span>}
                  </p>
                </div>

                {/* Property Stats */}
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4 pb-4 border-b">
                  <div className="flex items-center">
                    <FaBed className="mr-1" />
                    <span>{property.bedrooms} Beds</span>
                  </div>
                  <div className="flex items-center">
                    <FaBath className="mr-1" />
                    <span>{property.bathrooms} Baths</span>
                  </div>
                  <div className="flex items-center">
                    <FaRulerCombined className="mr-1" />
                    <span>{property.area} sqft</span>
                  </div>
                </div>

                {/* View Details Button */}
                <Link
                  to={`/properties/${property._id}`}
                  className="btn btn-primary w-full"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SavedProperties
