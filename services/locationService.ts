/**
 * Location Service - Kunajoto Lean
 * Handles geolocation, city detection, and location-based access control
 */

export const TARGET_CITIES = [
  'London',
  'Johannesburg',
  'Cape Town',
  'Los Angeles',
  'Austin',
  'New York City',
  'New York',  // Alias for NYC
  'Nairobi',
  'Kinshasa'
];

export interface LocationData {
  city: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  isTargetCity: boolean;
}

/**
 * Get user's current location using browser geolocation API
 */
export async function getCurrentLocation(): Promise<LocationData | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error('[LocationService] Geolocation not supported');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocode to get city name
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
          );
          
          const data = await response.json();
          
          if (data.results && data.results.length > 0) {
            const addressComponents = data.results[0].address_components;
            
            // Find city component
            const cityComponent = addressComponents.find((c: any) =>
              c.types.includes('locality') || c.types.includes('administrative_area_level_1')
            );
            
            // Find country component
            const countryComponent = addressComponents.find((c: any) =>
              c.types.includes('country')
            );
            
            const city = cityComponent ? cityComponent.long_name : 'Unknown';
            const country = countryComponent ? countryComponent.long_name : 'Unknown';
            
            const isTargetCity = isLocationInTargetCities(city);
            
            resolve({
              city,
              country,
              coordinates: { lat: latitude, lng: longitude },
              isTargetCity
            });
          } else {
            resolve(null);
          }
        } catch (error) {
          console.error('[LocationService] Geocoding error:', error);
          resolve(null);
        }
      },
      (error) => {
        console.error('[LocationService] Geolocation error:', error);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes cache
      }
    );
  });
}

/**
 * Check if a city name matches any of the target cities
 */
export function isLocationInTargetCities(cityName: string): boolean {
  const normalized = cityName.toLowerCase().trim();
  
  return TARGET_CITIES.some(targetCity => {
    const targetNormalized = targetCity.toLowerCase().trim();
    
    // Exact match
    if (normalized === targetNormalized) return true;
    
    // Partial match (e.g., "New York" matches "New York City")
    if (normalized.includes(targetNormalized) || targetNormalized.includes(normalized)) {
      return true;
    }
    
    return false;
  });
}

/**
 * Normalize city name to match target city format
 */
export function normalizeCityName(cityName: string): string {
  const normalized = cityName.toLowerCase().trim();
  
  // Special cases
  if (normalized.includes('new york') || normalized === 'nyc') {
    return 'New York City';
  }
  
  if (normalized.includes('los angeles') || normalized === 'la') {
    return 'Los Angeles';
  }
  
  if (normalized.includes('cape town')) {
    return 'Cape Town';
  }
  
  if (normalized.includes('johannesburg') || normalized === 'joburg' || normalized === 'jozi') {
    return 'Johannesburg';
  }
  
  // Return original if no special case
  return TARGET_CITIES.find(city => 
    city.toLowerCase() === normalized
  ) || cityName;
}

/**
 * Get selected city from localStorage
 */
export function getSelectedCity(): string | null {
  return localStorage.getItem('kunajoto_selected_city');
}

/**
 * Set selected city in localStorage
 */
export function setSelectedCity(city: string): void {
  localStorage.setItem('kunajoto_selected_city', city);
}

/**
 * Clear selected city from localStorage
 */
export function clearSelectedCity(): void {
  localStorage.removeItem('kunajoto_selected_city');
}

/**
 * Get the active city (selected or detected)
 */
export async function getActiveCity(): Promise<{
  city: string;
  source: 'manual' | 'detected' | 'default';
  isTargetCity: boolean;
}> {
  // Check for manually selected city first
  const selectedCity = getSelectedCity();
  if (selectedCity) {
    return {
      city: selectedCity,
      source: 'manual',
      isTargetCity: isLocationInTargetCities(selectedCity)
    };
  }
  
  // Try to detect location
  const location = await getCurrentLocation();
  if (location && location.isTargetCity) {
    return {
      city: normalizeCityName(location.city),
      source: 'detected',
      isTargetCity: true
    };
  }
  
  // Default to first target city if detection fails or not in target city
  return {
    city: TARGET_CITIES[0],
    source: 'default',
    isTargetCity: false
  };
}
