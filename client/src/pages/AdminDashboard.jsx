import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import axios from 'axios'
import Loader from '../components/Loader'
import { 
  FaUsers, FaHome, FaFileContract, FaChartLine,
  FaCheckCircle, FaTimesCircle, FaToggleOn, FaToggleOff,
  FaTrash, FaEye, FaSearch, FaFilter, FaFileExport,
  FaCheck, FaTimes
} from 'react-icons/fa'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function AdminDashboard() {
  const { user } = useSelector((state) => state.auth)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [properties, setProperties] = useState([])
  const [contracts, setContracts] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedItems, setSelectedItems] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const config = { headers: { Authorization: `Bearer ${token}` } }

      const [statsRes, usersRes, propertiesRes, contractsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/analytics`, config),
        axios.get(`${API_URL}/admin/users`, config),
        axios.get(`${API_URL}/admin/properties`, config),
        axios.get(`${API_URL}/admin/contracts`, config)
      ])

      console.log('Stats Response:', statsRes.data)
      console.log('Users Response:', usersRes.data)
      console.log('Properties Response:', propertiesRes.data)
      console.log('Contracts Response:', contractsRes.data)

      // Extract data from nested response structure
      setStats(statsRes.data.data?.summary || statsRes.data.summary)
      
      // Handle response structure: data: { users: [...], properties: [...], contracts: [...] }
      const usersData = usersRes.data.data?.users || []
      const propertiesData = propertiesRes.data.data?.properties || []
      const contractsData = contractsRes.data.data?.contracts || []
      
      console.log('Parsed Users:', usersData)
      console.log('Parsed Properties:', propertiesData)
      console.log('Parsed Contracts:', contractsData)
      
      setUsers(Array.isArray(usersData) ? usersData : [])
      setProperties(Array.isArray(propertiesData) ? propertiesData : [])
      setContracts(Array.isArray(contractsData) ? contractsData : [])
    } catch (error) {
      console.error('Error fetching admin data:', error)
      toast.error('Failed to load admin data')
      setUsers([])
      setProperties([])
      setContracts([])
    } finally {
      setLoading(false)
    }
  }

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('token')
      const action = currentStatus ? 'deactivate' : 'activate'
      await axios.put(
        `${API_URL}/admin/users/${userId}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success(`User ${action}d successfully`)
      fetchData()
    } catch (error) {
      console.error('Error toggling user status:', error)
      toast.error('Failed to update user status')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return
    
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_URL}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('User deleted successfully')
      fetchData()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    }
  }

  const handleChangeRole = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('token')
      await axios.put(
        `${API_URL}/admin/users/${userId}/change-role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success(`Role changed to ${newRole} successfully`)
      fetchData()
    } catch (error) {
      console.error('Error changing role:', error)
      toast.error('Failed to change role')
    }
  }

  const handleApproveProperty = async (propertyId) => {
    try {
      const token = localStorage.getItem('token')
      await axios.put(
        `${API_URL}/admin/properties/${propertyId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success('Property approved successfully')
      fetchData()
    } catch (error) {
      console.error('Error approving property:', error)
      toast.error('Failed to approve property')
    }
  }

  const handleRejectProperty = async (propertyId) => {
    const reason = window.prompt('Enter rejection reason:')
    if (!reason) return

    try {
      const token = localStorage.getItem('token')
      await axios.put(
        `${API_URL}/admin/properties/${propertyId}/reject`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success('Property rejected successfully')
      fetchData()
    } catch (error) {
      console.error('Error rejecting property:', error)
      toast.error('Failed to reject property')
    }
  }

  const handleDeleteProperty = async (propertyId) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return

    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_URL}/admin/properties/${propertyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Property deleted successfully')
      fetchData()
    } catch (error) {
      console.error('Error deleting property:', error)
      toast.error('Failed to delete property')
    }
  }

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleSelectAll = (items) => {
    if (selectedItems.length === items.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(items.map(item => item._id))
    }
  }

  const handleBulkApprove = async () => {
    if (selectedItems.length === 0) {
      toast.error('No properties selected')
      return
    }

    try {
      const token = localStorage.getItem('token')
      await axios.post(
        `${API_URL}/admin/properties/bulk-approve`,
        { propertyIds: selectedItems },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success(`${selectedItems.length} properties approved successfully`)
      setSelectedItems([])
      fetchData()
    } catch (error) {
      console.error('Error bulk approving:', error)
      toast.error('Failed to approve properties')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      toast.error('No properties selected')
      return
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedItems.length} properties?`)) return

    try {
      const token = localStorage.getItem('token')
      await axios.post(
        `${API_URL}/admin/properties/bulk-delete`,
        { propertyIds: selectedItems },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success(`${selectedItems.length} properties deleted successfully`)
      setSelectedItems([])
      fetchData()
    } catch (error) {
      console.error('Error bulk deleting:', error)
      toast.error('Failed to delete properties')
    }
  }

  const handleExport = async (type) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/admin/${type}/export`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${type}-${Date.now()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success(`${type} exported successfully`)
    } catch (error) {
      console.error(`Error exporting ${type}:`, error)
      toast.error(`Failed to export ${type}`)
    }
  }

  const filteredProperties = Array.isArray(properties) 
    ? properties.filter(property => {
        const matchesSearch = property.title?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'all' || property.status === statusFilter
        return matchesSearch && matchesStatus
      })
    : []

  if (loading) return <Loader />

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, properties, and contracts</p>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon={FaUsers} title="Total Users" value={stats.totalUsers || 0} color="blue" />
            <StatCard icon={FaHome} title="Total Properties" value={stats.totalProperties || 0} color="green" />
            <StatCard icon={FaFileContract} title="Active Contracts" value={stats.activeContracts || 0} color="purple" />
            <StatCard icon={FaChartLine} title="Pending Contracts" value={stats.pendingContracts || 0} color="orange" />
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              <TabButton
                active={activeTab === 'overview'}
                onClick={() => setActiveTab('overview')}
                icon={FaChartLine}
                label="Overview"
              />
              <TabButton
                active={activeTab === 'users'}
                onClick={() => setActiveTab('users')}
                icon={FaUsers}
                label="Users"
              />
              <TabButton
                active={activeTab === 'properties'}
                onClick={() => setActiveTab('properties')}
                icon={FaHome}
                label="Properties"
              />
              <TabButton
                active={activeTab === 'contracts'}
                onClick={() => setActiveTab('contracts')}
                icon={FaFileContract}
                label="Contracts"
              />
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <OverviewTab stats={stats} />
            )}

            {activeTab === 'users' && (
              <UsersTab
                users={users}
                onToggleStatus={handleToggleUserStatus}
                onDelete={handleDeleteUser}
                onChangeRole={handleChangeRole}
                onExport={() => handleExport('users')}
              />
            )}

            {activeTab === 'properties' && (
              <PropertiesTab
                properties={filteredProperties}
                selectedItems={selectedItems}
                onSelectItem={handleSelectItem}
                onSelectAll={() => handleSelectAll(filteredProperties)}
                onApprove={handleApproveProperty}
                onReject={handleRejectProperty}
                onDelete={handleDeleteProperty}
                onBulkApprove={handleBulkApprove}
                onBulkDelete={handleBulkDelete}
                onExport={() => handleExport('properties')}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
              />
            )}

            {activeTab === 'contracts' && (
              <ContractsTab
                contracts={contracts}
                onExport={() => handleExport('contracts')}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, title, value, color }) {
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`p-4 rounded-lg ${colors[color]}`}>
          <Icon className="text-2xl text-white" />
        </div>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 py-4 border-b-2 font-medium transition-colors ${
        active
          ? 'border-primary-600 text-primary-600'
          : 'border-transparent text-gray-600 hover:text-gray-900'
      }`}
    >
      <Icon />
      {label}
    </button>
  )
}

function OverviewTab({ stats }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Users</span>
              <span className="font-semibold">{stats?.totalUsers || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Properties</span>
              <span className="font-semibold">{stats?.totalProperties || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Contracts</span>
              <span className="font-semibold">{stats?.activeContracts || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pending Contracts</span>
              <span className="font-semibold">{stats?.pendingContracts || 0}</span>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-500" />
              <span className="text-gray-600">All Systems Operational</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-500" />
              <span className="text-gray-600">Database Connected</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-500" />
              <span className="text-gray-600">API Services Running</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function UsersTab({ users, onToggleStatus, onDelete, onChangeRole, onExport }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Users Management</h2>
        <button
          onClick={onExport}
          className="btn btn-primary flex items-center gap-2"
        >
          <FaFileExport />
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {Array.isArray(users) && users.length > 0 ? users.map((user) => (
              <tr key={user._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {user.profilePicture?.url ? (
                        <img
                          src={user.profilePicture.url}
                          alt={user.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.parentElement.innerHTML = `<span class="text-gray-600 font-semibold text-sm">${user.name?.charAt(0).toUpperCase() || 'U'}</span>`
                          }}
                        />
                      ) : (
                        <span className="text-gray-600 font-semibold text-sm">
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.role}
                    onChange={(e) => onChangeRole(user._id, e.target.value)}
                    className="text-sm border-gray-300 rounded-md"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => onToggleStatus(user._id, user.isActive)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    {user.isActive ? <FaToggleOn size={20} /> : <FaToggleOff size={20} />}
                  </button>
                  <button
                    onClick={() => onDelete(user._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PropertiesTab({
  properties,
  selectedItems,
  onSelectItem,
  onSelectAll,
  onApprove,
  onReject,
  onDelete,
  onBulkApprove,
  onBulkDelete,
  onExport,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Properties Management</h2>
        
        <div className="flex gap-2 flex-wrap">
          {selectedItems.length > 0 && (
            <>
              <button
                onClick={onBulkApprove}
                className="btn bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
              >
                <FaCheck />
                Approve Selected ({selectedItems.length})
              </button>
              <button
                onClick={onBulkDelete}
                className="btn bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
              >
                <FaTrash />
                Delete Selected ({selectedItems.length})
              </button>
            </>
          )}
          <button
            onClick={onExport}
            className="btn btn-primary flex items-center gap-2"
          >
            <FaFileExport />
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
        </div>
        <div className="min-w-[200px]">
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input pl-10 w-full"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedItems.length === properties.length && properties.length > 0}
                  onChange={onSelectAll}
                  className="rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Property
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Owner
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {Array.isArray(properties) && properties.length > 0 ? properties.map((property) => (
              <tr key={property._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(property._id)}
                    onChange={() => onSelectItem(property._id)}
                    className="rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center overflow-hidden">
                      {property.images?.[0]?.url ? (
                        <img
                          src={property.images[0].url}
                          alt={property.title}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.parentElement.innerHTML = '<span class="text-gray-500 text-xs">No Image</span>'
                          }}
                        />
                      ) : (
                        <span className="text-gray-500 text-xs">No Image</span>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{property.title}</div>
                      <div className="text-sm text-gray-500">
                        {property.location?.city}, {property.location?.state}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {property.owner?.name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {property.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₹{property.price?.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    property.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : property.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {property.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <Link
                    to={`/properties/${property._id}`}
                    className="text-blue-600 hover:text-blue-900 inline-block"
                  >
                    <FaEye />
                  </Link>
                  {property.status === 'pending' && (
                    <>
                      <button
                        onClick={() => onApprove(property._id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <FaCheckCircle />
                      </button>
                      <button
                        onClick={() => onReject(property._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FaTimesCircle />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => onDelete(property._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  No properties found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ContractsTab({ contracts, onExport }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Contracts Management</h2>
        <button
          onClick={onExport}
          className="btn btn-primary flex items-center gap-2"
        >
          <FaFileExport />
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contract ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Property
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tenant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Landlord
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Monthly Rent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {Array.isArray(contracts) && contracts.length > 0 ? contracts.map((contract) => (
              <tr key={contract._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                  {contract._id?.slice(-8)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {contract.property?.title || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {contract.tenant?.name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {contract.landlord?.name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₹{contract.monthlyRent?.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    contract.status === 'signed'
                      ? 'bg-green-100 text-green-800'
                      : contract.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : contract.status === 'active'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {contract.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link
                    to={`/contracts/${contract._id}`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <FaEye />
                  </Link>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  No contracts found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminDashboard
