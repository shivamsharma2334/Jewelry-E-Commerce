import React from "react";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
};

export default function About() {
  return (
    <div className="bg-white p-8 rounded-lg shadow-md overflow-hidden">
      <motion.section
        className="max-w-4xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h2 variants={itemVariants} className="text-center text-4xl font-bold mb-8 text-indigo-600 tracking-tight">
          The Heart of Craftsmanship
        </motion.h2>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div variants={itemVariants}>
            <h3 className="text-2xl font-semibold mb-4">Our Story</h3>
            <p className="text-gray-700 mb-6 text-lg leading-relaxed">
              ShivAmbar Jewels was born from a passion for timeless elegance and exquisite craftsmanship. We believe that every piece of jewellery tells a story—a story of love, celebration, and personal milestones. Our journey began with a simple vision: to create beautiful, high-quality jewellery that can be cherished for generations.
            </p>
            <h3 className="text-2xl font-semibold mt-8 mb-4">Our Mission</h3>
            <p className="text-gray-600 leading-relaxed">
              Our mission is to blend traditional artistry with contemporary design, offering our clients unique pieces that reflect their individuality. We are committed to using ethically sourced materials and upholding the highest standards of quality, ensuring that every ShivAmbar creation is a masterpiece of its own.
            </p>
          </motion.div>
          <motion.div variants={itemVariants} className="w-full h-96 rounded-lg overflow-hidden shadow-xl">
            <img src="https://media.istockphoto.com/id/1273447930/photo/jeweler-making-handmade-jewelry-on-vintage-bench-the-art-of-jewelry-jeweler-making-handmade.jpg?s=1024x1024&w=is&k=20&c=ppEd7fXz_3NNWjYszGAtQTx1FzINWGqspv8tj-oxFXw=" alt="Crafting Jewellery" className="w-full h-full object-cover" />
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}