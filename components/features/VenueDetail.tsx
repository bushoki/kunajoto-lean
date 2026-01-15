import React, { useState, useEffect } from 'react';
import { Venue } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import AddToPlanModal from '../modals/AddToPlanModal';
import { Venue } from '../../types';
import { getVibeColor, MOCK_REVIEWS } from '../../constants';
import { t } from '../../translations';

interface ForecastDay {
  day: string;
  score: number;
}

interface VenueDetailProps {
  venue: Venue;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onAddToPlan?: (venue: Venue) => void;
}

const VenueDetail: React.FC<VenueDetailProps> = ({ venue, onClose, isFavorite, onToggleFavorite, onAddToPlan }) => {
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loadingForecast, setLoadingForecast] = useState(true);
  const [showAddToPlanModal, setShowAddToPlanModal] = useState(false);

  useEffect(() => {
    const generateForecast = () => {
      console.log('[VenueDetail] Generating forecast for venue:', venue.id, venue.name);
      setLoadingForecast(true);
      
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const todayScore = venue.vibeScore; // This is ALREADY the current score with all boosts applied
      const today = new Date();
      const todayDayOfWeek = today.getDay();
      
      const forecast: ForecastDay[] = Array.from({ length: 7 }, (_, idx) => {
        const forecastDate = new Date(today);
        forecastDate.setDate(today.getDate() + idx);
        const dayOfWeek = forecastDate.getDay(); // 0=Sun, 6=Sat
        const dayName = idx === 0 ? 'Today' : dayNames[dayOfWeek];
        
        let score;
        
        if (idx === 0) {
          // TODAY: Use the exact current vibe score (no adjustments)
          score = todayScore;
        } else {
          // FUTURE DAYS: Calculate relative to today's score
          score = todayScore;
          
          // Remove today's day-of-week effect based on venue type
          if (venue.type === 'night_club') {
            const todayIsWeekend = todayDayOfWeek === 5 || todayDayOfWeek === 6 || todayDayOfWeek === 0;
            const todayIsThursday = todayDayOfWeek === 4;
            if (todayIsWeekend) score -= 15;
            if (todayIsThursday) score -= 8;
          } else if (venue.type === 'bar') {
            const todayIsWeekend = todayDayOfWeek === 5 || todayDayOfWeek === 6;
            const todayIsThursday = todayDayOfWeek === 4;
            if (todayIsWeekend) score -= 10;
            if (todayIsThursday) score -= 5;
          } else if (venue.type === 'restaurant') {
            const todayIsWeekend = todayDayOfWeek === 5 || todayDayOfWeek === 6;
            if (todayIsWeekend) score -= 5;
          }
          
          // Apply future day's effect based on venue type
          if (venue.type === 'night_club') {
            const futureIsWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;
            const futureIsThursday = dayOfWeek === 4;
            if (futureIsWeekend) score += 15;
            if (futureIsThursday) score += 8;
          } else if (venue.type === 'bar') {
            const futureIsWeekend = dayOfWeek === 5 || dayOfWeek === 6;
            const futureIsThursday = dayOfWeek === 4;
            if (futureIsWeekend) score += 10;
            if (futureIsThursday) score += 5;
          } else if (venue.type === 'restaurant') {
            const futureIsWeekend = dayOfWeek === 5 || dayOfWeek === 6;
            if (futureIsWeekend) score += 5;
          }
        }
        
        return {
          day: dayName,
          score: Math.min(100, Math.max(0, Math.round(score))) / 10 // Convert to 0-10 scale
        };
      });
      
      console.log('[VenueDetail] Generated forecast:', forecast);
      setForecast(forecast);
      setLoadingForecast(false);
    };

    generateForecast();
  }, [venue.id, venue.vibeScore, venue.type]);
  const [localFav, setLocalFav] = useState(isFavorite);

  const handleFavClick = () => {
      setLocalFav(!localFav);
      onToggleFavorite(venue.id);
  };

  return (
    <>
    <div className="absolute inset-x-0 bottom-0 top-10 sm:top-20 bg-white z-50 rounded-t-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-full duration-300">
      
      {/* Header Image */}
      <div className="h-56 relative shrink-0 group">
        <img src={venue.imageUrl} alt={venue.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-black/30 backdrop-blur-md rounded-full text-white flex items-center justify-center hover:bg-black/50 transition"
        >
          <i className="fa-solid fa-chevron-down"></i>
        </button>

        <div className="absolute bottom-6 left-6 text-white right-6">
          <div className="flex justify-between items-end">
             <div>
                <div className="flex items-center gap-2 mb-2">
                    <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border border-white/10">{venue.type}</span>
                    <span className="text-gray-200 text-xs font-medium"><i className="fa-solid fa-location-dot mr-1"></i>{venue.district}</span>
                </div>
                <h2 className="text-3xl font-black leading-none">{venue.name}</h2>
             </div>
             
             {/* Favorite Button */}
             <button 
               onClick={handleFavClick}
               className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition transform active:scale-90 ${localFav ? 'bg-red-500 text-white' : 'bg-white/20 backdrop-blur text-white hover:bg-white/30'}`}
             >
                <i className={`${localFav ? 'fa-solid' : 'fa-regular'} fa-heart text-xl`}></i>
             </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-white">
        
        {/* Live Context Banner - AI Narrative */}
        {venue.aiNarrative && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-3 items-start mb-6">
             <i className="fa-solid fa-sparkles text-blue-500 mt-0.5"></i>
             <div>
                <h4 className="text-xs font-bold text-blue-800 uppercase">Live Context</h4>
                <p className="text-xs text-blue-600 leading-snug">{venue.aiNarrative}</p>
             </div>
          </div>
        )}

        {/* Vibe Meter Card */}
        <div className="flex items-center justify-between mb-8 p-5 bg-gray-50 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Live Vibe Score</div>
            <div className="flex items-baseline gap-1.5">
               <span className="text-4xl font-black text-dark tracking-tight">{(venue.vibeScore / 10).toFixed(1)}</span>
               <span className="text-sm font-medium text-gray-400">/ 10</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
               <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: getVibeColor(venue.vibeScore) }}></span>
               <span className="text-xs font-bold" style={{ color: getVibeColor(venue.vibeScore) }}>
                  {venue.vibeConfidence} • {venue.vibeTrend}
               </span>
            </div>
          </div>
          
          {/* Animated Visual */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90 drop-shadow-lg">
              <circle cx="40" cy="40" r="34" stroke="#e5e7eb" strokeWidth="6" fill="transparent" />
              <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="transparent" 
                strokeLinecap="round"
                strokeDasharray={213} 
                strokeDashoffset={213 - (213 * venue.vibeScore) / 100} 
                style={{ color: getVibeColor(venue.vibeScore) }}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button className="py-3.5 rounded-2xl bg-dark text-white font-bold text-sm shadow-lg shadow-dark/20 active:scale-95 transition">
            Check In Here
          </button>
          <button 
            onClick={() => setShowAddToPlanModal(true)}
            className="py-3.5 rounded-2xl bg-gray-100 text-dark font-bold text-sm hover:bg-gray-200 active:scale-95 transition"
          >
            Add to Plan
          </button>
        </div>

        <div className="h-px bg-gray-100 mb-8"></div>

        <p className="text-gray-600 leading-relaxed text-sm mb-8 font-medium">
          {venue.description}
        </p>

	        {/* Forecast */}
	        <div className="mb-8">
	          <h3 className="font-bold text-dark mb-4 flex items-center gap-2">
	            <i className="fa-solid fa-chart-column text-primary"></i> {t('venue.forecast')}
	          </h3>
	          {loadingForecast ? (
	            <div className="text-center text-sm text-gray-500 py-4">Loading 7-Day Forecast...</div>
	          ) : (
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
              {forecast.map((day, i) => (
                <div key={i} className="flex flex-col items-center min-w-[56px] p-3 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="text-[10px] font-bold text-primary mb-1">
                    {day.score.toFixed(1)}
                  </div>
                  <div className="h-12 w-2 bg-gray-200 rounded-full mb-2 relative overflow-hidden">
                    <div 
                      className="absolute bottom-0 w-full rounded-full bg-primary" 
                      style={{ height: `${day.score * 10}%` }} // Scale 0-10 to 0-100%
                    ></div>
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">{day.day}</span>
                </div>
              ))}
            </div>
	          )}
	        </div>

        {/* Reviews Feed (Horizontal Scroll) */}
        <div className="mb-24">
           <div className="flex justify-between items-end mb-4">
             <h3 className="font-bold text-dark">{t('venue.reviews')}</h3>
             <button className="text-primary text-xs font-bold hover:underline">Write a Review</button>
           </div>
           
           <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 -mx-6 px-6">
             {MOCK_REVIEWS.map(review => (
               <div key={review.id} className="min-w-[240px] p-4 bg-white rounded-2xl border border-gray-100 shadow-sm snap-center">
                 <div className="flex items-center gap-2 mb-2">
                   <img src={review.userAvatar} className="w-8 h-8 rounded-full border border-gray-200" />
                   <div>
                     <div className="text-xs font-bold text-dark">{review.userName}</div>
                     <div className="flex text-[10px] text-orange-400">
                       {[...Array(5)].map((_, i) => (
                         <i key={i} className={`fa-solid fa-star ${i < review.rating ? '' : 'text-gray-200'}`}></i>
                       ))}
                     </div>
                   </div>
                   <span className="ml-auto text-[10px] text-gray-400">{review.timestamp}</span>
                 </div>
                 <p className="text-xs text-gray-600 leading-snug">"{review.text}"</p>
               </div>
             ))}
           </div>
        </div>

      </div>
    </div>
    
    {/* Add to Plan Modal */}
    {showAddToPlanModal && (
      <AddToPlanModal
        venue={venue}
        onClose={() => setShowAddToPlanModal(false)}
        onSuccess={() => {
          // Optionally refresh plans or show success message
          console.log('Venue added to plan successfully');
        }}
      />
    )}
    </>
  );
};

export default VenueDetail;
