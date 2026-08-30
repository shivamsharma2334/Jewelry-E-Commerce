import React, { useState } from "react";
import { motion } from "framer-motion";
import GoogleSignIn from './GoogleSignIn';
import toast from "react-hot-toast";
import { api } from "../lib";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function Register() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const submitGoogle = async (credentialResponse) => {
    setLoading(true);
    try {
      const data = await api("/api/auth/google", { method: "POST", body: JSON.stringify({ credential: credentialResponse.credential }) });
      toast.success("Account ready!");
      setUser(data.user);
      navigate("/");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api("/api/register", { method: "POST", body: JSON.stringify(formData) });
      toast.success("Account created successfully!");
      setUser(data.user);
      navigate("/");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-6 text-center text-indigo-600">Create Your Account</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input type="text" id="name" name="name" autoComplete="name" value={formData.name} onChange={handleChange}
            className="w-full border p-3 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" required />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input type="email" id="email" name="email" autoComplete="email" value={formData.email} onChange={handleChange}
            className="w-full border p-3 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" required />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input type="password" id="password" name="password" autoComplete="new-password" value={formData.password} onChange={handleChange}
            className="w-full border p-3 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            placeholder="12+ chars, upper/lower/number/symbol" required minLength={12} />
          <p className="mt-1 text-xs text-gray-500">Use at least 12 characters with upper/lowercase, a number, and a symbol.</p>
        </div>
        <button disabled={loading} type="submit"
          className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-md shadow-md hover:bg-indigo-700 disabled:opacity-60">
          {loading ? "Creating…" : "Sign Up"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-gray-400">
        <span className="h-px bg-gray-200 flex-1" /><span>OR</span><span className="h-px bg-gray-200 flex-1" />
      </div>
      <div className="flex justify-center">
        <GoogleSignIn onCredential={submitGoogle} disabled={loading} />
      </div>

      <p className="mt-6 text-center text-gray-600 text-sm">
        Already have an account? <Link to="/login" className="font-medium text-indigo-600 hover:underline">Log In</Link>
      </p>
    </motion.section>
  );
}
