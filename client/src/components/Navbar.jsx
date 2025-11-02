import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../redux/slices/authSlice'
import { FaHome, FaUser, FaSignOutAlt, FaBuilding, FaComments, FaFileContract, FaBars, FaTimes } from 'react-icons/fa'

function Navbar() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
    setIsMobileMenuOpen(false)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  // Get initials from name for avatar fallback
  const getInitials = (name) => {
    if (!name) return '?'
    const words = name.trim().split(' ')
    if (words.length === 1) return words[0][0].toUpperCase()
    return (words[0][0] + words[words.length - 1][0]).toUpperCase()
  }

  return (
    <nav className="bg-white shadow-md border-b border-gray-100 sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 text-primary-600 hover:text-primary-700 transition-colors group">
            <div className="bg-gradient-to-br from-primary-500 to-green-500 p-2.5 rounded-xl group-hover:scale-105 transition-transform shadow-md">
              <FaHome className="text-white text-xl" />
            </div>
            <span className="font-bold text-2xl bg-gradient-to-r from-primary-600 to-green-600 bg-clip-text text-transparent">
              RealEstate
            </span>
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
          >
            <FaBars className="text-2xl" />
          </button>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-2">
            <Link 
              to="/properties" 
              className="px-5 py-2.5 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all font-medium"
            >
              Properties
            </Link>
            
            {user ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="px-5 py-2.5 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all font-medium"
                >
                  Dashboard
                </Link>
                
                {(user.role === 'owner' || user.role === 'admin') && (
                  <Link 
                    to="/my-properties" 
                    className="px-5 py-2.5 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all font-medium"
                  >
                    My Properties
                  </Link>
                )}
                
                <Link 
                  to="/chats" 
                  className="px-5 py-2.5 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all font-medium flex items-center gap-2"
                >
                  <FaComments />
                  <span>Chats</span>
                </Link>
                
                <Link 
                  to="/contracts" 
                  className="px-5 py-2.5 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all font-medium flex items-center gap-2"
                >
                  <FaFileContract />
                  <span>Contracts</span>
                </Link>
                
                {user.role === 'admin' && (
                  <Link 
                    to="/admin" 
                    className="px-5 py-2.5 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all font-medium"
                  >
                    Admin
                  </Link>
                )}
                
                {/* User Profile Section */}
                <div className="flex items-center space-x-3 ml-4 pl-4 border-l-2 border-gray-200">
                  <Link to="/profile" className="flex items-center space-x-3 group hover:bg-gray-50 px-3 py-2 rounded-xl transition-all">
                    {user.profileImage && user.profileImage !== 'https://via.placeholder.com/150' ? (
                      <img
                        src={user.profileImage}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-primary-200 group-hover:ring-primary-400 transition-all shadow-sm"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-bold ring-2 ring-primary-200 group-hover:ring-primary-400 transition-all shadow-sm">
                        {getInitials(user.name)}
                      </div>
                    )}
                    <div className="hidden lg:block">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {user.role}
                      </p>
                    </div>
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="p-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all"
                    title="Logout"
                  >
                    <FaSignOutAlt className="text-lg" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3 ml-4">
                <Link 
                  to="/login" 
                  className="px-5 py-2.5 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all font-medium"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-green-600 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-green-700 transition-all shadow-md hover:shadow-lg"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-green-50">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-primary-500 to-green-500 p-2.5 rounded-xl shadow-md">
                <FaHome className="text-white text-xl" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-primary-600 to-green-600 bg-clip-text text-transparent">
                RealEstate
              </span>
            </div>
            <button
              onClick={closeMobileMenu}
              className="p-2 text-gray-700 hover:text-primary-600 hover:bg-white rounded-xl transition-all"
            >
              <FaTimes className="text-2xl" />
            </button>
          </div>

          {/* User Profile Section (Mobile) */}
          {user && (
            <div className="p-6 bg-gradient-to-br from-primary-50 to-green-50 border-b border-gray-200">
              <Link 
                to="/profile" 
                onClick={closeMobileMenu}
                className="flex items-center space-x-4 group"
              >
                {user.profileImage && user.profileImage !== 'https://via.placeholder.com/150' ? (
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    className="w-16 h-16 rounded-full object-cover ring-4 ring-primary-200 group-hover:ring-primary-400 transition-all shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xl font-bold ring-4 ring-primary-200 group-hover:ring-primary-400 transition-all shadow-md">
                    {getInitials(user.name)}
                  </div>
                )}
                <div>
                  <p className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {user.name}
                  </p>
                  <p className="text-sm text-gray-600 capitalize">
                    {user.role}
                  </p>
                </div>
              </Link>
            </div>
          )}

          {/* Mobile Menu Links */}
          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-4">
              <Link
                to="/properties"
                onClick={closeMobileMenu}
                className="flex items-center space-x-3 px-4 py-3.5 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all font-medium"
              >
                <FaBuilding className="text-lg" />
                <span>Properties</span>
              </Link>

              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={closeMobileMenu}
                    className="flex items-center space-x-3 px-4 py-3.5 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all font-medium"
                  >
                    <FaUser className="text-lg" />
                    <span>Dashboard</span>
                  </Link>

                  {(user.role === 'owner' || user.role === 'admin') && (
                    <Link
                      to="/my-properties"
                      onClick={closeMobileMenu}
                      className="flex items-center space-x-3 px-4 py-3.5 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all font-medium"
                    >
                      <FaHome className="text-lg" />
                      <span>My Properties</span>
                    </Link>
                  )}

                  <Link
                    to="/chats"
                    onClick={closeMobileMenu}
                    className="flex items-center space-x-3 px-4 py-3.5 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all font-medium"
                  >
                    <FaComments className="text-lg" />
                    <span>Chats</span>
                  </Link>

                  <Link
                    to="/contracts"
                    onClick={closeMobileMenu}
                    className="flex items-center space-x-3 px-4 py-3.5 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all font-medium"
                  >
                    <FaFileContract className="text-lg" />
                    <span>Contracts</span>
                  </Link>

                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={closeMobileMenu}
                      className="flex items-center space-x-3 px-4 py-3.5 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all font-medium"
                    >
                      <FaUser className="text-lg" />
                      <span>Admin Panel</span>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="flex items-center space-x-3 px-4 py-3.5 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all font-medium"
                  >
                    <FaUser className="text-lg" />
                    <span>Login</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            {user ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-3 px-4 py-3.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg"
              >
                <FaSignOutAlt className="text-lg" />
                <span>Logout</span>
              </button>
            ) : (
              <Link
                to="/register"
                onClick={closeMobileMenu}
                className="w-full flex items-center justify-center space-x-3 px-4 py-3.5 bg-gradient-to-r from-primary-600 to-green-600 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-green-700 transition-all shadow-md hover:shadow-lg"
              >
                <FaUser className="text-lg" />
                <span>Sign Up</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeMobileMenu}
        ></div>
      )}
    </nav>
  )
}

export default Navbar
