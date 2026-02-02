/**
 * Admin Dashboard - Kunajoto Lean
 * Complete content management system for all 8 admin content types
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/supabaseClient';
import { isUserAppAdmin } from '../../services/adminContentService';

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

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface AdminDashboardProps {
  userId: string;
  onClose: () => void;
}

type ContentType = 'events' | 'arrival_tips' | 'stay_recommendations' | 'tour_guides' | 'party_hosts' | 'accommodations' | 'travel_services' | 'vibe_scores';

const CONTENT_TYPES = [
  { id: 'events', label: 'Events of the Month', icon: 'fa-calendar-days' },
  { id: 'arrival_tips', label: 'Best to Arrive On', icon: 'fa-plane-arrival' },
  { id: 'stay_recommendations', label: 'Best Place to Stay', icon: 'fa-hotel' },
  { id: 'tour_guides', label: 'Tour Guides Directory', icon: 'fa-map-location-dot' },
  { id: 'party_hosts', label: 'Party Hosts Directory', icon: 'fa-champagne-glasses' },
  { id: 'accommodations', label: 'Accommodations Directory', icon: 'fa-building' },
  { id: 'travel_services', label: 'Travel Services', icon: 'fa-plane' },
  { id: 'vibe_scores', label: 'City Vibe Scores', icon: 'fa-chart-line' }
];

export default function AdminDashboard({ userId, onClose }: AdminDashboardProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<ContentType>('events');
  const [selectedCity, setSelectedCity] = useState<string>(TARGET_CITIES[0]);

  useEffect(() => {
    checkAdminStatus();
  }, [userId]);

  const checkAdminStatus = async () => {
    console.log('🔐 [AdminDashboard] Checking admin status for userId:', userId);
    const adminStatus = await isUserAppAdmin(userId);
    console.log('🔐 [AdminDashboard] Admin check result:', adminStatus);
    setIsAdmin(adminStatus);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-lock text-3xl text-red-600"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to access the admin dashboard.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl font-semibold transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderContentManager = () => {
    switch (selectedContent) {
      case 'events':
        return <EventsManager city={selectedCity} userId={userId} />;
      case 'arrival_tips':
        return <ArrivalTipsManager city={selectedCity} userId={userId} />;
      case 'stay_recommendations':
        return <StayRecommendationsManager city={selectedCity} userId={userId} />;
      case 'tour_guides':
        return <TourGuidesManager city={selectedCity} userId={userId} />;
      case 'party_hosts':
        return <PartyHostsManager city={selectedCity} userId={userId} />;
      case 'accommodations':
        return <AccommodationsManager city={selectedCity} userId={userId} />;
      case 'travel_services':
        return <TravelServicesManager city={selectedCity} userId={userId} />;
      case 'vibe_scores':
        return <VibeScoresManager city={selectedCity} userId={userId} />;
      default:
        return <div>Select a content type</div>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 overflow-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-6 px-6 shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-orange-100 mt-1">Manage Kunajoto content</p>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-sm transition-all duration-200 font-semibold"
          >
            <i className="fa-solid fa-times mr-2"></i>
            Close
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* City Selector */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Select City
          </label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full md:w-64 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
          >
            {TARGET_CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* Content Type Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CONTENT_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedContent(type.id as ContentType)}
                className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                  selectedContent === type.id
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <i className={`fa-solid ${type.icon} mr-2`}></i>
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Management Area */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {renderContentManager()}
        </div>
      </div>
    </div>
  );
}

// ==================== CONTENT MANAGERS ====================

