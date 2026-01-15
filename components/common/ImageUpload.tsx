import React, { useState, useRef } from 'react';

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageSelect: (file: File) => void;
  onImageRemove?: () => void;
  disabled?: boolean;
  maxSizeMB?: number;
  userName?: string;
  userEmail?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImageUrl,
  onImageSelect,
  onImageRemove,
  disabled = false,
  maxSizeMB = 5,
  userName,
  userEmail,
}) => {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a valid image file (JPG, PNG, or WebP)';
    }
    if (file.size > maxSizeBytes) {
      return `File size must be less than ${maxSizeMB}MB`;
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    setError(null);
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Pass file to parent
    onImageSelect(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onImageRemove) {
      onImageRemove();
    }
  };

  const getInitials = () => {
    if (userName) {
      return userName.charAt(0).toUpperCase();
    }
    if (userEmail) {
      return userEmail.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Image Preview/Upload Area */}
      <div
        className={`relative group ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDrop={!disabled ? handleDrop : undefined}
        onDragOver={!disabled ? handleDragOver : undefined}
        onDragLeave={!disabled ? handleDragLeave : undefined}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        {/* Avatar Display */}
        <div
          className={`w-32 h-32 rounded-full overflow-hidden border-4 transition ${
            isDragging ? 'border-primary scale-105' : 'border-gray-200'
          } ${!disabled ? 'group-hover:border-primary/50' : ''}`}
        >
          {preview ? (
            <img
              src={preview}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-primary text-white flex items-center justify-center text-4xl font-bold">
              {getInitials()}
            </div>
          )}
        </div>

        {/* Edit Overlay */}
        {!disabled && (
          <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
            <div className="text-center text-white">
              <i className="fa-solid fa-camera text-2xl mb-1"></i>
              <div className="text-xs font-medium">Change Photo</div>
            </div>
          </div>
        )}

        {/* Remove Button */}
        {preview && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRemove();
            }}
            className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition flex items-center justify-center"
          >
            <i className="fa-solid fa-times text-sm"></i>
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={allowedTypes.join(',')}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Instructions */}
      {!disabled && (
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Click to upload or drag and drop
          </p>
          <p className="text-[10px] text-gray-400 mt-1">
            JPG, PNG or WebP (max {maxSizeMB}MB)
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-xs text-red-500 text-center bg-red-50 px-3 py-2 rounded-lg">
          <i className="fa-solid fa-exclamation-circle mr-1"></i>
          {error}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
