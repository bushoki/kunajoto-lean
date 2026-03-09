import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/supabaseClient';
import VenueSearchInput, { VenueResult } from './VenueSearchInput';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ItineraryStop {
  id?: string;
  stop_order: number;
  is_starting_point: boolean;
  is_ending_point: boolean;
  name: string;
  description: string;
  latitude: number | '';
  longitude: number | '';
  arrive_time: string;
  leave_time: string;
  venue_id?: string;
  // Transient UI state — selected venue object (not persisted directly)
  _selectedVenue?: VenueResult | null;
}

interface Itinerary {
  id: string;
  title: string;
  description: string;
  city: string;
  is_paid: boolean;
  price: number;
  currency: string;
  vibe_tags: string[];
  music_genres: string[];
  crowd_density: string;
  budget_tier: string;
  time_preferences: string[];
  start_time: string;
  end_time: string;
  days_of_week: string[];
  color: string;
  display_order: number;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  stops?: ItineraryStop[];
}

interface ItineraryManagerProps {
  adminUserId: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const VIBE_TAG_OPTIONS = ['Late Night', 'Afters', 'Happy Hour', 'Prime Time', 'Sunset', 'Brunch', 'All Night'];
const MUSIC_OPTIONS = ['House', 'Hip Hop', 'Techno', 'Jazz', 'Pop', 'Reggaeton', 'Rock', 'Afrobeats', 'Amapiano', 'R&B', 'Indie', 'Dancehall'];
const CROWD_OPTIONS = ['Intimate', 'Buzzing', 'Packed', 'Raging'];
const BUDGET_OPTIONS = ['$', '$$', '$$$', '$$$$'];
const TIMING_OPTIONS = [
  { id: 'Happy Hour', label: '17:00–20:00' },
  { id: 'Prime Time', label: '21:00–00:00' },
  { id: 'Late Night', label: '00:00–03:00' },
  { id: 'Afters', label: '03:00+' },
];
const DAY_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const COLOR_PRESETS = [
  '#FF6B35', // Orange (default)
  '#22C55E', // Green
  '#A855F7', // Purple
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#EAB308', // Yellow
  '#EC4899', // Pink
  '#14B8A6', // Teal
];

const emptyStop = (): ItineraryStop => ({
  stop_order: 1,
  is_starting_point: false,
  is_ending_point: false,
  name: '',
  description: '',
  latitude: '',
  longitude: '',
  arrive_time: '',
  leave_time: '',
});

const emptyForm = (): Partial<Itinerary> & { stops: ItineraryStop[] } => ({
  title: '',
  description: '',
  city: '',
  is_paid: false,
  price: 0,
  currency: 'USD',
  vibe_tags: [],
  music_genres: [],
  crowd_density: 'Buzzing',
  budget_tier: '$$',
  time_preferences: [],
  start_time: '',
  end_time: '',
  days_of_week: [],
  color: '#FF6B35',
  display_order: 0,
  is_active: true,
  is_featured: false,
  stops: [{ ...emptyStop(), stop_order: 1, is_starting_point: true }],
});

// ─── Component ────────────────────────────────────────────────────────────────
const ItineraryManager: React.FC<ItineraryManagerProps> = ({ adminUserId }) => {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cityFilter, setCityFilter] = useState('');
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadItineraries();
    loadCities();
  }, []);

  const loadCities = async () => {
    const { data } = await supabase
      .from('venues')
      .select('city')
      .not('city', 'is', null)
      .order('city');
    if (data) {
      const unique = [...new Set(data.map(v => v.city))].filter(Boolean).sort();
      setAvailableCities(unique);
    }
  };

  const loadItineraries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('itineraries')
        .select('*')
        .order('city', { ascending: true })
        .order('display_order', { ascending: true });
      if (error) throw error;
      // Load stops for each itinerary
      const withStops = await Promise.all(
        (data || []).map(async (itin) => {
          const { data: stops } = await supabase
            .from('itinerary_stops')
            .select('*')
            .eq('itinerary_id', itin.id)
            .order('stop_order', { ascending: true });
          return { ...itin, stops: stops || [] };
        })
      );
      setItineraries(withStops);
    } catch (err: any) {
      showNotif('Failed to load itineraries: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotif = (msg: string, type: 'success' | 'error') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // ── Toggle array field ────────────────────────────────────────────────────
  const toggleArray = (field: keyof typeof form, value: string) => {
    const arr = (form[field] as string[]) || [];
    setForm(prev => ({
      ...prev,
      [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value],
    }));
  };

  // ── Stop management ───────────────────────────────────────────────────────
  const addStop = () => {
    setForm(prev => ({
      ...prev,
      stops: [
        ...prev.stops,
        { ...emptyStop(), stop_order: prev.stops.length + 1 },
      ],
    }));
  };

  const removeStop = (idx: number) => {
    setForm(prev => {
      const updated = prev.stops.filter((_, i) => i !== idx).map((s, i) => ({ ...s, stop_order: i + 1 }));
      return { ...prev, stops: updated };
    });
  };

  const updateStop = (idx: number, field: keyof ItineraryStop, value: any) => {
    setForm(prev => {
      const updated = [...prev.stops];
      updated[idx] = { ...updated[idx], [field]: value };
      // Auto-manage start/end flags
      if (field === 'is_starting_point' && value) {
        updated.forEach((s, i) => { if (i !== idx) s.is_starting_point = false; });
      }
      if (field === 'is_ending_point' && value) {
        updated.forEach((s, i) => { if (i !== idx) s.is_ending_point = false; });
      }
      return { ...prev, stops: updated };
    });
  };

  // ── Update stop from venue selection ──────────────────────────────────────
  const updateStopFromVenue = (idx: number, venue: VenueResult | null) => {
    setForm(prev => {
      const updated = [...prev.stops];
      if (venue) {
        updated[idx] = {
          ...updated[idx],
          _selectedVenue: venue,
          name: venue.name,
          latitude: venue.latitude ?? '',
          longitude: venue.longitude ?? '',
          venue_id: venue.isNew ? undefined : venue.id, // Only set venue_id for existing DB venues
        };
      } else {
        // Clear venue selection
        updated[idx] = {
          ...updated[idx],
          _selectedVenue: null,
          name: '',
          latitude: '',
          longitude: '',
          venue_id: undefined,
        };
      }
      return { ...prev, stops: updated };
    });
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const startEdit = (itin: Itinerary) => {
    setEditingId(itin.id);
    setForm({
      ...itin,
      stops: itin.stops || [],
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.title?.trim() || !form.city?.trim()) {
      showNotif('Title and City are required.', 'error');
      return;
    }
    if (form.stops.length === 0) {
      showNotif('Add at least one stop.', 'error');
      return;
    }
    setSaving(true);
    try {
      const itinPayload = {
        title: form.title,
        description: form.description || '',
        city: form.city,
        is_paid: form.is_paid,
        price: form.is_paid ? (form.price || 0) : 0,
        currency: form.currency || 'USD',
        vibe_tags: form.vibe_tags || [],
        music_genres: form.music_genres || [],
        crowd_density: form.crowd_density || 'Buzzing',
        budget_tier: form.budget_tier || '$$',
        time_preferences: form.time_preferences || [],
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        days_of_week: form.days_of_week || [],
        color: form.color || '#FF6B35',
        display_order: form.display_order || 0,
        is_active: form.is_active !== false,
        is_featured: form.is_featured || false,
        updated_by: adminUserId,
      };

      let itinId = editingId;

      if (editingId) {
        const { error } = await supabase
          .from('itineraries')
          .update(itinPayload)
          .eq('id', editingId);
        if (error) throw error;
        // Delete existing stops and re-insert
        await supabase.from('itinerary_stops').delete().eq('itinerary_id', editingId);
      } else {
        const { data, error } = await supabase
          .from('itineraries')
          .insert({ ...itinPayload, created_by: adminUserId })
          .select('id')
          .single();
        if (error) throw error;
        itinId = data.id;
      }

      // Insert stops — first handle any new venues from Google Places
      if (form.stops.length > 0 && itinId) {
        const resolvedStops = await Promise.all(
          form.stops.map(async (s, i) => {
            let venueId = s.venue_id || null;

            // If this stop came from Google Places (isNew = true), insert it into venues first
            if (s._selectedVenue?.isNew && s.name && s.latitude !== '' && s.longitude !== '') {
              const newVenue = {
                id: s._selectedVenue.place_id || `places_${Date.now()}_${i}`,
                name: s.name,
                type: s._selectedVenue.type || 'bar',
                city: form.city || s._selectedVenue.city || '',
                district: s._selectedVenue.district || '',
                latitude: Number(s.latitude),
                longitude: Number(s.longitude),
                price_level: s._selectedVenue.price_level || null,
                description: s.name,
                is_promoted: false,
              };
              // Upsert to avoid duplicate if place_id already exists
              const { data: venueData, error: venueErr } = await supabase
                .from('venues')
                .upsert(newVenue, { onConflict: 'id' })
                .select('id')
                .single();
              if (!venueErr && venueData) {
                venueId = venueData.id;
              }
            }

            return {
              itinerary_id: itinId,
              stop_order: i + 1,
              is_starting_point: s.is_starting_point,
              is_ending_point: s.is_ending_point,
              name: s.name,
              description: s.description,
              latitude: s.latitude !== '' ? Number(s.latitude) : null,
              longitude: s.longitude !== '' ? Number(s.longitude) : null,
              arrive_time: s.arrive_time || null,
              leave_time: s.leave_time || null,
              venue_id: venueId,
            };
          })
        );

        const { error: stopsErr } = await supabase.from('itinerary_stops').insert(resolvedStops);
        if (stopsErr) throw stopsErr;
      }

      showNotif(editingId ? 'Itinerary updated!' : 'Itinerary created!', 'success');
      cancelForm();
      loadItineraries();
    } catch (err: any) {
      showNotif('Save failed: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this itinerary and all its stops?')) return;
    try {
      const { error } = await supabase.from('itineraries').delete().eq('id', id);
      if (error) throw error;
      showNotif('Itinerary deleted.', 'success');
      loadItineraries();
    } catch (err: any) {
      showNotif('Delete failed: ' + err.message, 'error');
    }
  };

  // ── Toggle active ─────────────────────────────────────────────────────────
  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('itineraries')
      .update({ is_active: !current, updated_by: adminUserId })
      .eq('id', id);
    if (!error) loadItineraries();
  };

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = cityFilter
    ? itineraries.filter(i => i.city.toLowerCase().includes(cityFilter.toLowerCase()))
    : itineraries;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[9999] px-4 py-3 rounded-xl shadow-lg text-white text-sm font-semibold flex items-center gap-2 animate-in slide-in-from-right-5 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          <i className={`fa-solid ${notification.type === 'success' ? 'fa-check-circle' : 'fa-triangle-exclamation'}`}></i>
          {notification.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-dark">City Itineraries</h2>
          <p className="text-xs text-gray-500 mt-0.5">Create curated routes for specific cities — matched to user vibes</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm()); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow hover:bg-orange-600 transition active:scale-95"
        >
          <i className="fa-solid fa-plus"></i> New Itinerary
        </button>
      </div>

      {/* ── CREATE / EDIT FORM ─────────────────────────────────────────────── */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-dark">{editingId ? 'Edit Itinerary' : 'New Itinerary'}</h3>
            <button onClick={cancelForm} className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-xmark text-lg"></i></button>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Title *</label>
              <input
                value={form.title || ''}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Mombasa Afrobeats Night"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">City *</label>
              <input
                list="city-list"
                value={form.city || ''}
                onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                placeholder="e.g. Mombasa"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <datalist id="city-list">
                {availableCities.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Display Order</label>
              <input
                type="number"
                value={form.display_order ?? 0}
                onChange={e => setForm(p => ({ ...p, display_order: parseInt(e.target.value) || 0 }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
              <textarea
                value={form.description || ''}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={2}
                placeholder="Brief description of this itinerary's vibe..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>
          </div>

          {/* Paid / Free Toggle */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-dark">Access Type</p>
                <p className="text-xs text-gray-500">Admins always have access to paid itineraries</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setForm(p => ({ ...p, is_paid: false }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${!form.is_paid ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                >
                  <i className="fa-solid fa-unlock mr-1"></i> Free
                </button>
                <button
                  onClick={() => setForm(p => ({ ...p, is_paid: true }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${form.is_paid ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}
                >
                  <i className="fa-solid fa-lock mr-1"></i> Paid
                </button>
              </div>
            </div>
            {form.is_paid && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price || 0}
                    onChange={e => setForm(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Currency</label>
                  <select
                    value={form.currency || 'USD'}
                    onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option>USD</option><option>EUR</option><option>KES</option><option>ZAR</option><option>NGN</option><option>GBP</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Vibe Matching Tags */}
          <div className="space-y-3">
            <p className="text-sm font-bold text-dark flex items-center gap-2">
              <i className="fa-solid fa-wand-magic-sparkles text-primary"></i> Vibe Matching Tags
              <span className="text-xs font-normal text-gray-400">(used to match user preferences)</span>
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Timing</label>
              <div className="flex flex-wrap gap-2">
                {TIMING_OPTIONS.map(t => (
                  <button
                    key={t.id}
                    onClick={() => toggleArray('time_preferences', t.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${(form.time_preferences || []).includes(t.id) ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary'}`}
                  >
                    {t.id} <span className="opacity-60 text-[10px]">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Music Genres</label>
              <div className="flex flex-wrap gap-2">
                {MUSIC_OPTIONS.map(m => (
                  <button
                    key={m}
                    onClick={() => toggleArray('music_genres', m)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${(form.music_genres || []).includes(m) ? 'bg-purple-500 text-white border-purple-500' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-400'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Crowd Density</label>
                <div className="flex flex-wrap gap-2">
                  {CROWD_OPTIONS.map(c => (
                    <button
                      key={c}
                      onClick={() => setForm(p => ({ ...p, crowd_density: c }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${form.crowd_density === c ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Budget Tier</label>
                <div className="flex flex-wrap gap-2">
                  {BUDGET_OPTIONS.map(b => (
                    <button
                      key={b}
                      onClick={() => setForm(p => ({ ...p, budget_tier: b }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${form.budget_tier === b ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-gray-600 border-gray-200 hover:border-teal-400'}`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Vibe Tags</label>
              <div className="flex flex-wrap gap-2">
                {VIBE_TAG_OPTIONS.map(v => (
                  <button
                    key={v}
                    onClick={() => toggleArray('vibe_tags', v)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${(form.vibe_tags || []).includes(v) ? 'bg-orange-400 text-white border-orange-400' : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Timing & Days */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Start Time</label>
              <input
                type="time"
                value={form.start_time || ''}
                onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">End Time</label>
              <input
                type="time"
                value={form.end_time || ''}
                onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Active Days (leave empty = all days)</label>
              <div className="flex flex-wrap gap-2">
                {DAY_OPTIONS.map(d => (
                  <button
                    key={d}
                    onClick={() => toggleArray('days_of_week', d)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${(form.days_of_week || []).includes(d) ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}`}
                  >
                    {d.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Map Color & Flags */}
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Route Color</label>
              <div className="flex gap-2">
                {COLOR_PRESETS.map(c => (
                  <button
                    key={c}
                    onClick={() => setForm(p => ({ ...p, color: c }))}
                    style={{ backgroundColor: c }}
                    className={`w-7 h-7 rounded-full border-2 transition ${form.color === c ? 'border-dark scale-110' : 'border-transparent'}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_featured || false}
                  onChange={e => setForm(p => ({ ...p, is_featured: e.target.checked }))}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-xs font-semibold text-gray-600">Featured</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active !== false}
                  onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-xs font-semibold text-gray-600">Active</span>
              </label>
            </div>
          </div>

          {/* ── STOPS ──────────────────────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-dark flex items-center gap-2">
                <i className="fa-solid fa-map-pin text-primary"></i> Route Stops
              </p>
              <button
                onClick={addStop}
                className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline"
              >
                <i className="fa-solid fa-plus"></i> Add Stop
              </button>
            </div>

            {form.stops.map((stop, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                    <div className="flex gap-2">
                      <label className="flex items-center gap-1 text-xs font-semibold text-gray-500 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={stop.is_starting_point}
                          onChange={e => updateStop(idx, 'is_starting_point', e.target.checked)}
                          className="accent-green-500"
                        />
                        Start
                      </label>
                      <label className="flex items-center gap-1 text-xs font-semibold text-gray-500 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={stop.is_ending_point}
                          onChange={e => updateStop(idx, 'is_ending_point', e.target.checked)}
                          className="accent-red-500"
                        />
                        End
                      </label>
                    </div>
                  </div>
                  {form.stops.length > 1 && (
                    <button onClick={() => removeStop(idx)} className="text-red-400 hover:text-red-600 text-xs">
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {/* Venue Search — primary input */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                      <i className="fa-solid fa-magnifying-glass mr-1"></i>Search Venue
                    </label>
                    <VenueSearchInput
                      city={form.city || ''}
                      value={stop._selectedVenue || (stop.name ? { id: stop.venue_id || '', name: stop.name, latitude: stop.latitude as number, longitude: stop.longitude as number } : null)}
                      onChange={(venue) => updateStopFromVenue(idx, venue)}
                      placeholder={`Search venues in ${form.city || 'any city'}...`}
                    />
                  </div>

                  {/* Map bubble description */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                      <i className="fa-solid fa-comment mr-1"></i>Map Bubble Text
                    </label>
                    <textarea
                      value={stop.description}
                      onChange={e => updateStop(idx, 'description', e.target.value)}
                      placeholder="What to do here, when to arrive/leave — this appears in the map bubble..."
                      rows={2}
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
                    />
                  </div>

                  {/* Arrive / Leave times */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                        <i className="fa-solid fa-clock mr-1"></i>Arrive
                      </label>
                      <input
                        value={stop.arrive_time}
                        onChange={e => updateStop(idx, 'arrive_time', e.target.value)}
                        placeholder="e.g. 4PM"
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                        <i className="fa-solid fa-clock-rotate-left mr-1"></i>Leave
                      </label>
                      <input
                        value={stop.leave_time}
                        onChange={e => updateStop(idx, 'leave_time', e.target.value)}
                        placeholder="e.g. 8PM"
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                    </div>
                  </div>

                  {/* Manual coordinate override (collapsed by default, shown when venue has no coords) */}
                  {stop.name && (stop.latitude === '' || stop.longitude === '') && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 space-y-1.5">
                      <p className="text-[10px] font-bold text-yellow-700">
                        <i className="fa-solid fa-triangle-exclamation mr-1"></i>
                        No coordinates found — enter manually for map display
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          step="any"
                          value={stop.latitude}
                          onChange={e => updateStop(idx, 'latitude', e.target.value)}
                          placeholder="Latitude (e.g. -4.0297)"
                          className="border border-yellow-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-yellow-400 bg-white"
                        />
                        <input
                          type="number"
                          step="any"
                          value={stop.longitude}
                          onChange={e => updateStop(idx, 'longitude', e.target.value)}
                          placeholder="Longitude (e.g. 39.7205)"
                          className="border border-yellow-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-yellow-400 bg-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* Coordinates confirmed badge */}
                  {stop.latitude !== '' && stop.longitude !== '' && (
                    <div className="flex items-center gap-1.5 text-[10px] text-green-600 font-semibold">
                      <i className="fa-solid fa-circle-check"></i>
                      Coordinates: {Number(stop.latitude).toFixed(4)}, {Number(stop.longitude).toFixed(4)}
                      <button
                        type="button"
                        onClick={() => { updateStop(idx, 'latitude', ''); updateStop(idx, 'longitude', ''); }}
                        className="ml-1 text-gray-400 hover:text-red-500 transition"
                        title="Clear coordinates"
                      >
                        <i className="fa-solid fa-pen text-[9px]"></i>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Save / Cancel */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow hover:bg-orange-600 transition active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? <><i className="fa-solid fa-spinner fa-spin"></i> Saving...</> : <><i className="fa-solid fa-floppy-disk"></i> {editingId ? 'Update' : 'Create'} Itinerary</>}
            </button>
            <button
              onClick={cancelForm}
              className="px-5 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── FILTER ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
          <input
            value={cityFilter}
            onChange={e => setCityFilter(e.target.value)}
            placeholder="Filter by city..."
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">{filtered.length} itinerar{filtered.length !== 1 ? 'ies' : 'y'}</span>
      </div>

      {/* ── LIST ────────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">
          <i className="fa-solid fa-spinner fa-spin text-2xl mb-2"></i>
          <p className="text-sm">Loading itineraries...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <i className="fa-solid fa-route text-4xl text-gray-300 mb-3"></i>
          <p className="text-sm font-semibold text-gray-500">No itineraries yet</p>
          <p className="text-xs text-gray-400 mt-1">Create your first city itinerary above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(itin => (
            <div key={itin.id} className={`bg-white border rounded-xl overflow-hidden transition ${itin.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
              <div className="flex items-center gap-3 p-3">
                {/* Color swatch */}
                <div className="w-3 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: itin.color || '#FF6B35' }}></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-dark truncate">{itin.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${itin.is_paid ? 'bg-primary/10 text-primary' : 'bg-green-100 text-green-700'}`}>
                      {itin.is_paid ? `PAID · ${itin.currency} ${itin.price}` : 'FREE'}
                    </span>
                    {itin.is_featured && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700">FEATURED</span>}
                    {!itin.is_active && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">INACTIVE</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                    <i className="fa-solid fa-location-dot text-primary"></i>
                    <span>{itin.city}</span>
                    <span>·</span>
                    <span>{itin.stops?.length || 0} stops</span>
                    {itin.time_preferences?.length > 0 && (
                      <><span>·</span><span>{itin.time_preferences.join(', ')}</span></>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setExpandedId(expandedId === itin.id ? null : itin.id)}
                    className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 text-xs transition"
                    title="View stops"
                  >
                    <i className={`fa-solid fa-chevron-${expandedId === itin.id ? 'up' : 'down'}`}></i>
                  </button>
                  <button
                    onClick={() => toggleActive(itin.id, itin.is_active)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs transition ${itin.is_active ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                    title={itin.is_active ? 'Deactivate' : 'Activate'}
                  >
                    <i className={`fa-solid fa-${itin.is_active ? 'eye' : 'eye-slash'}`}></i>
                  </button>
                  <button
                    onClick={() => startEdit(itin)}
                    className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center text-xs transition"
                    title="Edit"
                  >
                    <i className="fa-solid fa-pen"></i>
                  </button>
                  <button
                    onClick={() => handleDelete(itin.id)}
                    className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center text-xs transition"
                    title="Delete"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>

              {/* Expanded stops view */}
              {expandedId === itin.id && itin.stops && itin.stops.length > 0 && (
                <div className="border-t border-gray-100 bg-gray-50 p-3 space-y-2">
                  {itin.stops.map((stop, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="flex flex-col items-center">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${stop.is_starting_point ? 'bg-green-500' : stop.is_ending_point ? 'bg-red-500' : 'bg-primary'}`}>
                          {stop.is_starting_point ? 'S' : stop.is_ending_point ? 'E' : i + 1}
                        </div>
                        {i < itin.stops!.length - 1 && <div className="w-0.5 h-4 bg-gray-300 mt-1"></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-dark">{stop.name}</p>
                        {stop.description && <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{stop.description}</p>}
                        {(stop.arrive_time || stop.leave_time) && (
                          <p className="text-[10px] text-primary mt-0.5">
                            {stop.arrive_time && `Arrive: ${stop.arrive_time}`}
                            {stop.arrive_time && stop.leave_time && ' · '}
                            {stop.leave_time && `Leave: ${stop.leave_time}`}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ItineraryManager;
