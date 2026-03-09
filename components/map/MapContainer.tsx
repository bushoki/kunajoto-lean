import React, { useEffect, useRef, useState } from 'react';
import { Venue, Coordinates, MapState, MapTheme } from '../../types';
import { getVibeColor } from '../../constants';

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
  onBoundsChanged?: (bounds: { north: number; south: number; east: number; west: number }, zoom: number) => void;
  hasInitiallyCentered?: boolean;
  onCenterComplete?: () => void;
  onMapReady?: (mapInstance: any) => void;
}

// --- CUSTOM MAP STYLES ---

// 1. DECLUTTERED NIGHT MODE (Dark)
const NIGHT_STYLE_CLEAN = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "poi",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }], 
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "transit",
    elementType: "labels.icon",
    stylers: [{ visibility: "on" }, { saturation: -50 }] 
  },
  {
    featureType: "transit",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }]
  },
  {
    featureType: "poi.business",
    elementType: "labels.icon",
    stylers: [{ visibility: "simplified" }, { saturation: -100 }, { lightness: -20 }] 
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];

// 2. DECLUTTERED DAY MODE (Light)
const LIGHT_STYLE_CLEAN = [
  {
    featureType: "poi",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    elementType: "labels.icon",
    stylers: [{ visibility: "on" }]
  },
  {
    featureType: "poi.business",
    elementType: "labels.icon",
    stylers: [{ visibility: "simplified" }, { saturation: -100 }] 
  }
];

