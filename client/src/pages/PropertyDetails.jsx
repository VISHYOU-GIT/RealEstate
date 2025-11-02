import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { getProperty } from '../redux/slices/propertySlice'
import { getOrCreateChat } from '../redux/slices/chatSlice'
import Loader from '../components/Loader'
import ImageWithShimmer from '../components/ImageWithShimmer'
import { 
  FaBed, FaBath, FaRuler, FaMapMarkerAlt, FaStar, FaComments, FaTimes, 
  FaUtensils, FaCouch, FaWifi, FaParking, FaSmokingBan, FaTree, FaPhone, 
  FaEnvelope, FaWhatsapp, FaHeart, FaLock, FaUnlock, FaFileContract, FaRegHeart
} from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { Splide, SplideSlide } from "@splidejs/react-splide"
import "@splidejs/react-splide/css"
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function PropertyDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { property, isLoading } = useSelector((state) => state.property)
  const { user } = useSelector((state) => state.auth)
  const [showGallery, setShowGallery] = useState(false)
  const [initialSlide, setInitialSlide] = useState(0)
  const [isSaved, setIsSaved] = useState(false)
  const [phoneUnlocked, setPhoneUnlocked] = useState(false)
  const [phoneRequestStatus, setPhoneRequestStatus] = useState(null)
  const [showContractModal, setShowContractModal] = useState(false)
  const [requestMessage, setRequestMessage] = useState('')
  const [contractForm, setContractForm] = useState({
    duration: '',
    moveInDate: '',
    message: ''
  })

  useEffect(() => {
    dispatch(getProperty(id))
  }, [dispatch, id])

  useEffect(() => {
    if (property && user) {
      // Check if property is saved
      checkIfSaved()
      // Check phone unlock status
      checkPhoneUnlockStatus()
    }
  }, [property, user])

  const checkIfSaved = async () => {
    if (!user) return
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/properties/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      // You'll need to add this field to the response
      setIsSaved(response.data.data.isSaved || false)
    } catch (error) {
      console.error('Error checking saved status:', error)
    }
  }

  const checkPhoneUnlockStatus = () => {
    if (!user || !property) return
    
    // Check if user is the owner
    if (property.owner._id === user._id) {
      setPhoneUnlocked(true)
      return
    }

    // Check if user has an approved request
    const userRequest = property.phoneUnlockRequests?.find(
      req => req.user === user._id || req.user?._id === user._id
    )

    if (userRequest) {
      setPhoneRequestStatus(userRequest.status)
      if (userRequest.status === 'approved') {
        setPhoneUnlocked(true)
      }
    }
  }

  const handleToggleSave = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    try {
      const token = localStorage.getItem('token')
      await axios.put(
        `${API_URL}/properties/${id}/save`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setIsSaved(!isSaved)
      toast.success(isSaved ? 'Removed from favorites' : 'Added to favorites')
    } catch (error) {
      console.error('Error toggling save:', error)
      toast.error('Failed to update favorites')
    }
  }

  const handleRequestPhoneUnlock = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    try {
      const token = localStorage.getItem('token')
      await axios.post(
        `${API_URL}/properties/${id}/request-phone`,
        { message: requestMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setPhoneRequestStatus('pending')
      setRequestMessage('')
      toast.success('Phone unlock request sent successfully')
    } catch (error) {
      console.error('Error requesting phone unlock:', error)
      toast.error(error.response?.data?.message || 'Failed to send request')
    }
  }

  const handleContractSubmit = async (e) => {
    e.preventDefault()
    
    if (!user) {
      navigate('/login')
      return
    }

    if (!contractForm.moveInDate) {
      toast.error('Please select a move-in date')
      return
    }

    if (property.listingType === 'rent' && !contractForm.duration) {
      toast.error('Please select rental duration')
      return
    }

    try {
      const token = localStorage.getItem('token')
      await axios.post(
        `${API_URL}/contracts/request`,
        {
          propertyId: property._id,
          contractType: property.listingType,
          moveInDate: contractForm.moveInDate,
          duration: contractForm.duration,
          message: contractForm.message
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      toast.success('Contract request submitted successfully!')
      setShowContractModal(false)
      setContractForm({ duration: '', moveInDate: '', message: '' })
      
      // Redirect to contracts page after a short delay
      setTimeout(() => {
        navigate('/contracts')
      }, 1500)
    } catch (error) {
      console.error('Error submitting contract request:', error)
      toast.error(error.response?.data?.message || 'Failed to submit contract request')
    }
  }

  const handleStartChat = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    const result = await dispatch(getOrCreateChat(id))
    if (result.payload) {
      navigate('/chats')
    }
  }

  const openGallery = (index) => {
    setInitialSlide(index)
    setShowGallery(true)
    document.body.style.overflow = 'hidden' // Prevent background scrolling
  }

  const closeGallery = () => {
    setShowGallery(false)
    document.body.style.overflow = 'auto' // Restore scrolling
  }

  if (isLoading || !property) return <Loader />

  const amenityIcons = {
    kitchen: FaUtensils,
    balcony: FaCouch,
    wifi: FaWifi,
    parking: FaParking,
    'parking area': FaParking,
    'smoking area': FaSmokingBan,
    garden: FaTree,
  }

  const getAmenityIcon = (amenity) => {
    const lowerAmenity = amenity.toLowerCase()
    const Icon = Object.keys(amenityIcons).find(key => lowerAmenity.includes(key))
    return Icon ? amenityIcons[Icon] : FaStar
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back button and Favorite button row */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to properties
          </button>
          <button
            onClick={handleToggleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-gray-300 hover:border-red-500 transition-colors group"
          >
            {isSaved ? (
              <FaHeart className="text-red-500 text-xl" />
            ) : (
              <FaRegHeart className="text-gray-600 group-hover:text-red-500 text-xl" />
            )}
            <span className="text-sm font-medium">
              {isSaved ? 'Saved' : 'Save Property'}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Main Info */}
          <div className="lg:col-span-2">
            {/* Image Gallery Grid */}
            <div className="mb-6">
              {/* Mobile Layout - Stacked */}
              <div className="block md:hidden">
                {/* Large Main Image */}
                <div 
                  className="relative rounded-2xl overflow-hidden cursor-pointer group mb-3 h-64"
                  onClick={() => openGallery(0)}
                >
                  <ImageWithShimmer
                    src={property.images[0]?.url || 'https://via.placeholder.com/800x600'}
                    alt={property.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                {/* Two Small Images Below */}
                {property.images.length > 1 && (
                  <div className="grid grid-cols-2 gap-3">
                    {property.images.slice(1, 3).map((img, index) => (
                      <div 
                        key={index}
                        className="relative rounded-2xl overflow-hidden cursor-pointer group h-32"
                        onClick={() => openGallery(index + 1)}
                      >
                        <ImageWithShimmer
                          src={img.url}
                          alt={`${property.title} ${index + 2}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {index === 1 && property.images.length > 3 && (
                          <div 
                            className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-10"
                            onClick={(e) => {
                              e.stopPropagation()
                              openGallery(0)
                            }}
                          >
                            <span className="text-white text-2xl font-bold">
                              {property.images.length}+
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Desktop/Tablet Layout - Large Left, Small Right */}
              <div className="hidden md:grid md:grid-cols-3 gap-3">
                {/* Large Main Image */}
                <div 
                  className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden cursor-pointer group"
                  onClick={() => openGallery(0)}
                >
                  <ImageWithShimmer
                    src={property.images[0]?.url || 'https://via.placeholder.com/800x600'}
                    alt={property.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                {/* Right Side Small Images */}
                {property.images.slice(1, 3).map((img, index) => (
                  <div 
                    key={index}
                    className="relative rounded-2xl overflow-hidden cursor-pointer group h-48"
                    onClick={() => openGallery(index + 1)}
                  >
                    <ImageWithShimmer
                      src={img.url}
                      alt={`${property.title} ${index + 2}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {index === 1 && property.images.length > 3 && (
                      <div 
                        className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-10"
                        onClick={(e) => {
                          e.stopPropagation()
                          openGallery(0)
                        }}
                      >
                        <span className="text-white text-3xl font-bold">
                          {property.images.length}+
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Property Title and Location */}
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                {property.title}
              </h1>
              <div className="flex items-center text-gray-500 mb-2">
                <FaMapMarkerAlt className="mr-2 text-gray-500" />
                <span>{property.location.address}, {property.location.city}, {property.location.state}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <FaStar className="text-yellow-500" />
                <span className="font-semibold">{property.averageRating || 5.0}</span>
              </div>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="inline-flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900">
                  ₹{property.price.toLocaleString()}
                </span>
                {property.listingType === 'rent' && (
                  <span className="text-lg text-gray-500">/month</span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Description:</h2>
              <p className="text-gray-700 leading-relaxed">
                {property.description}
              </p>
            </div>

            {/* Key Features / Amenities */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Key Features:</h2>
              
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3">
                    <FaBed className="text-gray-500 text-xl" />
                    <div>
                      <div className="font-semibold text-gray-900">{property.bedrooms} Beds</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaBath className="text-gray-500 text-xl" />
                    <div>
                      <div className="font-semibold text-gray-900">{property.bathrooms} Baths</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaRuler className="text-gray-500 text-xl" />
                    <div>
                      <div className="font-semibold text-gray-900">{property.area} sq ft</div>
                    </div>
                  </div>
                  {property.furnished && (
                    <div className="flex items-center gap-3">
                      <FaCouch className="text-gray-500 text-xl" />
                      <div>
                        <div className="font-semibold text-gray-900 capitalize">{property.furnished}</div>
                      </div>
                    </div>
                  )}
                </div>

                {property.amenities && property.amenities.length > 0 && (
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {property.amenities.map((amenity, index) => {
                      const Icon = getAmenityIcon(amenity)
                      return (
                        <div key={index} className="flex items-center gap-3">
                          <Icon className="text-gray-500 text-xl" />
                          <div className="font-semibold text-gray-900 capitalize">{amenity}</div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Areas & Lot */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Areas & Lot</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-500">Status</span>
                  <span className="font-semibold text-gray-900 capitalize">{property.listingType === 'rent' ? 'For Rent' : 'For Sale'}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-500">Location</span>
                  <span className="font-semibold text-gray-900">{property.location.city}, {property.location.state}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-500">Living Space</span>
                  <span className="font-semibold text-gray-900">{property.area} sq ft</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-500">Property Type</span>
                  <span className="font-semibold text-gray-900 capitalize">{property.propertyType}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Owner Contact Card */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-300 rounded-2xl p-6 sticky top-4 shadow-sm">
              {/* Owner Info */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
                {property.owner.profileImage ? (
                  <img
                    src={property.owner.profileImage}
                    alt={property.owner.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-2xl font-bold">
                    {property.owner.name?.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{property.owner.name}</h3>
                  <p className="text-sm text-gray-500">{property.location.city}</p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4 mb-6">
                {/* Phone Access Control */}
                {property.owner.phone && (
                  <>
                    {phoneUnlocked ? (
                      <>
                        <div>
                          <label className="text-sm text-gray-500 flex items-center gap-2 mb-1">
                            <FaUnlock className="text-green-600" /> Office Phone:
                          </label>
                          <a 
                            href={`tel:${property.owner.phone}`}
                            className="text-gray-900 font-semibold hover:text-gray-700 transition-colors"
                          >
                            {property.owner.phone}
                          </a>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500 flex items-center gap-2 mb-1">
                            <FaUnlock className="text-green-600" /> Mobile Phone:
                          </label>
                          <a 
                            href={`tel:${property.owner.phone}`}
                            className="text-gray-900 font-semibold hover:text-gray-700 transition-colors"
                          >
                            {property.owner.phone}
                          </a>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500 flex items-center gap-2 mb-1">
                            <FaUnlock className="text-green-600" /> WhatsApp:
                          </label>
                          <a 
                            href={`https://wa.me/${property.owner.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-900 font-semibold hover:text-gray-700 transition-colors"
                          >
                            {property.owner.phone}
                          </a>
                        </div>
                      </>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="mb-3">
                          <label className="text-sm text-gray-500 flex items-center gap-2 mb-1">
                            <FaLock className="text-gray-400" /> Phone Numbers:
                          </label>
                          <div className="text-gray-400 font-semibold">***-***-****</div>
                        </div>
                        
                        {phoneRequestStatus === 'pending' ? (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
                            <FaLock className="text-yellow-600" />
                            <div>
                              <p className="text-sm font-semibold text-yellow-800">Request Pending</p>
                              <p className="text-xs text-yellow-600">Waiting for owner's approval</p>
                            </div>
                          </div>
                        ) : phoneRequestStatus === 'rejected' ? (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                            <p className="text-sm font-semibold text-red-800">Request Rejected</p>
                            <p className="text-xs text-red-600">The owner declined your phone access request</p>
                          </div>
                        ) : (
                          <>
                            <textarea
                              value={requestMessage}
                              onChange={(e) => setRequestMessage(e.target.value)}
                              placeholder="Optional: Add a message for the property owner..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3 resize-none"
                              rows="3"
                            />
                            <button
                              onClick={handleRequestPhoneUnlock}
                              className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                            >
                              <FaLock />
                              Request Phone Access
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
                
                {/* Email always visible */}
                {property.owner.email && (
                  <div>
                    <label className="text-sm text-gray-500 block mb-1">Email:</label>
                    <a 
                      href={`mailto:${property.owner.email}`}
                      className="text-gray-900 font-semibold hover:text-gray-700 transition-colors break-all"
                    >
                      {property.owner.email}
                    </a>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mb-6">
                {/* Contract/Buy/Rent Button */}
                {user && user._id !== property.owner._id && (
                  <button
                    onClick={() => setShowContractModal(true)}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    <FaFileContract />
                    {property.listingType === 'rent' ? 'Rent Now' : 'Buy Now'}
                  </button>
                )}
                
                {/* Start Chat Button */}
                <button
                  onClick={handleStartChat}
                  className="w-full bg-gray-900 text-white py-4 rounded-xl font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                >
                  <FaComments />
                  Start Chat
                </button>
              </div>

              {/* Schedule Tour Section */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-bold text-gray-900 mb-2">Schedule tour</h4>
                <p className="text-sm text-gray-600 mb-4">
                  See your future home up close — book a tour with Real Nest today and let us help you find the perfect place!
                </p>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-700 block mb-1">Property ID</label>
                    <input 
                      type="text" 
                      value={property._id.slice(-6).toUpperCase()}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 font-mono text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-700 block mb-1">Property Name</label>
                    <input 
                      type="text" 
                      value={property.title}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-700 block mb-1">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="Your Name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Image Gallery Modal */}
        {showGallery && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center p-4">
            <button
              onClick={closeGallery}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 p-2 sm:p-3 bg-white rounded-full hover:bg-gray-100 transition-all shadow-lg"
            >
              <FaTimes className="text-xl sm:text-2xl text-gray-800" />
            </button>
            
            <div className="w-full max-w-6xl">
              <Splide
                options={{
                  type: 'loop',
                  perPage: 1,
                  perMove: 1,
                  gap: '1rem',
                  pagination: true,
                  arrows: true,
                  start: initialSlide,
                  heightRatio: 0.7,
                  cover: true,
                  breakpoints: {
                    640: {
                      arrows: false,
                      heightRatio: 0.8
                    }
                  }
                }}
              >
                {property.images.map((img, index) => (
                  <SplideSlide key={index}>
                    <div className="flex items-center justify-center h-full">
                      <ImageWithShimmer
                        src={img.url}
                        alt={`${property.title} ${index + 1}`}
                        className="max-h-[70vh] sm:max-h-[80vh] max-w-full object-contain rounded-lg"
                      />
                    </div>
                  </SplideSlide>
                ))}
              </Splide>
              
              <div className="text-center mt-2 sm:mt-4 text-white text-sm sm:text-base lg:text-lg px-4">
                {property.title}
              </div>
            </div>
          </div>
        )}

        {/* Contract Modal */}
        {showContractModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {property.listingType === 'rent' ? 'Rental' : 'Purchase'} Contract
                  </h2>
                  <button
                    onClick={() => setShowContractModal(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Property Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-bold text-gray-900 mb-2">Property Details</h3>
                  <p className="text-sm text-gray-600 mb-1"><strong>Title:</strong> {property.title}</p>
                  <p className="text-sm text-gray-600 mb-1"><strong>Location:</strong> {property.location.city}, {property.location.state}</p>
                  <p className="text-sm text-gray-600 mb-1"><strong>Price:</strong> ${property.price.toLocaleString()}{property.listingType === 'rent' ? '/month' : ''}</p>
                  <p className="text-sm text-gray-600"><strong>Type:</strong> {property.propertyType}</p>
                </div>

                {/* Contract Form */}
                <form onSubmit={handleContractSubmit} className="space-y-4">
                  {property.listingType === 'rent' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Rental Duration <span className="text-red-500">*</span>
                      </label>
                      <select 
                        value={contractForm.duration}
                        onChange={(e) => setContractForm({ ...contractForm, duration: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select duration</option>
                        <option value="1">1 Month</option>
                        <option value="3">3 Months</option>
                        <option value="6">6 Months</option>
                        <option value="12">1 Year</option>
                        <option value="24">2 Years</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Move-in Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={contractForm.moveInDate}
                      onChange={(e) => setContractForm({ ...contractForm, moveInDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Message to Owner
                    </label>
                    <textarea
                      value={contractForm.message}
                      onChange={(e) => setContractForm({ ...contractForm, message: e.target.value })}
                      rows="4"
                      placeholder="Introduce yourself and explain why you're interested in this property..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    ></textarea>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-bold text-blue-900 mb-2">Important Notes</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• This is a contract request, not a final agreement</li>
                      <li>• The property owner will review your request</li>
                      <li>• Further documentation may be required</li>
                      <li>• Payment terms will be discussed with the owner</li>
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowContractModal(false)}
                      className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
                    >
                      Submit Request
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PropertyDetails
