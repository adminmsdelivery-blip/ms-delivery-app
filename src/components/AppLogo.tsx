import React from 'react';
import { cn } from '../lib/utils';

interface AppLogoProps {
  className?: string;
  showText?: boolean;
}

const AppLogo: React.FC<AppLogoProps> = ({ className = "", showText = true }) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="bg-indigo-600 p-1.5 rounded-xl shadow-lg shadow-indigo-200">
        <img 
          src="/logo.png" 
          alt="MS Delivery Logo" 
          className="w-full h-full object-cover"
        />
      </div>
      {showText && (
        <div className="flex flex-col">
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
