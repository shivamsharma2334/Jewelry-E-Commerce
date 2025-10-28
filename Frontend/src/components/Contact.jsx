import React, { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5 },
  },
};

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill out all fields.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send message. Please try again.");
      }

      toast.success(data.message || `Thanks ${form.name}, we received your message!`);
      setForm({ name: "", email: "", message: "" });
    } catch (error) {
      console.error("Contact form error:", error);
      toast.error(error.message || "Unable to submit the form right now.");
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md"
    >
      <h2 className="text-3xl font-bold mb-8 text-center">Get In Touch</h2>
      <div className="grid md:grid-cols-2 gap-12">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.h3 variants={itemVariants} className="text-xl font-semibold mb-4">Contact Information</motion.h3>
          <motion.p variants={itemVariants} className="text-gray-600 mb-6">
            Have a question or want to discuss a custom piece? Fill out the form or reach out to us directly. We'd love to hear from you.
          </motion.p>
          <motion.div variants={itemVariants} className="flex items-center gap-4 mb-4">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="text-gray-700">123 Jewel Lane, Diamond City, 12345</span>
          </motion.div>
          <motion.div variants={itemVariants} className="flex items-center gap-4 mb-4">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            <span className="text-gray-700">(123) 456-7890</span>
          </motion.div>
          <motion.div variants={itemVariants} className="flex items-center gap-4">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            <span className="text-gray-700">contact@shivambarjewels.com</span>
          </motion.div>
        </motion.div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input id="name" className="w-full border p-3 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none transition" placeholder="Your Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input id="email" className="w-full border p-3 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none transition" placeholder="Your Email" type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})}/>
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea id="message" rows="5" className="w-full border p-3 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none transition" placeholder="How can we help you?" value={form.message} onChange={e=>setForm({...form, message:e.target.value})}/>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-md shadow-md hover:bg-indigo-700 transition-colors"
          >
            Send Message
          </motion.button>
        </form>
      </div>
    </motion.section>
  );
}
