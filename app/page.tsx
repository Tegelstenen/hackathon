"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const words = ["Documents", "Letters", "Slides", "Posters", "Invitations", "Emails"];

export default function LandingPage() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-100">
      <h1 className="text-6xl font-extrabold mb-4 text-gray-800 tracking-wide drop-shadow-lg">
        🚀 Prompt to <span className="text-blue-600">Visual Content</span> 🎨
      </h1>

      {/* Container for the sliding text */}
      <div className="relative h-8 w-48 overflow-hidden mb-8 text-center text-2xl text-gray-600">
        <AnimatePresence mode="wait">
          {/* Use the current word as the key to trigger re-renders in AnimatePresence */}
          <motion.div
            key={words[index]}
            initial={{ x: 50, opacity: 0 }}   // Slide in from right
            animate={{ x: 0, opacity: 1 }}   // To center
            exit={{ x: -50, opacity: 0 }}    // Slide out to left
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute w-full"
          >
            {words[index]}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex space-x-4">
        <Button className="text-lg px-20 py-10 w-60 h-20" variant="default" onClick={() => window.location.href='/production'}>
          Use Existing
        </Button>
        <Button className="text-lg px-20 py-10 w-60 h-20" variant="outline">
          Upload
        </Button>
      </div>
    </div>
  );
}