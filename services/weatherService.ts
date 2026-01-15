/**
 * Weather Service
 * Integrates with WeatherAPI.com to fetch current weather data
 * Used in vibe score calculation (Factor #3)
 */

interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  description: string;
  main: string;
  wind_speed: number;
  timestamp: number;
}

interface WeatherCache {
  [city: string]: {
    data: WeatherData;
    expires: number;
  };
}

const weatherCache: WeatherCache = {};
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// WeatherAPI.com API key
const API_KEY = '978da3235af14cc4a70211341251212';

export const weatherService = {
  /**
   * Get current weather for a city
   * Uses cache to avoid excessive API calls
   */
  getCurrentWeather: async (city: string): Promise<WeatherData | null> => {
    try {
      // Check cache first
      const cached = weatherCache[city];
      if (cached && cached.expires > Date.now()) {
        console.log(`[WeatherService] Using cached weather for ${city}`);
        return cached.data;
      }

      // Fetch from API
      console.log(`[WeatherService] Fetching weather for ${city}...`);
      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${encodeURIComponent(city)}&aqi=no`
      );

      if (!response.ok) {
        console.error(`[WeatherService] API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      const weatherData: WeatherData = {
        temp: data.current.temp_c,
        feels_like: data.current.feelslike_c,
        humidity: data.current.humidity,
        description: data.current.condition.text,
        main: data.current.condition.text,
        wind_speed: data.current.wind_kph,
        timestamp: Date.now()
      };

      // Cache the result
      weatherCache[city] = {
        data: weatherData,
        expires: Date.now() + CACHE_DURATION
      };

      console.log(`[WeatherService] Weather for ${city}:`, weatherData);
      return weatherData;
    } catch (error) {
      console.error(`[WeatherService] Error fetching weather for ${city}:`, error);
      return null;
    }
  },

  /**
   * Calculate weather impact on vibe score
   * Returns a modifier between -20 and +10
   */
  getWeatherImpact: (weather: WeatherData | null): number => {
    if (!weather) return 0;

    let impact = 0;

    // Main weather condition impact
    const condition = weather.main.toLowerCase();
    if (condition.includes('clear') || condition.includes('sunny')) {
      impact += 10;
    } else if (condition.includes('cloud') || condition.includes('partly')) {
      impact += 5;
    } else if (condition.includes('rain') || condition.includes('drizzle')) {
      impact -= 15;
    } else if (condition.includes('storm') || condition.includes('thunder')) {
      impact -= 20;
    } else if (condition.includes('snow')) {
      impact -= 10;
    } else if (condition.includes('mist') || condition.includes('fog')) {
      impact -= 5;
    }

    // Temperature impact (optimal range: 15-25°C)
    if (weather.temp < 10) {
      impact -= 5;
    } else if (weather.temp > 30) {
      impact -= 5;
    } else if (weather.temp >= 15 && weather.temp <= 25) {
      impact += 5;
    }

    // Wind impact
    if (weather.wind_speed > 30) {
      impact -= 5;
    }

    return Math.max(-20, Math.min(10, impact));
  },

  /**
   * Get weather emoji for display
   */
  getWeatherEmoji: (weather: WeatherData | null): string => {
    if (!weather) return '🌡️';

    const condition = weather.main.toLowerCase();
    if (condition.includes('clear') || condition.includes('sunny')) {
      return '☀️';
    } else if (condition.includes('cloud')) {
      return '☁️';
    } else if (condition.includes('rain') || condition.includes('drizzle')) {
      return '🌧️';
    } else if (condition.includes('storm') || condition.includes('thunder')) {
      return '⛈️';
    } else if (condition.includes('snow')) {
      return '❄️';
    } else if (condition.includes('mist') || condition.includes('fog')) {
      return '🌫️';
    }
    return '🌡️';
  }
};
