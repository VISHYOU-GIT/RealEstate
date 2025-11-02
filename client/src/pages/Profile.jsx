import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getProfile, updateProfile, updatePassword } from '../redux/slices/authSlice'
import Loader from '../components/Loader'
import { FaUser, FaEnvelope, FaPhone, FaLock, FaEdit, FaSave, FaTimes, FaCamera } from 'react-icons/fa'
import toast from 'react-hot-toast'

function Profile() {
  const dispatch = useDispatch()
  const { user, isLoading } = useSelector((state) => state.auth)

  const [editMode, setEditMode] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    profileImage: ''
  })

  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    dispatch(getProfile())
  }, [dispatch])

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        profileImage: user.profileImage || ''
      })
      setImagePreview(user.profileImage || null)
    }
  }, [user])

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileData({
      ...profileData,
      [name]: value
    })
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData({
      ...passwordData,
      [name]: value
    })
  }

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB')
        return
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }

      setSelectedImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const uploadImageToCloudinary = async (file) => {
    try {
      const base64 = await fileToBase64(file)
      
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/upload-profile-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ image: base64 })
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      return data.data.imageUrl
    } catch (error) {
      console.error('Image upload error:', error)
      throw new Error('Failed to upload image')
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    
    try {
      setIsUploadingImage(true)
      let imageUrl = profileData.profileImage

      // Upload image if a new one is selected
      if (selectedImage) {
        toast.loading('Uploading profile picture...')
        imageUrl = await uploadImageToCloudinary(selectedImage)
        toast.dismiss()
      }

      await dispatch(updateProfile({
        ...profileData,
        profileImage: imageUrl
      })).unwrap()
      
      setEditMode(false)
      setSelectedImage(null)
    } catch (error) {
      console.error('Update profile error:', error)
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleCancelEdit = () => {
    setProfileData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      profileImage: user.profileImage || ''
    })
    setImagePreview(user.profileImage || null)
    setSelectedImage(null)
    setEditMode(false)
  }

  // Get initials from name for avatar fallback
  const getInitials = (name) => {
    if (!name) return '?'
    const words = name.trim().split(' ')
    if (words.length === 1) return words[0][0].toUpperCase()
    return (words[0][0] + words[words.length - 1][0]).toUpperCase()
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    try {
      await dispatch(updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })).unwrap()

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      console.error('Update password error:', error)
    }
  }

  if (isLoading && !user) return <Loader />

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Personal Information</h2>
                {!editMode && (
                  <button
                    onClick={() => setEditMode(true)}
                    className="btn btn-secondary flex items-center"
                  >
                    <FaEdit className="mr-2" />
                    Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveProfile}>
                {/* Profile Picture Section */}
                <div className="flex items-center space-x-6 mb-6 pb-6 border-b">
                  <div className="relative">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-4 border-primary-200"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-3xl font-bold border-4 border-primary-200">
                        {getInitials(profileData.name || user?.name)}
                      </div>
                    )}
                    {editMode && (
                      <label
                        htmlFor="profileImage"
                        className="absolute bottom-0 right-0 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-2 cursor-pointer shadow-lg transition-colors"
                      >
                        <FaCamera className="text-sm" />
                        <input
                          type="file"
                          id="profileImage"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{profileData.name || user?.name}</h3>
                    <p className="text-gray-600">{profileData.email || user?.email}</p>
                    {editMode && (
                      <p className="text-sm text-gray-500 mt-2">
                        Click the camera icon to upload a new profile picture
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="label">Full Name</label>
                    <div className="relative">
                      <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        name="name"
                        value={profileData.name}
                        onChange={handleProfileChange}
                        disabled={!editMode}
                        className="input w-full pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Email Address</label>
                    <div className="relative">
                      <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={profileData.email}
                        onChange={handleProfileChange}
                        disabled={!editMode}
                        className="input w-full pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Phone Number</label>
                    <div className="relative">
                      <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleProfileChange}
                        disabled={!editMode}
                        placeholder="Enter phone number"
                        className="input w-full pl-10"
                      />
                    </div>
                  </div>
                </div>

                {editMode && (
                  <div className="flex space-x-3 mt-6">
                    <button
                      type="submit"
                      disabled={isLoading || isUploadingImage}
                      className="btn btn-primary flex items-center"
                    >
                      <FaSave className="mr-2" />
                      {isUploadingImage ? 'Uploading...' : isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={isUploadingImage}
                      className="btn btn-secondary flex items-center"
                    >
                      <FaTimes className="mr-2" />
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Change Password */}
            <div className="card">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <FaLock className="mr-2 text-primary-600" />
                Change Password
              </h2>

              <form onSubmit={handleChangePassword}>
                <div className="space-y-4">
                  <div>
                    <label className="label">Current Password</label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="input w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="input w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">Confirm New Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="input w-full"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary mt-6"
                >
                  {isLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* User Stats */}
            <div className="card">
              <h3 className="font-semibold mb-4">Account Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="font-semibold capitalize">{user?.role || 'User'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Reputation Score</p>
                  <p className="font-semibold">{user?.reputation || 0} points</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="font-semibold">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <a href="/my-properties" className="block w-full btn btn-secondary text-center">
                  My Properties
                </a>
                <a href="/saved-properties" className="block w-full btn btn-secondary text-center">
                  Saved Properties
                </a>
                <a href="/contracts" className="block w-full btn btn-secondary text-center">
                  My Contracts
                </a>
                <a href="/chats" className="block w-full btn btn-secondary text-center">
                  Messages
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
