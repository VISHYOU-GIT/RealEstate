import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { getProperties, deleteProperty } from '../redux/slices/propertySlice'
import Loader from '../components/Loader'
import ImageWithShimmer from '../components/ImageWithShimmer'
import { FaPlus, FaEdit, FaTrash, FaEye, FaBed, FaBath, FaRulerCombined, FaMapMarkerAlt } from 'react-icons/fa'
import toast from 'react-hot-toast'

function MyProperties() {
  const dispatch = useDispatch()
  const { properties, isLoading } = useSelector((state) => state.property)
  const { user } = useSelector((state) => state.auth)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    // Fetch only user's properties
    dispatch(getProperties({ owner: user?.id || user?._id }))
  }, [dispatch, user])

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      try {
        await dispatch(deleteProperty(id)).unwrap()
      } catch (error) {
        console.error('Delete error:', error)
      }
    }
  }

  const filteredProperties = properties.filter(property => {
    if (filter === 'all') return true
    return property.listingType === filter
  })

  if (isLoading) return <Loader />

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Properties</h1>
            <p className="text-gray-600">Manage your property listings</p>
          </div>
          <Link to="/create-property" className="btn btn-primary flex items-center">
            <FaPlus className="mr-2" />
            Add New Property
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All ({properties.length})
          </button>
          <button
            onClick={() => setFilter('sale')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'sale'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            For Sale ({properties.filter(p => p.listingType === 'sale').length})
          </button>
          <button
            onClick={() => setFilter('rent')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'rent'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            For Rent ({properties.filter(p => p.listingType === 'rent').length})
          </button>
        </div>

        {/* Properties Grid */}
        {filteredProperties.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-gray-400 mb-4">
              <FaPlus className="text-6xl mx-auto" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No properties yet</h3>
            <p className="text-gray-600 mb-6">Start by creating your first property listing</p>
            <Link to="/create-property" className="btn btn-primary inline-flex items-center">
              <FaPlus className="mr-2" />
              Create Your First Property
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
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
                  <h3 className="text-lg font-bold mb-2 line-clamp-1">{property.title}</h3>
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

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <Link
                    to={`/properties/${property._id}`}
                    className="btn btn-secondary text-sm flex items-center justify-center"
                  >
                    <FaEye className="mr-1" />
                    View
                  </Link>
                  <Link
                    to={`/edit-property/${property._id}`}
                    className="btn btn-primary text-sm flex items-center justify-center"
                  >
                    <FaEdit className="mr-1" />
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(property._id)}
                    className="btn bg-red-500 hover:bg-red-600 text-white text-sm flex items-center justify-center"
                  >
                    <FaTrash className="mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyProperties
