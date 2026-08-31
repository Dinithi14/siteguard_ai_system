/**
 * Open-Meteo API utility for SiteGuard AI.
 * No API Key required.
 */

// Mapping standard WMO weather codes to our AI categories
const mapWMOCodeToSiteGuardCategory = (code) => {
  // 0-3: Clear / Partly Cloudy
  if (code <= 3) return 'Clear';
  
  // 51-67, 80-82: Drizzle, Rain, Rain Showers
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'Rainy';
  
  // 95-99: Thunderstorms, heavy hail
  if (code >= 95) return 'Monsoon';
  
  // Fallback for snow/fog or anything else
  return 'Clear'; 
};

/**
 * Searches for a location using Open-Meteo Geocoding API.
 * @param {string} query Search term (e.g. "Colombo")
 * @returns {Promise<Array>} Array of location objects with name, lat, lon, country, admin1, etc.
 */
export const searchLocation = async (query) => {
  if (!query || query.length < 2) return [];

  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();
    
    if (!geoData.results) return [];
    return geoData.results;
  } catch (err) {
    console.error("Location search failed:", err);
    return [];
  }
};

/**
 * Fetches the current weather exactly by latitude and longitude.
 * @returns {Promise<{status: string, category: string}>}
 */
export const getWeatherByCoordinates = async (latitude, longitude) => {
  if (latitude === null || longitude === null || latitude === undefined || longitude === undefined) {
    return { status: 'error', category: 'Clear' };
  }

  try {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
    const weatherRes = await fetch(weatherUrl);
    
    if (!weatherRes.ok) {
      return { status: 'error', category: 'Clear' };
    }

    const weatherData = await weatherRes.json();
    
    if (!weatherData.current_weather) {
      return { status: 'error', category: 'Clear' };
    }

    const wmoCode = weatherData.current_weather.weathercode;
    return { 
      status: 'success', 
      category: mapWMOCodeToSiteGuardCategory(wmoCode) 
    };

  } catch (err) {
    console.error("Weather API error by coordinates:", err);
    return { status: 'error', category: 'Clear' };
  }
};

/**
 * Legacy: Fetches the current weather for a given location string.
 * Used as a fallback if coordinates are missing.
 */
export const getLiveWeatherForLocation = async (locationStr) => {
  if (!locationStr) return { status: 'error', category: 'Clear' };

  try {
    const searchStr = locationStr.split(',')[0].trim();
    const results = await searchLocation(searchStr);
    
    if (results.length === 0) {
      return { status: 'error', category: 'Clear' };
    }
    
    const { latitude, longitude } = results[0];
    return await getWeatherByCoordinates(latitude, longitude);

  } catch (err) {
    console.error("Legacy Weather API error:", err);
    return { status: 'error', category: 'Clear' };
  }
};
