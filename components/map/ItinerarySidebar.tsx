/**
 * ItinerarySidebar.tsx
 * Left-side panel on the map showing available itineraries for the current city.
 * Shows match score badges, free/paid labels, and lets users select/deselect routes.
 * Branch: map-features
 */

import React from 'react';
import { Itinerary } from '../../services/itineraryService';

interface ItinerarySidebarProps {
  itineraries: Itinerary[];
  activeItineraryId: string | null;
  onSelect: (id: string | null) => void;
  onSubscribeClick: (itin: Itinerary) => void;
  isLoading: boolean;
  userHasPrefs: boolean;
}

const ItinerarySidebar: React.FC<ItinerarySidebarProps> = ({
  itineraries,
  activeItineraryId,
  onSelect,
  onSubscribeClick,
  isLoading,
  userHasPrefs,
}) => {
  if (isLoading) {
    return (
      <div className="absolute top-16 left-3 z-[300] flex flex-col gap-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="w-32 h-9 bg-white/80 rounded-xl animate-pulse shadow" />
        ))}
      </div>
    );
  }

  if (itineraries.length === 0) return null;

  return (
    <div className="absolute top-16 left-3 z-[300] flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
      {itineraries.map((itin, idx) => {
        const isActive = activeItineraryId === itin.id;
        const color = itin.color || '#FF6B35';
        const hasAccess = itin.has_access ?? !itin.is_paid;
        const matchScore = itin.match_score ?? 0;
        const showMatch = userHasPrefs && matchScore > 0;

        return (
          <div key={itin.id} className="flex flex-col gap-0.5">
            <button
              onClick={() => onSelect(isActive ? null : itin.id)}
              style={{
                backgroundColor: isActive ? color : 'white',
                borderColor: color,
                boxShadow: isActive ? `0 4px 16px ${color}60` : '0 2px 8px rgba(0,0,0,0.12)',
              }}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-left
                transition-all duration-200 active:scale-95 min-w-[120px] max-w-[160px]
                ${isActive ? 'text-white' : 'text-gray-800'}
              `}
            >
              {/* Itinerary number badge */}
              <span
                style={{
                  backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : color,
                  color: 'white',
                }}
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
              >
                {idx + 1}
              </span>

              <div className="flex-1 min-w-0">
                <div className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-gray-800'}`}>
                  {itin.title}
                </div>
                <div className={`flex items-center gap-1 mt-0.5 ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                  {itin.is_paid ? (
                    hasAccess ? (
                      <span className="text-[9px] font-bold flex items-center gap-0.5">
                        <i className="fa-solid fa-unlock text-[8px]"></i> UNLOCKED
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold flex items-center gap-0.5">
                        <i className="fa-solid fa-lock text-[8px]"></i> PAID
                      </span>
                    )
                  ) : (
                    <span className="text-[9px] font-bold flex items-center gap-0.5">
                      <i className="fa-solid fa-unlock text-[8px]"></i> FREE
                    </span>
                  )}
                  {showMatch && (
                    <>
                      <span className="text-[8px]">·</span>
                      <span className="text-[9px] font-bold">
                        {matchScore}% match
                      </span>
                    </>
                  )}
                </div>
              </div>
            </button>

            {/* Subscribe button for paid itineraries without access */}
            {itin.is_paid && !hasAccess && isActive && (
              <button
                onClick={() => onSubscribeClick(itin)}
                style={{ backgroundColor: color }}
                className="text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-lg active:scale-95 transition ml-1 flex items-center gap-1 justify-center"
              >
                <i className="fa-solid fa-lock text-[9px]"></i>
                SUBSCRIBE TO UNLOCK
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ItinerarySidebar;
