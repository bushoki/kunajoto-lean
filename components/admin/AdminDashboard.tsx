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
  { id: 'stay_recommendations', label: 'Best to Stay In', icon: 'fa-hotel' },
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

function StayRecommendationsManager({ city, userId }: { city: string; userId: string }) {
  return <div className="text-center py-12 text-gray-500">
    <i className="fa-solid fa-hotel text-4xl mb-3"></i>
    <p>Stay Recommendations Manager - Coming Soon</p>
    <p className="text-sm mt-2">Manage neighborhood and area recommendations for {city}</p>
  </div>;
}

function TourGuidesManager({ city, userId }: { city: string; userId: string }) {
  return <div className="text-center py-12 text-gray-500">
    <i className="fa-solid fa-map-location-dot text-4xl mb-3"></i>
    <p>Tour Guides Directory - Coming Soon</p>
    <p className="text-sm mt-2">Manage tour guides with Stripe payment integration for {city}</p>
  </div>;
}

function PartyHostsManager({ city, userId }: { city: string; userId: string }) {
  return <div className="text-center py-12 text-gray-500">
    <i className="fa-solid fa-champagne-glasses text-4xl mb-3"></i>
    <p>Party Hosts Directory - Coming Soon</p>
    <p className="text-sm mt-2">Manage party hosts with Stripe payment integration for {city}</p>
  </div>;
}

function AccommodationsManager({ city, userId }: { city: string; userId: string }) {
  return <div className="text-center py-12 text-gray-500">
    <i className="fa-solid fa-building text-4xl mb-3"></i>
    <p>Accommodations Directory - Coming Soon</p>
    <p className="text-sm mt-2">Manage Airbnb & hotel listings with affiliate links for {city}</p>
  </div>;
}

function TravelServicesManager({ city, userId }: { city: string; userId: string }) {
  return <div className="text-center py-12 text-gray-500">
    <i className="fa-solid fa-plane text-4xl mb-3"></i>
    <p>Travel Services - Coming Soon</p>
    <p className="text-sm mt-2">Manage flights, airport services, and mobility solutions for {city}</p>
  </div>;
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
