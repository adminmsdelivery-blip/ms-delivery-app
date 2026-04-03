import React from 'react';
import { cn } from '../lib/utils';
import { Truck } from 'lucide-react';

interface AppLogoProps {
  className?: string;
  showText?: boolean;
}

const AppLogo: React.FC<AppLogoProps> = ({ className = "", showText = true }) => {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Icon Box - Fixed dimensions, no shrinking, proper object containment */}
      <div className="bg-indigo-600 w-12 h-12 rounded-xl shadow-lg shadow-indigo-200 flex-shrink-0 overflow-hidden">
        <img 
          src="/logo.svg" 
          alt="MS Delivery Logo" 
          className="w-full h-full object-contain"
          onError={(e) => {
            // Fallback to Truck icon if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              const icon = document.createElement('div');
              icon.className = 'w-full h-full flex items-center justify-center';
              icon.innerHTML = '<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path></svg>';
              parent.appendChild(icon);
            }
          }}
        />
      </div>
      
      {/* Text Group - Separate div, no absolute positioning, tight leading */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className="font-bold text-xl text-gray-900 tracking-tight">
            MS <span className="text-indigo-600 font-black">DELIVERY</span>
          </span>
          <span className="text-sm text-gray-500">Logistics Management Portal</span>
        </div>
      )}
    </div>
  );
};

export default AppLogo;
