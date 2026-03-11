/**
 * VenueSearchInput.tsx
 * Venue search for itinerary stop builder.
 *
 * UX Flow:
 *  1. Admin types → searches Supabase venues filtered by city (200ms debounce)
 *  2. If DB returns results → show ONLY DB results (no Google Places shown)
 *  3. If DB returns 0 results → show explicit options:
 *       a) "Search Google Places" button (city-biased query)
 *       b) "Add manually" button (name + lat/lng form)
 *  4. "Add manually" shortcut always visible below the input
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
  isNew?: boolean;
  isManual?: boolean;
  place_id?: string;
}

interface VenueSearchInputProps {
  city: string;
  value: VenueResult | null;
  onChange: (venue: VenueResult | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

type Mode = 'db' | 'places' | 'manual';

const VenueSearchInput: React.FC<VenueSearchInputProps> = ({
  city, value, onChange, placeholder = 'Search venues...', disabled = false,
}) => {
  const [query, setQuery] = useState('');
  const [dbResults, setDbResults] = useState<VenueResult[]>([]);
  const [placesResults, setPlacesResults] = useState<VenueResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<Mode>('db');
  const [dbDone, setDbDone] = useState(false);

  // Manual entry state
  const [manualName, setManualName] = useState('');
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const acRef = useRef<any>(null);
  const psRef = useRef<any>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Init Google Places services
  useEffect(() => {
    if (typeof google !== 'undefined' && google.maps?.places) {
      acRef.current = new google.maps.places.AutocompleteService();
      psRef.current = new google.maps.places.PlacesService(document.createElement('div'));
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Supabase DB search ─────────────────────────────────────────────────────
  const searchDb = useCallback(async (q: string) => {
    if (!q.trim()) { setDbResults([]); setDbDone(false); return; }
    setIsLoading(true);
    setDbDone(false);
    try {
      let qb = supabase
        .from('venues')
        .select('id, name, type, city, district, latitude, longitude, price_level')
        .ilike('name', `%${q}%`)
        .limit(10);
      if (city?.trim()) qb = qb.ilike('city', `%${city.trim()}%`);
      const { data, error } = await qb;
      if (error) {
        console.warn('[VenueSearch] DB error:', error.message);
        setDbResults([]);
      } else {
        setDbResults((data || []) as VenueResult[]);
      }
    } catch (e: any) {
      console.warn('[VenueSearch] Exception:', e?.message);
      setDbResults([]);
    } finally {
      setIsLoading(false);
      setDbDone(true);
    }
  }, [city]);

  // ── Google Places search (city-biased) ─────────────────────────────────────
  const searchPlaces = useCallback((q: string) => {
    if (!acRef.current || !q.trim()) { setPlacesResults([]); return; }
    setIsLoading(true);
    // Append city to bias results geographically
    const biasedQuery = city?.trim() ? `${q} ${city.trim()}` : q;
    acRef.current.getPlacePredictions(
      { input: biasedQuery, types: ['establishment'] },
      (preds: any[], status: string) => {
        setIsLoading(false);
        if (status !== 'OK' || !preds) { setPlacesResults([]); return; }
        setPlacesResults(preds.slice(0, 6).map(p => ({
          id: `places_${p.place_id}`,
          name: p.structured_formatting?.main_text || p.description,
          district: p.structured_formatting?.secondary_text || '',
          city,
          isNew: true,
          place_id: p.place_id,
        })));
      }
    );
  }, [city]);

  // ── Debounced search trigger ───────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setDbResults([]); setPlacesResults([]); setDbDone(false); setIsOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      if (mode === 'places') searchPlaces(query);
      else searchDb(query);
      setIsOpen(true);
    }, 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, mode, searchDb, searchPlaces]);

  // ── Event handlers ─────────────────────────────────────────────────────────
  const selectDb = (v: VenueResult) => {
    onChange(v);
    setQuery(''); setIsOpen(false); setDbResults([]);
    setMode('db'); setDbDone(false);
  };

  const selectPlaces = (v: VenueResult) => {
    if (!psRef.current || !v.place_id) {
      onChange({ ...v, isNew: true });
      resetSearch(); return;
    }
    setIsLoading(true);
    psRef.current.getDetails(
      { placeId: v.place_id, fields: ['name', 'geometry', 'types', 'formatted_address', 'price_level'] },
      (place: any, status: string) => {
        setIsLoading(false);
        if (status === 'OK' && place?.geometry?.location) {
          onChange({
            id: `places_${v.place_id}`,
            name: place.name,
            city,
            district: place.formatted_address,
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
            type: place.types?.[0] || 'establishment',
            price_level: place.price_level,
            isNew: true,
            place_id: v.place_id,
          });
        } else {
          onChange({ ...v, isNew: true });
        }
        resetSearch();
      }
    );
  };

  const submitManual = () => {
    if (!manualName.trim()) return;
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    onChange({
      id: `manual_${Date.now()}`,
      name: manualName.trim(),
      city,
      latitude: isNaN(lat) ? undefined : lat,
      longitude: isNaN(lng) ? undefined : lng,
      isManual: true,
      isNew: true,
    });
    setManualName(''); setManualLat(''); setManualLng('');
    setMode('db'); setQuery(''); setIsOpen(false);
  };

  const resetSearch = () => {
    setQuery(''); setIsOpen(false); setDbResults([]); setPlacesResults([]);
    setMode('db'); setDbDone(false);
  };

  const goPlaces = () => {
    setMode('places'); setDbResults([]); setPlacesResults([]); setDbDone(false);
    if (query.trim()) setTimeout(() => searchPlaces(query), 0);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const goManual = () => {
    setMode('manual'); setIsOpen(false); setManualName(query);
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const typeIcon = (t?: string): string => {
    const icons: Record<string, string> = {
      bar: '🍸', night_club: '🎵', restaurant: '🍽️', cafe: '☕', lodging: '🏨',
    };
    return icons[t || ''] || '📍';
  };
  const priceBadge = (l?: number) => l ? '$'.repeat(Math.min(l, 4)) : '';

  // ── Selected state ─────────────────────────────────────────────────────────
  if (value) {
    const hasCoords = value.latitude !== undefined && value.longitude !== undefined;
    return (
      <div className="space-y-2">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 ${
          value.isManual ? 'border-purple-300 bg-purple-50' :
          value.isNew    ? 'border-orange-300 bg-orange-50' :
                           'border-green-300 bg-green-50'
        }`}>
          <span className="text-lg flex-shrink-0">{typeIcon(value.type)}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-gray-900 truncate">{value.name}</div>
            <div className="text-xs text-gray-500 truncate">
              {value.city}{value.district ? ` · ${value.district}` : ''}
            </div>
            {hasCoords
              ? <div className="text-[10px] text-green-600 font-mono mt-0.5">
                  ✓ {value.latitude?.toFixed(5)}, {value.longitude?.toFixed(5)}
                </div>
              : <div className="text-[10px] text-amber-600 font-semibold mt-0.5">
                  ⚠ No coordinates — enter below
                </div>
            }
          </div>
          <div className="flex-shrink-0 flex flex-col items-end gap-1">
            {value.isNew && !value.isManual && (
              <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-bold">NEW</span>
            )}
            {value.isManual && (
              <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-bold">MANUAL</span>
            )}
            <button type="button"
              onClick={() => { onChange(null); setMode('db'); setQuery(''); }}
              className="text-[10px] text-gray-400 hover:text-red-500 transition">
              ✕ change
            </button>
          </div>
        </div>
        {/* Inline lat/lng inputs if no coordinates */}
        {!hasCoords && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Latitude</label>
              <input type="number" step="any" placeholder="-4.0297"
                value={value.latitude ?? ''}
                onChange={e => onChange({ ...value, latitude: parseFloat(e.target.value) || undefined })}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Longitude</label>
              <input type="number" step="any" placeholder="39.7205"
                value={value.longitude ?? ''}
                onChange={e => onChange({ ...value, longitude: parseFloat(e.target.value) || undefined })}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Manual entry mode ──────────────────────────────────────────────────────
  if (mode === 'manual') {
    return (
      <div className="space-y-2 p-3 bg-purple-50 border-2 border-purple-200 rounded-xl">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-purple-700 uppercase tracking-widest">
            ✏️ Add Venue Manually
          </span>
          <button type="button"
            onClick={() => { setMode('db'); setManualName(''); setManualLat(''); setManualLng(''); }}
            className="text-[10px] text-gray-400 hover:text-gray-600">
            ← back to search
          </button>
        </div>
        <input type="text" placeholder="Venue name *" value={manualName}
          onChange={e => setManualName(e.target.value)}
          autoFocus
          className="w-full border border-purple-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400 bg-white" />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Latitude</label>
            <input type="number" step="any" placeholder="-4.0297" value={manualLat}
              onChange={e => setManualLat(e.target.value)}
              className="w-full border border-purple-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400 bg-white" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Longitude</label>
            <input type="number" step="any" placeholder="39.7205" value={manualLng}
              onChange={e => setManualLng(e.target.value)}
              className="w-full border border-purple-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400 bg-white" />
          </div>
        </div>
        <p className="text-[10px] text-gray-400">
          💡 Right-click any spot on Google Maps → "What's here?" to copy coordinates
        </p>
        <button type="button" onClick={submitManual} disabled={!manualName.trim()}
          className="w-full bg-purple-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
          ✓ Use This Venue
        </button>
      </div>
    );
  }

  // ── Main search input (DB or Places mode) ──────────────────────────────────
  return (
    <div ref={wrapRef} className="relative w-full">
      {/* Places mode header */}
      {mode === 'places' && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold text-orange-500">
            <i className="fa-brands fa-google mr-1"></i>
            Google Places {city ? `(searching in ${city})` : ''}
          </span>
          <button type="button" onClick={() => { setMode('db'); setPlacesResults([]); }}
            className="text-[10px] text-gray-400 hover:text-gray-600">
            ← back to DB
          </button>
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {mode === 'places'
            ? <i className="fa-brands fa-google text-sm text-orange-400"></i>
            : <i className="fa-solid fa-magnifying-glass text-sm"></i>
          }
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { if (query.trim()) setIsOpen(true); }}
          placeholder={mode === 'places'
            ? `Search Google Places${city ? ` in ${city}` : ''}...`
            : placeholder
          }
          disabled={disabled}
          className={`w-full pl-9 pr-8 py-2.5 border-2 rounded-xl text-sm focus:outline-none transition bg-white disabled:bg-gray-50 disabled:text-gray-400 ${
            mode === 'places'
              ? 'border-orange-300 focus:border-orange-400'
              : 'border-gray-200 focus:border-primary'
          }`}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Always-visible manual add shortcut */}
      {mode === 'db' && (
        <button type="button" onClick={goManual}
          className="mt-1 text-[10px] text-purple-500 hover:text-purple-700 font-semibold transition flex items-center gap-1">
          <span>✏️</span> Can't find it? Add venue manually
        </button>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-[500] max-h-72 overflow-y-auto">

          {/* DB results — shown ONLY when mode is 'db' */}
          {mode === 'db' && dbResults.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 bg-gray-50 rounded-t-xl sticky top-0">
                <i className="fa-solid fa-database mr-1"></i>
                {city ? `Venues in ${city}` : 'Your Venues Database'}
                <span className="ml-1 text-gray-300">({dbResults.length})</span>
              </div>
              {dbResults.map(v => (
                <button key={v.id} type="button" onClick={() => selectDb(v)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition text-left border-b border-gray-50 last:border-0">
                  <span className="text-base flex-shrink-0">{typeIcon(v.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{v.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {v.city}{v.district ? ` · ${v.district}` : ''}
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
                    {v.type && (
                      <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold uppercase">
                        {v.type.replace('_', ' ')}
                      </span>
                    )}
                    {v.price_level != null && (
                      <span className="text-[9px] text-gray-400">{priceBadge(v.price_level)}</span>
                    )}
                  </div>
                </button>
              ))}
            </>
          )}

          {/* DB search done with 0 results → show fallback options */}
          {mode === 'db' && dbDone && dbResults.length === 0 && !isLoading && (
            <div className="px-3 py-3">
              <p className="text-xs text-gray-500 mb-2.5">
                <strong>"{query}"</strong> not found{city ? ` in ${city}` : ''} in the database.
              </p>
              <div className="flex flex-col gap-1.5">
                <button type="button" onClick={goPlaces}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-orange-50 border border-orange-200 rounded-lg text-xs font-semibold text-orange-700 hover:bg-orange-100 transition">
                  <i className="fa-brands fa-google"></i>
                  Search Google Places for "{query}"
                </button>
                <button type="button" onClick={goManual}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-purple-50 border border-purple-200 rounded-lg text-xs font-semibold text-purple-700 hover:bg-purple-100 transition">
                  ✏️ Add manually (enter name + coordinates)
                </button>
              </div>
            </div>
          )}

          {/* Google Places results — shown ONLY when mode is 'places' */}
          {mode === 'places' && placesResults.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 bg-orange-50 rounded-t-xl sticky top-0">
                <i className="fa-brands fa-google mr-1 text-orange-500"></i>
                Google Places
              </div>
              {placesResults.map(v => (
                <button key={v.id} type="button" onClick={() => selectPlaces(v)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-orange-50 transition text-left border-b border-gray-50 last:border-0">
                  <span className="text-base flex-shrink-0">📍</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{v.name}</div>
                    <div className="text-xs text-gray-500 truncate">{v.district}</div>
                  </div>
                  <span className="flex-shrink-0 text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-bold">
                    + ADD
                  </span>
                </button>
              ))}
            </>
          )}

          {/* Places mode, no results */}
          {mode === 'places' && placesResults.length === 0 && !isLoading && query.trim() && (
            <div className="px-3 py-3 text-center">
              <p className="text-xs text-gray-400 mb-2">No Google Places results for "{query}"</p>
              <button type="button" onClick={goManual}
                className="text-xs text-purple-600 hover:text-purple-700 font-semibold">
                ✏️ Add manually instead
              </button>
            </div>
          )}

          {/* Loading spinner */}
          {isLoading && (
            <div className="px-3 py-3 text-center text-xs text-gray-400">
              <div className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2 align-middle"></div>
              Searching...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VenueSearchInput;
