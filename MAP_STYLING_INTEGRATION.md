# Google Maps Styling Integration Guide

## Overview

This document explains how to integrate the custom Kunajoto dining-focused Google Maps styling into the application. The styling emphasizes food and dining venues with a warm orange/coral color palette.

## Current State

The application currently uses **Google Maps JavaScript API** with legacy styling arrays defined in `components/map/MapContainer.tsx`:
- `NIGHT_STYLE_CLEAN` - Dark theme
- `LIGHT_STYLE_CLEAN` - Light theme

## New Styling System

A new styling configuration file has been created at `styles/mapStyles.ts` that includes:

### 1. Legacy Styles (Backward Compatible)
- `NIGHT_STYLE_CLEAN` - Existing dark theme
- `LIGHT_STYLE_CLEAN` - Existing light theme

### 2. Advanced Google Maps Platform Styles
- `KUNAJOTO_DINING_STYLE` - Feature-based styling with dining focus

## Implementation Options

### Option A: Use Advanced Styling with Google Maps Platform (Recommended)

**Requirements:**
- Google Maps Platform API key
- Map ID created in Google Cloud Console
- Enable "Maps JavaScript API" and "Maps Static API"

**Steps:**

1. **Update MapContainer.tsx** to use the advanced styling:

```typescript
import { KUNAJOTO_DINING_STYLE } from '../../styles/mapStyles';

const mapOptions: any = {
  center: { lat: 20, lng: 0 },
  zoom: 2,
  disableDefaultUI: true,
  clickableIcons: true,
  backgroundColor: '#ff8547',
  minZoom: 2,
  renderingType: google.maps.RenderingType.VECTOR,
  mapId: 'YOUR_MAP_ID_HERE', // Replace with your actual Map ID
  gestureHandling: 'cooperative',
  rotateControl: true,
  // For advanced styling, don't set styles array - use mapId instead
};
```

2. **Configure Map ID in Google Cloud Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to Maps > Map Styles
   - Create a new map style
   - Copy the provided JSON configuration from `KUNAJOTO_DINING_STYLE`
   - Save and note the Map ID

3. **Update Environment Variables:**

Create or update `.env.local`:
```
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
VITE_GOOGLE_MAPS_MAP_ID=your_map_id_here
```

4. **Load Map ID Dynamically:**

```typescript
const mapOptions: any = {
  // ... other options
  mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
};
```

### Option B: Use Legacy Styling (Current Approach)

Continue using the existing `NIGHT_STYLE_CLEAN` and `LIGHT_STYLE_CLEAN` arrays in MapContainer.tsx.

**Advantages:**
- No additional configuration needed
- Works with existing API key
- Immediate implementation

**Disadvantages:**
- Limited styling capabilities
- Cannot use feature-based styling
- Less granular control over POI visibility

## Styling Features Explained

### Color Palette
- **Primary Orange**: `#ff8547` - Main accent color
- **Warm Orange**: `#ff6a35` - Secondary accent
- **Deep Orange**: `#ff6a00` - Tertiary accent
- **Dark Background**: Monochrome dark theme

### Featured Elements
- **Restaurants**: `#ff8647` (warm orange)
- **Bars**: `#ff6a35` (bright orange)
- **Cafes**: `#ff6a00` (deep orange)
- **Wineries**: `#ff8647` (warm orange)
- **Beaches**: `#ff8647` (warm orange fill)
- **Landmarks**: Visible for navigation

### Hidden Elements
- Road network labels
- Most entertainment POIs (arts, cinema, museum)
- Retail and shopping venues
- Services (ATM, bank, gas station, parking)
- Government and administrative areas
- Most recreation areas (except beaches)

## Testing the Styling

### Local Testing

1. **Start development server:**
```bash
npm run dev
```

2. **Test in different zoom levels:**
   - Zoom 2-5: World/continent view
   - Zoom 10-15: City/neighborhood view
   - Zoom 15+: Street level

3. **Toggle between themes:**
   - Test dark mode styling
   - Test light mode styling
   - Test auto mode (time-based)

### Visual Verification Checklist

- [ ] Restaurants appear with orange pins
- [ ] Bars appear with bright orange pins
- [ ] Cafes appear with deep orange pins
- [ ] Landmarks are visible
- [ ] Beaches show orange fill color
- [ ] Unnecessary POIs are hidden
- [ ] Road labels are not cluttered
- [ ] Map is readable at all zoom levels

## Deployment to Netlify

### Pre-deployment Checklist

1. **Ensure environment variables are set:**
   - Add to Netlify environment variables
   - Never commit API keys to repository

2. **Test build locally:**
```bash
npm run build
npm run preview
```

3. **Verify styling in production:**
   - Test on different devices
   - Test on different browsers
   - Verify performance

### Netlify Configuration

Add to `netlify.toml`:
```toml
[build]
  command = "npm run build"
  functions = "supabase/functions"
  publish = "dist"

[build.environment]
  VITE_GOOGLE_MAPS_API_KEY = "your_api_key"
  VITE_GOOGLE_MAPS_MAP_ID = "your_map_id"
```

Or set environment variables in Netlify dashboard:
1. Go to Site settings > Build & deploy > Environment
2. Add new variables:
   - `VITE_GOOGLE_MAPS_API_KEY`
   - `VITE_GOOGLE_MAPS_MAP_ID`

## Troubleshooting

### Issue: Map not displaying with custom styling

**Solution:**
- Verify Map ID is correct in Google Cloud Console
- Ensure "Maps JavaScript API" is enabled
- Check API key has proper permissions
- Verify environment variables are loaded

### Issue: POIs not showing correct colors

**Solution:**
- Ensure using Google Maps Platform API (not legacy)
- Verify Map ID is associated with correct style
- Check style configuration in Google Cloud Console

### Issue: Performance issues with many markers

**Solution:**
- Implement marker clustering
- Use custom overlay rendering (already implemented)
- Optimize venue data fetching
- Consider pagination for large datasets

## Future Enhancements

1. **Dynamic Styling**: Allow users to customize colors
2. **Multiple Themes**: Create additional themed styles
3. **Marker Clustering**: Group nearby venues at lower zoom levels
4. **Heat Maps**: Show venue density/popularity
5. **Real-time Updates**: Update styling based on live data

## References

- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [Map Styling Guide](https://developers.google.com/maps/documentation/maps-static/styling)
- [Feature-based Styling](https://developers.google.com/maps/documentation/maps-static/styling#feature-based-styling)
- [Map IDs and Styles](https://developers.google.com/maps/documentation/maps-javascript-api/map-ids)

## Support

For issues or questions about the styling implementation:
1. Check the troubleshooting section above
2. Review Google Maps documentation
3. Test with the provided sample configurations
4. Contact the development team

---

**Last Updated**: December 2, 2025
**Version**: 1.0
**Status**: Ready for Integration
