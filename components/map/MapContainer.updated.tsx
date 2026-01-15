/**
 * MapContainer.tsx - Updated with Custom Styling Support
 * 
 * This is an updated version showing how to integrate the custom Kunajoto
 * dining-focused styling. Replace the existing MapContainer.tsx with this
 * version to enable advanced Google Maps Platform styling.
 * 
 * Key Changes:
 * - Import styling from styles/mapStyles.ts
 * - Support for both legacy and advanced styling
 * - Environment variable support for Map ID
 * - Toggle between styling modes
 */

import React, { useEffect, useRef, useState } from 'react';
import { Venue, Coordinates, MapState, MapTheme } from '../../types';
import { getVibeColor } from '../../constants';
import { NIGHT_STYLE_CLEAN, LIGHT_STYLE_CLEAN, KUNAJOTO_DINING_STYLE } from '../../styles/mapStyles';

// Declare google global to avoid namespace errors
declare var google: any;

interface MapContainerProps {
  venues: Venue[];
  onVenueSelect: (venue: Venue) => void;
  userLocation: Coordinates | null;
  mapState: MapState;
  onMapStateChange: (newState: MapState) => void;
  isDarkMode: boolean;
  mapTheme: MapTheme;
  locationError?: string | null;
  onRetryLocation?: () => void;
  useAdvancedStyling?: boolean; // NEW: Toggle advanced styling
}

