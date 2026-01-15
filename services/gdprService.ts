import { supabase } from '../src/supabaseClient';

/**
 * Service for GDPR compliance operations
 * Handles user data export and account deletion
 */

export const gdprService = {
  /**
   * Export all user data in JSON format (GDPR compliance)
   * @returns Complete user data package
   */
  exportUserData: async (): Promise<{ data: any | null; error: any }> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return { data: null, error: { message: 'Not authenticated' } };
      }

      const userId = session.user.id;
      const userEmail = session.user.email;

      // Fetch all user-related data
      const [
        profileResult,
        userResult,
        preferencesResult,
        favoritesResult,
        plansResult,
        checkInsResult,
      ] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('id', userId).single(),
        supabase.from('users').select('*').eq('id', userId).single(),
        supabase.from('user_preferences').select('*').eq('user_id', userId).single(),
        supabase.from('favorites').select('*, venues(name, type, city)').eq('user_id', userId),
        supabase.from('check_ins').select('*, venues(name, type, city)').eq('user_id', userId),
      ]);

      // Compile data package
      const dataPackage = {
        export_date: new Date().toISOString(),
        user_id: userId,
        email: userEmail,
        profile: profileResult.data || {},
        user_details: userResult.data || {},
        preferences: preferencesResult.data || {},
        favorites: favoritesResult.data || [],
        check_ins: checkInsResult.data || [],
        metadata: {
          total_favorites: favoritesResult.data?.length || 0,
          total_check_ins: checkInsResult.data?.length || 0,
        },
      };

      return { data: dataPackage, error: null };
    } catch (err: any) {
      console.error('Error exporting user data:', err);
      return { data: null, error: { message: err.message || 'Export failed' } };
    }
  },

  /**
   * Download user data as JSON file
   */
  downloadUserData: async (): Promise<{ success: boolean; error: any }> => {
    try {
      const { data, error } = await gdprService.exportUserData();
      
      if (error || !data) {
        return { success: false, error: error || { message: 'No data to export' } };
      }

      // Create blob and download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kunajoto-user-data-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { success: true, error: null };
    } catch (err: any) {
      console.error('Error downloading user data:', err);
      return { success: false, error: { message: err.message || 'Download failed' } };
    }
  },

  /**
   * Delete user account and all associated data (GDPR compliance)
   * This is a soft delete that anonymizes the user data
   * @param confirmationText - User must type "DELETE MY ACCOUNT" to confirm
   */
  deleteUserAccount: async (confirmationText: string): Promise<{ success: boolean; error: any }> => {
    try {
      if (confirmationText !== 'DELETE MY ACCOUNT') {
        return { 
          success: false, 
          error: { message: 'Please type "DELETE MY ACCOUNT" to confirm' } 
        };
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return { success: false, error: { message: 'Not authenticated' } };
      }

      const userId = session.user.id;

      // Call RPC function to handle account deletion
      // This should be implemented in Supabase as a stored procedure
      const { error: deleteError } = await supabase.rpc('delete_user_account', {
        p_user_id: userId,
      });

      if (deleteError) {
        console.error('Error deleting account:', deleteError);
        return { success: false, error: deleteError };
      }

      // Sign out the user
      await supabase.auth.signOut();

      return { success: true, error: null };
    } catch (err: any) {
      console.error('Error in deleteUserAccount:', err);
      return { success: false, error: { message: err.message || 'Account deletion failed' } };
    }
  },

  /**
   * Request account deletion (creates a deletion request for admin review)
   * Alternative to immediate deletion
   */
  requestAccountDeletion: async (reason?: string): Promise<{ success: boolean; error: any }> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return { success: false, error: { message: 'Not authenticated' } };
      }

      // Create deletion request (this would need a table in the database)
      const { error } = await supabase
        .from('account_deletion_requests')
        .insert({
          user_id: session.user.id,
          reason: reason || 'User requested account deletion',
          status: 'pending',
          requested_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error creating deletion request:', error);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (err: any) {
      console.error('Error in requestAccountDeletion:', err);
      return { success: false, error: { message: err.message || 'Request failed' } };
    }
  },
};
