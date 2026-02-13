
import React from 'react';

const Logo: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizes = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-5xl'
  };

  return (
    <div className="flex items-center gap-2 font-black italic tracking-tighter" aria-label="CampusRide Logo">
      <div className="bg-indigo-600 text-white p-2 rounded-xl flex items-center justify-center" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18.5" cy="17.5" r="3.5" />
          <circle cx="5.5" cy="17.5" r="3.5" />
          <circle cx="9" cy="5" r="1" />
          <path d="M12 12l2-7 1 1" />
          <path d="M7 5.9a3 3 0 1 1 5.4 0" />
          <path d="M16 11.5l-4-4.5-3 3 5 5" />
        </svg>
      </div>
      <div className={`${sizes[size]} flex flex-col leading-none`}>
        <span className="text-indigo-600">Campus</span>
        <span className="text-amber-500 -mt-1">Ride</span>
      </div>
    </div>
  );
};

export default Logo;
