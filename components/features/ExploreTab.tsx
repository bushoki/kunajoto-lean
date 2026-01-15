/**
 * ExploreTab - Kunajoto
 * Simplified, admin-driven content display
 * No vibe scores or forecasts - just venues and curated content
 */

import React, { useState, useEffect } from 'react';
import { getAllContentForCity } from '../../services/adminContentService';
import { supabase } from '../../src/supabaseClient';

// Target cities
const TARGET_CITIES = [
  'London',
  'Johannesburg',
  'Cape Town',
  'Los Angeles',
  'Austin',
  'New York City',
  'Nairobi',
  'Kinshasa'
];

interface ExploreTabProps {
  locationName: string;
  selectedCity: string;
  onCityChange: (city: string) => void;
  onOpenPreferences: () => void;
  hasCompletedPrefs: boolean;
  isAuthenticated: boolean;
  onVenueSelect: (venue: any) => void;
  onOpenPlans: () => void;
}

export default function ExploreTab({ 
  locationName,
  selectedCity,
  onCityChange,
  onOpenPreferences,
  hasCompletedPrefs,
  isAuthenticated,
  onVenueSelect,
  onOpenPlans
}: ExploreTabProps) {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load content when city changes
  useEffect(() => {
    if (selectedCity) {
      loadContentForCity(selectedCity);
    }
  }, [selectedCity]);

  const loadContentForCity = async (city: string) => {
    setLoading(true);
    try {
      const data = await getAllContentForCity(city);
      setContent(data);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    setShowCitySelector(false);
    onLocationChange(city);
  };

  // Show city selector if user not in target city
  if (showCitySelector || !selectedCity) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Welcome to Kunajoto! 🌍
            </h2>
            <p className="text-gray-600 text-lg">
              {userLocation
                ? `We're not yet available in ${userLocation.city}. Select a city to explore:`
                : 'Select a city to explore:'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TARGET_CITIES.map(city => (
              <button
                key={city}
                onClick={() => handleCitySelect(city)}
                className="p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <span className="text-lg font-semibold">{city}</span>
              </button>
            ))}
          </div>

          <p className="text-center text-sm text-gray-500 mt-8">
            More cities coming soon! 🚀
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading {selectedCity}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Header with City Name */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-8 px-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">{selectedCity.toUpperCase()}</h1>
              <p className="text-orange-100 text-lg">Discover the best of your city</p>
            </div>
            <button
              onClick={() => setShowCitySelector(true)}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-sm transition-all duration-200 text-white font-semibold"
            >
              Change City
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Events of the Month */}
        {content?.events && content.events.length > 0 && (
          <section className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="mr-3">🎉</span>
              Events this Month
            </h2>
            <div className="space-y-4">
              {content.events.slice(0, 5).map((event: any) => (
                <div
                  key={event.id}
                  className="p-4 bg-gradient-to-r from-orange-50 to-white rounded-xl border border-orange-100 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-gray-900 text-lg">{event.title}</h3>
                  {event.description && (
                    <p className="text-gray-600 mt-2">{event.description}</p>
                  )}
                  {event.event_date && (
                    <p className="text-sm text-orange-600 mt-2">
                      📅 {new Date(event.event_date).toLocaleDateString()}
                      {event.event_time && ` at ${event.event_time}`}
                    </p>
                  )}
                  {event.external_link && (
                    <a
                      href={event.external_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-3 text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Learn More →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Best to Arrive On */}
        {content?.arrivalTips && content.arrivalTips.length > 0 && (
          <section className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="mr-3">✈️</span>
              Best to arrive on
            </h2>
            <div className="space-y-3">
              {content.arrivalTips.map((tip: any) => (
                <div key={tip.id} className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-gray-900 font-medium">
                    {tip.day_of_week && <span className="font-bold">{tip.day_of_week}: </span>}
                    {tip.time_range && <span className="text-blue-600">{tip.time_range}</span>}
                  </p>
                  <p className="text-gray-700 mt-2">{tip.description}</p>
                  {tip.reason && (
                    <p className="text-sm text-gray-600 mt-2 italic">{tip.reason}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Best to Stay In */}
        {content?.stayRecommendations && content.stayRecommendations.length > 0 && (
          <section className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="mr-3">🏘️</span>
              Best to stay in
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {content.stayRecommendations.map((rec: any) => (
                <div
                  key={rec.id}
                  className="p-4 bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-100 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-bold text-gray-900 text-lg">{rec.neighborhood}</h3>
                  <p className="text-gray-700 mt-2">{rec.description}</p>
                  {rec.highlights && rec.highlights.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {rec.highlights.map((highlight: string, idx: number) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start">
                          <span className="text-green-600 mr-2">•</span>
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Flights & Airport Services */}
          <ActionCard
            title="BOOK A FLIGHT, PRE-BOOK AIRPORT PICKUP & MORE"
            icon="✈️"
            bgColor="from-orange-500 to-orange-600"
            onClick={() => {
              // Navigate to travel services
              console.log('Navigate to flights');
            }}
          />

          {/* Tour Guides */}
          <ActionCard
            title="EXPLORE LOCAL SITES WITH OUR AWARD-WINNING TOUR GUIDES!"
            icon="🗺️"
            bgColor="from-orange-500 to-orange-600"
            onClick={() => {
              // Navigate to tour guides
              console.log('Navigate to tour guides');
            }}
          />

          {/* Accommodations */}
          <ActionCard
            title="STAY AT CAREFULLY VETTED AIRBNBs & HOTELS"
            icon="🏠"
            bgColor="from-orange-500 to-orange-600"
            onClick={() => {
              // Navigate to accommodations
              console.log('Navigate to accommodations');
            }}
          />

          {/* Party Hosts */}
          <ActionCard
            title="PARTY LIKE A LOCAL WITH OUR EXPERIENCED HOSTS!"
            icon="🎉"
            bgColor="from-orange-500 to-orange-600"
            onClick={() => {
              // Navigate to party hosts
              console.log('Navigate to party hosts');
            }}
          />
        </div>

        {/* Weather/Alert Banner (placeholder) */}
        <div className="bg-blue-600 text-white rounded-2xl p-4 shadow-lg">
          <p className="text-center font-medium">
            🌤️ Perfect weather expected this weekend!
          </p>
        </div>
      </div>
    </div>
  );
}

// Action Card Component
interface ActionCardProps {
  title: string;
  icon: string;
  bgColor: string;
  onClick: () => void;
}

function ActionCard({ title, icon, bgColor, onClick }: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden bg-gradient-to-r ${bgColor} text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 min-h-[140px] flex flex-col items-center justify-center text-center`}
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-bold text-lg leading-tight">{title}</h3>
    </button>
  );
}
