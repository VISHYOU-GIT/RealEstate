import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { getContracts } from '../redux/slices/contractSlice'
import Loader from '../components/Loader'
import { FaFileContract, FaDownload, FaEye, FaCheckCircle, FaClock, FaTimesCircle } from 'react-icons/fa'
import { format } from 'date-fns'

function Contracts() {
  const dispatch = useDispatch()
  const { contracts, isLoading } = useSelector((state) => state.contract)
  const { user } = useSelector((state) => state.auth)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    dispatch(getContracts())
  }, [dispatch])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'signed':
      case 'active':
        return <FaCheckCircle className="text-green-500" />
      case 'pending':
      case 'draft':
        return <FaClock className="text-yellow-500" />
      case 'expired':
      case 'terminated':
        return <FaTimesCircle className="text-red-500" />
      default:
        return <FaFileContract className="text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'signed':
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'expired':
      case 'terminated':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredContracts = contracts.filter(contract => {
    if (filter === 'all') return true
    return contract.status === filter
  })

  if (isLoading) return <Loader />

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Contracts</h1>
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">Filter:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="signed">Signed</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {filteredContracts.length === 0 ? (
          <div className="card text-center py-12">
            <FaFileContract className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Contracts Found</h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? "You don't have any contracts yet."
                : `No ${filter} contracts found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredContracts.map((contract) => (
              <div key={contract._id} className="card hover:shadow-lg transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className="text-2xl mr-3">
                        {getStatusIcon(contract.status)}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">
                          {contract.property?.title || 'Property Contract'}
                        </h3>
                        <p className="text-gray-600">
                          {contract.property?.location?.city}, {contract.property?.location?.state}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-500">Type</p>
                        <p className="font-semibold capitalize">{contract.contractType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Amount</p>
                        <p className="font-semibold">
                          {contract.currency} {contract.amount.toLocaleString()}
                          {contract.contractType === 'rent' && (
                            <span className="text-sm text-gray-600">/{contract.paymentFrequency}</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Start Date</p>
                        <p className="font-semibold">
                          {format(new Date(contract.startDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">End Date</p>
                        <p className="font-semibold">
                          {format(new Date(contract.endDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center mt-4 space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {user?._id === contract.owner?._id ? 'Tenant' : 'Owner'}:
                        </span>
                        <span className="font-medium">
                          {user?._id === contract.owner?._id 
                            ? contract.tenant?.name 
                            : contract.owner?.name}
                        </span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(contract.status)}`}>
                        {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                      </span>
                    </div>

                    {contract.status === 'pending' && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-sm text-yellow-800">
                          <strong>Signatures:</strong>
                          {' '}Owner: {contract.ownerSignature?.signed ? '✓ Signed' : '⏳ Pending'}
                          {' | '}
                          Tenant: {contract.tenantSignature?.signed ? '✓ Signed' : '⏳ Pending'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <Link
                      to={`/contracts/${contract._id}`}
                      className="btn btn-primary flex items-center justify-center"
                    >
                      <FaEye className="mr-2" />
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Contracts
