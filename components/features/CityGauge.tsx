import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import { getRelativeTime } from '../../utils/timeUtils';

interface CityVibeScore {
  city: string;
  overall_score: number;
  confidence: string;
  trend: string;
  total_venues: number;
  hot_venues: number;
  popping_venues: number;
  warming_venues: number;
  dead_venues: number;
  top_districts: Array<{ district: string; venues: number }>;
  updated_at: string;
}

interface CityGaugeProps {
  locationName: string;
  onOpenPreferences?: () => void;
  hasCompletedPrefs?: boolean;
  isAuthenticated?: boolean;
}

const CityGauge: React.FC<CityGaugeProps> = ({ 
  locationName, 
  onOpenPreferences,
  hasCompletedPrefs = true,
  isAuthenticated = false
}) => {
  const [cityData, setCityData] = useState<CityVibeScore | null>(null);
  const [allCities, setAllCities] = useState<CityVibeScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>(locationName);

  useEffect(() => {
    loadCityData();
    
    // Auto-refresh city data when component mounts
    const refreshCityAggregation = async () => {
      try {
        console.log('[CityGauge] Triggering city aggregation refresh...');
        await fetch('https://grnekxrkypgighmxyveh.supabase.co/functions/v1/aggregate-city-vibes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdybmVreHJreXBnaWdobXh5dmVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM4NDI4NDIsImV4cCI6MjA0OTQxODg0Mn0.Ue2bkPpvFcLmZWn9xNsqzxqF5Fz7Gy_pYJJCUJx-Uh4'
          }
        });
        // Reload city data after aggregation
        setTimeout(() => loadCityData(), 2000);
      } catch (error) {
        console.error('[CityGauge] Error refreshing city aggregation:', error);
      }
    };
    refreshCityAggregation();
    
    // Continuous background refresh every 3 minutes (location-based)
    const intervalId = setInterval(() => {
      console.log('[CityGauge] Background refresh triggered (3min interval)...');
      refreshCityAggregation(); // Refresh city scores from realtime venue data
    }, 180000); // 3 minutes = 180000ms
    
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    // Update selected city when location changes
    if (locationName && locationName !== 'Locating...') {
      setSelectedCity(locationName);
    }
  }, [locationName]);

  useEffect(() => {
    // Find city data when selected city changes
    if (allCities.length > 0) {
      const city = allCities.find(c => c.city === selectedCity);
      setCityData(city || allCities[0]);
    }
  }, [selectedCity, allCities]);

  const loadCityData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const cities = await dataService.getCityVibeScores();
      console.log('[CityGauge] Loaded city data:', cities);
      
      if (cities && cities.length > 0) {
        setAllCities(cities);
        
        // Find current city or use first
        const currentCity = cities.find(c => c.city === locationName);
        setCityData(currentCity || cities[0]);
      } else {
        setError('No city data available. Run city aggregation from Admin Dashboard.');
      }
    } catch (err) {
      console.error('[CityGauge] Error loading city data:', err);
      setError('Failed to load city data');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'HOT': return 'text-red-500';
      case 'POPPING': return 'text-orange-500';
      case 'WARMING': return 'text-yellow-500';
      default: return 'text-gray-400';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'RISING': return 'fa-arrow-trend-up';
      case 'FALLING': return 'fa-arrow-trend-down';
      default: return 'fa-minus';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'RISING': return 'text-green-500';
      case 'FALLING': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // Generate 7-day forecast (simplified - could be enhanced with actual forecast data)
  const generateForecast = () => {
    if (!cityData) return [];
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayScore = cityData.overall_score; // This is ALREADY the current score with all boosts applied
    const today = new Date();
    const todayDayOfWeek = today.getDay();
    
    return Array.from({ length: 7 }, (_, idx) => {
      const forecastDate = new Date(today);
      forecastDate.setDate(today.getDate() + idx);
      const dayOfWeek = forecastDate.getDay(); // 0=Sun, 6=Sat
      const dayName = idx === 0 ? 'Today' : dayNames[dayOfWeek];
      
      let score;
      
      if (idx === 0) {
        // TODAY: Use the exact overall score (no adjustments)
        score = todayScore;
      } else {
        // FUTURE DAYS: Calculate relative to today's score
        score = todayScore;
        
        // Remove today's day-of-week effect
        const todayIsWeekend = todayDayOfWeek === 5 || todayDayOfWeek === 6 || todayDayOfWeek === 0;
        const todayIsThursday = todayDayOfWeek === 4;
        if (todayIsWeekend) score -= 15;
        if (todayIsThursday) score -= 8;
        
        // Apply future day's effect
        const futureIsWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;
        const futureIsThursday = dayOfWeek === 4;
        if (futureIsWeekend) score += 15;
        if (futureIsThursday) score += 8;
        
        // Trend adjustment (only for future days)
        if (cityData.trend === 'RISING') score += idx * 1.5;
        else if (cityData.trend === 'FALLING') score -= idx * 1.5;
      }
      
      return {
        day: dayName,
        score: Math.min(100, Math.max(0, Math.round(score)))
      };
    });
  };

  if (loading) {
    return (
      <div className="pt-12 px-6 h-full overflow-y-auto pb-24 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="fa-solid fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-gray-500">Loading city data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-12 px-6 h-full overflow-y-auto pb-24 bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <i className="fa-solid fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
          <h3 className="font-bold text-red-700 mb-2">No City Data</h3>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadCityData}
            className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!cityData) {
    return (
      <div className="pt-12 px-6 h-full overflow-y-auto pb-24 bg-gray-50">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <i className="fa-solid fa-info-circle text-4xl text-yellow-500 mb-4"></i>
          <h3 className="font-bold text-yellow-700 mb-2">No Data Available</h3>
          <p className="text-sm text-yellow-600">City vibe scores haven't been calculated yet.</p>
        </div>
      </div>
    );
  }

  const forecast = generateForecast();

  return (
    <div className="pt-12 px-6 h-full overflow-y-auto pb-24 bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-dark">Explore Your City</h2>
        <button
          onClick={loadCityData}
          className="bg-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-primary-hover transition flex items-center gap-2"
        >
          <i className="fa-solid fa-refresh"></i>
          <span className="text-sm">Refresh</span>
        </button>
      </div>
      
      {/* Preferences Prompt */}
      {isAuthenticated && !hasCompletedPrefs && onOpenPreferences && (
        <div className="mb-6 bg-indigo-600 rounded-xl p-4 text-white shadow-lg flex justify-between items-center animate-in slide-in-from-top-5">
          <div>
            <h4 className="font-bold text-sm">
              <i className="fa-solid fa-circle-info mr-2"></i>
              Complete Your Persona
            </h4>
            <p className="text-xs text-indigo-200">Set preferences to unlock accurate forecasts.</p>
          </div>
          <button 
            onClick={onOpenPreferences}
            className="bg-white text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-50 transition"
          >
            Setup Now
          </button>
        </div>
      )}


      
      
      {/* Overall City Score */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center mb-6">
        <div className="text-gray-500 text-sm uppercase font-bold tracking-wide mb-2">
          Overall {cityData.city}
        </div>
        <div className={`text-5xl font-black mb-2 ${getConfidenceColor(cityData.confidence)}`}>
          {(cityData.overall_score / 10).toFixed(1)}
        </div>
        <div className="text-xs text-gray-400 mb-2">out of 10</div>
        <div className={`font-medium text-sm ${getTrendColor(cityData.trend)}`}>
          <i className={`fa-solid ${getTrendIcon(cityData.trend)}`}></i> {cityData.trend}
        </div>
        
        {/* Venue Breakdown */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="text-2xl font-bold text-red-500">{cityData.hot_venues}</div>
              <div className="text-[10px] text-gray-500 uppercase">Hot</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-500">{cityData.popping_venues}</div>
              <div className="text-[10px] text-gray-500 uppercase">Popping</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-500">{cityData.warming_venues}</div>
              <div className="text-[10px] text-gray-500 uppercase">Warming</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-400">{cityData.dead_venues}</div>
              <div className="text-[10px] text-gray-500 uppercase">Dead</div>
            </div>
          </div>
        </div>
        
        {/* 7-Day Forecast */}
        <div className="mt-6 border-t border-gray-100 pt-4">
          <h4 className="text-[10px] font-bold uppercase text-gray-400 mb-3">City 7-Day Forecast</h4>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
            {forecast.map((day, idx) => (
              <div key={idx} className="flex flex-col items-center min-w-[40px]">
                <div className="text-[10px] font-bold text-primary mb-1">
                  {(day.score / 10).toFixed(1)}
                </div>
                <div className="h-16 w-2 bg-gray-100 rounded-full relative mb-2 overflow-hidden">
                  <div 
                    className="absolute bottom-0 w-full bg-primary/60 rounded-full" 
                    style={{ height: `${day.score}%` }}
                  ></div>
                </div>
                <span className="text-[10px] font-bold text-gray-500">{day.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Districts - Removed as per user request */}



      {/* Last Updated */}
      <div className="text-center text-xs text-gray-400 mt-6">
        Last updated: {getRelativeTime(cityData.updated_at)}
      </div>
    </div>
  );
};

export default CityGauge;
