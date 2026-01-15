import { supabase } from '../src/supabaseClient';

/**
 * Service for handling file uploads to Supabase Storage
 */

const AVATAR_BUCKET = 'user-avatars';

export const storageService = {
  /**
   * Upload user avatar to Supabase Storage
   * @param userId - The user's ID
   * @param file - The image file to upload
   * @returns The public URL of the uploaded image
   */
  uploadAvatar: async (userId: string, file: File): Promise<{ url: string | null; error: any }> => {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload file to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true, // Replace if exists
        });

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        return { url: null, error: uploadError };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(AVATAR_BUCKET)
        .getPublicUrl(filePath);

      return { url: publicUrl, error: null };
    } catch (err: any) {
      console.error('Error in uploadAvatar:', err);
      return { url: null, error: { message: err.message || 'Upload failed' } };
    }
  },

  /**
   * Delete user avatar from Supabase Storage
   * @param avatarUrl - The URL of the avatar to delete
   */
  deleteAvatar: async (avatarUrl: string): Promise<{ success: boolean; error: any }> => {
    try {
      // Extract file path from URL
      const urlParts = avatarUrl.split(`${AVATAR_BUCKET}/`);
      if (urlParts.length < 2) {
        return { success: false, error: { message: 'Invalid avatar URL' } };
      }

      const filePath = urlParts[1];

      // Delete file from storage
      const { error } = await supabase.storage
        .from(AVATAR_BUCKET)
        .remove([filePath]);

      if (error) {
        console.error('Error deleting avatar:', error);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (err: any) {
      console.error('Error in deleteAvatar:', err);
      return { success: false, error: { message: err.message || 'Delete failed' } };
    }
  },

  /**
   * Get the public URL for an avatar
   * @param filePath - The file path in storage
   */
  getAvatarUrl: (filePath: string): string => {
    const { data: { publicUrl } } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(filePath);
    return publicUrl;
  },

  /**
   * Check if storage bucket exists and is accessible
   */
  checkBucketExists: async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.storage.getBucket(AVATAR_BUCKET);
      return !error && !!data;
    } catch (err) {
      console.error('Error checking bucket:', err);
      return false;
    }
  },
};
