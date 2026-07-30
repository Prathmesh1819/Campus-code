"use client";

import React, { useState, useEffect } from "react";

export function SarhadLogo({ className = "w-10 h-10" }: { className?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <img
      src="/sarhad-logo.jpg"
      alt="Sarhad College Logo"
      suppressHydrationWarning
      className={`${className} rounded-2xl object-cover ring-2 ring-purple-500/50 shadow-glow transition-transform hover:scale-105 bg-white p-0.5 shrink-0`}
    />
  );
}
