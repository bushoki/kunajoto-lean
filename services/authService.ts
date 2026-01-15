import { supabase } from '../src/supabaseClient';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Enhanced user profile with Basejump integration
export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  default_role: 'super_admin' | 'app_admin' | 'venue_manager' | 'guest';
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAccount {
  account_id: string;
  team_name: string;
  personal_account: boolean;
  account_role: 'owner' | 'member';
  role: 'super_admin' | 'app_admin' | 'venue_manager' | 'guest';
  is_premium: boolean;
}

export const authService = {
  
  signUp: async (email: string, password: string, metadata?: { first_name?: string; last_name?: string; full_name?: string }): Promise<{ user: SupabaseUser | null, error: any }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata || {}
        }
      });

      if (error) return { user: null, error };

      // Profile and Basejump account are created automatically by database triggers
      // - handle_new_user() creates user_profiles
      // - Basejump trigger creates personal account
      // - handle_new_user_role() creates user_roles entry

      return { user: data.user, error: null };
    } catch (err: any) {
      return { user: null, error: { message: err.message || 'Registration failed' } };
    }
  },

  signIn: async (email: string, password: string): Promise<{ user: SupabaseUser | null, error: any }> => {
    try {
      console.log('🔑 [authService] Starting sign in for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ [authService] Sign in error:', error.message, error);
        return { user: null, error };
      }
      
      if (!data.user) {
        console.error('❌ [authService] No user returned from sign in');
        return { user: null, error: { message: 'Authentication failed - no user data' } };
      }
      
      console.log('✅ [authService] Sign in successful for user:', data.user.id);
      return { user: data.user, error: null };
    } catch (err: any) {
      console.error('❌ [authService] Sign in exception:', err.message, err);
      return { user: null, error: { message: err.message || 'Login failed. Please try again.' } };
    }
  },

  signOut: async () => {
    console.log('🚪 [authService] Starting logout process...');
    
    try {
      // Sign out from Supabase
      console.log('🔑 [authService] Calling supabase.auth.signOut()...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ [authService] Supabase signOut error:', error);
        throw error;
      }
      console.log('✅ [authService] Supabase signOut successful');
      
      // Clear all user-specific localStorage data
      console.log('🧽 [authService] Clearing localStorage...');
      const itemsToRemove = ['kunajoto_auth_token', 'kunajoto_user_prefs', 'kunajoto_preferences_completed'];
      
      itemsToRemove.forEach(item => {
        const hadItem = localStorage.getItem(item) !== null;
        localStorage.removeItem(item);
        console.log(`  • ${item}: ${hadItem ? 'removed' : 'not found'}`);
      });
      
      // Keep kunajoto_has_onboarded so user doesn't see onboarding again
      console.log('  • kunajoto_has_onboarded: kept (user stays onboarded)');
      
      console.log('✅ [authService] Logout complete - all user data cleared');
    } catch (error) {
      console.error('❌ [authService] Logout failed:', error);
      throw error;
    }
  },

  getSession: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  /**
   * Get user profile with role information
   */
  getUserProfile: async (): Promise<UserProfile | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data as UserProfile;
  },

  /**
   * Get user's Basejump accounts with role information
   */
  getUserAccounts: async (): Promise<UserAccount[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];

    try {
      const { data, error } = await supabase.rpc('get_user_accounts', {
        p_user_id: session.user.id
      });

      if (error) {
        console.error('Error fetching user accounts:', error);
        return [];
      }

      return data as UserAccount[];
    } catch (err) {
      console.error('Error calling get_user_accounts:', err);
      return [];
    }
  },

  /**
   * Get user's primary (personal) account
   */
  getPrimaryAccount: async (): Promise<UserAccount | null> => {
    const accounts = await authService.getUserAccounts();
    return accounts.find(acc => acc.personal_account) || null;
  },

  /**
   * Get user's role (checks personal account first, then default_role)
   */
  getUserRole: async (): Promise<'super_admin' | 'app_admin' | 'venue_manager' | 'guest'> => {
    const profile = await authService.getUserProfile();
    if (!profile) return 'guest';

    // Get role from personal account if available
    const primaryAccount = await authService.getPrimaryAccount();
    if (primaryAccount) {
      return primaryAccount.role;
    }

    // Fallback to default_role from profile
    return profile.default_role || 'guest';
  },

  /**
   * Check if user has specific role
   */
  hasRole: async (role: 'super_admin' | 'app_admin' | 'venue_manager' | 'guest'): Promise<boolean> => {
    const userRole = await authService.getUserRole();
    return userRole === role;
  },

  /**
   * Check if user is admin (super_admin or app_admin)
   */
  isAdmin: async (): Promise<boolean> => {
    const userRole = await authService.getUserRole();
    return userRole === 'super_admin' || userRole === 'app_admin';
  },

  /**
   * Check if user is super admin
   */
  isSuperAdmin: async (): Promise<boolean> => {
    return await authService.hasRole('super_admin');
  },

  /**
   * Check if user is venue manager
   */
  isVenueManager: async (): Promise<boolean> => {
    return await authService.hasRole('venue_manager');
  },

  /**
   * Check if user has premium subscription
   */
  isPremium: async (): Promise<boolean> => {
    const profile = await authService.getUserProfile();
    return profile?.is_premium || false;
  },

  /**
   * Check if user manages a specific venue
   */
  managesVenue: async (venueId: string): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;

    try {
      const { data } = await supabase.rpc('is_venue_manager', {
        p_user_id: session.user.id,
        p_venue_id: venueId
      });

      return data || false;
    } catch (err) {
      console.error('Error checking venue manager status:', err);
      return false;
    }
  },

  /**
   * Get venues managed by user
   */
  getManagedVenues: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];

    try {
      const { data, error } = await supabase.rpc('get_user_managed_venues', {
        p_user_id: session.user.id
      });

      if (error) {
        console.error('Error fetching managed venues:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error calling get_user_managed_venues:', err);
      return [];
    }
  },

  /**
   * Apply to become a venue manager
   */
  applyForVenueManager: async (
    venueId: string,
    businessName: string,
    businessEmail: string,
    businessPhone?: string,
    proofDocumentUrl?: string
  ): Promise<{ success: boolean; applicationId?: string; error?: any }> => {
    try {
      const { data, error } = await supabase.rpc('apply_for_venue_manager', {
        p_venue_id: venueId,
        p_business_name: businessName,
        p_business_email: businessEmail,
        p_business_phone: businessPhone,
        p_proof_document_url: proofDocumentUrl
      });

      if (error) {
        return { success: false, error };
      }

      return { success: true, applicationId: data };
    } catch (err: any) {
      return { success: false, error: { message: err.message || 'Application failed' } };
    }
  },

  updateUserProfile: async (updates: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', session.user.id);
  }
};
