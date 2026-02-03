/**
 * ExploreTab - Kunajoto
 * Dynamic content display driven by admin dashboard
 */

import React, { useState, useEffect } from 'react';
import { getAllContentForCity, getWeekVibeScoresForCity } from '../../services/adminContentService';
import { supabase } from '../../src/supabaseClient';
import { trackAndOpenLink } from '../../services/linkTrackingService';

// Target cities
const TARGET_CITIES = [
  'London',
  'Johannesburg',
  'Cape Town',
  'Los Angeles',
  'Austin',
  'New York City',
  'Nairobi',
  'Kinshasa',
  'Zanzibar',
  'Kuala Lumpur'
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

type ContentType = 'arrival' | 'stay' | 'tours' | 'party' | null;

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
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [vibeData, setVibeData] = useState<any>(null);
  // Initialize with localStorage or default to 'arrival' (Book a Flight)
  const [selectedContentType, setSelectedContentType] = useState<ContentType>(() => {
    const saved = localStorage.getItem('kunajoto_selected_content_type');
    return (saved as ContentType) || 'arrival';
  });
  const [dynamicContent, setDynamicContent] = useState<any>(null);
  const [loadingDynamic, setLoadingDynamic] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Load content when city changes
  useEffect(() => {
    if (selectedCity) {
      loadContentForCity(selectedCity);
    }
  }, [selectedCity]);

  // Load content when city changes or selectedContentType changes
  useEffect(() => {
    if (selectedContentType && selectedCity) {
      // Load content for the selected type and city
      loadDynamicContent(selectedContentType);
    }
  }, [selectedCity, selectedContentType]); // Run when city or selection changes

  // Separate function to load content without toggle logic
  const loadDynamicContent = async (type: ContentType) => {
    setLoadingDynamic(true);

    try {
      let data: any = {};

      switch (type) {
        case 'arrival':
          const [arrivalData, travelData] = await Promise.all([
            supabase.from('admin_arrival_tips').select('*').eq('city', selectedCity).order('display_order'),
            supabase.from('admin_travel_services').select('*').eq('city', selectedCity).order('display_order')
          ]);
          data = {
            arrivalTips: arrivalData.data || [],
            travelServices: travelData.data || []
          };
          break;

        case 'stay':
          const [stayData, accomData] = await Promise.all([
            supabase.from('admin_stay_recommendations').select('*').eq('city', selectedCity).order('display_order'),
            supabase.from('admin_accommodations').select('*').eq('city', selectedCity).order('display_order')
          ]);
          data = {
            stayRecommendations: stayData.data || [],
            accommodations: accomData.data || []
          };
          break;

        case 'tours':
          const tourData = await supabase.from('admin_tour_guides').select('*').eq('city', selectedCity).order('display_order');
          data = { tourGuides: tourData.data || [] };
          break;

        case 'party':
          const [partyData, eventsData] = await Promise.all([
            supabase.from('admin_party_hosts').select('*').eq('city', selectedCity).order('display_order'),
            supabase.from('admin_events').select('*').eq('city', selectedCity).order('display_order')
          ]);
          data = {
            partyHosts: partyData.data || [],
            events: eventsData.data || []
          };
          break;
      }

      setDynamicContent(data);
    } catch (error) {
      console.error('Error loading dynamic content:', error);
    } finally {
      setLoadingDynamic(false);
    }
  };

  const loadContentForCity = async (city: string) => {
    setLoading(true);
    try {
      const [contentData, vibeScores] = await Promise.all([
        getAllContentForCity(city),
        getWeekVibeScoresForCity(city)
      ]);
      setContent(contentData);
      setVibeData(vibeScores);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelect = (city: string) => {
    onCityChange(city);
    setShowCitySelector(false);
    // Don't clear selectedContentType - maintain button selection across city changes
    // Only clear dynamicContent to force reload for new city
    setDynamicContent(null);
  };

  const handleActionClick = async (type: ContentType) => {
    // Toggle off if clicking same button
    if (selectedContentType === type) {
      setSelectedContentType(null);
      setDynamicContent(null);
      localStorage.removeItem('kunajoto_selected_content_type');
      return;
    }

    setSelectedContentType(type);
    localStorage.setItem('kunajoto_selected_content_type', type);
    
    // Use the shared loadDynamicContent function
    await loadDynamicContent(type);
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
              {locationName && !TARGET_CITIES.includes(locationName)
                ? `We're not yet available in ${locationName}. Select a city to explore:`
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
        {/* City Vibe Forecast */}
        {vibeData && (
          <section className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {selectedCity} City Vibe
            </h2>
            
            {/* Overall Score and Trend */}
            <div className="flex items-center gap-4 mb-2">
              <div className="text-5xl font-bold text-orange-600">
                {vibeData.currentDayScore !== null ? vibeData.currentDayScore.toFixed(1) : 'N/A'}
              </div>
              <div className="flex items-center gap-1 text-sm font-medium">
                {vibeData.trendingUp ? (
                  <>
                    <span className="text-green-600">↑</span>
                    <span className="text-green-600">Trending Up</span>
                  </>
                ) : (
                  <>
                    <span className="text-red-600">↓</span>
                    <span className="text-red-600">Trending Down</span>
                  </>
                )}
              </div>
            </div>
            
            <p className="text-sm text-gray-500 uppercase tracking-wide mb-4">
              7-Day City Vibe Forecast
            </p>
            
            {/* 7-Day Bar Chart */}
            <div className="flex items-end justify-between gap-2 h-40">
              {vibeData.scores.map((dayData: any, index: number) => {
                const today = new Date();
                const currentDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
                const isToday = index === currentDayIndex;
                const maxScore = 10;
                const barHeight = (dayData.score / maxScore) * 100;
                
                // Color based on today's score
                let barColor = 'bg-gray-300'; // Default grey for all bars
                if (isToday) {
                  // Color today's bar based on the score
                  if (vibeData.currentDayScore >= 8) barColor = 'bg-red-500';
                  else if (vibeData.currentDayScore >= 6) barColor = 'bg-yellow-500';
                  else if (vibeData.currentDayScore >= 4) barColor = 'bg-green-500';
                  else barColor = 'bg-blue-500';
                }
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    {/* Score value above bar */}
                    <div className="text-xs font-semibold text-gray-700 mb-1">
                      {dayData.score.toFixed(1)}
                    </div>
                    {/* Bar */}
                    <div className="w-full bg-gray-100 rounded-t relative" style={{ height: '120px' }}>
                      <div
                        className={`${barColor} rounded-t absolute bottom-0 w-full transition-all duration-300`}
                        style={{ height: `${barHeight}%` }}
                      />
                    </div>
                    {/* Day label */}
                    <div className="text-xs text-gray-600 mt-2 font-medium">
                      {dayData.day}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Action Cards Grid */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {/* Flights & Airport Services */}
          <ActionCard
            title="BOOK A FLIGHT, PRE-BOOK AIRPORT PICKUP & MORE"
            icon="✈️"
            bgColor="from-orange-500 to-orange-600"
            isActive={selectedContentType === 'arrival'}
            onClick={() => handleActionClick('arrival')}
          />

          {/* Tour Guides */}
          <ActionCard
            title="EXPLORE LOCAL SITES WITH OUR AWARD-WINNING TOUR GUIDES!"
            icon="🗺️"
            bgColor="from-orange-500 to-orange-600"
            isActive={selectedContentType === 'tours'}
            onClick={() => handleActionClick('tours')}
          />

          {/* Accommodations */}
          <ActionCard
            title="STAY AT CAREFULLY VETTED AIRBNBs & HOTELS"
            icon="🏠"
            bgColor="from-orange-500 to-orange-600"
            isActive={selectedContentType === 'stay'}
            onClick={() => handleActionClick('stay')}
          />

          {/* Party Hosts */}
          <ActionCard
            title="PARTY LIKE A LOCAL WITH OUR EXPERIENCED HOSTS!"
            icon="🎉"
            bgColor="from-orange-500 to-orange-600"
            isActive={selectedContentType === 'party'}
            onClick={() => handleActionClick('party')}
          />
        </div>

        {/* Dynamic Content Display Area */}
        {selectedContentType && (
          <section className="bg-white rounded-2xl shadow-lg p-6 animate-fadeIn">
            {loadingDynamic ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-500 mx-auto mb-3"></div>
                <p className="text-gray-600">Loading content...</p>
              </div>
            ) : (
              <DynamicContentDisplay 
                contentType={selectedContentType} 
                data={dynamicContent} 
                city={selectedCity}
                userId={userId}
              />
            )}
          </section>
        )}
      </div>
    </div>
  );
}

// Action Card Component
interface ActionCardProps {
  title: string;
  icon: string;
  bgColor: string;
  isActive: boolean;
  onClick: () => void;
}

function ActionCard({ title, icon, bgColor, isActive, onClick }: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden bg-gradient-to-r ${bgColor} text-white rounded-xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 min-h-[100px] md:min-h-[120px] flex flex-col items-center justify-center text-center ${
        isActive ? 'ring-4 ring-yellow-400 ring-offset-2' : ''
      }`}
    >
      <div className="text-2xl md:text-3xl mb-2">{icon}</div>
      <h3 className="font-bold text-xs md:text-sm leading-tight">{title}</h3>
      {isActive && (
        <div className="absolute top-2 right-2 bg-yellow-400 text-gray-900 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
          ✓
        </div>
      )}
    </button>
  );
}

// Dynamic Content Display Component
interface DynamicContentDisplayProps {
  contentType: ContentType;
  data: any;
  city: string;
  userId: string | null;
}

function DynamicContentDisplay({ contentType, data, city, userId }: DynamicContentDisplayProps) {
  if (!data) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No content available for {city} yet.</p>
      </div>
    );
  }

  switch (contentType) {
    case 'arrival':
      return (
        <div className="space-y-6">
          {/* Best to Arrive On */}
          {data.arrivalTips && data.arrivalTips.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="mr-3">✈️</span>
                Best to arrive on
              </h2>
              <div className="space-y-3">
                {data.arrivalTips.map((tip: any) => (
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
            </div>
          )}

          {/* Travel Services */}
          {data.travelServices && data.travelServices.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">🚗</span>
                Travel Services
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.travelServices.map((service: any) => (
                  <div key={service.id} className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold text-gray-900">{service.title}</h4>
                      <span className="px-2 py-1 bg-indigo-200 text-indigo-800 text-xs rounded-full">
                        {service.service_type}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm">{service.description}</p>
                    {service.promo_code && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-mono rounded">
                          {service.promo_code}
                        </span>
                        {service.discount_details && (
                          <span className="text-xs text-gray-600">{service.discount_details}</span>
                        )}
                      </div>
                    )}
                    {service.affiliate_link && (
                      <button
                        onClick={() => trackAndOpenLink({
                          linkUrl: service.affiliate_link,
                          linkType: 'travel_service',
                          contentId: service.id,
                          contentType: 'admin_travel_services',
                          city: city,
                          userLocation: city
                        }, userId || undefined)}
                        className="inline-block mt-3 text-indigo-600 hover:text-indigo-700 font-medium text-sm cursor-pointer"
                      >
                        Book Now →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.arrivalTips.length === 0 && data.travelServices.length === 0 && (
            <p className="text-center text-gray-500 py-8">No arrival information available for {city} yet.</p>
          )}
        </div>
      );

    case 'stay':
      return (
        <div className="space-y-6">
          {/* Best Place to Stay */}
          {data.stayRecommendations && data.stayRecommendations.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="mr-3">🏘️</span>
                Best Place to Stay
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.stayRecommendations.map((rec: any) => (
                  <div
                    key={rec.id}
                    className="p-4 bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-100"
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
            </div>
          )}

          {/* Accommodations Directory */}
          {data.accommodations && data.accommodations.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">🏨</span>
                Recommended Accommodations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.accommodations.map((accom: any) => (
                  <div key={accom.id} className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold text-gray-900">{accom.name}</h4>
                      <span className="px-2 py-1 bg-purple-200 text-purple-800 text-xs rounded-full">
                        {accom.accommodation_type}
                      </span>
                    </div>
                    {accom.neighborhood && (
                      <p className="text-sm text-gray-600 mb-2">📍 {accom.neighborhood}</p>
                    )}
                    <p className="text-gray-700 text-sm">{accom.description}</p>
                    {accom.price_range && (
                      <p className="text-sm text-gray-600 mt-2">💰 {accom.price_range}</p>
                    )}
                    {accom.booking_link && (
                      <button
                        onClick={() => trackAndOpenLink({
                          linkUrl: accom.booking_link,
                          linkType: 'accommodation',
                          contentId: accom.id,
                          contentType: 'admin_accommodations',
                          city: city,
                          userLocation: city
                        }, userId || undefined)}
                        className="inline-block mt-3 text-purple-600 hover:text-purple-700 font-medium text-sm cursor-pointer"
                      >
                        View Details →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.stayRecommendations.length === 0 && data.accommodations.length === 0 && (
            <p className="text-center text-gray-500 py-8">No accommodation information available for {city} yet.</p>
          )}
        </div>
      );

    case 'tours':
      return (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="mr-3">🗺️</span>
            Tour Guides Directory
          </h2>
          {data.tourGuides && data.tourGuides.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.tourGuides.map((guide: any) => (
                <div key={guide.id} className="p-4 bg-gradient-to-br from-yellow-50 to-white rounded-xl border border-yellow-100">
                  <h3 className="font-bold text-gray-900 text-lg">{guide.name}</h3>
                  {guide.specialties && (
                    <p className="text-sm text-gray-600 mt-1">🎯 {guide.specialties}</p>
                  )}
                  <p className="text-gray-700 mt-2">{guide.bio}</p>
                  {guide.contact_info && (
                    <p className="text-sm text-gray-600 mt-3">📞 {guide.contact_info}</p>
                  )}
                  {guide.booking_link && (
                    <button
                      onClick={() => trackAndOpenLink({
                        linkUrl: guide.booking_link,
                        linkType: 'tour_guide',
                        contentId: guide.id,
                        contentType: 'admin_tour_guides',
                        city: city,
                        userLocation: city
                      }, userId || undefined)}
                      className="inline-block mt-3 text-yellow-700 hover:text-yellow-800 font-medium text-sm cursor-pointer"
                    >
                      Book Tour →
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No tour guides available for {city} yet.</p>
          )}
        </div>
      );

    case 'party':
      return (
        <div className="space-y-6">
          {/* Party Hosts */}
          {data.partyHosts && data.partyHosts.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="mr-3">🎉</span>
                Party Hosts Directory
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.partyHosts.map((host: any) => (
                  <div key={host.id} className="p-4 bg-gradient-to-br from-pink-50 to-white rounded-xl border border-pink-100">
                    <h3 className="font-bold text-gray-900 text-lg">{host.name}</h3>
                    {host.specialties && (
                      <p className="text-sm text-gray-600 mt-1">🎯 {host.specialties}</p>
                    )}
                    <p className="text-gray-700 mt-2">{host.bio}</p>
                    {host.contact_info && (
                      <p className="text-sm text-gray-600 mt-3">📞 {host.contact_info}</p>
                    )}
                    {host.booking_link && (
                      <button
                        onClick={() => trackAndOpenLink({
                          linkUrl: host.booking_link,
                          linkType: 'party_host',
                          contentId: host.id,
                          contentType: 'admin_party_hosts',
                          city: city,
                          userLocation: city
                        }, userId || undefined)}
                        className="inline-block mt-3 text-pink-700 hover:text-pink-800 font-medium text-sm cursor-pointer"
                      >
                        Contact Host →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Events of the Month */}
          {data.events && data.events.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">📅</span>
                Events this Month
              </h3>
              <div className="space-y-4">
                {data.events.slice(0, 5).map((event: any) => (
                  <div
                    key={event.id}
                    className="p-4 bg-gradient-to-r from-orange-50 to-white rounded-xl border border-orange-100"
                  >
                    <h4 className="font-semibold text-gray-900 text-lg">{event.title}</h4>
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
                      <button
                        onClick={() => trackAndOpenLink({
                          linkUrl: event.external_link,
                          linkType: 'event',
                          contentId: event.id,
                          contentType: 'admin_events',
                          city: city,
                          userLocation: city
                        }, userId || undefined)}
                        className="inline-block mt-3 text-orange-600 hover:text-orange-700 font-medium cursor-pointer"
                      >
                        Learn More →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.partyHosts.length === 0 && data.events.length === 0 && (
            <p className="text-center text-gray-500 py-8">No party hosts or events available for {city} yet.</p>
          )}
        </div>
      );

    default:
      return null;
  }
}