// 1. Events Manager
function EventsManager({ city, userId }: { city: string; userId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    loadItems();
  }, [city]);

  const loadItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('admin_events')
      .select('*')
      .eq('city', city)
      .order('display_order', { ascending: true });

    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    const { error } = await supabase.from('admin_events').delete().eq('id', id);

    if (!error) {
      loadItems();
    } else {
      alert('Error deleting event: ' + error.message);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading events...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Events of the Month - {city}
        </h2>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(!showForm);
          }}
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
        >
          <i className="fa-solid fa-plus mr-2"></i>
          Add Event
        </button>
      </div>

      {showForm && (
        <EventForm
          city={city}
          userId={userId}
          editingItem={editingItem}
          onSuccess={() => {
            setShowForm(false);
            setEditingItem(null);
            loadItems();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
        />
      )}

      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <i className="fa-solid fa-calendar-xmark text-4xl mb-3"></i>
          <p>No events added yet for {city}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900">{item.title}</h3>
                  {item.description && (
                    <p className="text-gray-600 mt-1">{item.description}</p>
                  )}
                  {item.event_date && (
                    <p className="text-sm text-orange-600 mt-2">
                      📅 {new Date(item.event_date).toLocaleDateString()}
                      {item.event_time && ` at ${item.event_time}`}
                    </p>
                  )}
                  {item.is_featured && (
                    <span className="inline-block mt-2 px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                      Featured
                    </span>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setShowForm(true);
                    }}
                    className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                  >
                    <i className="fa-solid fa-edit"></i>
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Event Form Component
function EventForm({
  city,
  userId,
  editingItem,
  onSuccess,
  onCancel
}: {
  city: string;
  userId: string;
  editingItem?: any;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    title: editingItem?.title || '',
    description: editingItem?.description || '',
    event_date: editingItem?.event_date || '',
    event_time: editingItem?.event_time || '',
    external_link: editingItem?.external_link || '',
    is_featured: editingItem?.is_featured || false,
    display_order: editingItem?.display_order || 0
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (editingItem) {
      // Update existing
      const { error } = await supabase
        .from('admin_events')
        .update(formData)
        .eq('id', editingItem.id);

      if (error) {
        alert('Error updating event: ' + error.message);
      } else {
        onSuccess();
      }
    } else {
      // Create new
      const { error } = await supabase.from('admin_events').insert({
        city,
        ...formData,
        created_by: userId
      });

      if (error) {
        alert('Error creating event: ' + error.message);
      } else {
        onSuccess();
      }
    }

    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-blue-50 rounded-xl p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        {editingItem ? 'Edit Event' : 'Add New Event'}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Event Title *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
            placeholder="e.g., Jazz Festival"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Event Date
          </label>
          <input
            type="date"
            value={formData.event_date}
            onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
          rows={3}
          placeholder="Describe the event..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Event Time
          </label>
          <input
            type="time"
            value={formData.event_time}
            onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            External Link
          </label>
          <input
            type="url"
            value={formData.external_link}
            onChange={(e) => setFormData({ ...formData, external_link: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="flex items-center gap-6 mb-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_featured}
            onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
            className="w-5 h-5 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
          />
          <span className="text-sm font-semibold text-gray-700">Featured Event</span>
        </label>

        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-700">Display Order:</label>
          <input
            type="number"
            value={formData.display_order}
            onChange={(e) =>
              setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
            }
            className="w-20 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold disabled:opacity-50"
        >
          {saving ? 'Saving...' : editingItem ? 'Update Event' : 'Save Event'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl font-semibold transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// 2-7. Simplified managers for other content types (similar structure)
function ArrivalTipsManager({ city, userId }: { city: string; userId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    loadItems();
  }, [city]);

  const loadItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('admin_arrival_tips')
      .select('*')
      .eq('city', city)
      .order('display_order', { ascending: true });

    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this arrival tip?')) return;

    const { error } = await supabase.from('admin_arrival_tips').delete().eq('id', id);

    if (!error) {
      loadItems();
    } else {
      alert('Error deleting arrival tip: ' + error.message);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading arrival tips...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Best to Arrive On - {city}
        </h2>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(!showForm);
          }}
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
        >
          <i className="fa-solid fa-plus mr-2"></i>
          Add Arrival Tip
        </button>
      </div>

      {showForm && (
        <ArrivalTipForm
          city={city}
          userId={userId}
          editingItem={editingItem}
          onSuccess={() => {
            setShowForm(false);
            setEditingItem(null);
            loadItems();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
        />
      )}

      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <i className="fa-solid fa-plane-arrival text-4xl mb-3"></i>
          <p>No arrival tips added yet for {city}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {item.day_of_week && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
                        {item.day_of_week}
                      </span>
                    )}
                    {item.time_range && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
                        {item.time_range}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-900 font-medium">{item.description}</p>
                  {item.reason && (
                    <p className="text-gray-600 text-sm mt-2">💡 {item.reason}</p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setShowForm(true);
                    }}
                    className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                  >
                    <i className="fa-solid fa-pen"></i>
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ArrivalTipForm({
  city,
  userId,
  editingItem,
  onSuccess,
  onCancel
}: {
  city: string;
  userId: string;
  editingItem: any;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    day_of_week: editingItem?.day_of_week || '',
    time_range: editingItem?.time_range || '',
    description: editingItem?.description || '',
    reason: editingItem?.reason || '',
    display_order: editingItem?.display_order || 0
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      city,
      ...formData,
      created_by: userId
    };

    let error;
    if (editingItem) {
      const result = await supabase
        .from('admin_arrival_tips')
        .update(payload)
        .eq('id', editingItem.id);
      error = result.error;
    } else {
      const result = await supabase.from('admin_arrival_tips').insert([payload]);
      error = result.error;
    }

    setSaving(false);

    if (error) {
      alert('Error saving arrival tip: ' + error.message);
    } else {
      onSuccess();
    }
  };

  return (
    <div className="mb-6 p-6 bg-white border-2 border-orange-200 rounded-2xl">
      <h3 className="text-xl font-bold mb-4">
        {editingItem ? 'Edit' : 'Add'} Arrival Tip
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Day of Week
            </label>
            <select
              value={formData.day_of_week}
              onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Any Day</option>
              {DAYS_OF_WEEK.map((day) => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Time Range
            </label>
            <input
              type="text"
              placeholder="e.g., Morning, 9AM-12PM"
              value={formData.time_range}
              onChange={(e) => setFormData({ ...formData, time_range: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            required
            placeholder="e.g., Arrive on Friday evening for the best weekend experience"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Reason
          </label>
          <textarea
            placeholder="Why is this a good time to arrive?"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Display Order
          </label>
          <input
            type="number"
            value={formData.display_order}
            onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving...' : editingItem ? 'Update' : 'Create'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-colors font-semibold"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================================================
// 3. STAY RECOMMENDATIONS MANAGER
// ============================================================================
function StayRecommendationsManager({ city, userId }: { city: string; userId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    loadItems();
  }, [city]);

  const loadItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('admin_stay_recommendations')
      .select('*')
      .eq('city', city)
      .order('display_order', { ascending: true });

    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recommendation?')) return;

    const { error } = await supabase.from('admin_stay_recommendations').delete().eq('id', id);

    if (!error) {
      loadItems();
    } else {
      alert('Error deleting recommendation: ' + error.message);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading recommendations...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Best Place to Stay - {city}
        </h2>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(!showForm);
          }}
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
        >
          <i className="fa-solid fa-plus mr-2"></i>
          Add Recommendation
        </button>
      </div>

      {showForm && (
        <StayRecommendationForm
          city={city}
          userId={userId}
          editingItem={editingItem}
          onSuccess={() => {
            setShowForm(false);
            setEditingItem(null);
            loadItems();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
        />
      )}

      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <i className="fa-solid fa-hotel text-4xl mb-3"></i>
          <p>No recommendations added yet for {city}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900">{item.neighborhood}</h3>
                  <p className="text-gray-600 mt-1">{item.description}</p>
                  {item.highlights && item.highlights.length > 0 && (
                    <div className="mt-2">
                      <span className="text-sm font-semibold text-gray-700">Highlights:</span>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {item.highlights.map((h: string, i: number) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setShowForm(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <i className="fa-solid fa-edit"></i>
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StayRecommendationForm({ city, userId, editingItem, onSuccess, onCancel }: any) {
  const [formData, setFormData] = useState({
    neighborhood: editingItem?.neighborhood || '',
    description: editingItem?.description || '',
    highlights: editingItem?.highlights?.join('\n') || '',
    image_url: editingItem?.image_url || '',
    is_featured: editingItem?.is_featured || false,
    display_order: editingItem?.display_order || 0
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const dataToSave = {
      city,
      neighborhood: formData.neighborhood,
      description: formData.description,
      highlights: formData.highlights.split('\n').filter(h => h.trim()),
      image_url: formData.image_url || null,
      is_featured: formData.is_featured,
      display_order: formData.display_order,
      created_by: userId,
      updated_at: new Date().toISOString()
    };

    let error;
    if (editingItem) {
      ({ error } = await supabase
        .from('admin_stay_recommendations')
        .update(dataToSave)
        .eq('id', editingItem.id));
    } else {
      ({ error } = await supabase
        .from('admin_stay_recommendations')
        .insert({ ...dataToSave, created_at: new Date().toISOString() }));
    }

    setSaving(false);

    if (error) {
      alert('Error saving recommendation: ' + error.message);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border-2 border-orange-200 mb-6">
      <h3 className="text-xl font-bold mb-4">
        {editingItem ? 'Edit' : 'Add'} Stay Recommendation
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Neighborhood Name *
          </label>
          <input
            type="text"
            required
            value={formData.neighborhood}
            onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="e.g., Shoreditch, Downtown"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            rows={3}
            placeholder="Describe the neighborhood and why it's great to stay there"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Highlights (one per line)
          </label>
          <textarea
            value={formData.highlights}
            onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            rows={4}
            placeholder="Close to nightlife&#10;Great restaurants&#10;Safe area"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Image URL
          </label>
          <input
            type="url"
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_featured}
              onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
              className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
            />
            <span className="text-sm font-semibold text-gray-700">Featured</span>
          </label>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Display Order
            </label>
            <input
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
              className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 font-semibold"
        >
          {saving ? 'Saving...' : editingItem ? 'Update' : 'Add'} Recommendation
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}


// ============================================================================
// 4. TOUR GUIDES MANAGER
// ============================================================================
function TourGuidesManager({ city, userId }: { city: string; userId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    loadItems();
  }, [city]);

  const loadItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('admin_tour_guides')
      .select('*')
      .eq('city', city)
      .order('display_order', { ascending: true });

    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tour guide?')) return;

    const { error } = await supabase.from('admin_tour_guides').delete().eq('id', id);

    if (!error) {
      loadItems();
    } else {
      alert('Error deleting tour guide: ' + error.message);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading tour guides...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Tour Guides Directory - {city}
        </h2>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(!showForm);
          }}
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
        >
          <i className="fa-solid fa-plus mr-2"></i>
          Add Tour Guide
        </button>
      </div>

      {showForm && (
        <TourGuideForm
          city={city}
          userId={userId}
          editingItem={editingItem}
          onSuccess={() => {
            setShowForm(false);
            setEditingItem(null);
            loadItems();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
        />
      )}

      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <i className="fa-solid fa-map-location-dot text-4xl mb-3"></i>
          <p>No tour guides added yet for {city}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
                  <p className="text-gray-600 mt-1">{item.bio}</p>
                  {item.specialties && item.specialties.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.specialties.map((s: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 text-sm text-gray-600">
                    {item.contact_email && <div>📧 {item.contact_email}</div>}
                    {item.contact_phone && <div>📱 {item.contact_phone}</div>}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setShowForm(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <i className="fa-solid fa-edit"></i>
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TourGuideForm({ city, userId, editingItem, onSuccess, onCancel }: any) {
  const [formData, setFormData] = useState({
    name: editingItem?.name || '',
    bio: editingItem?.bio || '',
    profile_image_url: editingItem?.profile_image_url || '',
    contact_email: editingItem?.contact_email || '',
    contact_phone: editingItem?.contact_phone || '',
    specialties: editingItem?.specialties?.join(', ') || '',
    languages: editingItem?.languages?.join(', ') || '',
    is_active: editingItem?.is_active !== false,
    display_order: editingItem?.display_order || 0
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const dataToSave = {
      city,
      name: formData.name,
      bio: formData.bio,
      profile_image_url: formData.profile_image_url || null,
      contact_email: formData.contact_email || null,
      contact_phone: formData.contact_phone || null,
      specialties: formData.specialties.split(',').map(s => s.trim()).filter(s => s),
      languages: formData.languages.split(',').map(l => l.trim()).filter(l => l),
      is_active: formData.is_active,
      display_order: formData.display_order,
      created_by: userId,
      updated_at: new Date().toISOString()
    };

    let error;
    if (editingItem) {
      ({ error } = await supabase
        .from('admin_tour_guides')
        .update(dataToSave)
        .eq('id', editingItem.id));
    } else {
      ({ error } = await supabase
        .from('admin_tour_guides')
        .insert({ ...dataToSave, created_at: new Date().toISOString() }));
    }

    setSaving(false);

    if (error) {
      alert('Error saving tour guide: ' + error.message);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border-2 border-orange-200 mb-6">
      <h3 className="text-xl font-bold mb-4">
        {editingItem ? 'Edit' : 'Add'} Tour Guide
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Guide's full name"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Bio *
          </label>
          <textarea
            required
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            rows={3}
            placeholder="Brief bio about the tour guide"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="contact@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.contact_phone}
              onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="+1234567890"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Specialties (comma-separated)
          </label>
          <input
            type="text"
            value={formData.specialties}
            onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Nightlife, Food Tours, History"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Languages (comma-separated)
          </label>
          <input
            type="text"
            value={formData.languages}
            onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="English, French, Spanish"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Profile Image URL
          </label>
          <input
            type="url"
            value={formData.profile_image_url}
            onChange={(e) => setFormData({ ...formData, profile_image_url: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="https://example.com/photo.jpg"
          />
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
            />
            <span className="text-sm font-semibold text-gray-700">Active</span>
          </label>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Display Order
            </label>
            <input
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
              className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 font-semibold"
        >
          {saving ? 'Saving...' : editingItem ? 'Update' : 'Add'} Tour Guide
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}


// ============================================================================
// 5. PARTY HOSTS MANAGER (Similar to Tour Guides)
// ============================================================================
function PartyHostsManager({ city, userId }: { city: string; userId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    loadItems();
  }, [city]);

  const loadItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('admin_party_hosts')
      .select('*')
      .eq('city', city)
      .order('display_order', { ascending: true });

    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this party host?')) return;

    const { error } = await supabase.from('admin_party_hosts').delete().eq('id', id);

    if (!error) {
      loadItems();
    } else {
      alert('Error deleting party host: ' + error.message);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading party hosts...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Party Hosts Directory - {city}
        </h2>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(!showForm);
          }}
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
        >
          <i className="fa-solid fa-plus mr-2"></i>
          Add Party Host
        </button>
      </div>

      {showForm && (
        <PartyHostForm
          city={city}
          userId={userId}
          editingItem={editingItem}
          onSuccess={() => {
            setShowForm(false);
            setEditingItem(null);
            loadItems();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
        />
      )}

      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <i className="fa-solid fa-champagne-glasses text-4xl mb-3"></i>
          <p>No party hosts added yet for {city}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
                  <p className="text-gray-600 mt-1">{item.bio}</p>
                  {item.specialties && item.specialties.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.specialties.map((s: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 text-sm text-gray-600">
                    {item.contact_email && <div>📧 {item.contact_email}</div>}
                    {item.contact_phone && <div>📱 {item.contact_phone}</div>}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setShowForm(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <i className="fa-solid fa-edit"></i>
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PartyHostForm({ city, userId, editingItem, onSuccess, onCancel }: any) {
  const [formData, setFormData] = useState({
    name: editingItem?.name || '',
    bio: editingItem?.bio || '',
    profile_image_url: editingItem?.profile_image_url || '',
    contact_email: editingItem?.contact_email || '',
    contact_phone: editingItem?.contact_phone || '',
    specialties: editingItem?.specialties?.join(', ') || '',
    is_active: editingItem?.is_active !== false,
    display_order: editingItem?.display_order || 0
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const dataToSave = {
      city,
      name: formData.name,
      bio: formData.bio,
      profile_image_url: formData.profile_image_url || null,
      contact_email: formData.contact_email || null,
      contact_phone: formData.contact_phone || null,
      specialties: formData.specialties.split(',').map(s => s.trim()).filter(s => s),
      is_active: formData.is_active,
      display_order: formData.display_order,
      created_by: userId,
      updated_at: new Date().toISOString()
    };

    let error;
    if (editingItem) {
      ({ error } = await supabase
        .from('admin_party_hosts')
        .update(dataToSave)
        .eq('id', editingItem.id));
    } else {
      ({ error } = await supabase
        .from('admin_party_hosts')
        .insert({ ...dataToSave, created_at: new Date().toISOString() }));
    }

    setSaving(false);

    if (error) {
      alert('Error saving party host: ' + error.message);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border-2 border-orange-200 mb-6">
      <h3 className="text-xl font-bold mb-4">
        {editingItem ? 'Edit' : 'Add'} Party Host
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Host's full name"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Bio *
          </label>
          <textarea
            required
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            rows={3}
            placeholder="Brief bio about the party host"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="contact@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.contact_phone}
              onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="+1234567890"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Specialties (comma-separated)
          </label>
          <input
            type="text"
            value={formData.specialties}
            onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Club Nights, Private Events, VIP Access"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Profile Image URL
          </label>
          <input
            type="url"
            value={formData.profile_image_url}
            onChange={(e) => setFormData({ ...formData, profile_image_url: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="https://example.com/photo.jpg"
          />
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
            />
            <span className="text-sm font-semibold text-gray-700">Active</span>
          </label>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Display Order
            </label>
            <input
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
              className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 font-semibold"
        >
          {saving ? 'Saving...' : editingItem ? 'Update' : 'Add'} Party Host
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// 6. ACCOMMODATIONS MANAGER
// ============================================================================
function AccommodationsManager({ city, userId }: { city: string; userId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    loadItems();
  }, [city]);

  const loadItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('admin_accommodations')
      .select('*')
      .eq('city', city)
      .order('display_order', { ascending: true });

    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this accommodation?')) return;

    const { error } = await supabase.from('admin_accommodations').delete().eq('id', id);

    if (!error) {
      loadItems();
    } else {
      alert('Error deleting accommodation: ' + error.message);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading accommodations...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Accommodations Directory - {city}
        </h2>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(!showForm);
          }}
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
        >
          <i className="fa-solid fa-plus mr-2"></i>
          Add Accommodation
        </button>
      </div>

      {showForm && (
        <AccommodationForm
          city={city}
          userId={userId}
          editingItem={editingItem}
          onSuccess={() => {
            setShowForm(false);
            setEditingItem(null);
            loadItems();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
        />
      )}

      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <i className="fa-solid fa-building text-4xl mb-3"></i>
          <p>No accommodations added yet for {city}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {item.accommodation_type}
                    </span>
                    {item.price_range && (
                      <span className="text-green-600 font-semibold">{item.price_range}</span>
                    )}
                  </div>
                  <p className="text-gray-600 mt-1">{item.description}</p>
                  {item.booking_url && (
                    <a
                      href={item.booking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                    >
                      🔗 Booking Link
                    </a>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setShowForm(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <i className="fa-solid fa-edit"></i>
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AccommodationForm({ city, userId, editingItem, onSuccess, onCancel }: any) {
  const [formData, setFormData] = useState({
    name: editingItem?.name || '',
    description: editingItem?.description || '',
    accommodation_type: editingItem?.accommodation_type || 'Hotel',
    image_url: editingItem?.image_url || '',
    booking_url: editingItem?.booking_url || '',
    affiliate_link: editingItem?.affiliate_link || '',
    price_range: editingItem?.price_range || '',
    is_featured: editingItem?.is_featured || false,
    display_order: editingItem?.display_order || 0
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const dataToSave = {
      city,
      name: formData.name,
      description: formData.description,
      accommodation_type: formData.accommodation_type,
      image_url: formData.image_url || null,
      booking_url: formData.booking_url || null,
      affiliate_link: formData.affiliate_link || null,
      price_range: formData.price_range || null,
      is_featured: formData.is_featured,
      display_order: formData.display_order,
      created_by: userId,
      updated_at: new Date().toISOString()
    };

    let error;
    if (editingItem) {
      ({ error } = await supabase
        .from('admin_accommodations')
        .update(dataToSave)
        .eq('id', editingItem.id));
    } else {
      ({ error } = await supabase
        .from('admin_accommodations')
        .insert({ ...dataToSave, created_at: new Date().toISOString() }));
    }

    setSaving(false);

    if (error) {
      alert('Error saving accommodation: ' + error.message);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border-2 border-orange-200 mb-6">
      <h3 className="text-xl font-bold mb-4">
        {editingItem ? 'Edit' : 'Add'} Accommodation
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Hotel/Airbnb name"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            rows={3}
            placeholder="Description of the accommodation"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Type *
            </label>
            <select
              required
              value={formData.accommodation_type}
              onChange={(e) => setFormData({ ...formData, accommodation_type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="Hotel">Hotel</option>
              <option value="Airbnb">Airbnb</option>
              <option value="Hostel">Hostel</option>
              <option value="Apartment">Apartment</option>
              <option value="Resort">Resort</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Price Range
            </label>
            <select
              value={formData.price_range}
              onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Select...</option>
              <option value="$">$ (Budget)</option>
              <option value="$$">$$ (Moderate)</option>
              <option value="$$$">$$$ (Upscale)</option>
              <option value="$$$$">$$$$ (Luxury)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Booking URL
          </label>
          <input
            type="url"
            value={formData.booking_url}
            onChange={(e) => setFormData({ ...formData, booking_url: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="https://booking.com/..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Affiliate Link
          </label>
          <input
            type="url"
            value={formData.affiliate_link}
            onChange={(e) => setFormData({ ...formData, affiliate_link: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="https://affiliate.link/..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Image URL
          </label>
          <input
            type="url"
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_featured}
              onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
              className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
            />
            <span className="text-sm font-semibold text-gray-700">Featured</span>
          </label>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Display Order
            </label>
            <input
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
              className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 font-semibold"
        >
          {saving ? 'Saving...' : editingItem ? 'Update' : 'Add'} Accommodation
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}


// ============================================================================
// 7. TRAVEL SERVICES MANAGER
// ============================================================================
function TravelServicesManager({ city, userId }: { city: string; userId: string}) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    loadItems();
  }, [city]);

  const loadItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('admin_travel_services')
      .select('*')
      .eq('city', city)
      .order('display_order', { ascending: true });

    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this travel service?')) return;

    const { error } = await supabase.from('admin_travel_services').delete().eq('id', id);

    if (!error) {
      loadItems();
    } else {
      alert('Error deleting travel service: ' + error.message);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading travel services...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Travel Services - {city}
        </h2>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(!showForm);
          }}
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
        >
          <i className="fa-solid fa-plus mr-2"></i>
          Add Service
        </button>
      </div>

      {showForm && (
        <TravelServiceForm
          city={city}
          userId={userId}
          editingItem={editingItem}
          onSuccess={() => {
            setShowForm(false);
            setEditingItem(null);
            loadItems();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
        />
      )}

      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <i className="fa-solid fa-plane text-4xl mb-3"></i>
          <p>No travel services added yet for {city}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-gray-900">{item.title}</h3>
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                      {item.service_type}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1">{item.description}</p>
                  {item.promo_code && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-mono rounded">
                        {item.promo_code}
                      </span>
                      {item.discount_details && (
                        <span className="text-sm text-gray-600">{item.discount_details}</span>
                      )}
                    </div>
                  )}
                  {item.affiliate_link && (
                    <a
                      href={item.affiliate_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                    >
                      🔗 Service Link
                    </a>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setShowForm(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <i className="fa-solid fa-edit"></i>
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TravelServiceForm({ city, userId, editingItem, onSuccess, onCancel }: any) {
  const [formData, setFormData] = useState({
    service_type: editingItem?.service_type || 'Flight',
    title: editingItem?.title || '',
    description: editingItem?.description || '',
    affiliate_link: editingItem?.affiliate_link || '',
    promo_code: editingItem?.promo_code || '',
    discount_details: editingItem?.discount_details || '',
    image_url: editingItem?.image_url || '',
    display_order: editingItem?.display_order || 0
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const dataToSave = {
      city,
      service_type: formData.service_type,
      title: formData.title,
      description: formData.description,
      affiliate_link: formData.affiliate_link || null,
      promo_code: formData.promo_code || null,
      discount_details: formData.discount_details || null,
      image_url: formData.image_url || null,
      display_order: formData.display_order,
      created_by: userId,
      updated_at: new Date().toISOString()
    };

    let error;
    if (editingItem) {
      ({ error } = await supabase
        .from('admin_travel_services')
        .update(dataToSave)
        .eq('id', editingItem.id));
    } else {
      ({ error } = await supabase
        .from('admin_travel_services')
        .insert({ ...dataToSave, created_at: new Date().toISOString() }));
    }

    setSaving(false);

    if (error) {
      alert('Error saving travel service: ' + error.message);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border-2 border-orange-200 mb-6">
      <h3 className="text-xl font-bold mb-4">
        {editingItem ? 'Edit' : 'Add'} Travel Service
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Service Type *
          </label>
          <select
            required
            value={formData.service_type}
            onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="Flight">Flight</option>
            <option value="Airport Transfer">Airport Transfer</option>
            <option value="Car Rental">Car Rental</option>
            <option value="Ride Share">Ride Share</option>
            <option value="Public Transport">Public Transport</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="e.g., Book Flights with Skyscanner"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            rows={3}
            placeholder="Description of the service"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Affiliate Link
          </label>
          <input
            type="url"
            value={formData.affiliate_link}
            onChange={(e) => setFormData({ ...formData, affiliate_link: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="https://affiliate.link/..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Promo Code
            </label>
            <input
              type="text"
              value={formData.promo_code}
              onChange={(e) => setFormData({ ...formData, promo_code: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="KUNAJOTO20"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Discount Details
            </label>
            <input
              type="text"
              value={formData.discount_details}
              onChange={(e) => setFormData({ ...formData, discount_details: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="20% off first booking"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Image URL
          </label>
          <input
            type="url"
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Display Order
          </label>
          <input
            type="number"
            value={formData.display_order}
            onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
            className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 font-semibold"
        >
          {saving ? 'Saving...' : editingItem ? 'Update' : 'Add'} Service
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}


// 8. Vibe Scores Manager
function VibeScoresManager({ city, userId }: { city: string; userId: string }) {
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editScore, setEditScore] = useState<number>(5);

  useEffect(() => {
    loadScores();
  }, [city]);

  const loadScores = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('admin_city_vibe_scores')
      .select('*')
      .eq('city', city)
      .order('day_of_week', { ascending: true });

    if (!error && data) {
      setScores(data);
    }
    setLoading(false);
  };

  const saveScore = async (dayOfWeek: string, score: number) => {
    // Convert day name to integer (0=Monday, 1=Tuesday, etc.)
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayIndex = dayNames.indexOf(dayOfWeek);
    
    if (dayIndex === -1) {
      alert('Invalid day of week');
      return;
    }
    
    // Check if score exists
    const existing = scores.find(s => s.day_of_week === dayIndex);

    if (existing) {
      // Update
      const { error } = await supabase
        .from('admin_city_vibe_scores')
        .update({ vibe_score: score })
        .eq('id', existing.id);

      if (error) {
        alert('Error updating score: ' + error.message);
      } else {
        loadScores();
        setEditingDay(null);
      }
    } else {
      // Insert
      const { error } = await supabase
        .from('admin_city_vibe_scores')
        .insert({
          city,
          day_of_week: dayIndex,
          vibe_score: score,
          created_by: userId
        });

      if (error) {
        alert('Error creating score: ' + error.message);
      } else {
        loadScores();
        setEditingDay(null);
      }
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading vibe scores...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Weekly City Vibe Scores - {city}
      </h2>
      <p className="text-gray-600 mb-6">
        Set the vibe score (1-10) for each day of the week. The app will automatically display the current day's score.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {DAYS_OF_WEEK.map((day, dayIndex) => {
          const dayScore = scores.find(s => s.day_of_week === dayIndex);
          const isEditing = editingDay === day;

          return (
            <div
              key={day}
              className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border-2 border-orange-200"
            >
              <h3 className="font-bold text-gray-900 mb-2">{day}</h3>
              
              {isEditing ? (
                <div>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.1"
                    value={editScore}
                    onChange={(e) => setEditScore(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveScore(day, editScore)}
                      className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingDay(null)}
                      className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-4xl font-black text-orange-600 mb-2">
                    {dayScore?.vibe_score?.toFixed(1) || '—'}
                  </div>
                  <button
                    onClick={() => {
                      setEditingDay(day);
                      setEditScore(dayScore?.vibe_score || 5);
                    }}
                    className="w-full px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition"
                  >
                    {dayScore ? 'Edit' : 'Set'} Score
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
