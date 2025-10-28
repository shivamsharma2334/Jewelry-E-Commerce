import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaTwitter } from 'react-icons/fa';
import logo from '../assets/Images/logo.png';

export default function Footer() {
  return (
    <footer className="bg-white border-t mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          
          <div className="flex flex-col items-center md:items-start">
            <Link to="/" className="flex items-center space-x-3 mb-4">
              <img src={logo} alt="ShivAmbar Jewels Logo" className="h-10 w-auto" />
              <span className="font-semibold text-lg">ShivAmbar Jewels</span>
            </Link>
            <p className="text-gray-500 text-sm">Crafting memories, one jewel at a time.</p>
          </div>

      
          <div>
            <h3 className="font-semibold mb-4 uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/products" className="text-gray-600 hover:text-indigo-600">Collection</Link></li>
              <li><Link to="/about" className="text-gray-600 hover:text-indigo-600">Our Story</Link></li>
              <li><Link to="/contact" className="text-gray-600 hover:text-indigo-600">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 uppercase tracking-wider">Follow Us</h3>
            <div className="flex justify-center md:justify-start space-x-6">
              <a href="#" className="text-gray-500 hover:text-indigo-600"><FaFacebook size={24} /></a>
              <a href="#" className="text-gray-500 hover:text-indigo-600"><FaInstagram size={24} /></a>
              <a href="#" className="text-gray-500 hover:text-indigo-600"><FaTwitter size={24} /></a>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-6 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} ShivAmbar Jewels. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}