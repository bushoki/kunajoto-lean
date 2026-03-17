/**
 * CityManager — Admin Dashboard
 * Allows admins to add, hide, and delete cities available in the app.
 * Cities are stored in the `cities` table and fetched dynamically across the app.
 *
 * Also includes Venue Vibe Score Override section:
 * - Lists all venues for a selected city
 * - Allows admin to manually override the computed vibe_score for each venue
 * - Override is stored in venues.vibe_score_override (nullable numeric 0.0–10.0)
 * - When set, the override takes precedence over the computed vibe_score in the app
 * - Clear button sets override back to NULL (reverts to computed score)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../src/supabaseClient';

interface City {
  id: string;
  name: string;
  country: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

interface VenueWithScore {
  id: string;
  name: string;
  type: string;
  district: string;
  vibe_score: number | null;
  vibe_score_override: number | null;
}

export default function CityManager() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [itineraryExplorerEnabled, setItineraryExplorerEnabled] = useState(false);
  const [togglingFeature, setTogglingFeature] = useState(false);

  // Add city form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [newCityCountry, setNewCityCountry] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Venue Vibe Score Override
  const [selectedCityForVibe, setSelectedCityForVibe] = useState<string>('');
  const [venues, setVenues] = useState<VenueWithScore[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(false);
  const [editingOverrides, setEditingOverrides] = useState<Record<string, string>>({});
  const [savingVenueId, setSavingVenueId] = useState<string | null>(null);

  useEffect(() => {
    loadCities();
    loadFeatureFlags();
  }, []);

  // Auto-select first city for vibe score panel once cities load
  useEffect(() => {
    if (cities.length > 0 && !selectedCityForVibe) {
      setSelectedCityForVibe(cities[0].name);
    }
  }, [cities, selectedCityForVibe]);

  // Load venues when city selection changes
  useEffect(() => {
    if (selectedCityForVibe) {
      loadVenuesForCity(selectedCityForVibe);
    }
  }, [selectedCityForVibe]);

  const loadFeatureFlags = async () => {
    try {
      const { data } = await supabase
        .from('admin_feature_flags')
        .select('is_enabled')
        .eq('feature_name', 'itinerary_explorer')
        .single();
      setItineraryExplorerEnabled(data?.is_enabled ?? false);
    } catch {
      setItineraryExplorerEnabled(false);
    }
  };

  const toggleItineraryExplorer = async () => {
    setTogglingFeature(true);
    const newValue = !itineraryExplorerEnabled;
    try {
      const { error } = await supabase
        .from('admin_feature_flags')
        .upsert({ feature_name: 'itinerary_explorer', is_enabled: newValue }, { onConflict: 'feature_name' });
      if (error) throw error;
      setItineraryExplorerEnabled(newValue);
      showMsg(`City Itinerary Explorer is now ${newValue ? 'visible to users' : 'hidden from users'}`);
    } catch (e: any) {
      showMsg('Failed to update feature flag: ' + e.message, true);
    } finally {
      setTogglingFeature(false);
    }
  };

  const loadCities = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      setCities(data || []);
    } catch (e: any) {
      setError('Failed to load cities: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadVenuesForCity = async (cityName: string) => {
    setVenuesLoading(true);
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('id, name, type, district, vibe_score, vibe_score_override')
        .eq('city', cityName)
        .order('name', { ascending: true });
      if (error) throw error;
      setVenues(data || []);
      // Initialize editing state with current override values
      const overrideMap: Record<string, string> = {};
      (data || []).forEach((v: VenueWithScore) => {
        overrideMap[v.id] = v.vibe_score_override !== null ? String(v.vibe_score_override) : '';
      });
      setEditingOverrides(overrideMap);
    } catch (e: any) {
      showMsg('Failed to load venues: ' + e.message, true);
    } finally {
      setVenuesLoading(false);
    }
  };

  const saveVibeOverride = async (venueId: string) => {
    const rawValue = editingOverrides[venueId];
    const parsed = rawValue === '' ? null : parseFloat(rawValue);

    if (parsed !== null && (isNaN(parsed) || parsed < 0 || parsed > 10)) {
      showMsg('Score must be between 0.0 and 10.0', true);
      return;
    }

    setSavingVenueId(venueId);
    try {
      const { error } = await supabase
        .from('venues')
        .update({ vibe_score_override: parsed })
        .eq('id', venueId);
      if (error) throw error;

      // Update local state
      setVenues(prev => prev.map(v =>
        v.id === venueId ? { ...v, vibe_score_override: parsed } : v
      ));
      showMsg(parsed !== null
        ? `✓ Override set to ${parsed.toFixed(1)}`
        : '✓ Override cleared — using computed score'
      );
    } catch (e: any) {
      showMsg('Failed to save override: ' + e.message, true);
    } finally {
      setSavingVenueId(null);
    }
  };

  const clearVibeOverride = async (venueId: string) => {
    setEditingOverrides(prev => ({ ...prev, [venueId]: '' }));
    setSavingVenueId(venueId);
    try {
      const { error } = await supabase
        .from('venues')
        .update({ vibe_score_override: null })
        .eq('id', venueId);
      if (error) throw error;
      setVenues(prev => prev.map(v =>
        v.id === venueId ? { ...v, vibe_score_override: null } : v
      ));
      showMsg('✓ Override cleared — using computed score');
    } catch (e: any) {
      showMsg('Failed to clear override: ' + e.message, true);
    } finally {
      setSavingVenueId(null);
    }
  };

  const showMsg = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(null); }
    else { setSuccess(msg); setError(null); }
    setTimeout(() => { setError(null); setSuccess(null); }, 4000);
  };

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCityName.trim()) return;
    setSaving(true);
    try {
      const maxOrder = cities.length > 0 ? Math.max(...cities.map(c => c.display_order)) + 1 : 1;
      const { error } = await supabase.from('cities').insert({
        name: newCityName.trim(),
        country: newCityCountry.trim() || null,
        is_active: true,
        display_order: maxOrder,
      });
      if (error) throw error;
      setNewCityName('');
      setNewCityCountry('');
      setShowAddForm(false);
      await loadCities();
      showMsg(`✓ ${newCityName.trim()} added successfully`);
    } catch (e: any) {
      showMsg(e.message?.includes('unique') ? 'That city already exists.' : 'Failed to add city: ' + e.message, true);
    } finally {
      setSaving(false);
    }
  };

  const toggleVisibility = async (city: City) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('cities')
        .update({ is_active: !city.is_active })
        .eq('id', city.id);
      if (error) throw error;
      setCities(prev => prev.map(c => c.id === city.id ? { ...c, is_active: !c.is_active } : c));
      showMsg(`${city.name} is now ${!city.is_active ? 'visible' : 'hidden'}`);
    } catch (e: any) {
      showMsg('Failed to update city: ' + e.message, true);
    } finally {
      setSaving(false);
    }
  };

  const deleteCity = async (city: City) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('cities').delete().eq('id', city.id);
      if (error) throw error;
      setCities(prev => prev.filter(c => c.id !== city.id));
      setConfirmDelete(null);
      showMsg(`${city.name} deleted`);
    } catch (e: any) {
      showMsg('Failed to delete city: ' + e.message, true);
    } finally {
      setSaving(false);
    }
  };

  const activeCities = cities.filter(c => c.is_active);
  const hiddenCities = cities.filter(c => !c.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">City Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {activeCities.length} active · {hiddenCities.length} hidden · {cities.length} total
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition"
        >
          <i className="fa-solid fa-plus"></i>
          Add City
        </button>
      </div>

      {/* Feedback */}
      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 flex items-center gap-2">
          <i className="fa-solid fa-circle-exclamation"></i> {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-700 text-sm p-3 rounded-xl border border-green-100 flex items-center gap-2">
          <i className="fa-solid fa-circle-check"></i> {success}
        </div>
      )}

      {/* Add City Form */}
      {showAddForm && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <i className="fa-solid fa-city text-primary"></i>
            Add New City
          </h3>
          <form onSubmit={handleAddCity} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">City Name *</label>
                <input
                  type="text"
                  required
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                  placeholder="e.g. Accra"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Country</label>
                <input
                  type="text"
                  value={newCityCountry}
                  onChange={(e) => setNewCityCountry(e.target.value)}
                  placeholder="e.g. Ghana"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving || !newCityName.trim()}
                className="flex-1 bg-primary text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-primary/90 transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <><i className="fa-solid fa-plus"></i> Add City</>}
              </button>
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setNewCityName(''); setNewCityCountry(''); }}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Feature Flags Section */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
        <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
          <i className="fa-solid fa-toggle-on text-primary"></i>
          App Feature Visibility
        </h3>
        <p className="text-xs text-gray-500 mb-4">Toggle features visible to users in the Explore tab.</p>
        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
          <div>
            <p className="font-semibold text-gray-900 text-sm">City Itinerary Explorer</p>
            <p className="text-xs text-gray-400 mt-0.5">Shows curated itinerary cards below the four-square menu</p>
          </div>
          <button
            onClick={toggleItineraryExplorer}
            disabled={togglingFeature}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none ${
              itineraryExplorerEnabled ? 'bg-primary' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                itineraryExplorerEnabled ? 'translate-x-8' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* ── Venue Vibe Score Override ─────────────────────────────────────────── */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <i className="fa-solid fa-sliders text-primary"></i>
              Venue Vibe Score Override
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Manually override the computed vibe score for any venue. When set, the override
              takes precedence over the system-calculated score. Leave blank to use the computed score.
            </p>
          </div>
          <button
            onClick={() => selectedCityForVibe && loadVenuesForCity(selectedCityForVibe)}
            title="Refresh venues"
            className="ml-3 text-gray-400 hover:text-primary transition text-sm"
          >
            <i className="fa-solid fa-rotate-right"></i>
          </button>
        </div>

        {/* City filter for venue list */}
        <div className="mt-4 mb-4">
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Filter by City</label>
          <select
            value={selectedCityForVibe}
            onChange={(e) => setSelectedCityForVibe(e.target.value)}
            className="w-full md:w-64 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          >
            {cities.map(city => (
              <option key={city.id} value={city.name}>{city.name}</option>
            ))}
          </select>
        </div>

        {/* Venue list */}
        {venuesLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-b-4 border-primary"></div>
          </div>
        ) : venues.length === 0 ? (
          <p className="text-sm text-gray-400 italic text-center py-6">
            No venues found for {selectedCityForVibe || 'this city'}
          </p>
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {venues.map(venue => {
              const hasOverride = venue.vibe_score_override !== null;
              const isSaving = savingVenueId === venue.id;
              const editValue = editingOverrides[venue.id] ?? '';
              const effectiveScore = hasOverride ? venue.vibe_score_override! : (venue.vibe_score ?? 0);

              return (
                <div
                  key={venue.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                    hasOverride ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'
                  }`}
                >
                  {/* Venue info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{venue.name}</p>
                    <p className="text-xs text-gray-400">
                      {venue.type} · {venue.district || 'No district'}
                    </p>
                  </div>

                  {/* Current effective score badge */}
                  <div className="flex flex-col items-center min-w-[52px]">
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-full ${
                        hasOverride
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {effectiveScore.toFixed(1)}
                    </span>
                    <span className="text-[9px] text-gray-400 mt-0.5">
                      {hasOverride ? 'override' : 'computed'}
                    </span>
                  </div>

                  {/* Override input */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={editValue}
                      onChange={(e) => setEditingOverrides(prev => ({ ...prev, [venue.id]: e.target.value }))}
                      placeholder={String(venue.vibe_score ?? '—')}
                      className="w-16 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                    <button
                      onClick={() => saveVibeOverride(venue.id)}
                      disabled={isSaving || editValue === (hasOverride ? String(venue.vibe_score_override) : '')}
                      title="Save override"
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-white text-xs hover:bg-primary/90 transition disabled:opacity-40"
                    >
                      {isSaving ? <i className="fa-solid fa-circle-notch fa-spin text-[10px]"></i> : <i className="fa-solid fa-check text-[10px]"></i>}
                    </button>
                    {hasOverride && (
                      <button
                        onClick={() => clearVibeOverride(venue.id)}
                        disabled={isSaving}
                        title="Clear override (revert to computed)"
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 text-xs hover:bg-red-50 hover:text-red-500 transition disabled:opacity-40"
                      >
                        <i className="fa-solid fa-xmark text-[10px]"></i>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cities List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Cities */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
              Active Cities ({activeCities.length})
            </h3>
            <div className="space-y-2">
              {activeCities.map(city => (
                <CityRow
                  key={city.id}
                  city={city}
                  onToggle={() => toggleVisibility(city)}
                  onDelete={() => setConfirmDelete(city.id)}
                  saving={saving}
                />
              ))}
              {activeCities.length === 0 && (
                <p className="text-sm text-gray-400 italic py-4 text-center">No active cities</p>
              )}
            </div>
          </div>

          {/* Hidden Cities */}
          {hiddenCities.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400 inline-block"></span>
                Hidden Cities ({hiddenCities.length})
              </h3>
              <div className="space-y-2">
                {hiddenCities.map(city => (
                  <CityRow
                    key={city.id}
                    city={city}
                    onToggle={() => toggleVisibility(city)}
                    onDelete={() => setConfirmDelete(city.id)}
                    saving={saving}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-80 mx-4">
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fa-solid fa-trash text-2xl text-red-500"></i>
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Delete City?</h3>
              <p className="text-sm text-gray-500 mt-1">
                <strong>{cities.find(c => c.id === confirmDelete)?.name}</strong> will be permanently removed.
                Existing itineraries for this city will remain in the database.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const city = cities.find(c => c.id === confirmDelete);
                  if (city) deleteCity(city);
                }}
                disabled={saving}
                className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-600 transition disabled:opacity-60"
              >
                {saving ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CityRow({ city, onToggle, onDelete, saving }: {
  city: City;
  onToggle: () => void;
  onDelete: () => void;
  saving: boolean;
}) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border transition ${
      city.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
          city.is_active ? 'bg-orange-100 text-primary' : 'bg-gray-200 text-gray-500'
        }`}>
          {city.name.charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">{city.name}</p>
          {city.country && <p className="text-xs text-gray-400">{city.country}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onToggle}
          disabled={saving}
          title={city.is_active ? 'Hide city' : 'Show city'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            city.is_active
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          <i className={`fa-solid ${city.is_active ? 'fa-eye' : 'fa-eye-slash'}`}></i>
          {city.is_active ? 'Visible' : 'Hidden'}
        </button>
        <button
          onClick={onDelete}
          disabled={saving}
          title="Delete city"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
        >
          <i className="fa-solid fa-trash text-xs"></i>
        </button>
      </div>
    </div>
  );
}
