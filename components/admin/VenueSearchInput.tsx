/**
 * VenueSearchInput.tsx
 * Search input for selecting a venue when building itinerary stops.
 * 
 * Priority order:
 *  1. Search existing Supabase venues (filtered by city if provided)
 *  2. If no match found, offer "Add as new venue" via Google Places Autocomplete
 * 
 * Branch: map-features
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../src/supabaseClient';

declare var google: any;

export interface VenueResult {
  id: string;
  name: string;
  type?: string;
  city?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  price_level?: number;
  description?: string;
  isNew?: boolean; // true if sourced from Google Places (not yet in DB)
  place_id?: string; // Google Places ID for new venues
}

interface VenueSearchInputProps {
  city: string;
  value: VenueResult | null;
  onChange: (venue: VenueResult | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

const VenueSearchInput: React.FC<VenueSearchInputProps> = ({
  city,
  value,
  onChange,
  placeholder = 'Search venues...',
  disabled = false,
}) => {
  const [query, setQuery] = useState('');
  const [supabaseResults, setSupabaseResults] = useState<VenueResult[]>([]);
  const [placesResults, setPlacesResults] = useState<VenueResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPlacesFallback, setShowPlacesFallback] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize Google Places services
  useEffect(() => {
    if (typeof google !== 'undefined' && google.maps?.places) {
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
      // PlacesService needs a DOM element
      const div = document.createElement('div');
      placesServiceRef.current = new google.maps.places.PlacesService(div);
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Search Supabase venues
  const searchSupabase = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSupabaseResults([]);
      return;
    }
    setIsLoading(true);
    try {
      let queryBuilder = supabase
        .from('venues')
        .select('id, name, type, city, district, latitude, longitude, price_level, description')
        .ilike('name', `%${q}%`)
        .limit(8);

      // Filter by city if provided
      if (city && city.trim()) {
        queryBuilder = queryBuilder.ilike('city', `%${city}%`);
      }

      const { data, error } = await queryBuilder;
      if (error) throw error;
      setSupabaseResults((data || []) as VenueResult[]);
      // Show Places fallback if fewer than 3 results
      setShowPlacesFallback((data || []).length < 3);
    } catch (err) {
      console.warn('[VenueSearchInput] Supabase search error:', err);
      setSupabaseResults([]);
      setShowPlacesFallback(true);
    } finally {
      setIsLoading(false);
    }
  }, [city]);

  // Search Google Places
  const searchPlaces = useCallback((q: string) => {
    if (!autocompleteServiceRef.current || !q.trim()) {
      setPlacesResults([]);
      return;
    }
    const request: any = {
      input: q,
      types: ['establishment'],
    };
    if (city) {
      request.componentRestrictions = {};
      // Use city as a bias if we can
    }
    autocompleteServiceRef.current.getPlacePredictions(request, (predictions: any[], status: string) => {
      if (status !== 'OK' || !predictions) {
        setPlacesResults([]);
        return;
      }
      const results: VenueResult[] = predictions.slice(0, 5).map(p => ({
        id: `places_${p.place_id}`,
        name: p.structured_formatting?.main_text || p.description,
        district: p.structured_formatting?.secondary_text || '',
        city: city,
        isNew: true,
        place_id: p.place_id,
      }));
      setPlacesResults(results);
    });
  }, [city]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSupabaseResults([]);
      setPlacesResults([]);
      setIsOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      searchSupabase(query);
      if (showPlacesFallback) searchPlaces(query);
      setIsOpen(true);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchSupabase, searchPlaces, showPlacesFallback]);

  // When Places fallback becomes available, trigger Places search
  useEffect(() => {
    if (showPlacesFallback && query.trim()) {
      searchPlaces(query);
    }
  }, [showPlacesFallback, query, searchPlaces]);

  // Handle selecting a venue from Supabase results
  const handleSelectSupabase = (venue: VenueResult) => {
    onChange(venue);
    setQuery('');
    setIsOpen(false);
    setSupabaseResults([]);
    setPlacesResults([]);
  };

  // Handle selecting a Google Places result — fetch full details to get coordinates
  const handleSelectPlaces = (venue: VenueResult) => {
    if (!placesServiceRef.current || !venue.place_id) {
      onChange(venue);
      setQuery('');
      setIsOpen(false);
      return;
    }
    placesServiceRef.current.getDetails(
      {
        placeId: venue.place_id,
        fields: ['name', 'geometry', 'formatted_address', 'types', 'price_level', 'place_id'],
      },
      (place: any, status: string) => {
        if (status === 'OK' && place) {
          const enriched: VenueResult = {
            ...venue,
            name: place.name || venue.name,
            latitude: place.geometry?.location?.lat(),
            longitude: place.geometry?.location?.lng(),
            district: place.formatted_address || venue.district,
            type: place.types?.[0] || 'bar',
            price_level: place.price_level,
            isNew: true,
            place_id: venue.place_id,
          };
          onChange(enriched);
        } else {
          onChange(venue);
        }
        setQuery('');
        setIsOpen(false);
        setSupabaseResults([]);
        setPlacesResults([]);
      }
    );
  };

  const handleClear = () => {
    onChange(null);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const allResults = [...supabaseResults, ...(showPlacesFallback ? placesResults : [])];

  const getPriceBadge = (level?: number) => {
    if (!level) return '';
    return '💰'.repeat(Math.min(level, 3));
  };

  const getTypeIcon = (type?: string) => {
    if (!type) return '📍';
    if (type.includes('night_club') || type.includes('club')) return '🎉';
    if (type.includes('bar')) return '🍹';
    if (type.includes('restaurant')) return '🍽️';
    if (type.includes('lounge')) return '🛋️';
    if (type.includes('cafe') || type.includes('coffee')) return '☕';
    return '📍';
  };

  return (
    <div className="relative w-full">
      {/* Selected venue display */}
      {value ? (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 border-2 border-green-300 rounded-xl">
          <span className="text-lg">{getTypeIcon(value.type)}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-gray-900 truncate">{value.name}</div>
            <div className="text-xs text-gray-500 truncate">
              {value.city}{value.district ? ` · ${value.district}` : ''}
              {value.isNew && <span className="ml-1 text-orange-500 font-bold">· NEW</span>}
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 hover:bg-red-100 hover:text-red-500 transition flex-shrink-0"
            >
              <i className="fa-solid fa-xmark text-xs"></i>
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <i className="fa-solid fa-magnifying-glass text-sm"></i>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => query.trim() && setIsOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full pl-9 pr-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary transition bg-white disabled:bg-gray-50 disabled:text-gray-400"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && !value && allResults.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-[400] max-h-64 overflow-y-auto"
        >
          {/* Supabase results */}
          {supabaseResults.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 bg-gray-50 rounded-t-xl">
                <i className="fa-solid fa-database mr-1"></i>
                In Your Venues Database
              </div>
              {supabaseResults.map(venue => (
                <button
                  key={venue.id}
                  type="button"
                  onClick={() => handleSelectSupabase(venue)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition text-left border-b border-gray-50 last:border-0"
                >
                  <span className="text-base flex-shrink-0">{getTypeIcon(venue.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{venue.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {venue.city}{venue.district ? ` · ${venue.district}` : ''}
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
                    {venue.type && (
                      <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold uppercase">
                        {venue.type.replace('_', ' ')}
                      </span>
                    )}
                    {venue.price_level && (
                      <span className="text-[9px] text-gray-400">{getPriceBadge(venue.price_level)}</span>
                    )}
                  </div>
                </button>
              ))}
            </>
          )}

          {/* Google Places fallback */}
          {showPlacesFallback && placesResults.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 bg-orange-50">
                <i className="fa-brands fa-google mr-1 text-orange-500"></i>
                Add from Google Places
              </div>
              {placesResults.map(venue => (
                <button
                  key={venue.id}
                  type="button"
                  onClick={() => handleSelectPlaces(venue)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-orange-50 transition text-left border-b border-gray-50 last:border-0"
                >
                  <span className="text-base flex-shrink-0">📍</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{venue.name}</div>
                    <div className="text-xs text-gray-500 truncate">{venue.district}</div>
                  </div>
                  <span className="flex-shrink-0 text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-bold">
                    + ADD NEW
                  </span>
                </button>
              ))}
            </>
          )}

          {/* No results */}
          {allResults.length === 0 && !isLoading && query.trim() && (
            <div className="px-3 py-4 text-center text-sm text-gray-400">
              No venues found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VenueSearchInput;