const MapContainer: React.FC<MapContainerProps> = ({ 
  venues, 
  onVenueSelect, 
  userLocation, 
  mapState, 
  onMapStateChange,
  isDarkMode,
  mapTheme,
  locationError,
  onRetryLocation,
  useAdvancedStyling = false, // NEW: Default to legacy styling
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const userOverlayRef = useRef<any>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [hasCentered, setHasCentered] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current) return;
    if (googleMapRef.current) return;

    // Define Custom Overlay Class inside effect to ensure Google is loaded
    class CustomOverlay extends google.maps.OverlayView {
      position: any;
      content: HTMLElement;
      
      constructor(position: any, content: HTMLElement) {
        super();
        this.position = position;
        this.content = content;
      }

      onAdd() {
        const panes = (this as any).getPanes();
        if (panes) {
          panes.overlayMouseTarget.appendChild(this.content);
        }
      }

      draw() {
        const overlayProjection = (this as any).getProjection();
        if (!overlayProjection) return;
        
        const point = overlayProjection.fromLatLngToDivPixel(this.position);
        if (point) {
          this.content.style.left = point.x + 'px';
          this.content.style.top = point.y + 'px';
        }
      }

      onRemove() {
        if (this.content.parentElement) {
          this.content.parentElement.removeChild(this.content);
        }
      }
    }
    
    (window as any).CustomOverlay = CustomOverlay;

    // NEW: Get Map ID from environment or use null for legacy styling
    const mapId = useAdvancedStyling 
      ? import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'bafb83d9370faed262e75c52'
      : undefined;

    const mapOptions: any = {
      center: { lat: 20, lng: 0 }, // World View
      zoom: 2,
      disableDefaultUI: true, // Clean look
      clickableIcons: true, // Allow clicking transit icons
      backgroundColor: useAdvancedStyling ? '#ff8547' : '#f3f4f6', // NEW: Orange for advanced styling
      minZoom: 2,
      restriction: {
        latLngBounds: { north: 85, south: -85, west: -180, east: 180 },
        strictBounds: false
      },
      // Standard View (Overhead)
      heading: 0,
      tilt: 0, // Explicitly 0
      
      // FIX: Enable Vector Map Features (Tilt/Rotate)
      renderingType: google.maps.RenderingType.VECTOR,
      gestureHandling: 'cooperative', // Recommended for mobile rotate/tilt
      rotateControl: true, // Optional UI button

      // NEW: Conditional Map ID and Styles
      ...(useAdvancedStyling && mapId ? { mapId } : {}),
      styles: useAdvancedStyling ? [] : NIGHT_STYLE_CLEAN, // NEW: Empty styles for advanced, use legacy for standard
    };

    const map = new google.maps.Map(mapRef.current, mapOptions);
    googleMapRef.current = map;

    // Listeners
    map.addListener('idle', () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      if (center && zoom) {
        onMapStateChange({
          center: { lat: center.lat(), lng: center.lng() },
          zoom: zoom
        });
      }
    });

  }, [useAdvancedStyling]);

  // Theme Handling
  useEffect(() => {
    if (!googleMapRef.current) return;

    let resolvedTheme = mapTheme;
    if (mapTheme === MapTheme.AUTO) {
        const hour = new Date().getHours();
        resolvedTheme = (hour >= 18 || hour < 6) ? MapTheme.DARK : MapTheme.LIGHT;
    }

    const map = googleMapRef.current;

    // NEW: Skip style updates if using advanced styling with Map ID
    if (useAdvancedStyling && import.meta.env.VITE_GOOGLE_MAPS_MAP_ID) {
      console.log('Using advanced Google Maps Platform styling - theme changes handled by Map ID');
      return;
    }

    if (resolvedTheme === MapTheme.SATELLITE) {
      map.setMapTypeId('satellite');
      map.setOptions({ styles: [] });
    } else if (resolvedTheme === MapTheme.DARK) {
      map.setMapTypeId('roadmap');
      map.setOptions({ styles: NIGHT_STYLE_CLEAN });
    } else {
      map.setMapTypeId('roadmap');
      map.setOptions({ styles: LIGHT_STYLE_CLEAN }); 
    }

  }, [mapTheme, useAdvancedStyling]);

  // Centering Logic - Strict on First Load
  useEffect(() => {
    if (!googleMapRef.current || !userLocation || hasCentered) return;

    googleMapRef.current.panTo({ lat: userLocation.lat, lng: userLocation.lng });
    googleMapRef.current.setZoom(15);
    setHasCentered(true);
  }, [userLocation, hasCentered]);

  // Render Markers (Venues + User)
  useEffect(() => {
    if (!googleMapRef.current) return;
    const map = googleMapRef.current;
    const CustomOverlay = (window as any).CustomOverlay;

    if (!CustomOverlay) return;

    // Clear existing
    overlaysRef.current.forEach(o => o.setMap(null));
    overlaysRef.current = [];
    if (userOverlayRef.current) userOverlayRef.current.setMap(null);

    // 1. User Marker (Breathing Purple Dot - Robust CSS)
    if (userLocation) {
       const userDiv = document.createElement('div');
       userDiv.className = 'user-pin-container';
       // Note: CSS classes handle the purple color now
       userDiv.innerHTML = `<div class="user-pin-glow"></div><div class="user-pin-dot"></div>`;
       
       const userOverlay = new CustomOverlay(
         new google.maps.LatLng(userLocation.lat, userLocation.lng),
         userDiv
       );
       userOverlay.setMap(map);
       userOverlayRef.current = userOverlay;
    }

    // 2. Venue Markers
    venues.forEach(venue => {
       const color = getVibeColor(venue.vibeScore);
       const scoreDisplay = (venue.vibeScore / 10).toFixed(1);
       
       const div = document.createElement('div');
       div.className = 'venue-marker-container group';
       // Added venue-pulse-ring for pulsating effect in specific color
       div.innerHTML = `
         <div class="venue-pulse-ring" style="background-color: ${color};"></div>
         <div class="relative flex items-center justify-center w-9 h-9 rounded-full shadow-md border-2 border-white transform transition hover:scale-110 z-10" style="background-color: ${color};">
            <span class="text-[11px] font-black text-white font-sans">${scoreDisplay}</span>
         </div>
         <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/90 backdrop-blur text-white text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity font-bold z-[500] shadow-xl border border-white/10">${venue.name}</div>
       `;
       
       div.addEventListener('click', (e) => {
         e.stopPropagation(); // Prevent map click
         onVenueSelect(venue);
       });

       const overlay = new CustomOverlay(
         new google.maps.LatLng(venue.coordinates.lat, venue.coordinates.lng),
         div
       );
       overlay.setMap(map);
       overlaysRef.current.push(overlay);
    });

  }, [venues, userLocation]);

  const handleRecenter = () => {
    if (userLocation && googleMapRef.current) {
        googleMapRef.current.panTo({ lat: userLocation.lat, lng: userLocation.lng });
        googleMapRef.current.setZoom(15);
    } else if (onRetryLocation) {
        onRetryLocation();
    }
  };

  return (
    <div className="w-full h-full relative bg-gray-100">
      <div ref={mapRef} className="w-full h-full z-0" />
      
      {/* Blocking Overlay (Until Location Found) */}
      {!userLocation && (
         <div className="absolute inset-0 z-[500] bg-gray-50/95 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-300 border border-white/50">
               <div className="w-16 h-16 rounded-full bg-orange-50 text-primary flex items-center justify-center mb-4 shadow-inner relative">
                  <i className="fa-solid fa-location-crosshairs text-2xl animate-pulse"></i>
                  <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-ping"></div>
               </div>
               <h2 className="text-xl font-black text-dark mb-2">Locating Your Vibe...</h2>
               <p className="text-gray-500 text-sm mb-4">Finding the best spots near you</p>
               {locationError && (
                  <div className="text-red-500 text-xs mb-3 text-center max-w-xs">
                     {locationError}
                  </div>
               )}
               {onRetryLocation && (
                  <button 
                     onClick={onRetryLocation}
                     className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition"
                  >
                     Retry Location
                  </button>
               )}
            </div>
         </div>
      )}

      {/* Legend Toggle */}
      <button 
         onClick={() => setShowLegend(!showLegend)}
         className="absolute bottom-6 right-6 z-[400] bg-white rounded-lg shadow-lg p-3 hover:shadow-xl transition"
         title="Toggle legend"
      >
         <i className="fa-solid fa-layer-group text-gray-700"></i>
      </button>

      {/* Legend */}
      {showLegend && (
         <div className="absolute bottom-20 right-6 z-[400] bg-white rounded-lg shadow-xl p-4 max-w-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
            <h3 className="font-bold text-sm mb-3 text-gray-900">Vibe Score Legend</h3>
            <div className="space-y-2">
               <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{backgroundColor: '#ef4444'}}></div>
                  <span className="text-xs text-gray-700">Low Vibe (0-40)</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{backgroundColor: '#f97316'}}></div>
                  <span className="text-xs text-gray-700">Medium Vibe (40-70)</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{backgroundColor: '#22c55e'}}></div>
                  <span className="text-xs text-gray-700">High Vibe (70-90)</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{backgroundColor: '#3b82f6'}}></div>
                  <span className="text-xs text-gray-700">Hot Vibe (90-100)</span>
               </div>
               <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-xs text-gray-700">Your Location</span>
               </div>
            </div>
         </div>
      )}

      {/* Recenter Button */}
      {userLocation && (
         <button 
            onClick={handleRecenter}
            className="absolute bottom-6 left-6 z-[400] bg-white rounded-lg shadow-lg p-3 hover:shadow-xl transition"
            title="Recenter map on your location"
         >
            <i className="fa-solid fa-location-dot text-primary"></i>
         </button>
      )}
    </div>
  );
};

export default MapContainer;
