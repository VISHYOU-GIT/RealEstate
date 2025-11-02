import { Link } from 'react-router-dom'
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa'

function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">RealEstate</h3>
            <p className="text-gray-400">
              Find your perfect home with our comprehensive real estate platform.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/properties" className="text-gray-400 hover:text-white">Browse Properties</Link></li>
              <li><Link to="/register" className="text-gray-400 hover:text-white">Sign Up</Link></li>
              <li><Link to="/login" className="text-gray-400 hover:text-white">Login</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white">Help Center</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Contact Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Terms of Service</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Follow Us</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white text-xl"><FaFacebook /></a>
              <a href="#" className="text-gray-400 hover:text-white text-xl"><FaTwitter /></a>
              <a href="#" className="text-gray-400 hover:text-white text-xl"><FaInstagram /></a>
              <a href="#" className="text-gray-400 hover:text-white text-xl"><FaLinkedin /></a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 RealEstate Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
