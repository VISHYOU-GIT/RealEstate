import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { getProperty, updateProperty } from '../redux/slices/propertySlice'
import { FaHome, FaMapMarkerAlt, FaDollarSign, FaCheckCircle } from 'react-icons/fa'
import Loader from '../components/Loader'
import toast from 'react-hot-toast'

function EditProperty() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { property, isLoading } = useSelector((state) => state.property)

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    propertyType: 'apartment',
    listingType: 'sale',
    price: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    latitude: '',
    longitude: '',
    images: '',
    amenities: [],
    accessibilityFeatures: [],
    sustainabilityTags: [],
    yearBuilt: '',
    parking: '',
    furnished: false
  })

  const amenitiesList = [
    'Pool', 'Gym', 'Garden', 'Balcony', 'Elevator', 'Security',
    'Air Conditioning', 'Heating', 'Fireplace', 'Pet Friendly',
    'Laundry', 'Internet', 'Cable TV', 'Garage'
  ]

  const accessibilityList = [
    'Wheelchair Accessible', 'Elevator', 'Ramp', 'Wide Doorways',
    'Accessible Bathroom', 'Ground Floor', 'Grab Bars', 'Visual Aids'
  ]

  const sustainabilityList = [
    'Solar Panels', 'Energy Efficient', 'Rainwater Harvesting',
    'Green Building', 'LED Lighting', 'Low-Flow Fixtures',
    'Recycling Center', 'Insulated Windows'
  ]

  useEffect(() => {
    dispatch(getProperty(id))
  }, [dispatch, id])

  useEffect(() => {
    if (property && property._id === id) {
      setFormData({
        title: property.title || '',
        description: property.description || '',
        propertyType: property.propertyType || 'apartment',
        listingType: property.listingType || 'sale',
        price: property.price || '',
        bedrooms: property.bedrooms || '',
        bathrooms: property.bathrooms || '',
        area: property.area || '',
        address: property.location?.address || '',
        city: property.location?.city || '',
        state: property.location?.state || '',
        zipCode: property.location?.zipCode || '',
        country: property.location?.country || 'USA',
        latitude: property.location?.coordinates?.[1] || '',
        longitude: property.location?.coordinates?.[0] || '',
        images: property.images?.join(', ') || '',
        amenities: property.amenities || [],
        accessibilityFeatures: property.accessibilityFeatures || [],
        sustainabilityTags: property.sustainabilityTags || [],
        yearBuilt: property.yearBuilt || '',
        parking: property.parking || '',
        furnished: property.furnished || false
      })
    }
  }, [property, id])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleArrayToggle = (field, value) => {
    setFormData({
      ...formData,
      [field]: formData[field].includes(value)
        ? formData[field].filter(item => item !== value)
        : [...formData[field], value]
    })
  }

  const handleNext = () => {
    if (step < 4) setStep(step + 1)
  }

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title || !formData.description || !formData.price) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const propertyData = {
        ...formData,
        price: parseFloat(formData.price),
        bedrooms: parseInt(formData.bedrooms) || 0,
        bathrooms: parseInt(formData.bathrooms) || 0,
        area: parseFloat(formData.area) || 0,
        yearBuilt: parseInt(formData.yearBuilt) || undefined,
        parking: parseInt(formData.parking) || 0,
        location: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
          coordinates: formData.latitude && formData.longitude
            ? [parseFloat(formData.longitude), parseFloat(formData.latitude)]
            : undefined
        },
        images: formData.images.split(',').map(url => url.trim()).filter(url => url)
      }

      await dispatch(updateProperty({ id, propertyData })).unwrap()
      navigate('/my-properties')
    } catch (error) {
      console.error('Update property error:', error)
    }
  }

  if (isLoading && !property) return <Loader />

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Edit Property</h1>
          <p className="text-gray-600">Update your property listing details</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="flex items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step >= num ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {step > num ? <FaCheckCircle /> : num}
                </div>
                {num < 4 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    step > num ? 'bg-primary-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span>Basic Info</span>
            <span>Location</span>
            <span>Details</span>
            <span>Features</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card">
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-center mb-6">
                  <FaHome className="text-2xl text-primary-600 mr-3" />
                  <h2 className="text-2xl font-bold">Basic Information</h2>
                </div>

                <div>
                  <label className="label">Property Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Modern 3BR Apartment in Downtown"
                    className="input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="label">Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe your property..."
                    rows="6"
                    className="input w-full"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Property Type *</label>
                    <select
                      name="propertyType"
                      value={formData.propertyType}
                      onChange={handleChange}
                      className="input w-full"
                      required
                    >
                      <option value="apartment">Apartment</option>
                      <option value="house">House</option>
                      <option value="villa">Villa</option>
                      <option value="condo">Condo</option>
                      <option value="land">Land</option>
                      <option value="commercial">Commercial</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Listing Type *</label>
                    <select
                      name="listingType"
                      value={formData.listingType}
                      onChange={handleChange}
                      className="input w-full"
                      required
                    >
                      <option value="sale">For Sale</option>
                      <option value="rent">For Rent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Price * ($)</label>
                  <div className="relative">
                    <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="Enter price"
                      className="input w-full pl-10"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center mb-6">
                  <FaMapMarkerAlt className="text-2xl text-primary-600 mr-3" />
                  <h2 className="text-2xl font-bold">Location Details</h2>
                </div>

                <div>
                  <label className="label">Street Address *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="123 Main Street"
                    className="input w-full"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">City *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="New York"
                      className="input w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">State *</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="NY"
                      className="input w-full"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">ZIP Code *</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                      placeholder="10001"
                      className="input w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">Country *</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      placeholder="USA"
                      className="input w-full"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Latitude (Optional)</label>
                    <input
                      type="number"
                      step="any"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleChange}
                      placeholder="40.7128"
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="label">Longitude (Optional)</label>
                    <input
                      type="number"
                      step="any"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleChange}
                      placeholder="-74.0060"
                      className="input w-full"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Property Details */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Property Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Bedrooms</label>
                    <input
                      type="number"
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleChange}
                      placeholder="3"
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="label">Bathrooms</label>
                    <input
                      type="number"
                      name="bathrooms"
                      value={formData.bathrooms}
                      onChange={handleChange}
                      placeholder="2"
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="label">Area (sq ft)</label>
                    <input
                      type="number"
                      name="area"
                      value={formData.area}
                      onChange={handleChange}
                      placeholder="1500"
                      className="input w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Year Built</label>
                    <input
                      type="number"
                      name="yearBuilt"
                      value={formData.yearBuilt}
                      onChange={handleChange}
                      placeholder="2020"
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="label">Parking Spaces</label>
                    <input
                      type="number"
                      name="parking"
                      value={formData.parking}
                      onChange={handleChange}
                      placeholder="2"
                      className="input w-full"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="furnished"
                    name="furnished"
                    checked={formData.furnished}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <label htmlFor="furnished" className="label mb-0">
                    Furnished Property
                  </label>
                </div>

                <div>
                  <label className="label">Property Images (URLs, comma-separated)</label>
                  <textarea
                    name="images"
                    value={formData.images}
                    onChange={handleChange}
                    placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                    rows="3"
                    className="input w-full"
                  />
                  <p className="text-sm text-gray-500 mt-1">Enter image URLs separated by commas</p>
                </div>
              </div>
            )}

            {/* Step 4: Features & Amenities */}
            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Features & Amenities</h2>

                <div>
                  <label className="label mb-3">Amenities</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {amenitiesList.map((amenity) => (
                      <div key={amenity} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`amenity-${amenity}`}
                          checked={formData.amenities.includes(amenity)}
                          onChange={() => handleArrayToggle('amenities', amenity)}
                          className="w-4 h-4"
                        />
                        <label htmlFor={`amenity-${amenity}`} className="text-sm">
                          {amenity}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label mb-3">Accessibility Features</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {accessibilityList.map((feature) => (
                      <div key={feature} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`accessibility-${feature}`}
                          checked={formData.accessibilityFeatures.includes(feature)}
                          onChange={() => handleArrayToggle('accessibilityFeatures', feature)}
                          className="w-4 h-4"
                        />
                        <label htmlFor={`accessibility-${feature}`} className="text-sm">
                          {feature}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label mb-3">Sustainability Tags</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {sustainabilityList.map((tag) => (
                      <div key={tag} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`sustainability-${tag}`}
                          checked={formData.sustainabilityTags.includes(tag)}
                          onChange={() => handleArrayToggle('sustainabilityTags', tag)}
                          className="w-4 h-4"
                        />
                        <label htmlFor={`sustainability-${tag}`} className="text-sm">
                          {tag}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <button
                type="button"
                onClick={handlePrevious}
                className="btn btn-secondary"
                disabled={step === 1}
              >
                Previous
              </button>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/my-properties')}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="btn btn-primary"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary"
                  >
                    {isLoading ? 'Updating...' : 'Update Property'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditProperty
