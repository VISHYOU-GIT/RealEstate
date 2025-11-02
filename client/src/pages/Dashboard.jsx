import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { FaBuilding, FaHeart, FaComments, FaFileContract } from 'react-icons/fa'

function Dashboard() {
  const { user } = useSelector((state) => state.auth)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <h1 className="text-3xl font-bold mb-8">Welcome, {user?.name}!</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(user?.role === 'owner' || user?.role === 'admin') && (
            <Link to="/my-properties" className="card hover:shadow-lg transition">
              <FaBuilding className="text-4xl text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold">My Properties</h3>
              <p className="text-gray-600 mt-2">Manage your listings</p>
            </Link>
          )}

          <Link to="/saved" className="card hover:shadow-lg transition">
            <FaHeart className="text-4xl text-red-500 mb-4" />
            <h3 className="text-xl font-semibold">Saved Properties</h3>
            <p className="text-gray-600 mt-2">View your saved homes</p>
          </Link>

          <Link to="/chats" className="card hover:shadow-lg transition">
            <FaComments className="text-4xl text-green-500 mb-4" />
            <h3 className="text-xl font-semibold">Messages</h3>
            <p className="text-gray-600 mt-2">Chat with owners/buyers</p>
          </Link>

          <Link to="/contracts" className="card hover:shadow-lg transition">
            <FaFileContract className="text-4xl text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold">Contracts</h3>
            <p className="text-gray-600 mt-2">View your contracts</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
