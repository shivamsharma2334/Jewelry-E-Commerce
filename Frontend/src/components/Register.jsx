import React, { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

export default function Register() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Please fill out all fields.");
      return;
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed. Please try again.");
      }

      toast.success(`Welcome, ${formData.name}! Your account has been created.`);
      setFormData({ name: "", email: "", password: "" });
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error.message || "Unable to register at the moment.");
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md"
    >
      <h2 className="text-3xl font-bold mb-6 text-center text-indigo-600">Create Your Account</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border p-3 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
            placeholder="John Doe"
            required
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
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
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
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
        <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-md shadow-md hover:bg-indigo-700 transition-colors">
          Sign Up
        </motion.button>
      </form>
      <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }} className="mt-6 text-center text-gray-600 text-sm">
        Already have an account? <Link to="/login" className="font-medium text-indigo-600 hover:underline">Log In</Link>
      </motion.p>
    </motion.section>
  );
}
