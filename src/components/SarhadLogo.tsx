import React from "react";

export function SarhadLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      className={`${className} rounded-2xl ring-2 ring-amber-400/60 shadow-glow transition-transform hover:scale-105 shrink-0`}
    >
      <defs>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="50%" stopColor="#1d4ed8" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="torchGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#eab308" />
        </linearGradient>
      </defs>

      <!-- Outer Ring -->
      <circle cx="100" cy="100" r="96" fill="url(#goldGrad)" />
      <circle cx="100" cy="100" r="88" fill="#0f172a" stroke="url(#goldGrad)" strokeWidth="2" />

      <!-- Top Text Arc -->
      <path id="textPathTopInline" d="M 25,100 A 75,75 0 1,1 175,100" fill="none" />
      <text font me="'Plus Jakarta Sans', sans-serif" fontSize="11" fontWeight="900" fill="#fbbf24" letterSpacing="2">
        <textPath href="#textPathTopInline" startOffset="50%" textAnchor="middle">
          SARHAD COLLEGE PUNE
        </textPath>
      </text>

      <!-- Inner Crest Shield -->
      <path
        d="M 100,35 Q 145,35 155,75 Q 155,135 100,165 Q 45,135 45,75 Q 55,35 100,35 Z"
        fill="url(#shieldGrad)"
        stroke="url(#goldGrad)"
        strokeWidth="3"
      />

      <!-- Open Book of Knowledge -->
      <path
        d="M 65,105 Q 85,95 100,105 Q 115,95 135,105 L 135,125 Q 115,115 100,125 Q 85,115 65,125 Z"
        fill="#ffffff"
        stroke="#cbd5e1"
        strokeWidth="1.5"
      />
      <path d="M 100,105 L 100,125" stroke="#1e293b" strokeWidth="1.5" />

      <!-- Torch Flame of Knowledge -->
      <path d="M 100,60 Q 106,72 100,82 Q 94,72 100,60 Z" fill="url(#torchGrad)" />
      <path d="M 100,66 Q 103,73 100,80 Q 97,73 100,66 Z" fill="#fef08a" />
      <path d="M 97,82 L 103,82 L 101,98 L 99,98 Z" fill="url(#goldGrad)" />

      <!-- Golden Star -->
      <polygon points="100,42 102,47 107,47 103,50 104,55 100,52 96,55 97,50 93,47 98,47" fill="#fbbf24" />
    </svg>
  );
}
