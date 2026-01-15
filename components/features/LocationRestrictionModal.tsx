/**
 * Location Restriction Modal - Kunajoto Lean
 * Displayed when user is not in a target city
 */

import React, { useState } from 'react';
import { TARGET_CITIES } from '../../services/locationService';

interface LocationRestrictionModalProps {
  detectedCity: string;
  onSelectCity: (city: string) => void;
  onClose: () => void;
}

export default function LocationRestrictionModal({
  detectedCity,
  onSelectCity,
  onClose
}: LocationRestrictionModalProps) {
  const [selectedCity, setSelectedCity] = useState<string>(TARGET_CITIES[0]);

  const handleConfirm = () => {
    onSelectCity(selectedCity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-location-dot text-3xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-center">Location Notice</h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-gray-700 text-lg mb-2">
              We detected you're in <span className="font-bold text-orange-600">{detectedCity}</span>
            </p>
            <p className="text-gray-600 text-sm">
              Kunajoto is currently available in select cities. Choose a city below to explore its nightlife scene!
            </p>
          </div>

          {/* City Selector */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Select Your City of Interest
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium text-gray-900 bg-white"
            >
              {TARGET_CITIES.filter(city => city !== 'New York').map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              <i className="fa-solid fa-info-circle mr-1"></i>
              You can change this anytime in settings
            </p>
          </div>

          {/* Available Cities Info */}
          <div className="bg-orange-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">
              Currently Available In:
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {TARGET_CITIES.filter(city => city !== 'New York').map((city) => (
                <div key={city} className="flex items-center gap-2 text-sm text-gray-700">
                  <i className="fa-solid fa-check text-orange-500 text-xs"></i>
                  {city}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleConfirm}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
            >
              <i className="fa-solid fa-check mr-2"></i>
              Continue
            </button>
          </div>

          <p className="text-center text-xs text-gray-500 mt-4">
            Planning a trip? Select your destination city to access relevant content and services.
          </p>
        </div>
      </div>
    </div>
  );
}
