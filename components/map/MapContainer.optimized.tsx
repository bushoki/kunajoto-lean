import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { Venue, Coordinates, MapState, MapTheme } from '../../types';
import { getVibeColor } from '../../constants';
import dataService from '../../services/dataService.optimized';

declare var google: any;

interface MapContainerProps {
  onVenueSelect: (venue: Venue) => void;
  userLocation: Coordinates | null;
  mapState: MapState;
  onMapStateChange: (newState: MapState) => void;
  isDarkMode: boolean;
  mapTheme: MapTheme;
  locationError?: string | null;
  onRetryLocation?: () => void;
  onVenuesLoaded?: (venues: Venue[]) => void; // Callback to pass venues to parent
}

/**
 * Optimized MapContainer with Marker Clustering and Bounding-Box Fetching
 * 
 * Key Improvements:
 * 1. Marker Clustering - Groups nearby venues, prevents DOM overload
 * 2. Bounding-Box Fetching - Only loads venues in visible area
 * 3. Debounced Updates - Prevents excessive API calls during pan/zoom
 * 4. useMemo/useRef - Optimized React patterns
 * 5. No more 17K venue crashes!
 */

const MapContainer: React.FC<MapContainerProps> = ({
  onVenueSelect,
  userLocation,
  mapState,
  onMapStateChange,
  isDarkMode,
  mapTheme,
  locationError,
  onRetryLocation,
  onVenuesLoaded
}) => {
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const userMarkerRef = useRef<any>(null);
  
  // Store venues in ref to avoid unnecessary re-renders
  const venuesRef = useRef<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [venueCount, setVenueCount] = useState(0);
  
  // Debounce timer for map idle events
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = new google.maps.Map(mapRef.current, {
      center: userLocation || { lat: 0, lng: 0 },
      zoom: userLocation ? 12 : 2,
      styles: isDarkMode ? NIGHT_STYLE_CLEAN : DAY_STYLE_CLEAN,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    mapInstanceRef.current = map;

    // Initialize marker clusterer
    clustererRef.current = new MarkerClusterer({ map, markers: [] });

    console.log('[MapContainer] Map and clusterer initialized');

    // Add idle listener for bounding-box fetching
    map.addListener('idle', handleMapIdle);

    // Initial fetch
    fetchVenuesInCurrentBounds();

  }, []);

  // Update map center when user location changes
  useEffect(() => {
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(userLocation);
      mapInstanceRef.current.setZoom(12);
    }
  }, [userLocation]);

  // Update map theme
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setOptions({
        styles: isDarkMode ? NIGHT_STYLE_CLEAN : DAY_STYLE_CLEAN
      });
    }
  }, [isDarkMode, mapTheme]);

  /**
   * Handle map idle event (after pan/zoom)
   * Debounced to prevent excessive API calls
   */
  const handleMapIdle = useCallback(() => {
    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce for 500ms
    debounceTimerRef.current = setTimeout(() => {
      fetchVenuesInCurrentBounds();
    }, 500);
  }, []);

  /**
   * Fetch venues within current map bounds
   */
  const fetchVenuesInCurrentBounds = async () => {
    if (!mapInstanceRef.current) return;

    try {
      setIsLoading(true);
      
      const bounds = mapInstanceRef.current.getBounds();
      const zoom = mapInstanceRef.current.getZoom();
      
      if (!bounds) {
        console.warn('[MapContainer] Map bounds not available yet');
        return;
      }

      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();

      console.log(`[MapContainer] Fetching venues (zoom: ${zoom})`);

      const venues = await dataService.fetchVenuesInBounds({
        bounds: {
          north: ne.lat(),
          south: sw.lat(),
          east: ne.lng(),
          west: sw.lng()
        },
        zoomLevel: zoom,
        limit: 5000
      });

      venuesRef.current = venues;
      setVenueCount(venues.length);
      
      // Pass venues to parent component
      if (onVenuesLoaded) {
        onVenuesLoaded(venues);
      }

      // Render markers with clustering
      renderMarkersWithClustering(venues);

    } catch (error) {
      console.error('[MapContainer] Error fetching venues:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Render markers with clustering
   * Uses MarkerClusterer to group nearby venues
   */
  const renderMarkersWithClustering = (venues: Venue[]) => {
    if (!mapInstanceRef.current || !clustererRef.current) return;

    console.log(`[MapContainer] Rendering ${venues.length} venues with clustering`);

    // Clear existing markers
    clustererRef.current.clearMarkers();
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Create new markers
    const newMarkers = venues.map(venue => {
      const marker = new google.maps.Marker({
        position: { lat: venue.coordinates.lat, lng: venue.coordinates.lng },
        title: venue.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: getVibeColor(venue.vibeScore),
          fillOpacity: 0.8,
          strokeColor: '#fff',
          strokeWeight: 2
        }
      });

      // Add click listener
      marker.addListener('click', () => {
        onVenueSelect(venue);
      });

      return marker;
    });

    // Add markers to clusterer
    clustererRef.current.addMarkers(newMarkers);
    markersRef.current = newMarkers;

    console.log(`[MapContainer] ✓ ${newMarkers.length} markers added to clusterer`);
  };

  /**
   * Render user location marker
   */
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation) return;

    // Remove old user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
    }

    // Create new user marker
    const userMarker = new google.maps.Marker({
      position: userLocation,
      map: mapInstanceRef.current,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 3
      },
      zIndex: 9999
    });

    userMarkerRef.current = userMarker;
  }, [userLocation]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Loading indicator */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: 4,
          fontSize: 12
        }}>
          Loading venues...
        </div>
      )}

      {/* Venue count */}
      <div style={{
        position: 'absolute',
        bottom: 10,
        left: 10,
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '6px 10px',
        borderRadius: 4,
        fontSize: 11
      }}>
        {venueCount} venues in view
      </div>

      {/* Location error */}
      {locationError && onRetryLocation && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: 20,
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          textAlign: 'center'
        }}>
          <p style={{ margin: '0 0 10px 0', color: '#333' }}>{locationError}</p>
          <button 
            onClick={onRetryLocation}
            style={{
              background: '#FF6B35',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            Retry Access
          </button>
        </div>
      )}
    </div>
  );
};

// Map styles (simplified)
const NIGHT_STYLE_CLEAN = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
];

const DAY_STYLE_CLEAN = [
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
];

export default MapContainer;
