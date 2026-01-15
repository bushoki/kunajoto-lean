/**
 * Map Styling Configuration for Kunajoto
 * 
 * This file contains Google Maps styling configurations including:
 * - Legacy Google Maps JavaScript API styles (for backward compatibility)
 * - Advanced Google Maps Platform styles (feature-based styling)
 * - Custom theme configurations
 */

// ============================================================================
// LEGACY GOOGLE MAPS JAVASCRIPT API STYLES (Backward Compatible)
// ============================================================================

/**
 * Clean Night Mode Style - Decluttered dark theme
 * Used for dark mode map display
 */
export const NIGHT_STYLE_CLEAN = [
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
    stylers: [{ visibility: "on" }, { saturation: -50 }],
  },
  {
    featureType: "transit",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "poi.business",
    elementType: "labels.icon",
    stylers: [{ visibility: "simplified" }, { saturation: -100 }, { lightness: -20 }],
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

/**
 * Clean Light Mode Style - Decluttered light theme
 * Used for light mode map display
 */
export const LIGHT_STYLE_CLEAN = [
  {
    featureType: "poi",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    elementType: "labels.icon",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "poi.business",
    elementType: "labels.icon",
    stylers: [{ visibility: "simplified" }, { saturation: -100 }],
  },
];

// ============================================================================
// ADVANCED GOOGLE MAPS PLATFORM STYLES (Feature-Based Styling)
// ============================================================================

/**
 * Custom Kunajoto Dining-Focused Style
 * 
 * This style configuration emphasizes food and dining venues with a warm
 * orange/coral color palette (#ff8547, #ff6a35, #ff6a00).
 * 
 * Features:
 * - Monochrome dark theme with orange accents
 * - Highlights restaurants, bars, cafes, and wineries
 * - Hides non-essential POIs (retail, services, government)
 * - Shows landmarks for navigation reference
 * - Emphasizes beaches and recreation areas
 * 
 * Usage: Use with Google Maps Platform API (mapId required)
 */
export const KUNAJOTO_DINING_STYLE = {
  monochrome: true,
  variant: "dark",
  backgroundColor: "#ff8547",
  styles: [
    // Hide road network labels
    {
      id: "infrastructure.roadNetwork.noTraffic",
      geometry: {
        visible: false,
      },
      label: {
        visible: false,
      },
    },
    // Entertainment POIs - Hide most
    {
      id: "pointOfInterest.entertainment.arts",
      label: {
        visible: false,
      },
    },
    {
      id: "pointOfInterest.entertainment.casino",
      label: {
        pinFillColor: "#ff8647",
      },
    },
    {
      id: "pointOfInterest.entertainment.cinema",
      label: {
        visible: false,
      },
    },
    {
      id: "pointOfInterest.entertainment.historic",
      label: {
        visible: false,
      },
    },
    {
      id: "pointOfInterest.entertainment.museum",
      label: {
        visible: false,
      },
    },
    {
      id: "pointOfInterest.entertainment.themePark",
      label: {
        visible: false,
      },
    },
    {
      id: "pointOfInterest.entertainment.touristAttraction",
      label: {
        visible: false,
      },
    },
    // Food & Drink POIs - Highlight with warm colors
    {
      id: "pointOfInterest.foodAndDrink.bar",
      label: {
        pinFillColor: "#ff6a35",
      },
    },
    {
      id: "pointOfInterest.foodAndDrink.cafe",
      label: {
        pinFillColor: "#ff6a00",
      },
    },
    {
      id: "pointOfInterest.foodAndDrink.restaurant",
      label: {
        pinFillColor: "#ff8647",
      },
    },
    {
      id: "pointOfInterest.foodAndDrink.winery",
      label: {
        pinFillColor: "#ff8647",
      },
    },
    // Landmarks - Show for navigation
    {
      id: "pointOfInterest.landmark",
      label: {
        visible: true,
      },
    },
    // Lodging - Hide
    {
      id: "pointOfInterest.lodging",
      label: {
        visible: false,
      },
    },
    // Other POIs - Hide most
    {
      id: "pointOfInterest.other",
      geometry: {
        visible: false,
      },
      label: {
        visible: false,
      },
    },
    {
      id: "pointOfInterest.other.cemetery",
      geometry: {
        visible: false,
      },
      label: {
        visible: false,
      },
    },
    {
      id: "pointOfInterest.other.government",
      label: {
        visible: false,
      },
    },
    {
      id: "pointOfInterest.other.library",
      label: {
        visible: false,
      },
    },
    {
      id: "pointOfInterest.other.military",
      geometry: {
        visible: false,
      },
      label: {
        visible: false,
      },
    },
    {
      id: "pointOfInterest.other.placeOfWorship",
      label: {
        visible: false,
      },
    },
    {
      id: "pointOfInterest.other.school",
      label: {
        visible: false,
      },
    },
    {
      id: "pointOfInterest.other.townSquare",
      label: {
        visible: false,
      },
    },
    // Recreation - Hide most except beaches
    {
      id: "pointOfInterest.recreation",
      geometry: {
        visible: false,
      },
      label: {
        visible: false,
      },
    },
    {
      id: "pointOfInterest.recreation.beach",
      geometry: {
        fillOpacity: 1,
        fillColor: "#ff8647",
      },
    },
    {
      id: "pointOfInterest.recreation.boating",
      label: {
        visible: false,
      },
    },
    {
      id: "pointOfInterest.recreation.fishing",
      label: {
        visible: false,
      },
    },
    {
      id: "pointOfInterest.recreation.golfCourse",
      geometry: {
        visible: false,
      },
    },
    {
      id: "pointOfInterest.recreation.hotSpring",
      label: {
        visible: false,
      },
    },
    {
      id: "pointOfInterest.recreation.natureReserve",
      geometry: {
        visible: false,
      },
    },
    {
      id: "pointOfInterest.recreation.park",
      geometry: {
        visible: false,
      },
    },
    {
      id: "pointOfInterest.recreation.peak",
      label: {
        visible: false,
      },
    },
    {
      id: "pointOfInterest.recreation.sportsComplex",
      geometry: {
        visible: false,
      },
      label: {
        visible: false,
      },
    },
    {
      id: "pointOfInterest.recreation.sportsField",
      geometry: {
        visible: false,
      },
    },
    {
      id: "pointOfInterest.recreation.trailhead",
      label: {
        visible: false,
      },
    },
    {
      id: "pointOfInterest.recreation.zoo",
      geometry: {
        visible: false,
      },
    },
    // Retail - Hide
    {
      id: "pointOfInterest.retail",
      label: {
        visible: false,
      },
    },
    {
      id: "pointOfInterest.retail.grocery",
      label: {
        visible: false,
      },
    },
    {
      id: "pointOfInterest.retail.shopping",
      label: {
        visible: false,
      },
    },
    // Services - Hide
    {
      id: "pointOfInterest.service",
      geometry: {
        visible: false,
      },
      label: {
        visible: false,
      },
    },
    {
      id: "pointOfInterest.service.atm",
      label: {
        visible: false,
      },
    },
    {
      id: "pointOfInterest.service.bank",
      label: {
        visible: false,
      },
    },
    {
      id: "pointOfInterest.service.carRental",
      label: {
        visible: false,
      },
    },
    {
      id: "pointOfInterest.service.evCharging",
      label: {
        visible: false,
      },
    },
    {
      id: "pointOfInterest.service.gasStation",
      label: {
        visible: false,
      },
    },
    {
      id: "pointOfInterest.service.parkingLot",
      geometry: {
        visible: false,
      },
      label: {
        visible: false,
      },
    },
    {
      id: "pointOfInterest.service.postOffice",
      label: {
        visible: false,
      },
    },
    {
      id: "pointOfInterest.service.restroom",
      label: {
        visible: false,
      },
    },
    {
      id: "pointOfInterest.service.restStop",
      label: {
        visible: false,
      },
    },
    // Political boundaries - Hide
    {
      id: "political.reservation",
      geometry: {
        visible: false,
      },
    },
    {
      id: "political.sublocality",
      label: {
        visible: false,
      },
    },
  ],
};

// ============================================================================
// STYLE SELECTOR UTILITY
// ============================================================================

/**
 * Converts advanced Google Maps Platform styles to legacy format
 * This allows using the feature-based styling with older Maps API
 * 
 * Note: This is a simplified conversion. For full feature support,
 * use the Google Maps Platform API with mapId
 */
export function convertPlatformStylesToLegacy(platformStyles: any): any[] {
  // This is a placeholder for conversion logic
  // In production, you would map feature IDs to legacy element types
  return [];
}

/**
 * Get the appropriate map style based on theme preference
 */
export function getMapStyle(isDarkMode: boolean, useAdvancedStyling: boolean = false) {
  if (useAdvancedStyling) {
    return KUNAJOTO_DINING_STYLE;
  }
  return isDarkMode ? NIGHT_STYLE_CLEAN : LIGHT_STYLE_CLEAN;
}
