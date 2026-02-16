/**
 * City Media Manager Component
 * Admin interface for managing embedded media content (YouTube, Vimeo, photo slideshows)
 */

import React, { useState, useEffect } from 'react';
import {
  getCityMedia,
  getAllCityMedia,
  createCityMedia,
  updateCityMedia,
  deleteCityMedia,
  toggleCityMediaActive,
  extractVideoId,
  CityMedia
} from '../../services/cityMediaService';

interface CityMediaManagerProps {
  city: string;
  userId: string;
}

export default function CityMediaManager({ city, userId }: CityMediaManagerProps) {
  const [mediaItems, setMediaItems] = useState<CityMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<CityMedia | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<CityMedia>>({
    city,
    media_type: 'youtube',
    video_url: '',
    photo_urls: [],
    title: '',
    description: '',
    display_order: 0,
    is_active: true
  });

  useEffect(() => {
    loadMedia();
  }, [city]);

  const loadMedia = async () => {
    setLoading(true);
    const data = await getAllCityMedia(city);
    setMediaItems(data);
    setLoading(false);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingItem(null);
    setFormData({
      city,
      media_type: 'youtube',
      video_url: '',
      photo_urls: [],
      title: '',
      description: '',
      display_order: mediaItems.length,
      is_active: true
    });
  };

  const handleEdit = (item: CityMedia) => {
    setIsCreating(false);
    setEditingItem(item);
    setFormData({
      ...item,
      photo_urls: item.photo_urls || []
    });
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingItem(null);
    setFormData({
      city,
      media_type: 'youtube',
      video_url: '',
      photo_urls: [],
      title: '',
      description: '',
      display_order: 0,
      is_active: true
    });
  };

  const handleSave = async () => {
    try {
      if (isCreating) {
        const result = await createCityMedia(formData);
        if (result.success) {
          alert('Media item created successfully!');
          await loadMedia();
          handleCancel();
        } else {
          alert(`Error creating media: ${result.error}`);
        }
      } else if (editingItem) {
        const result = await updateCityMedia(editingItem.id, formData);
        if (result.success) {
          alert('Media item updated successfully!');
          await loadMedia();
          handleCancel();
        } else {
          alert(`Error updating media: ${result.error}`);
        }
      }
    } catch (error: any) {
      alert(`Error saving media: ${error.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this media item?')) return;

    const result = await deleteCityMedia(id);
    if (result.success) {
      alert('Media item deleted successfully!');
      await loadMedia();
    } else {
      alert(`Error deleting media: ${result.error}`);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const result = await toggleCityMediaActive(id, !currentStatus);
    if (result.success) {
      await loadMedia();
    } else {
      alert(`Error toggling status: ${result.error}`);
    }
  };

  const handlePhotoUrlsChange = (value: string) => {
    // Split by newlines and filter empty lines
    const urls = value.split('\n').filter(url => url.trim() !== '');
    setFormData({ ...formData, photo_urls: urls });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-500 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading media...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          City Media Content - {city}
        </h2>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-md"
        >
          <i className="fa-solid fa-plus mr-2"></i>
          Add Media
        </button>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingItem) && (
        <div className="bg-gray-50 rounded-xl p-6 border-2 border-orange-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {isCreating ? 'Create New Media' : 'Edit Media'}
          </h3>

          <div className="space-y-4">
            {/* Media Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Media Type *
              </label>
              <select
                value={formData.media_type}
                onChange={(e) => setFormData({ ...formData, media_type: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="youtube">YouTube Video</option>
                <option value="vimeo">Vimeo Video</option>
                <option value="photo_slideshow">Photo Slideshow</option>
              </select>
            </div>

            {/* Video URL (for YouTube/Vimeo) */}
            {(formData.media_type === 'youtube' || formData.media_type === 'vimeo') && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Video URL *
                </label>
                <input
                  type="text"
                  value={formData.video_url || ''}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  placeholder={formData.media_type === 'youtube' ? 'https://www.youtube.com/watch?v=...' : 'https://vimeo.com/...'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Paste the full URL or just the video ID
                </p>
              </div>
            )}

            {/* Photo URLs (for slideshow) */}
            {formData.media_type === 'photo_slideshow' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Photo URLs * (one per line)
                </label>
                <textarea
                  value={(formData.photo_urls || []).join('\n')}
                  onChange={(e) => handlePhotoUrlsChange(e.target.value)}
                  placeholder="https://example.com/photo1.jpg&#10;https://example.com/photo2.jpg"
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {(formData.photo_urls || []).length} photo(s) added
                </p>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Title (optional)
              </label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Discover Nairobi's Nightlife"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the media content"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Display Order */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Display Order
              </label>
              <input
                type="number"
                value={formData.display_order || 0}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Lower numbers appear first
              </p>
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active || false}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
              />
              <label htmlFor="is_active" className="text-sm font-semibold text-gray-700">
                Active (visible to users)
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all"
              >
                <i className="fa-solid fa-save mr-2"></i>
                Save
              </button>
              <button
                onClick={handleCancel}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Items List */}
      <div className="space-y-4">
        {mediaItems.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <i className="fa-solid fa-photo-film text-5xl text-gray-300 mb-4"></i>
            <p className="text-gray-600 text-lg">No media items yet</p>
            <p className="text-gray-500 text-sm mt-2">Click "Add Media" to create your first item</p>
          </div>
        ) : (
          mediaItems.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-xl p-6 border-2 ${
                item.is_active ? 'border-green-200' : 'border-gray-200'
              } hover:shadow-lg transition-all`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      item.media_type === 'youtube' ? 'bg-red-100 text-red-700' :
                      item.media_type === 'vimeo' ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {item.media_type === 'youtube' ? 'YouTube' :
                       item.media_type === 'vimeo' ? 'Vimeo' :
                       'Photo Slideshow'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-xs text-gray-500">
                      Order: {item.display_order}
                    </span>
                  </div>

                  {item.title && (
                    <h4 className="text-lg font-bold text-gray-900 mb-1">
                      {item.title}
                    </h4>
                  )}

                  {item.description && (
                    <p className="text-gray-600 text-sm mb-2">
                      {item.description}
                    </p>
                  )}

                  {item.media_type !== 'photo_slideshow' && item.video_url && (
                    <p className="text-xs text-gray-500 font-mono truncate">
                      {item.video_url}
                    </p>
                  )}

                  {item.media_type === 'photo_slideshow' && item.photo_urls && (
                    <p className="text-xs text-gray-500">
                      {item.photo_urls.length} photo(s)
                    </p>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleToggleActive(item.id, item.is_active)}
                    className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
                      item.is_active
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                    title={item.is_active ? 'Deactivate' : 'Activate'}
                  >
                    <i className={`fa-solid ${item.is_active ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                  <button
                    onClick={() => handleEdit(item)}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold text-sm hover:bg-blue-200 transition-all"
                  >
                    <i className="fa-solid fa-edit"></i>
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg font-semibold text-sm hover:bg-red-200 transition-all"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
