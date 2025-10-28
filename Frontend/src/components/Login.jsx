import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  // Check if user is already logged in on component mount
  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/'); // Redirect to home or dashboard if already logged in
      toast.success("You are already logged in!");
    }
  }, [navigate]);
 
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error("Please enter both email and password.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      console.log("Login successful, token:", data.token);
      toast.success("Login successful!");

      // Save the token to localStorage
      localStorage.setItem('token', data.token);
      // Redirect the user to the home page or dashboard
      navigate('/');

      setFormData({ email: "", password: "" });
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.message || "Login failed. Please try again.");
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md"
    >
      <h2 className="text-3xl font-bold mb-6 text-center text-indigo-600">Login to Your Account</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border p-3 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
            placeholder="you@example.com"
            required
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full border p-3 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
            placeholder="********"
            required
          />
        </motion.div>
        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-md shadow-md hover:bg-indigo-700 transition-colors"
        >
          Log In
        </motion.button>
      </form>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="mt-6 text-center text-gray-600 text-sm"
      >
        Don't have an account? <Link to="/register" className="font-medium text-indigo-600 hover:underline">Sign Up</Link>
      </motion.p>
    </motion.section>
  );
}