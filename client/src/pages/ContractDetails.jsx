import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { getContract, signContract, downloadPDF } from '../redux/slices/contractSlice'
import Loader from '../components/Loader'
import { FaFileContract, FaDownload, FaCheckCircle, FaSignature, FaHome } from 'react-icons/fa'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

function ContractDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { contract, isLoading } = useSelector((state) => state.contract)
  const { user } = useSelector((state) => state.auth)
  const [signing, setSigning] = useState(false)

  useEffect(() => {
    dispatch(getContract(id))
  }, [dispatch, id])

  const handleSign = async () => {
    if (!confirm('Are you sure you want to sign this contract? This action cannot be undone.')) {
      return
    }

    setSigning(true)
    try {
      await dispatch(signContract(id)).unwrap()
      dispatch(getContract(id)) // Refresh contract
    } catch (error) {
      console.error('Sign error:', error)
    } finally {
      setSigning(false)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      await dispatch(downloadPDF(id)).unwrap()
    } catch (error) {
      console.error('Download error:', error)
    }
  }

  const canSign = () => {
    if (!contract || !user) return false
    
    const isOwner = contract.owner?._id === user.id || contract.owner?._id === user._id
    const isTenant = contract.tenant?._id === user.id || contract.tenant?._id === user._id
    
    if (isOwner) {
      return !contract.ownerSignature?.signed
    }
    if (isTenant) {
      return !contract.tenantSignature?.signed
    }
    return false
  }

  if (isLoading || !contract) return <Loader />

  const isOwner = contract.owner?._id === user?.id || contract.owner?._id === user?._id
  const isTenant = contract.tenant?._id === user?.id || contract.tenant?._id === user?._id

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <button
          onClick={() => navigate('/contracts')}
          className="btn btn-secondary mb-6"
        >
          ← Back to Contracts
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Contract Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold flex items-center">
                  <FaFileContract className="mr-3 text-primary-600" />
                  Contract Details
                </h1>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  contract.status === 'active' || contract.status === 'signed' 
                    ? 'bg-green-100 text-green-800'
                    : contract.status === 'pending' 
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {contract.status.toUpperCase()}
                </span>
              </div>

              {/* Property Info */}
              <div className="border-b pb-6 mb-6">
                <h2 className="text-lg font-semibold mb-3 flex items-center">
                  <FaHome className="mr-2 text-primary-600" />
                  Property Information
                </h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">{contract.property?.title}</h3>
                  <p className="text-gray-600 mb-2">{contract.property?.location?.address}</p>
                  <p className="text-gray-600">
                    {contract.property?.location?.city}, {contract.property?.location?.state}
                  </p>
                </div>
              </div>

              {/* Contract Terms */}
              <div className="border-b pb-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Contract Terms</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Contract Type</p>
                    <p className="font-semibold capitalize">{contract.contractType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="font-semibold text-xl text-primary-600">
                      {contract.currency} {contract.amount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Security Deposit</p>
                    <p className="font-semibold">
                      {contract.currency} {contract.securityDeposit.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Frequency</p>
                    <p className="font-semibold capitalize">{contract.paymentFrequency}</p>
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
                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="font-semibold capitalize">{contract.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-semibold">
                      {Math.ceil((new Date(contract.endDate) - new Date(contract.startDate)) / (1000 * 60 * 60 * 24 * 30))} months
                    </p>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              {contract.terms && (
                <div className="border-b pb-6 mb-6">
                  <h2 className="text-lg font-semibold mb-3">Terms & Conditions</h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{contract.terms}</p>
                  </div>
                </div>
              )}

              {/* Special Conditions */}
              {contract.specialConditions && (
                <div className="border-b pb-6 mb-6">
                  <h2 className="text-lg font-semibold mb-3">Special Conditions</h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{contract.specialConditions}</p>
                  </div>
                </div>
              )}

              {/* Signatures */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Signatures</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg border-2 ${
                    contract.ownerSignature?.signed 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-300 bg-gray-50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Owner</h3>
                      {contract.ownerSignature?.signed && (
                        <FaCheckCircle className="text-green-500 text-xl" />
                      )}
                    </div>
                    <p className="text-gray-700 font-medium">{contract.owner?.name}</p>
                    <p className="text-sm text-gray-600">{contract.owner?.email}</p>
                    {contract.ownerSignature?.signed ? (
                      <p className="text-sm text-green-600 mt-2">
                        Signed on {format(new Date(contract.ownerSignature.signedAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 mt-2">Not signed yet</p>
                    )}
                  </div>

                  <div className={`p-4 rounded-lg border-2 ${
                    contract.tenantSignature?.signed 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-300 bg-gray-50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Tenant</h3>
                      {contract.tenantSignature?.signed && (
                        <FaCheckCircle className="text-green-500 text-xl" />
                      )}
                    </div>
                    <p className="text-gray-700 font-medium">{contract.tenant?.name}</p>
                    <p className="text-sm text-gray-600">{contract.tenant?.email}</p>
                    {contract.tenantSignature?.signed ? (
                      <p className="text-sm text-green-600 mt-2">
                        Signed on {format(new Date(contract.tenantSignature.signedAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 mt-2">Not signed yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            <div className="card sticky top-4">
              <h3 className="font-semibold mb-4">Actions</h3>
              <div className="space-y-3">
                {canSign() && (
                  <button
                    onClick={handleSign}
                    disabled={signing}
                    className="btn btn-primary w-full flex items-center justify-center"
                  >
                    <FaSignature className="mr-2" />
                    {signing ? 'Signing...' : 'Sign Contract'}
                  </button>
                )}

                <button
                  onClick={handleDownloadPDF}
                  className="btn btn-secondary w-full flex items-center justify-center"
                >
                  <FaDownload className="mr-2" />
                  Download PDF
                </button>
              </div>

              {canSign() && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> By signing this contract, you agree to all the terms and conditions stated above.
                  </p>
                </div>
              )}

              {contract.ownerSignature?.signed && contract.tenantSignature?.signed && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800">
                    <strong>Contract Active!</strong> Both parties have signed this contract.
                  </p>
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="font-semibold mb-4">Contract ID</h3>
              <p className="text-xs text-gray-600 break-all">{contract._id}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContractDetails
