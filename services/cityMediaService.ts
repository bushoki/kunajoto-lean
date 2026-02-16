/**
 * City Media Service
 * Handles fetching and managing embedded media content (videos, photo slideshows) for cities
 */

import { supabase } from '../src/supabaseClient';

export interface CityMedia {
  id: string;
  city: string;
  media_type: 'youtube' | 'vimeo' | 'photo_slideshow';
  video_url?: string;
  video_id?: string;
  photo_urls?: string[];
  title?: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Extract video ID from YouTube or Vimeo URL
 */
export function extractVideoId(url: string, mediaType: 'youtube' | 'vimeo'): string | null {
  if (mediaType === 'youtube') {
    // Handle various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
  } else if (mediaType === 'vimeo') {
    // Handle Vimeo URL formats
    const patterns = [
      /vimeo\.com\/(\d+)/,
      /player\.vimeo\.com\/video\/(\d+)/,
      /^(\d+)$/ // Direct video ID
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
  }
  
  return null;
}

/**
 * Get all active media for a specific city
 */
export async function getCityMedia(city: string): Promise<CityMedia[]> {
  try {
    const { data, error } = await supabase
      .from('admin_city_media')
      .select('*')
      .eq('city', city)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching city media:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getCityMedia:', error);
    return [];
  }
}

/**
 * Get all media items for admin dashboard (includes inactive)
 */
export async function getAllCityMedia(city: string): Promise<CityMedia[]> {
  try {
    const { data, error } = await supabase
      .from('admin_city_media')
      .select('*')
      .eq('city', city)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching all city media:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllCityMedia:', error);
    return [];
  }
}

/**
 * Create a new media item
 */
export async function createCityMedia(mediaData: Partial<CityMedia>): Promise<{ success: boolean; data?: CityMedia; error?: string }> {
  try {
    // Extract video ID if it's a video
    if (mediaData.media_type && ['youtube', 'vimeo'].includes(mediaData.media_type) && mediaData.video_url) {
      const videoId = extractVideoId(mediaData.video_url, mediaData.media_type);
      if (videoId) {
        mediaData.video_id = videoId;
      }
    }

    const { data, error } = await supabase
      .from('admin_city_media')
      .insert([mediaData])
      .select()
      .single();

    if (error) {
      console.error('Error creating city media:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error in createCityMedia:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update an existing media item
 */
export async function updateCityMedia(id: string, updates: Partial<CityMedia>): Promise<{ success: boolean; data?: CityMedia; error?: string }> {
  try {
    // Extract video ID if video URL is being updated
    if (updates.media_type && ['youtube', 'vimeo'].includes(updates.media_type) && updates.video_url) {
      const videoId = extractVideoId(updates.video_url, updates.media_type);
      if (videoId) {
        updates.video_id = videoId;
      }
    }

    const { data, error } = await supabase
      .from('admin_city_media')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating city media:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error in updateCityMedia:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a media item
 */
export async function deleteCityMedia(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('admin_city_media')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting city media:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in deleteCityMedia:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Toggle active status of a media item
 */
export async function toggleCityMediaActive(id: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
  return updateCityMedia(id, { is_active: isActive });
}
