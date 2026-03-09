/**
 * SubscribeToUnlockModal.tsx
 * Shown when a user taps "Subscribe to Unlock" on a paid itinerary.
 * Displays the itinerary details and a CTA to subscribe.
 * Branch: map-features
 */

import React from 'react';
import { Itinerary } from '../../services/itineraryService';

interface SubscribeToUnlockModalProps {
  itinerary: Itinerary;
  onClose: () => void;
  onSubscribe: () => void;
  isAuthenticated: boolean;
  onSignIn: () => void;
}

const SubscribeToUnlockModal: React.FC<SubscribeToUnlockModalProps> = ({
  itinerary,
  onClose,
  onSubscribe,
  isAuthenticated,
  onSignIn,
}) => {
  const color = itinerary.color || '#FF6B35';

  return (
    <div className="fixed inset-0 z-[500] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-t-3xl shadow-2xl p-6 pb-10 animate-in slide-in-from-bottom-8 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
            <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Paid Itinerary</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Lock icon */}
        <div className="flex flex-col items-center text-center mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
            style={{ backgroundColor: color + '20' }}
          >
            <i className="fa-solid fa-lock text-3xl" style={{ color }}></i>
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-1">{itinerary.title}</h2>
          <p className="text-sm text-gray-500">{itinerary.city}</p>
          {itinerary.description && (
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">{itinerary.description}</p>
          )}
        </div>

        {/* What's inside teaser */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-5">
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">What's Inside</p>
          <div className="space-y-2">
            {itinerary.time_preferences?.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <i className="fa-solid fa-clock text-primary w-4"></i>
                <span>{itinerary.time_preferences.join(' · ')}</span>
              </div>
            )}
            {itinerary.music_genres?.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <i className="fa-solid fa-music text-purple-500 w-4"></i>
                <span>{itinerary.music_genres.slice(0, 3).join(', ')}{itinerary.music_genres.length > 3 ? '...' : ''}</span>
              </div>
            )}
            {itinerary.crowd_density && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <i className="fa-solid fa-users text-green-500 w-4"></i>
                <span>{itinerary.crowd_density} crowd</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <i className="fa-solid fa-map-pin text-primary w-4"></i>
              <span>Full route with {(itinerary.stops?.length || 0) + 2}+ curated stops</span>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-5 px-1">
          <span className="text-sm text-gray-500">Access price</span>
          <span className="text-lg font-black text-gray-900">
            {itinerary.currency} {itinerary.price?.toFixed(2)}
          </span>
        </div>

        {/* CTA */}
        {isAuthenticated ? (
          <button
            onClick={onSubscribe}
            style={{ backgroundColor: color }}
            className="w-full py-4 rounded-2xl text-white font-black text-base shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-unlock"></i>
            Unlock This Itinerary
          </button>
        ) : (
          <div className="space-y-3">
            <button
              onClick={onSignIn}
              style={{ backgroundColor: color }}
              className="w-full py-4 rounded-2xl text-white font-black text-base shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-user"></i>
              Sign In to Unlock
            </button>
            <p className="text-center text-xs text-gray-400">Sign in or create an account to access paid itineraries</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscribeToUnlockModal;
