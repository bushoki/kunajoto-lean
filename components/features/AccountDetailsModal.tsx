import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/supabaseClient';
import CountrySelect from '../common/CountrySelect';
import ImageUpload from '../common/ImageUpload';
import { storageService } from '../../services/storageService';

interface AccountDetailsModalProps {
  onClose: () => void;
  userId: string;
  userEmail: string;
  userName?: string;
  onUpdate?: () => void;
}

interface UserData {
  id: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  username: string;
  avatar_url: string;
  bio: string;
  date_of_birth: string;
  city: string;
  country: string;
  created_at: string;
  is_verified: boolean;
}

const AccountDetailsModal: React.FC<AccountDetailsModalProps> = ({
  onClose,
  userId,
  userEmail,
  userName,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [formData, setFormData] = useState<Partial<UserData>>({});
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  // Fetch user data when component mounts
  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchUserData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch from both user_profiles and users tables
      const [profileResult, userResult] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('id', userId).single(),
        supabase.from('users').select('*').eq('id', userId).single(),
      ]);

      if (profileResult.error) throw profileResult.error;
      if (userResult.error) throw userResult.error;

      // Merge data from both tables
      const mergedData: UserData = {
        id: userId,
        email: userEmail,
        full_name: profileResult.data?.full_name || userResult.data?.full_name || '',
        first_name: profileResult.data?.first_name || '',
        last_name: profileResult.data?.last_name || '',
        username: profileResult.data?.username || '',
        avatar_url: profileResult.data?.avatar_url || userResult.data?.avatar_url || '',
        bio: userResult.data?.bio || '',
        date_of_birth: userResult.data?.date_of_birth || '',
        city: userResult.data?.city || '',
        country: userResult.data?.country || '',
        created_at: profileResult.data?.created_at || '',
        is_verified: userResult.data?.is_verified || false,
      };

      setUserData(mergedData);
      setFormData(mergedData);
    } catch (err: any) {
      console.error('Error fetching user data:', err);
      setError(err.message || 'Failed to load account details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof UserData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
    setError(null);
  };

  const handleImageRemove = () => {
    setSelectedImage(null);
    setFormData(prev => ({ ...prev, avatar_url: '' }));
  };

  const validateForm = (): string | null => {
    if (!formData.first_name?.trim()) {
      return 'First name is required';
    }
    if (!formData.last_name?.trim()) {
      return 'Last name is required';
    }
    if (formData.username && formData.username.length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (formData.date_of_birth) {
      const birthDate = new Date(formData.date_of_birth);
      const age = (Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (age < 18) {
        return 'You must be at least 18 years old';
      }
    }
    return null;
  };

  const handleSave = async () => {
    setError(null);
    setSuccessMessage(null);

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);

    try {
      let avatarUrl = formData.avatar_url;

      // Upload new avatar if selected
      if (selectedImage) {
        const { url, error: uploadError } = await storageService.uploadAvatar(userId, selectedImage);
        if (uploadError) {
          throw new Error(uploadError.message || 'Failed to upload avatar');
        }
        avatarUrl = url || '';
      }

      // Generate full_name from first_name and last_name
      const full_name = `${formData.first_name} ${formData.last_name}`.trim();

      // Update user_profiles table
      const profileUpdates = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        full_name: full_name,
        username: formData.username || null,
        avatar_url: avatarUrl,
      };

      const { error: profileError } = await supabase
        .from('user_profiles')
        .update(profileUpdates)
        .eq('id', userId);

      if (profileError) throw profileError;

      // Update users table
      const userUpdates = {
        full_name: full_name,
        avatar_url: avatarUrl,
        bio: formData.bio || null,
        date_of_birth: formData.date_of_birth || null,
        city: formData.city || null,
        country: formData.country || null,
        updated_at: new Date().toISOString(),
      };

      const { error: userError } = await supabase
        .from('users')
        .update(userUpdates)
        .eq('id', userId);

      if (userError) throw userError;

      // Update local state
      setUserData(prev => prev ? { ...prev, ...formData, full_name, avatar_url: avatarUrl || '' } : null);
      setSelectedImage(null);
      setIsEditing(false);
      setSuccessMessage('Account details updated successfully!');

      // Notify parent component
      if (onUpdate) {
        onUpdate();
      }
    } catch (err: any) {
      console.error('Error saving account details:', err);
      setError(err.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(userData || {});
    setSelectedImage(null);
    setIsEditing(false);
    setError(null);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="absolute inset-0 z-[50] bg-gray-50 flex flex-col font-sans animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="bg-white p-6 pt-12 shadow-sm border-b border-gray-200 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-dark">Account Details</h1>
          <p className="text-xs text-gray-500 font-medium">Manage your personal information</p>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
           <i className="fa-solid fa-xmark"></i>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-32">
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

              {/* Profile Picture */}
              <div className="mb-6">
                <ImageUpload
                  currentImageUrl={formData.avatar_url}
                  onImageSelect={handleImageSelect}
                  onImageRemove={handleImageRemove}
                  disabled={!isEditing}
                  userName={formData.full_name}
                  userEmail={userEmail}
                />
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Email (Read-only) */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">
                    Email Address
                    {userData?.is_verified && (
                      <span className="ml-2 text-green-600">
                        <i className="fa-solid fa-check-circle"></i> Verified
                      </span>
                    )}
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    disabled
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-600 cursor-not-allowed"
                  />
                </div>

                {/* First Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.first_name || ''}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter your first name"
                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-dark transition ${
                      isEditing ? 'bg-white hover:border-primary/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/10' : 'bg-gray-50'
                    }`}
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.last_name || ''}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter your last name"
                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-dark transition ${
                      isEditing ? 'bg-white hover:border-primary/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/10' : 'bg-gray-50'
                    }`}
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username || ''}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Choose a unique username"
                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-dark transition ${
                      isEditing ? 'bg-white hover:border-primary/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/10' : 'bg-gray-50'
                    }`}
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio || ''}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Tell us about yourself"
                    rows={3}
                    maxLength={500}
                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-dark transition resize-none ${
                      isEditing ? 'bg-white hover:border-primary/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/10' : 'bg-gray-50'
                    }`}
                  />
                  {isEditing && (
                    <div className="text-xs text-gray-400 mt-1 text-right">
                      {(formData.bio || '').length}/500
                    </div>
                  )}
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.date_of_birth || ''}
                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                    disabled={!isEditing}
                    max={new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-dark transition ${
                      isEditing ? 'bg-white hover:border-primary/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/10' : 'bg-gray-50'
                    }`}
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Your city"
                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-dark transition ${
                      isEditing ? 'bg-white hover:border-primary/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/10' : 'bg-gray-50'
                    }`}
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">
                    Country
                  </label>
                  {isEditing ? (
                    <CountrySelect
                      value={formData.country || ''}
                      onChange={(country) => handleInputChange('country', country)}
                      disabled={!isEditing}
                    />
                  ) : (
                    <input
                      type="text"
                      value={formData.country || 'Not set'}
                      disabled
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-dark"
                    />
                  )}
                </div>

                {/* Account Created */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">
                    Account Created
                  </label>
                  <input
                    type="text"
                    value={formatDate(userData?.created_at || '')}
                    disabled
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-600 cursor-not-allowed"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          {!isEditing ? (
            <>
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                Close
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition"
              >
                <i className="fa-solid fa-edit mr-2"></i>
                Edit Profile
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition disabled:opacity-50"
              >
                Cancel
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
                    Save Changes
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
  );
};

export default AccountDetailsModal;
