
import React, { useMemo } from 'react';
import { CAMPUS_LOCATIONS } from '../constants';
import { Location } from '../types';

interface MapRequest {
  id: string;
  from: Location;
}

interface CampusMapProps {
  selectedFrom?: Location;
  selectedTo?: Location;
  onSelectLocation?: (loc: Location) => void;
  riderPosition?: { x: number; y: number };
  activeRequests?: MapRequest[];
  showZones?: boolean;
}

const CampusMap: React.FC<CampusMapProps> = ({ 
  selectedFrom, 
  selectedTo, 
  onSelectLocation, 
  riderPosition, 
  activeRequests = [],
  showZones = true
}) => {
  // Calculate camera pan to keep rider centered if moving
  const mapTransform = useMemo(() => {
    if (!riderPosition) return 'translate(0%, 0%) scale(1)';
    const translateX = Math.max(-25, Math.min(25, 50 - riderPosition.x));
    const translateY = Math.max(-25, Math.min(25, 50 - riderPosition.y));
    return `translate(${translateX}%, ${translateY}%) scale(1.1)`;
  }, [riderPosition]);

  return (
    <div 
      className="relative w-full h-[380px] bg-slate-100 rounded-[3rem] overflow-hidden shadow-inner border-4 border-white group/map"
      role="application"
      aria-label="Campus Map"
    >
      <div 
        className="absolute inset-0 transition-transform duration-1000 ease-out"
        style={{ transform: mapTransform }}
      >
        <div className="absolute inset-[-50%] opacity-10" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 0)', backgroundSize: '32px 32px' }} aria-hidden="true"></div>
        
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" aria-hidden="true">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <path d="M 20 30 L 40 50 L 55 40 L 80 15" stroke="#cbd5e1" strokeWidth="10" fill="none" strokeLinecap="round" />
          <path d="M 10 10 L 45 20 L 40 50 L 75 70" stroke="#cbd5e1" strokeWidth="10" fill="none" strokeLinecap="round" />
          <path d="M 15 80 L 40 50" stroke="#cbd5e1" strokeWidth="10" fill="none" strokeLinecap="round" />
          
          {selectedFrom && selectedTo && (
            <path 
              d={`M ${selectedFrom.coords.x} ${selectedFrom.coords.y} L ${selectedTo.coords.x} ${selectedTo.coords.y}`}
              stroke="#6366f1"
              strokeWidth="3"
              fill="none"
              strokeDasharray="8 8"
              className="animate-dash"
            />
          )}
        </svg>

        {showZones && CAMPUS_LOCATIONS.filter(l => l.isPopular).map(loc => (
          <div 
            key={`zone-${loc.id}`}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `${loc.coords.x}%`, top: `${loc.coords.y}%` }}
            aria-hidden="true"
          >
            <div className={`w-24 h-24 rounded-full animate-pulse blur-xl opacity-20 ${loc.trafficLevel === 'high' ? 'bg-red-500' : 'bg-amber-400'}`} />
          </div>
        ))}

        {CAMPUS_LOCATIONS.map((loc) => {
          const isPickup = selectedFrom?.id === loc.id;
          const isDropoff = selectedTo?.id === loc.id;
          
          return (
            <button
              key={loc.id}
              onClick={() => onSelectLocation?.(loc)}
              aria-label={isPickup ? `Pick-up location at ${loc.name}` : isDropoff ? `Drop-off location at ${loc.name}` : `Select ${loc.name} on map`}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 p-2 rounded-full transition-all duration-500 group/marker focus:ring-4 ring-indigo-500
                ${isPickup ? 'z-40 scale-125' : isDropoff ? 'z-40 scale-125' : 'bg-white/80 backdrop-blur shadow-sm border border-slate-100'}
              `}
              style={{ left: `${loc.coords.x}%`, top: `${loc.coords.y}%` }}
            >
              {isPickup ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-40 scale-150" aria-hidden="true" />
                  <div className="bg-green-600 text-white w-8 h-8 rounded-2xl flex items-center justify-center shadow-xl border-2 border-white rotate-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-green-600 text-[8px] text-white font-black px-1.5 py-0.5 rounded-full whitespace-nowrap uppercase tracking-tighter" aria-hidden="true">Pickup</div>
                </div>
              ) : isDropoff ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-500 rounded-full animate-ping opacity-40 scale-150" aria-hidden="true" />
                  <div className="bg-amber-500 text-white w-8 h-8 rounded-2xl flex items-center justify-center shadow-xl border-2 border-white -rotate-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-amber-500 text-[8px] text-white font-black px-1.5 py-0.5 rounded-full whitespace-nowrap uppercase tracking-tighter" aria-hidden="true">Drop</div>
                </div>
              ) : (
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" aria-hidden="true"></div>
              )}
              
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/marker:opacity-100 transition-opacity whitespace-nowrap z-50">
                <div className="bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-2">
                  {loc.name}
                  {loc.isPopular && <span className="text-amber-400" aria-label="Popular location">🔥</span>}
                </div>
              </div>
            </button>
          );
        })}

        {riderPosition && (
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-50 transition-all duration-1000 ease-in-out"
            style={{ left: `${riderPosition.x}%`, top: `${riderPosition.y}%` }}
            aria-label="Rider current position"
            role="img"
          >
            <div className="relative">
               <div className="absolute -inset-6 bg-indigo-600/20 blur-2xl rounded-full animate-pulse" />
               <div className="bg-indigo-600 p-2.5 rounded-[1.25rem] shadow-2xl border-2 border-white transform rotate-3 shadow-indigo-200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/>
                    <path d="M12 12l2-7 1 1"/><path d="M7 5.9a3 3 0 1 1 5.4 0"/><path d="M16 11.5l-4-4.5-3 3 5 5"/>
                  </svg>
               </div>
               <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 border-2 border-white rounded-full" />
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-4 left-4 right-4 bg-white/80 backdrop-blur-xl p-3.5 rounded-[2rem] border border-white shadow-2xl flex justify-between items-center z-50" aria-hidden="true">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm shadow-green-200" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pick-up</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-200" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Drop-off</span>
          </div>
        </div>
        <div className="bg-indigo-50 px-3 py-1.5 rounded-full flex items-center gap-2">
           <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
           <p className="text-[9px] font-black text-indigo-600 uppercase tracking-tighter">Live GPS Locked</p>
        </div>
      </div>

      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -32;
          }
        }
        .animate-dash {
          animation: dash 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default CampusMap;
