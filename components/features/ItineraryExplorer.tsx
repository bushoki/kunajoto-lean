/**
 * ItineraryExplorer — User-facing itinerary section
 * Displayed below the four-square menu in the Explore tab.
 * Shows city-relevant itineraries that match the user's profile.
 * Admins can toggle this section visible/invisible from the dashboard.
 */
import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/supabaseClient';

interface Stop {
  id: string;
  venue_name: string;
  description: string;
  arrive_time: string | null;
  leave_time: string | null;
  is_start: boolean;
  is_end: boolean;
  order_index: number;
  latitude: number | null;
  longitude: number | null;
}

interface Itinerary {
  id: string;
  title: string;
  description: string | null;
  city: string;
  is_paid: boolean;
  route_color: string;
  timing_tags: string[];
  music_tags: string[];
  crowd_density: string | null;
  budget_tier: string | null;
  is_featured: boolean;
  stops?: Stop[];
  has_access?: boolean;
}

interface ItineraryExplorerProps {
  city: string;
  userId: string | null;
  isAuthenticated: boolean;
  onRequestAuth: () => void;
}

export default function ItineraryExplorer({ city, userId, isAuthenticated, onRequestAuth }: ItineraryExplorerProps) {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false); // admin-controlled visibility
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [stopsMap, setStopsMap] = useState<Record<string, Stop[]>>({});
  const [loadingStops, setLoadingStops] = useState<string | null>(null);
  const [lockedItinerary, setLockedItinerary] = useState<Itinerary | null>(null);

  useEffect(() => {
    checkVisibility();
  }, []);

  useEffect(() => {
    if (isVisible && city) {
      loadItineraries();
    }
  }, [isVisible, city, userId]);

  const checkVisibility = async () => {
    try {
      const { data } = await supabase
        .from('admin_feature_flags')
        .select('is_enabled')
        .eq('feature_name', 'itinerary_explorer')
        .single();
      setIsVisible(data?.is_enabled ?? false);
    } catch {
      setIsVisible(false);
    }
  };

  const loadItineraries = async () => {
    setLoading(true);
    try {
      // Load active itineraries for this city
      const { data: itin, error } = await supabase
        .from('itineraries')
        .select('*')
        .eq('city', city)
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('display_order', { ascending: true });

      if (error) throw error;
      if (!itin || itin.length === 0) {
        setItineraries([]);
        setLoading(false);
        return;
      }

      // Check access for paid itineraries
      let accessMap: Record<string, boolean> = {};
      if (userId) {
        // Check if user is admin
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('is_app_admin, default_role')
          .eq('id', userId)
          .single();
        const isAdmin = profile?.is_app_admin || ['app_admin', 'super_admin'].includes(profile?.default_role || '');

        if (isAdmin) {
          // Admins have access to everything
          itin.forEach(i => { accessMap[i.id] = true; });
        } else {
          // Check explicit access grants
          const paidIds = itin.filter(i => i.is_paid).map(i => i.id);
          if (paidIds.length > 0) {
            const { data: access } = await supabase
              .from('itinerary_access')
              .select('itinerary_id')
              .eq('user_id', userId)
              .in('itinerary_id', paidIds);
            (access || []).forEach((a: any) => { accessMap[a.itinerary_id] = true; });
          }
          // Free itineraries always accessible
          itin.filter(i => !i.is_paid).forEach(i => { accessMap[i.id] = true; });
        }
      } else {
        // Guests: only free itineraries
        itin.filter(i => !i.is_paid).forEach(i => { accessMap[i.id] = true; });
      }

      const withAccess = itin.map(i => ({ ...i, has_access: accessMap[i.id] ?? false }));
      setItineraries(withAccess);
    } catch (e) {
      console.error('Failed to load itineraries:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadStops = async (itineraryId: string) => {
    if (stopsMap[itineraryId]) return; // already loaded
    setLoadingStops(itineraryId);
    try {
      const { data } = await supabase
        .from('itinerary_stops')
        .select('*')
        .eq('itinerary_id', itineraryId)
        .order('order_index', { ascending: true });
      setStopsMap(prev => ({ ...prev, [itineraryId]: data || [] }));
    } catch {
      setStopsMap(prev => ({ ...prev, [itineraryId]: [] }));
    } finally {
      setLoadingStops(null);
    }
  };

  const handleExpand = async (itinerary: Itinerary) => {
    if (!itinerary.has_access && itinerary.is_paid) {
      setLockedItinerary(itinerary);
      return;
    }
    const newId = expandedId === itinerary.id ? null : itinerary.id;
    setExpandedId(newId);
    if (newId) await loadStops(newId);
  };

  if (!isVisible) return null;

  return (
    <section className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Section Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
            <i className="fa-solid fa-route text-primary text-lg"></i>
          </div>
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">City Itineraries</h2>
            <p className="text-gray-400 text-xs mt-0.5">Curated routes for {city}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-primary"></div>
          </div>
        ) : itineraries.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fa-solid fa-map text-3xl text-gray-300"></i>
            </div>
            <p className="text-gray-500 font-medium">No itineraries yet for {city}</p>
            <p className="text-gray-400 text-sm mt-1">Check back soon — curated routes are coming.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {itineraries.map((itinerary, index) => (
              <ItineraryCard
                key={itinerary.id}
                itinerary={itinerary}
                index={index}
                isExpanded={expandedId === itinerary.id}
                stops={stopsMap[itinerary.id] || []}
                loadingStops={loadingStops === itinerary.id}
                onToggle={() => handleExpand(itinerary)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Locked Itinerary Modal */}
      {lockedItinerary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
            {/* Preview header with route color */}
            <div
              className="h-2"
              style={{ backgroundColor: lockedItinerary.route_color || '#FF6B35' }}
            />
            <div className="p-6">
              <div className="text-center mb-5">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <i className="fa-solid fa-lock text-3xl text-primary"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900">{lockedItinerary.title}</h3>
                <p className="text-gray-500 text-sm mt-1">This is a premium itinerary</p>
              </div>

              {/* Tags preview */}
              <div className="flex flex-wrap gap-2 justify-center mb-5">
                {lockedItinerary.timing_tags?.slice(0, 3).map(tag => (
                  <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                    {tag}
                  </span>
                ))}
                {lockedItinerary.music_tags?.slice(0, 2).map(tag => (
                  <span key={tag} className="px-3 py-1 bg-orange-50 text-primary rounded-full text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>

              <p className="text-sm text-gray-600 text-center mb-6">
                Subscribe to unlock this curated route and access all premium itineraries in {lockedItinerary.city}.
              </p>

              <div className="space-y-3">
                {!isAuthenticated ? (
                  <button
                    onClick={() => { setLockedItinerary(null); onRequestAuth(); }}
                    className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary/90 transition"
                  >
                    <i className="fa-solid fa-user-plus mr-2"></i>
                    Sign Up to Subscribe
                  </button>
                ) : (
                  <button
                    className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary/90 transition"
                    onClick={() => setLockedItinerary(null)}
                  >
                    <i className="fa-solid fa-crown mr-2"></i>
                    Subscribe to Unlock
                  </button>
                )}
                <button
                  onClick={() => setLockedItinerary(null)}
                  className="w-full border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition text-sm"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Itinerary Card ─────────────────────────────────────────────────────────

function ItineraryCard({
  itinerary,
  index,
  isExpanded,
  stops,
  loadingStops,
  onToggle,
}: {
  itinerary: Itinerary;
  index: number;
  isExpanded: boolean;
  stops: Stop[];
  loadingStops: boolean;
  onToggle: () => void;
}) {
  const color = itinerary.route_color || '#FF6B35';
  const isLocked = itinerary.is_paid && !itinerary.has_access;

  return (
    <div
      className={`rounded-2xl border-2 overflow-hidden transition-all duration-200 ${
        isExpanded ? 'shadow-lg' : 'shadow-sm hover:shadow-md'
      }`}
      style={{ borderColor: isExpanded ? color : '#E5E7EB' }}
    >
      {/* Card Header — always visible */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4 flex items-center gap-4"
      >
        {/* Number badge */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ backgroundColor: color }}
        >
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-900 text-sm truncate">{itinerary.title}</span>
            {itinerary.is_featured && (
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full flex-shrink-0">
                ⭐ Featured
              </span>
            )}
            {itinerary.is_paid ? (
              <span className={`px-2 py-0.5 text-xs font-bold rounded-full flex-shrink-0 ${
                isLocked ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'
              }`}>
                {isLocked ? '🔒 Premium' : '✓ Premium'}
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full flex-shrink-0">
                Free
              </span>
            )}
          </div>

          {/* Tags row */}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {itinerary.timing_tags?.slice(0, 2).map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">{tag}</span>
            ))}
            {itinerary.music_tags?.slice(0, 2).map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-orange-50 text-orange-500 text-xs rounded-full">{tag}</span>
            ))}
            {itinerary.crowd_density && (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-500 text-xs rounded-full">{itinerary.crowd_density}</span>
            )}
          </div>
        </div>

        {/* Expand / Lock indicator */}
        <div className="flex-shrink-0">
          {isLocked ? (
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-lock text-gray-400 text-xs"></i>
            </div>
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-200"
              style={{ backgroundColor: color + '20' }}
            >
              <i
                className={`fa-solid fa-chevron-down text-xs transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                style={{ color }}
              ></i>
            </div>
          )}
        </div>
      </button>

      {/* Expanded Content — stops list */}
      {isExpanded && (
        <div className="border-t border-gray-100 px-4 pb-4">
          {itinerary.description && (
            <p className="text-sm text-gray-600 py-3 italic">{itinerary.description}</p>
          )}

          {loadingStops ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: color }}></div>
            </div>
          ) : stops.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center italic">No stops added yet.</p>
          ) : (
            <div className="relative mt-3">
              {/* Vertical timeline line */}
              <div
                className="absolute left-4 top-4 bottom-4 w-0.5 rounded-full"
                style={{ backgroundColor: color + '40' }}
              />

              <div className="space-y-4">
                {stops.map((stop, i) => (
                  <div key={stop.id} className="flex gap-4 relative">
                    {/* Timeline dot */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 z-10 shadow-sm"
                      style={{ backgroundColor: stop.is_start ? color : stop.is_end ? '#1F2937' : color + 'CC' }}
                    >
                      {stop.is_start ? (
                        <i className="fa-solid fa-play text-xs"></i>
                      ) : stop.is_end ? (
                        <i className="fa-solid fa-flag-checkered text-xs"></i>
                      ) : (
                        i + 1
                      )}
                    </div>

                    {/* Stop content */}
                    <div className="flex-1 bg-gray-50 rounded-xl p-3 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{stop.venue_name}</p>
                          {(stop.arrive_time || stop.leave_time) && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {stop.arrive_time && <span>Arrive: <strong>{stop.arrive_time}</strong></span>}
                              {stop.arrive_time && stop.leave_time && <span className="mx-1">·</span>}
                              {stop.leave_time && <span>Leave: <strong>{stop.leave_time}</strong></span>}
                            </p>
                          )}
                        </div>
                        {stop.is_start && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full flex-shrink-0">START</span>
                        )}
                        {stop.is_end && (
                          <span className="px-2 py-0.5 bg-gray-800 text-white text-xs font-bold rounded-full flex-shrink-0">END</span>
                        )}
                      </div>
                      {stop.description && (
                        <p className="text-xs text-gray-600 mt-2 leading-relaxed">{stop.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
