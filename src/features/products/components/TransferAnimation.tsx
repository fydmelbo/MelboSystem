import React from 'react';
import { motion } from 'framer-motion';

interface TransferAnimationProps {
  originName: string;
  destinyName: string;
  onComplete?: () => void;
}

export default function TransferAnimation({ originName, destinyName, onComplete }: TransferAnimationProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative w-full max-w-lg h-48">
        <svg viewBox="0 0 500 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e5e7eb" />
              <stop offset="50%" stopColor="#d1d5db" />
              <stop offset="100%" stopColor="#e5e7eb" />
            </linearGradient>
            <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f0f9ff" />
              <stop offset="100%" stopColor="#e0f2fe" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="shadow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2"/>
            </filter>
          </defs>

          {/* Sky background */}
          <rect x="0" y="0" width="500" height="200" fill="url(#skyGrad)" rx="16" />

          {/* Clouds */}
          <motion.g
            animate={{ x: [0, 20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          >
            <ellipse cx="80" cy="35" rx="25" ry="10" fill="white" opacity="0.6" />
            <ellipse cx="100" cy="30" rx="30" ry="12" fill="white" opacity="0.7" />
            <ellipse cx="120" cy="35" rx="22" ry="9" fill="white" opacity="0.5" />
          </motion.g>
          <motion.g
            animate={{ x: [0, -15, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          >
            <ellipse cx="350" cy="28" rx="20" ry="8" fill="white" opacity="0.5" />
            <ellipse cx="368" cy="24" rx="25" ry="10" fill="white" opacity="0.6" />
            <ellipse cx="385" cy="28" rx="18" ry="7" fill="white" opacity="0.4" />
          </motion.g>

          {/* Road */}
          <rect x="0" y="140" width="500" height="40" fill="url(#roadGrad)" rx="4" />
          <line x1="0" y1="160" x2="500" y2="160" stroke="#9ca3af" strokeWidth="2" strokeDasharray="12,8" />

          {/* Origin building */}
          <g filter="url(#shadow)">
            <rect x="20" y="70" width="70" height="70" rx="6" fill="#1B3A5C" />
            <rect x="28" y="80" width="14" height="14" rx="2" fill="#4A9BD9" opacity="0.8" />
            <rect x="48" y="80" width="14" height="14" rx="2" fill="#4A9BD9" opacity="0.8" />
            <rect x="68" y="80" width="14" height="14" rx="2" fill="#4A9BD9" opacity="0.6" />
            <rect x="28" y="100" width="14" height="14" rx="2" fill="#4A9BD9" opacity="0.6" />
            <rect x="48" y="100" width="14" height="14" rx="2" fill="#4A9BD9" opacity="0.8" />
            <rect x="68" y="100" width="14" height="14" rx="2" fill="#4A9BD9" opacity="0.8" />
            <rect x="38" y="120" width="24" height="20" rx="3" fill="#2D8C3C" />
            <text x="55" y="62" textAnchor="middle" fontSize="9" fill="#1B3A5C" fontWeight="bold">
              {originName.length > 12 ? originName.substring(0, 12) + '...' : originName}
            </text>
          </g>

          {/* Destination building */}
          <g filter="url(#shadow)">
            <rect x="410" y="70" width="70" height="70" rx="6" fill="#1B3A5C" />
            <rect x="418" y="80" width="14" height="14" rx="2" fill="#4A9BD9" opacity="0.8" />
            <rect x="438" y="80" width="14" height="14" rx="2" fill="#4A9BD9" opacity="0.8" />
            <rect x="458" y="80" width="14" height="14" rx="2" fill="#4A9BD9" opacity="0.6" />
            <rect x="418" y="100" width="14" height="14" rx="2" fill="#4A9BD9" opacity="0.6" />
            <rect x="438" y="100" width="14" height="14" rx="2" fill="#4A9BD9" opacity="0.8" />
            <rect x="458" y="100" width="14" height="14" rx="2" fill="#4A9BD9" opacity="0.8" />
            <rect x="438" y="120" width="24" height="20" rx="3" fill="#2D8C3C" />
            <text x="445" y="62" textAnchor="middle" fontSize="9" fill="#1B3A5C" fontWeight="bold">
              {destinyName.length > 12 ? destinyName.substring(0, 12) + '...' : destinyName}
            </text>
          </g>

          {/* Truck */}
          <motion.g
            initial={{ x: 90 }}
            animate={{ x: 340 }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              repeatDelay: 0.5,
            }}
          >
            {/* Truck body */}
            <rect x="0" y="118" width="50" height="28" rx="4" fill="#2D8C3C" filter="url(#glow)" />
            {/* Cargo area */}
            <rect x="4" y="120" width="30" height="24" rx="2" fill="#247030" />
            {/* Packages in truck */}
            <rect x="7" y="122" width="8" height="8" rx="1" fill="#fbbf24" />
            <rect x="17" y="122" width="8" height="8" rx="1" fill="#f97316" />
            <rect x="27" y="122" width="4" height="8" rx="1" fill="#fbbf24" />
            <rect x="7" y="132" width="10" height="8" rx="1" fill="#f97316" />
            <rect x="19" y="132" width="8" height="8" rx="1" fill="#fbbf24" />
            {/* Cabin */}
            <rect x="36" y="122" width="14" height="24" rx="3" fill="#1B3A5C" />
            {/* Window */}
            <rect x="39" y="124" width="8" height="10" rx="2" fill="#4A9BD9" opacity="0.8" />
            {/* Headlight */}
            <circle cx="50" cy="140" r="2" fill="#fbbf24" />
            {/* Wheels */}
            <circle cx="12" cy="148" r="5" fill="#374151" />
            <circle cx="12" cy="148" r="2" fill="#6b7280" />
            <circle cx="40" cy="148" r="5" fill="#374151" />
            <circle cx="40" cy="148" r="2" fill="#6b7280" />
          </motion.g>

          {/* Motion trail */}
          <motion.g
            initial={{ opacity: 0.6 }}
            animate={{ opacity: [0.6, 0.2, 0.6] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.g
              initial={{ x: 60 }}
              animate={{ x: 310 }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.5 }}
            >
              <rect x="0" y="130" width="12" height="2" rx="1" fill="#9ca3af" opacity="0.3" />
              <rect x="-8" y="133" width="8" height="2" rx="1" fill="#9ca3af" opacity="0.2" />
              <rect x="-14" y="136" width="5" height="1" rx="1" fill="#9ca3af" opacity="0.1" />
            </motion.g>
          </motion.g>

          {/* Direction arrow */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
          >
            <path d="M 230 155 L 250 150 L 230 145" fill="none" stroke="#2D8C3C" strokeWidth="2" strokeLinecap="round" />
          </motion.g>
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center mt-4"
      >
        <p className="text-sm font-medium text-gray-500">Transferencia en curso...</p>
        <p className="text-xs text-gray-400 mt-1">{originName} → {destinyName}</p>
      </motion.div>
    </div>
  );
}
