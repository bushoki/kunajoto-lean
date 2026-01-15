/**
 * Admin Dashboard - Kunajoto
 * Simplified content management for app admins
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

interface AdminDashboardProps {
  userId: string;
  onClose: () => void;
}

type ContentType = 'events';

export default function AdminDashboard({ userId, onClose }: AdminDashboardProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<ContentType>('events');
  const [selectedCity, setSelectedCity] = useState<string>(TARGET_CITIES[0]);

  useEffect(() => {
    checkAdminStatus();
  }, [userId]);

  const checkAdminStatus = async () => {
    const adminStatus = await isUserAppAdmin(userId);
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

        {/* Content Management Area */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <EventsManager city={selectedCity} userId={userId} />
        </div>
      </div>
    </div>
  );
}

// Events Manager Component
function EventsManager({ city, userId }: { city: string; userId: string }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [city]);

  const loadEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('admin_events')
      .select('*')
      .eq('city', city)
      .order('display_order', { ascending: true });

    if (!error && data) {
      setEvents(data);
    }
    setLoading(false);
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    const { error } = await supabase.from('admin_events').delete().eq('id', id);

    if (!error) {
      loadEvents();
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
          onClick={() => setShowForm(!showForm)}
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
          onSuccess={() => {
            setShowForm(false);
            loadEvents();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {events.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <i className="fa-solid fa-calendar-xmark text-4xl mb-3"></i>
          <p>No events added yet for {city}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900">{event.title}</h3>
                  {event.description && (
                    <p className="text-gray-600 mt-1">{event.description}</p>
                  )}
                  {event.event_date && (
                    <p className="text-sm text-orange-600 mt-2">
                      📅 {new Date(event.event_date).toLocaleDateString()}
                      {event.event_time && ` at ${event.event_time}`}
                    </p>
                  )}
                  {event.is_featured && (
                    <span className="inline-block mt-2 px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                      Featured
                    </span>
                  )}
                </div>
                <button
                  onClick={() => deleteEvent(event.id)}
                  className="ml-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
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
  onSuccess,
  onCancel
}: {
  city: string;
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    external_link: '',
    is_featured: false,
    display_order: 0
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase.from('admin_events').insert({
      city,
      ...formData,
      created_by: userId
    });

    setSaving(false);

    if (error) {
      alert('Error creating event: ' + error.message);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-blue-50 rounded-xl p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Event</h3>

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
          {saving ? 'Saving...' : 'Save Event'}
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
