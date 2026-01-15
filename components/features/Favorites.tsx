import React, { useState, useEffect } from 'react';
import { Venue } from '../../types';
import { dataService } from '../../services/dataService';

interface FavoritesProps {
  onClose: () => void;
  onVenueClick: (venue: Venue) => void;
  onToggleFavorite: (venueId: string) => Promise<void>;
  onExploreVenues?: () => void;
}

const Favorites: React.FC<FavoritesProps> = ({ onClose, onVenueClick, onToggleFavorite, onExploreVenues }) => {
  const [favoriteVenues, setFavoriteVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'clubs' | 'bars' | 'lounges'>('all');

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const venues = await dataService.fetchVenues();
      const favorites = venues.filter(v => v.isFavorite);
      setFavoriteVenues(favorites);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (venueId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await onToggleFavorite(venueId);
      // Remove from local state immediately for better UX
      setFavoriteVenues(prev => prev.filter(v => v.id !== venueId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const filteredVenues = favoriteVenues.filter(v => {
    if (filter === 'all') return true;
    return v.type?.toLowerCase().includes(filter.slice(0, -1)); // Remove 's' from filter
  });

  const getVibeColor = (score: number) => {
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-dark text-white px-6 py-4 flex justify-between items-center shadow-lg">
        <div>
          <h2 className="text-2xl font-black">My Favorites</h2>
          <p className="text-xs text-gray-400 mt-1">
            {favoriteVenues.length} {favoriteVenues.length === 1 ? 'venue' : 'venues'} saved
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center"
        >
          <i className="fa-solid fa-times text-xl"></i>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="flex gap-2 overflow-x-auto">
          {[
            { key: 'all', label: 'All', icon: 'fa-heart' },
            { key: 'clubs', label: 'Clubs', icon: 'fa-music' },
            { key: 'bars', label: 'Bars', icon: 'fa-martini-glass' },
            { key: 'lounges', label: 'Lounges', icon: 'fa-couch' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap ${
                filter === tab.key
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <i className={`fa-solid ${tab.icon} mr-1.5`}></i>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 pb-24">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <i className="fa-solid fa-spinner fa-spin text-4xl text-primary mb-3"></i>
              <p className="text-gray-500 text-sm">Loading your favorites...</p>
            </div>
          </div>
        ) : filteredVenues.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center max-w-xs">
              <i className="fa-solid fa-heart-crack text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-bold text-dark mb-2">
                {filter === 'all' ? 'No favorites yet' : `No ${filter} favorited`}
              </h3>
              <p className="text-sm text-gray-500">
                {filter === 'all'
                  ? 'Start exploring and tap the heart icon to save your favorite venues!'
                  : `Try favoriting some ${filter} from the map.`}
              </p>
              <button
                onClick={() => {
                  if (onExploreVenues) {
                    onExploreVenues();
                  }
                  onClose();
                }}
                className="mt-4 px-6 py-2 bg-primary text-white rounded-full text-sm font-bold hover:bg-primary/90 transition"
              >
                Explore Venues
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredVenues.map(venue => (
              <div
                key={venue.id}
                onClick={() => {
                  onVenueClick(venue);
                  if (onExploreVenues) {
                    onExploreVenues();
                  }
                  onClose();
                }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
              >
                <div className="flex">
                  {/* Image */}
                  <div className="w-24 h-24 flex-shrink-0 relative">
                    <img
                      src={venue.imageUrl}
                      alt={venue.name}
                      className="w-full h-full object-cover"
                    />
                    {venue.isPromoted && (
                      <div className="absolute top-1 left-1 bg-primary text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                        PROMOTED
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-3 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-dark text-sm leading-tight pr-2">
                          {venue.name}
                        </h3>
                        <button
                          onClick={(e) => handleRemoveFavorite(venue.id, e)}
                          className="flex-shrink-0 w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition flex items-center justify-center"
                        >
                          <i className="fa-solid fa-heart text-sm"></i>
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-1">
                        <span className="capitalize">{venue.type || 'Venue'}</span>
                        {venue.district && (
                          <>
                            <span>•</span>
                            <span>{venue.district}</span>
                          </>
                        )}
                        {venue.priceLevel && (
                          <>
                            <span>•</span>
                            <span>{'$'.repeat(venue.priceLevel)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Vibe Score */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <i className="fa-solid fa-fire text-primary text-xs"></i>
                        <span className={`text-sm font-bold ${getVibeColor(venue.vibeScore)}`}>
                          {(venue.vibeScore / 10).toFixed(1)}
                        </span>
                      </div>
                      <span className="text-[9px] text-gray-400 uppercase tracking-wide">
                        {venue.vibeConfidence}
                      </span>
                      {venue.vibeTrend && venue.vibeTrend !== 'Stable' && (
                        <span className="text-[9px] text-gray-500">
                          {venue.vibeTrend === 'Rising' ? '↗' : '↘'} {venue.vibeTrend}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Action Bar (Optional) */}
      {filteredVenues.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
          <div className="flex gap-3">
            <button
              onClick={() => {
                // Could implement "Clear All Favorites" with confirmation
                if (confirm(`Remove all ${filteredVenues.length} favorites?`)) {
                  filteredVenues.forEach(v => handleRemoveFavorite(v.id, {} as any));
                }
              }}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition"
            >
              <i className="fa-solid fa-trash mr-2"></i>
              Clear {filter === 'all' ? 'All' : filter}
            </button>
            <button
              onClick={() => {
                if (filteredVenues.length > 0 && onExploreVenues) {
                  // Click first venue to center map on it
                  onVenueClick(filteredVenues[0]);
                  onExploreVenues();
                }
                onClose();
              }}
              className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition"
            >
              <i className="fa-solid fa-map mr-2"></i>
              View on Map
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Favorites;