// 3. KUNAJOTO DINING STYLE (Dark with orange restaurants)
// Map styling is now handled by the Map ID from GCP (VITE_GOOGLE_MAP_ID)
// The Map ID applies the Kunajoto Dining Style with dark background and orange restaurant pins
// No code-based styling needed when using Map IDs

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
  onBoundsChanged,
  hasInitiallyCentered = false,
  onCenterComplete,
  onMapReady
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const userOverlayRef = useRef<any>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [mapBoundsChanged, setMapBoundsChanged] = useState(0); // Trigger for viewport-based rendering

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

    const mapOptions: any = {
      center: mapState.center, // Restore user's last position
      zoom: mapState.zoom,
      disableDefaultUI: true, // Clean look
      clickableIcons: true, // Allow clicking transit icons
      backgroundColor: '#1a1a1a',
      minZoom: 2,
      restriction: {
        latLngBounds: { north: 85, south: -85, west: -180, east: 180 },
        strictBounds: false
      },
      // Standard View (Overhead)
      heading: 0,
      tilt: 0, // Explicitly 0
      
      // Use Map ID from GCP for Kunajoto Dining Style
      // This applies the styled map with dark background and orange restaurant pins
      mapId: (window as any).__GOOGLE_MAP_ID__ || undefined,
      
      // Force dark mode as the default style for all users
      // ColorScheme.DARK ensures the dark style associated with the Map ID is used
      colorScheme: 'DARK',
      
      // Gesture handling
      gestureHandling: 'cooperative'
    };

    const map = new google.maps.Map(mapRef.current, mapOptions);
    googleMapRef.current = map;
    // Notify parent that map is ready with the map instance
    if (onMapReady) onMapReady(map);

    // Listeners
    map.addListener('idle', () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      const bounds = map.getBounds();
      
      if (center && zoom) {
        onMapStateChange({
          center: { lat: center.lat(), lng: center.lng() },
          zoom: zoom
        });
      }
      
      // Notify parent of bounds change for bounding-box fetching
      if (bounds && zoom && onBoundsChanged) {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        onBoundsChanged(
          {
            north: ne.lat(),
            south: sw.lat(),
            east: ne.lng(),
            west: sw.lng()
          },
          zoom
        );
      }
      
      // Trigger marker re-render when map bounds change
      // This will update visible venues based on new viewport
      setMapBoundsChanged(prev => prev + 1);
    });

  }, []);

  // Theme Handling
  useEffect(() => {
    if (!googleMapRef.current) return;

    let resolvedTheme = mapTheme;
    if (mapTheme === MapTheme.AUTO) {
        const hour = new Date().getHours();
        resolvedTheme = (hour >= 18 || hour < 6) ? MapTheme.DARK : MapTheme.LIGHT;
    }

    const map = googleMapRef.current;

    if (resolvedTheme === MapTheme.SATELLITE) {
      map.setMapTypeId('satellite');
      map.setOptions({ styles: [] });
    } else {
      map.setMapTypeId('roadmap');
    }

  }, [mapTheme]);

  // Centering Logic - Only on Initial Load (persists across tab switches)
  useEffect(() => {
    if (!googleMapRef.current || !userLocation || hasInitiallyCentered) return;

    console.log('[MapContainer] Initial centering on user location');
    googleMapRef.current.panTo({ lat: userLocation.lat, lng: userLocation.lng });
    googleMapRef.current.setZoom(15);
    
    // Notify parent that initial centering is complete
    if (onCenterComplete) {
      onCenterComplete();
    }
  }, [userLocation, hasInitiallyCentered, onCenterComplete]);

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

    // 2. Venue Markers (Viewport Filtering to prevent browser crash)
    // Get current map bounds
    let visibleVenues: Venue[] = [];
    
    try {
      const bounds = map.getBounds();
      if (bounds && venues.length > 0) {
        visibleVenues = venues.filter(venue => {
          try {
            const lat = venue.coordinates?.lat;
            const lng = venue.coordinates?.lng;
            if (lat === undefined || lng === undefined) return false;
            return bounds.contains(new google.maps.LatLng(lat, lng));
          } catch (e) {
            return false;
          }
        });
        console.log(`[MapContainer] Rendering ${visibleVenues.length} of ${venues.length} venues in viewport`);
      } else {
        // Map not ready yet, don't render any venues
        console.log('[MapContainer] Map bounds not available yet, skipping venue render');
      }
    } catch (error) {
      console.error('[MapContainer] Error filtering venues:', error);
    }
    
    visibleVenues.forEach(venue => {
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

  }, [venues, userLocation, mapBoundsChanged]); // Re-render when viewport changes

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
               <p className="text-sm text-gray-500 text-center max-w-[220px] mb-6">Connecting to satellites for precision forecasting.</p>
               
               {locationError && (
                  <div className="bg-red-50 border border-red-100 text-red-500 text-xs font-bold px-3 py-2 rounded-lg mb-4 flex items-center gap-2 max-w-[250px]">
                     <i className="fa-solid fa-triangle-exclamation"></i>
                     {locationError}
                  </div>
               )}

               <button 
                 onClick={onRetryLocation}
                 className="bg-dark text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg active:scale-95 transition flex items-center gap-2"
               >
                 <i className="fa-solid fa-rotate-right"></i>
                 {locationError ? 'Retry Access' : 'Searching...'}
               </button>
            </div>
         </div>
      )}

      {/* Controls */}
      {userLocation && (
        <div className="absolute bottom-24 right-4 flex flex-col gap-2 z-[400] animate-in slide-in-from-bottom-4 duration-500">
            <button 
            onClick={() => setShowLegend(!showLegend)}
            className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-dark hover:text-primary border border-gray-100"
            >
            <i className="fa-solid fa-circle-info"></i>
            </button>

            <button 
            onClick={handleRecenter}
            className="w-10 h-10 bg-white text-gray-600 rounded-full shadow-lg flex items-center justify-center border border-gray-100 hover:text-primary"
            title="Recenter"
            >
            <i className="fa-solid fa-location-crosshairs"></i>
            </button>
        </div>
      )}

      {/* Legend Modal */}
      {showLegend && (
        <div className="absolute bottom-36 right-4 bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-gray-200 p-4 w-48 z-[401] animate-in slide-in-from-right-5">
           <div className="flex justify-between items-center mb-3">
             <h4 className="font-bold text-xs uppercase text-gray-500">Vibe Legend</h4>
             <button onClick={() => setShowLegend(false)}><i className="fa-solid fa-xmark text-gray-400"></i></button>
           </div>
           <div className="space-y-2">
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-[#EF4444]"></div>
               <span className="text-xs font-bold text-dark">Hot (9.0+)</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-[#EAB308]"></div>
               <span className="text-xs font-bold text-dark">Popping (7.0-8.9)</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-[#22C55E]"></div>
               <span className="text-xs font-bold text-dark">Warming (4.0-6.9)</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-[#3B82F6]"></div>
               <span className="text-xs font-bold text-dark">Dead (0-3.9)</span>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MapContainer;