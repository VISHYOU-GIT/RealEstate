import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Properties from './pages/Properties'
import PropertyDetails from './pages/PropertyDetails'
import Dashboard from './pages/Dashboard'
import MyProperties from './pages/MyProperties'
import CreateProperty from './pages/CreateProperty'
import EditProperty from './pages/EditProperty'
import SavedProperties from './pages/SavedProperties'
import Chats from './pages/Chats'
import Contracts from './pages/Contracts'
import ContractDetails from './pages/ContractDetails'
import AdminDashboard from './pages/AdminDashboard'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public routes */}
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="properties" element={<Properties />} />
        <Route path="properties/:id" element={<PropertyDetails />} />
        
        {/* Protected routes - All authenticated users */}
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="saved" element={<SavedProperties />} />
          <Route path="chats" element={<Chats />} />
          <Route path="contracts" element={<Contracts />} />
          <Route path="contracts/:id" element={<ContractDetails />} />
        </Route>
        
        {/* Protected routes - Owner only */}
        <Route element={<ProtectedRoute allowedRoles={['owner', 'admin']} />}>
          <Route path="my-properties" element={<MyProperties />} />
          <Route path="properties/create" element={<CreateProperty />} />
          <Route path="properties/edit/:id" element={<EditProperty />} />
        </Route>
        
        {/* Protected routes - Admin only */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="admin" element={<AdminDashboard />} />
        </Route>
        
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
