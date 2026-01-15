import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/supabaseClient';
import { gdprService } from '../../services/gdprService';

interface PrivacySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
}

interface PrivacySettings {
  safety_mode: boolean;
  profile_visibility: 'public' | 'private';
  show_email: boolean;
  show_location: boolean;
  show_dob: boolean;
}

const PrivacySettingsModal: React.FC<PrivacySettingsModalProps> = ({
  isOpen,
  onClose,
  userId,
  userEmail,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<PrivacySettings>({
    safety_mode: true,
    profile_visibility: 'public',
    show_email: false,
    show_location: true,
    show_dob: false,
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch privacy settings when modal opens
  useEffect(() => {
    if (isOpen && userId) {
      fetchPrivacySettings();
    }
  }, [isOpen, userId]);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchPrivacySettings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('safety_mode, preferences')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      // Extract privacy settings from preferences JSONB
      const privacyPrefs = data?.preferences?.privacy || {};

      setSettings({
        safety_mode: data?.safety_mode ?? true,
        profile_visibility: privacyPrefs.profile_visibility || 'public',
        show_email: privacyPrefs.show_email ?? false,
        show_location: privacyPrefs.show_location ?? true,
        show_dob: privacyPrefs.show_dob ?? false,
      });
    } catch (err: any) {
      console.error('Error fetching privacy settings:', err);
      setError(err.message || 'Failed to load privacy settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key: keyof PrivacySettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setError(null);
  };

  const handleSave = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      // Get current preferences
      const { data: currentData } = await supabase
        .from('users')
        .select('preferences')
        .eq('id', userId)
        .single();

      const currentPreferences = currentData?.preferences || {};

      // Update preferences with new privacy settings
      const updatedPreferences = {
        ...currentPreferences,
        privacy: {
          profile_visibility: settings.profile_visibility,
          show_email: settings.show_email,
          show_location: settings.show_location,
          show_dob: settings.show_dob,
        },
      };

      // Save to database
      const { error: updateError } = await supabase
        .from('users')
        .update({
          safety_mode: settings.safety_mode,
          preferences: updatedPreferences,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      setSuccessMessage('Privacy settings updated successfully!');
    } catch (err: any) {
      console.error('Error saving privacy settings:', err);
      setError(err.message || 'Failed to save privacy settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    setError(null);

    try {
      const { success, error: exportError } = await gdprService.downloadUserData();
      
      if (!success || exportError) {
        throw new Error(exportError?.message || 'Failed to export data');
      }

      setSuccessMessage('Your data has been downloaded successfully!');
    } catch (err: any) {
      console.error('Error exporting data:', err);
      setError(err.message || 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
      setError('Please type "DELETE MY ACCOUNT" to confirm');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const { success, error: deleteError } = await gdprService.deleteUserAccount(deleteConfirmText);
      
      if (!success || deleteError) {
        throw new Error(deleteError?.message || 'Failed to delete account');
      }

      // Account deleted successfully, user will be signed out
      // The modal will close automatically as the user is redirected
    } catch (err: any) {
      console.error('Error deleting account:', err);
      setError(err.message || 'Failed to delete account');
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-dark text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Privacy & Security Settings</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/10 transition flex items-center justify-center"
          >
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Success Message */}
              {successMessage && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                  <i className="fa-solid fa-check-circle"></i>
                  {successMessage}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                  <i className="fa-solid fa-exclamation-circle"></i>
                  {error}
                </div>
              )}

              {/* Safety & Security Section */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-dark mb-3">Safety & Security</h3>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Safety Mode */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-dark text-sm mb-1">Safety Mode</div>
                        <div className="text-xs text-gray-500">
                          Share your location with trusted friends when visiting venues
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggle('safety_mode')}
                        className={`w-12 h-6 rounded-full relative transition ${
                          settings.safety_mode ? 'bg-primary' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                            settings.safety_mode ? 'right-1' : 'left-1'
                          }`}
                        ></div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Visibility Section */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-dark mb-3">Profile Visibility</h3>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Profile Visibility */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <div className="font-medium text-dark text-sm mb-1">Profile Visibility</div>
                        <div className="text-xs text-gray-500">
                          Control who can see your profile
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSettings(prev => ({ ...prev, profile_visibility: 'public' }))}
                        className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition ${
                          settings.profile_visibility === 'public'
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Public
                      </button>
                      <button
                        onClick={() => setSettings(prev => ({ ...prev, profile_visibility: 'private' }))}
                        className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition ${
                          settings.profile_visibility === 'private'
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Private
                      </button>
                    </div>
                  </div>

                  {/* Show Email */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-dark text-sm mb-1">Show Email</div>
                        <div className="text-xs text-gray-500">
                          Display your email address on your profile
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggle('show_email')}
                        className={`w-12 h-6 rounded-full relative transition ${
                          settings.show_email ? 'bg-primary' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                            settings.show_email ? 'right-1' : 'left-1'
                          }`}
                        ></div>
                      </button>
                    </div>
                  </div>

                  {/* Show Location */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-dark text-sm mb-1">Show Location</div>
                        <div className="text-xs text-gray-500">
                          Display your city and country on your profile
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggle('show_location')}
                        className={`w-12 h-6 rounded-full relative transition ${
                          settings.show_location ? 'bg-primary' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                            settings.show_location ? 'right-1' : 'left-1'
                          }`}
                        ></div>
                      </button>
                    </div>
                  </div>

                  {/* Show Date of Birth */}
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-dark text-sm mb-1">Show Date of Birth</div>
                        <div className="text-xs text-gray-500">
                          Display your date of birth on your profile
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggle('show_dob')}
                        className={`w-12 h-6 rounded-full relative transition ${
                          settings.show_dob ? 'bg-primary' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                            settings.show_dob ? 'right-1' : 'left-1'
                          }`}
                        ></div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Management (GDPR) Section */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-dark mb-3">Data Management</h3>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Export Data */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-dark text-sm mb-1">Export Your Data</div>
                        <div className="text-xs text-gray-500">
                          Download a copy of all your data in JSON format
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleExportData}
                      disabled={isExporting}
                      className="w-full py-2.5 bg-gray-100 text-dark text-sm font-bold rounded-lg hover:bg-gray-200 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isExporting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-dark"></div>
                          Exporting...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-download"></i>
                          Export My Data
                        </>
                      )}
                    </button>
                  </div>

                  {/* Delete Account */}
                  <div className="p-4 bg-red-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-red-600 text-sm mb-1">Delete Account</div>
                        <div className="text-xs text-red-500">
                          Permanently delete your account and all associated data
                        </div>
                      </div>
                    </div>
                    {!showDeleteConfirm ? (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full py-2.5 bg-red-100 text-red-600 text-sm font-bold rounded-lg hover:bg-red-200 transition"
                      >
                        <i className="fa-solid fa-trash mr-2"></i>
                        Delete My Account
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-3 bg-white border border-red-200 rounded-lg">
                          <p className="text-xs text-red-600 font-medium mb-2">
                            ⚠️ This action cannot be undone. All your data will be permanently deleted.
                          </p>
                          <p className="text-xs text-gray-600 mb-3">
                            Type <strong>"DELETE MY ACCOUNT"</strong> to confirm:
                          </p>
                          <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="DELETE MY ACCOUNT"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setShowDeleteConfirm(false);
                              setDeleteConfirmText('');
                              setError(null);
                            }}
                            disabled={isDeleting}
                            className="flex-1 py-2.5 bg-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleDeleteAccount}
                            disabled={isDeleting || deleteConfirmText !== 'DELETE MY ACCOUNT'}
                            className="flex-1 py-2.5 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {isDeleting ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Deleting...
                              </>
                            ) : (
                              <>
                                <i className="fa-solid fa-trash"></i>
                                Confirm Delete
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Privacy Policy Link */}
              <div className="text-center text-xs text-gray-500">
                <p>
                  By using Kunajoto, you agree to our{' '}
                  <a href="/privacy-policy" className="text-primary hover:underline">
                    Privacy Policy
                  </a>{' '}
                  and{' '}
                  <a href="/terms-of-service" className="text-primary hover:underline">
                    Terms of Service
                  </a>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition disabled:opacity-50"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <i className="fa-solid fa-save"></i>
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettingsModal;
