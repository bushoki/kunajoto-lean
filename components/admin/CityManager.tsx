/**
 * CityManager — Admin Dashboard
 * Allows admins to add, hide, and delete cities available in the app.
 * Cities are stored in the `cities` table and fetched dynamically across the app.
 */
import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/supabaseClient';

interface City {
  id: string;
  name: string;
  country: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
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

  useEffect(() => {
    loadCities();
    loadFeatureFlags();
  }, []);

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
