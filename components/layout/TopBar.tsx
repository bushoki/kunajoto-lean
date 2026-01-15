import React, { useState } from 'react';
import { AppState } from '../../types';
import { getVibeColor } from '../../constants';

interface TopBarProps {
  appState: AppState;
  onSearch: (query: string) => void;
  toggleViewMode: () => void;
  viewMode: 'MAP' | 'LIST';
  isAdvancedOpen: boolean;
  toggleAdvanced: () => void;
  locationName?: string;
  cityVibeScore?: number;
}

const TopBar: React.FC<TopBarProps> = ({ 
  appState, 
  onSearch, 
  toggleViewMode, 
  viewMode,
  isAdvancedOpen,
  toggleAdvanced,
  locationName,
  cityVibeScore
}) => {
  const [searchValue, setSearchValue] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    onSearch(e.target.value);
  };

  if (appState !== AppState.MAIN_APP && appState !== AppState.GUEST_MAP) return null;

  // Calculate rotation for barometer needle (0-10 score maps to 0-180 degrees)
  const needleRotation = cityVibeScore ? (cityVibeScore / 10) * 180 : 0;
  const scoreColor = cityVibeScore ? getVibeColor(cityVibeScore * 10) : '#ccc';

  return (
    <div className="absolute top-0 left-0 right-0 z-40 p-4">
      {/* Glass Container */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 overflow-hidden transition-all duration-300">
        
        {/* Main Search Row */}
        <div className="flex items-center p-3 gap-3">
          <div className="flex-1 relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input 
              type="text" 
              placeholder="Venues, music, vibe..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-dark"
              value={searchValue}
              onChange={handleSearchChange}
            />
          </div>
          
          <button 
            onClick={toggleViewMode}
            className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-xl text-dark hover:bg-gray-200 transition"
          >
            <i className={`fa-solid ${viewMode === 'MAP' ? 'fa-list-ul' : 'fa-map'}`}></i>
          </button>
          
          <button 
            onClick={toggleAdvanced}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition ${isAdvancedOpen ? 'bg-primary text-white' : 'bg-gray-100 text-dark hover:bg-gray-200'}`}
          >
            <i className="fa-solid fa-sliders"></i>
          </button>
        </div>

        {/* Advanced Filters (Collapsible) */}
        {isAdvancedOpen && (
          <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 duration-200">
            <div className="h-px bg-gray-200 mb-3"></div>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <span>Filter by Vibe</span>
              </div>
              <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                {['Chill', 'Dance', 'Live Music', 'Rooftop', 'Dive', 'Cocktail'].map((tag) => (
                  <button key={tag} className="whitespace-nowrap px-4 py-1.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600 hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 transition">
                    {tag}
                  </button>
                ))}
              </div>
              
              {/* Refine with AI Button */}
              <button className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition transform active:scale-95">
                <i className="fa-solid fa-wand-magic-sparkles"></i>
                Refine with AI Assistant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Geolocation / City Indicator - Visible in both Guest and Main App */}
      {(appState === AppState.GUEST_MAP || appState === AppState.MAIN_APP) && (
         <div className="absolute top-24 right-4 bg-black/80 backdrop-blur text-white text-xs pl-3 pr-1 py-1 rounded-full shadow-lg flex items-center gap-3 pointer-events-none z-10 border border-white/10 min-w-[140px] justify-between">
           
           <div className="flex items-center gap-2">
             <i className="fa-solid fa-location-dot text-[10px] text-primary"></i>
             <span className="font-bold max-w-[80px] truncate">{locationName || 'Locating...'}</span>
           </div>
           
           {/* DYNAMIC VIBE BAROMETER */}
           {locationName && locationName !== 'Locating...' && locationName !== 'Unknown' && cityVibeScore && (
             <div className="relative w-12 h-8 flex items-end justify-center mb-1">
               {/* Gauge Background */}
               <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
                 <defs>
                   <linearGradient id="vibeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                     {/* 
                        Dead (0-4): Blue (0% - 40%)
                        Warming (4-7): Green (40% - 70%)
                        Popping (7-9): Yellow (70% - 90%)
                        Hot (9-10): Red (90% - 100%)
                     */}
                     <stop offset="0%" stopColor="#3B82F6" />
                     <stop offset="40%" stopColor="#22C55E" />
                     <stop offset="70%" stopColor="#EAB308" />
                     <stop offset="90%" stopColor="#EF4444" />
                     <stop offset="100%" stopColor="#EF4444" />
                   </linearGradient>
                 </defs>
                 {/* Arc Path */}
                 <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="url(#vibeGradient)" strokeWidth="8" strokeLinecap="round" />
                 
                 {/* Needle - Initial Position: Pointing LEFT (0 deg) to match rotation sweep */}
                 {/* Rotates around 50,50. 0 deg = Left (Blue), 180 deg = Right (Red) */}
                 <g transform={`rotate(${needleRotation} 50 50)`} className="transition-transform duration-1000 ease-out">
                    {/* Needle shape pointing left */}
                    <path d="M 50 50 L 10 50 L 50 46 Z" fill="white" />
                    <circle cx="50" cy="50" r="4" fill="white" />
                 </g>
               </svg>
               
               {/* Score Text Overlay */}
               <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-black/50 rounded-md px-1">
                  <span className="text-[9px] font-black leading-none" style={{ color: scoreColor }}>
                    {cityVibeScore}
                  </span>
               </div>
             </div>
           )}
         </div>
      )}
    </div>
  );
};

export default TopBar;