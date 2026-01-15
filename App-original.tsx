import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, UserRole, Venue, Coordinates, MapState, ThemePreference, Service, SubscriptionPlan, TickerSource, MapTheme, OnboardingSlide, UserPreferences } from './types';
import { MOCK_VENUES, PARTNER_SERVICES, MOCK_SUBSCRIPTION_PLANS, MOCK_TICKER_SOURCES, getVibeColor, ONBOARDING_SLIDES } from './constants';
import { t, setLocale } from './translations';
import Onboarding from './components/features/Onboarding';
import MapContainer from './components/map/MapContainer';
import TopBar from './components/layout/TopBar';
import BottomNav from './components/layout/BottomNav';
import AuthModal from './components/features/AuthModal';
import VenueDetail from './components/features/VenueDetail';
import AIChat from './components/features/AIChat';
import Profile from './components/features/Profile';
import AdminDashboard from './components/admin/AdminDashboard';
import SplashScreen from './components/layout/SplashScreen';
import PreferenceFlow from './components/features/PreferenceFlow';
import PreferenceEditor from './components/features/PreferenceEditor';
import Plans from './components/features/Plans';
import Favorites from './components/features/Favorites';
import PlanSelectionModal from './components/features/PlanSelectionModal';
import CityGauge from './components/features/CityGauge';
import ExploreTab from './components/features/ExploreTab';

// Services
import { authService } from './services/authService';
import { dataService } from './services/dataService';
import { supabase } from './src/supabaseClient';

const App: React.FC = () => {
  // Start with SPLASH screen
  const [appState, setAppState] = useState<AppState>(AppState.SPLASH);
  
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('guest');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  const [currentTab, setCurrentTab] = useState('map');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'MAP' | 'LIST'>('MAP');
  
  // Features State
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [plansCount, setPlansCount] = useState<number>(0);
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [planSelectionVenue, setPlanSelectionVenue] = useState<Venue | null>(null);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  
  // Admin Controlled State
  const [services, setServices] = useState<Service[]>(PARTNER_SERVICES);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>(MOCK_SUBSCRIPTION_PLANS);
  const [tickerSources, setTickerSources] = useState<TickerSource[]>(MOCK_TICKER_SOURCES);
  const [onboardingSlides, setOnboardingSlides] = useState<OnboardingSlide[]>(ONBOARDING_SLIDES);

  // Ticker State
  const [isTickerPaused, setIsTickerPaused] = useState(false);

  // Geolocation State
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationName, setLocationName] = useState<string>('Locating...');
  const [locationError, setLocationError] = useState<string | null>(null);
  const locationFoundRef = useRef(false);
  
  // Map Persistence State
  const [mapState, setMapState] = useState<MapState>({
    center: { lat: 20, lng: 0 }, 
    zoom: 2 
  });
  const [hasInitiallyCentered, setHasInitiallyCentered] = useState(false); // Persists across tab switches

  // Theme State
  const [appTheme, setAppTheme] = useState<ThemePreference>(ThemePreference.AUTO);
  const [mapTheme, setMapTheme] = useState<MapTheme>(MapTheme.DARK); // FORCED DARK FOR TESTING 
  const [isDarkMode, setIsDarkMode] = useState(false);

  // City Vibe Score State
  const [cityVibeScore, setCityVibeScore] = useState<number | undefined>(undefined); 

  // --- 0. INIT DATA & AUTH ---
  useEffect(() => {
    // 1. Check for existing session
    const initAuth = async () => {
       const session = await authService.getSession();
       if (session) {
         setIsAuthenticated(true);
         setUserId(session.user.id);
         
         // Load user data on initial load
         const prefs = await dataService.getUserPreferences();
         if (prefs && prefs.preferences) {
           localStorage.setItem('kunajoto_user_prefs', JSON.stringify(prefs.preferences));
           localStorage.setItem('kunajoto_preferences_completed', prefs.preferences_completed ? 'true' : 'false');
           console.log('✅ Initial load: preferences found');
         } else {
           localStorage.setItem('kunajoto_preferences_completed', 'false');
           console.log('⚠️ Initial load: no preferences');
         }
         
         const profile = await authService.getUserProfile();
         if (profile) {
           if (profile.default_role) setUserRole(profile.default_role);
           setUserEmail(profile.email || session.user.email || '');
           setUserName(profile.full_name || profile.first_name || '');
           console.log('✅ Initial load: profile loaded', { email: profile.email, name: profile.full_name });
         } else {
           // Fallback to session data if profile not found
           const email = session.user.email || '';
           const name = session.user.user_metadata?.full_name || session.user.user_metadata?.first_name || session.user.email?.split('@')[0] || 'User';
           setUserEmail(email);
           setUserName(name);
           console.log('⚠️ Initial load: profile not found, using session data', { email, name, metadata: session.user.user_metadata });
         }
         
         // Load user plans count on initial load
         try {
           const plans = await dataService.fetchUserPlans();
           setPlansCount(plans.length);
           console.log('✅ Initial load: plans count loaded:', plans.length);
         } catch (error) {
           console.error('⚠️ Initial load: error loading plans count:', error);
         }
         
         // Set app state for authenticated users
         const hasPrefs = localStorage.getItem('kunajoto_preferences_completed') === 'true';
         if (hasPrefs) {
           setAppState(AppState.MAIN_APP);
           console.log('✅ Authenticated user with prefs -> MAIN_APP');
         } else {
           setAppState(AppState.PREFERENCE_FLOW);
           console.log('⚠️ Authenticated user without prefs -> PREFERENCE_FLOW');
         }
       } else {
         // No session - user is not authenticated
         console.log('⚠️ No session found - user not authenticated');
         setIsAuthenticated(false);
         setUserId('');
         setUserRole('guest');
         setUserEmail('');
         setUserName('');
         setAppState(AppState.GUEST_MAP);
       }
    };
    initAuth();
    
    // Auto-refresh vibe scores on load (dynamic based on current day/time)
    const refreshVibeScores = async () => {
      try {
        console.log('[App] Auto-refreshing vibe scores...');
        const response = await fetch('https://grnekxrkypgighmxyveh.supabase.co/functions/v1/auto-refresh-vibes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdybmVreHJreXBnaWdobXh5dmVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM4NDI4NDIsImV4cCI6MjA0OTQxODg0Mn0.Ue2bkPpvFcLmZWn9xNsqzxqF5Fz7Gy_pYJJCUJx-Uh4'
          }
        });
        const result = await response.json();
        console.log('[App] Vibe scores refreshed:', result);
      } catch (error) {
        console.error('[App] Error refreshing vibe scores:', error);
      }
    };
    refreshVibeScores();

    // 2. Listen for auth changes (Realtime)
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        setIsAuthenticated(!!session);
        
        if (session) {
          // Load user preferences from database
          const prefs = await dataService.getUserPreferences();
          if (prefs && prefs.preferences) {
            localStorage.setItem('kunajoto_user_prefs', JSON.stringify(prefs.preferences));
            localStorage.setItem('kunajoto_preferences_completed', prefs.preferences_completed ? 'true' : 'false');
            console.log('✅ Loaded preferences from database on login');
          } else {
            // No preferences in database, mark as not completed
            localStorage.setItem('kunajoto_preferences_completed', 'false');
            console.log('⚠️ No preferences found in database');
          }
          
          // Load user plans count
          try {
            const plans = await dataService.fetchUserPlans();
            setPlansCount(plans.length);
            console.log('✅ Loaded plans count:', plans.length);
          } catch (error) {
            console.error('⚠️ Error loading plans count:', error);
          }
          
          setUserId(session.user.id);
          // Load user profile
          const profile = await authService.getUserProfile();
          if (profile) {
            if (profile.default_role) {
              setUserRole(profile.default_role);
              console.log('✅ User role:', profile.default_role);
            }
            setUserEmail(profile.email || session.user.email || '');
            setUserName(profile.full_name || profile.first_name || '');
            console.log('✅ User profile loaded:', profile.email);
          } else {
            // Fallback to session data if profile not found
            const email = session.user.email || '';
            const name = session.user.user_metadata?.full_name || session.user.user_metadata?.first_name || session.user.email?.split('@')[0] || 'User';
            setUserEmail(email);
            setUserName(name);
            console.log('⚠️ Profile not found, using session data', { email, name, metadata: session.user.user_metadata });
          }
        } else {
          // User logged out, clear data
          setUserRole('guest');
          setUserEmail('');
          setUserName('');
        }
        
        // Refresh venues to get updated favorite status
        loadVenues(); 
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const hasLoadedInitial = useRef(false);
  const boundsDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  /**
   * Handle map bounds change with debouncing (Gemini recommendation)
   * Prevents excessive API calls during pan/zoom
   */
  const handleMapBoundsChanged = useCallback((bounds: { north: number; south: number; east: number; west: number }, zoom: number) => {
    // Clear existing timer
    if (boundsDebounceTimer.current) {
      clearTimeout(boundsDebounceTimer.current);
    }
    
    // Debounce for 500ms
    boundsDebounceTimer.current = setTimeout(async () => {
      console.log('[App] Map bounds changed, fetching venues in new viewport...');
      
      try {
        const data = await dataService.fetchVenuesInBounds(bounds, zoom);
        setVenues(data);
        
        // Sync favorites
        const favIds = data.filter(v => v.isFavorite).map(v => v.id);
        setFavorites(favIds);
        
        console.log(`[App] Loaded ${data.length} venues in viewport`);
      } catch (error) {
        console.error('[App] Error loading venues in bounds:', error);
      }
    }, 500);
  }, []);
  
  const loadVenues = async () => {
    // Load initial batch (1000 venues) for fast render
    // Pass user location to prioritize nearby venues
    const data = await dataService.fetchVenues(userLocation || undefined);
    setVenues(data);
    
    // Sync local favorites state with fetched data
    const favIds = data.filter(v => v.isFavorite).map(v => v.id);
    setFavorites(favIds);
    
    // Progressive loading disabled to prevent browser crashes
    // Viewport filtering ensures only visible venues are rendered
    // Users can see all venues by panning to different regions
    console.log('[App] Loaded 1000 venues. Viewport filtering active.');
  };

  // Fetch Real Data on Mount
  useEffect(() => {
    loadVenues();
  }, []); // Only run once on mount
  
  // Reload venues when user location changes (skip first load)
  useEffect(() => {
    if (userLocation && hasLoadedInitial.current) {
      console.log('[App] User location detected, reloading venues for region...');
      loadVenues();
    } else if (userLocation) {
      hasLoadedInitial.current = true;
    }
  }, [userLocation]);


  // --- 1. App Theme Logic ---
  useEffect(() => {
    const calculateTheme = () => {
      if (appTheme === ThemePreference.LIGHT) return false;
      if (appTheme === ThemePreference.DARK) return true;
      
      // Auto Mode (6PM - 6AM)
      const hour = new Date().getHours();
      return hour >= 18 || hour < 6;
    };

    setIsDarkMode(calculateTheme());
    
    // Initialize splash logic - FLOW: Splash -> Onboarding -> Guest Map (for guests)
    // Authenticated users handled in initAuth
    if (appState === AppState.SPLASH) {
        const splashTimer = setTimeout(() => {
          const hasOnboarded = localStorage.getItem('kunajoto_has_onboarded') === 'true';
          
          if (!hasOnboarded) {
             // New user - show onboarding
             setAppState(AppState.GUEST_INTRO);
          } else {
             // Returning guest - go to map
             // (Authenticated users already handled in initAuth)
             setAppState(AppState.GUEST_MAP);
          }
        }, 3500);
        return () => clearTimeout(splashTimer);
    }
  }, [appTheme, appState]);

  // --- 2. ROBUST GEOLOCATION LOGIC ---
  const triggerGeolocation = () => {
    setLocationError(null);
    locationFoundRef.current = false; 
    
    const handleLocationUpdate = async (lat: number, lng: number, source: string) => {
      if (locationFoundRef.current) return;
      locationFoundRef.current = true;
      
      console.log(`Location found via ${source}:`, lat, lng);
      setUserLocation({ lat, lng });
      
      // TELEPORT VENUES TO USER (Mocking behavior if using MOCKS only)
      // If we are using Supabase, we assume venues have real coordinates and we don't move them.
      // If venues are empty/mocked, we might want to scatter them.
      if (!supabase) {
        const updatedVenues = venues.map((v, i) => ({
            ...v,
            coordinates: {
                lat: lat + (Math.random() - 0.5) * 0.02, // Random scatter around user
                lng: lng + (Math.random() - 0.5) * 0.02
            },
            isFavorite: favorites.includes(v.id)
        }));
        setVenues(updatedVenues);
      } else {
        // Just ensure favorites are synced
        setVenues(prev => prev.map(v => ({...v, isFavorite: favorites.includes(v.id)})));
      }

      // Reverse Geocode for City Name
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await response.json();
        // Priority: city > town > village > state (skip county/district to avoid sub-city names)
        const city = data.address.city || data.address.town || data.address.village || data.address.state || data.address.country || "Unknown Location";
        setLocationName(city);
        
        // Load city vibe score from database (same as CityGauge)
        console.log('[App] Loading city vibe score for:', city);
        try {
          const cityScores = await dataService.getCityVibeScores();
          const cityData = cityScores.find((c: any) => c.city === city);
          if (cityData) {
            // Convert from 0-100 scale to 0-10 scale
            const score = cityData.overall_score / 10;
            setCityVibeScore(score);
            console.log(`[App] City vibe score loaded: ${score.toFixed(1)} for ${city}`);
          } else {
            console.log(`[App] No city vibe data found for ${city}`);
            setCityVibeScore(undefined);
          }
        } catch (error) {
          console.error('[App] Error loading city vibe score:', error);
          setCityVibeScore(undefined);
        }
      } catch (e) {
        console.error("Geocode error", e);
        setLocationName("Unknown Area");
      }
    };

    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => handleLocationUpdate(pos.coords.latitude, pos.coords.longitude, 'High Accuracy GPS'),
      (err) => {
         console.warn("GPS failed, trying WiFi/Cell triangulation...", err);
         navigator.geolocation.getCurrentPosition(
            (pos) => handleLocationUpdate(pos.coords.latitude, pos.coords.longitude, 'Low Accuracy Network'),
            (err2) => {
               console.error("All location attempts failed", err2);
               if (!locationFoundRef.current) {
                   setLocationError("Could not pinpoint location. Check GPS settings.");
               }
            },
            { enableHighAccuracy: false, timeout: 3000, maximumAge: 0 }
         );
      },
      { enableHighAccuracy: true, timeout: 3000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    triggerGeolocation();
  }, []);


  // --- Handlers ---

  const toggleFavorite = async (id: string) => {
     if (!isAuthenticated) {
        setShowAuthModal(true);
        return;
     }

     // Optimistic UI Update
     const wasFavorite = favorites.includes(id);
     const newFavorites = wasFavorite 
        ? favorites.filter(fav => fav !== id) 
        : [...favorites, id];
     setFavorites(newFavorites);

     // Update venues local state to reflect change immediately
     setVenues(prev => prev.map(v => v.id === id ? { ...v, isFavorite: !wasFavorite } : v));

     try {
       await dataService.toggleFavorite(id);
     } catch (e) {
       console.error("Failed to sync favorite", e);
       // Revert on error
       setFavorites(favorites);
       setVenues(prev => prev.map(v => v.id === id ? { ...v, isFavorite: wasFavorite } : v));
     }
  };

  const handleGuestOnboardingComplete = (skipped: boolean) => {
    if (!skipped) {
      localStorage.setItem('kunajoto_has_onboarded', 'true');
    }
    // Guest users go to map, not preferences
    // Preferences only shown after signup/login
    setAppState(AppState.GUEST_MAP);
  };

  const handlePreferencesComplete = async (wasSkipped: boolean, preferences?: any) => {
    if (!wasSkipped && preferences) {
       localStorage.setItem('kunajoto_preferences_completed', 'true');
       // Save preferences to database
       try {
         await dataService.updateUserProfile(preferences);
         console.log('✅ Preferences saved to database');
       } catch (error) {
         console.error('❌ Error saving preferences:', error);
       }
    }
    setAppState(AppState.MAIN_APP);
  };

  const handleUserOnboardingComplete = () => {
     setAppState(AppState.MAIN_APP);
  };

  const handleAuthSuccess = async (isNewSignup: boolean = false) => {
    setShowAuthModal(false);
    localStorage.setItem('kunajoto_has_account', 'true');
    
    if (isNewSignup) {
      // New signup - show preference flow
      console.log('✅ New signup detected, showing preference flow');
      setAppState(AppState.PREFERENCE_FLOW);
    } else {
      // Existing login - check if preferences completed
      const hasPrefs = localStorage.getItem('kunajoto_preferences_completed') === 'true';
      if (!hasPrefs) {
        // User logged in but hasn't completed preferences
        setAppState(AppState.PREFERENCE_FLOW);
      } else {
        // Normal login flow
        if (appState === AppState.GUEST_MAP || appState === AppState.GUEST_INTRO) {
          setAppState(AppState.MAIN_APP);
        }
      }
    }
  };

  const handleLogout = async () => {
    console.log('🔴 Logout button clicked');
    console.log('📍 Current state before logout:', { isAuthenticated, currentTab, appState });
    
    try {
      console.log('🚺 Calling authService.signOut()...');
      await authService.signOut();
      console.log('✅ authService.signOut() completed');
      
      console.log('🔄 Updating app state...');
      setIsAuthenticated(false);
      setUserId('');
      setFavorites([]);
      setPlansCount(0);
      setUserRole('guest');
      setUserEmail('');
      setUserName('');
      setCurrentTab('map');
      setAppState(AppState.GUEST_MAP);
      localStorage.removeItem('kunajoto_preferences_completed');
      localStorage.removeItem('kunajoto_user_prefs');
      localStorage.removeItem('kunajoto_auth_token');
      
      console.log('✅ Logout complete!');
      console.log('📍 New state after logout:', { isAuthenticated: false, currentTab: 'map', appState: AppState.GUEST_MAP });
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  const handleActionRequiringAuth = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    } else {
      setAppState(AppState.MAIN_APP);
    }
  };

  const handleTabChange = (tabId: string) => {
    if ((tabId === 'profile' || tabId === 'explore')) {
      if (!isAuthenticated) {
         handleActionRequiringAuth();
         return;
      } else {
         if (appState === AppState.GUEST_MAP) {
             setAppState(AppState.MAIN_APP);
         }
      }
    }
    setCurrentTab(tabId);
  };
  
  const activeTickerMessages = tickerSources
     .filter(ts => ts.isActive)
     .map(ts => ts.type === 'Manual' ? ts.content : ts.name === 'Weather Alerts' ? `Heavy rain expected in ${locationName} at 11 PM` : 'Safe travel zones active downtown');

  const cityForecast = [
     { day: 'Mon', score: 7.2 },
     { day: 'Tue', score: 6.8 },
     { day: 'Wed', score: 7.5 },
     { day: 'Thu', score: 8.1 },
     { day: 'Fri', score: 9.2 },
     { day: 'Sat', score: 9.5 },
     { day: 'Sun', score: 6.5 },
  ];

  const hasCompletedPrefs = localStorage.getItem('kunajoto_preferences_completed') === 'true';

  const getRecommendedVenues = () => {
     const savedPrefsStr = localStorage.getItem('kunajoto_user_prefs');
     let userMusic: string[] = [];
     if (savedPrefsStr) {
        try {
           const prefs = JSON.parse(savedPrefsStr) as UserPreferences;
           userMusic = prefs.music || [];
        } catch (e) {}
     }

     return [...venues].sort((a, b) => {
        if (a.isPromoted && !b.isPromoted) return -1;
        if (!a.isPromoted && b.isPromoted) return 1;

        // Null-safe music matching
        const aDesc = a.description || '';
        const aType = a.type || '';
        const bDesc = b.description || '';
        const bType = b.type || '';
        
        const aMatch = userMusic.some(m => aDesc.includes(m) || aType.includes(m));
        const bMatch = userMusic.some(m => bDesc.includes(m) || bType.includes(m));
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;

        return (b.vibeScore || 0) - (a.vibeScore || 0);
     }).slice(0, 6); 
  };

  return (
    <div className={`relative w-full h-screen overflow-hidden font-sans ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-dark'}`}>
      
      {appState === AppState.SPLASH && <SplashScreen />}

      {appState === AppState.GUEST_INTRO && (
        <Onboarding 
          type="GUEST" 
          onComplete={handleGuestOnboardingComplete} 
          slides={onboardingSlides}
        />
      )}
      
      {appState === AppState.PREFERENCE_FLOW && (
        <PreferenceFlow onComplete={handlePreferencesComplete} />
      )}

      {appState === AppState.PREFERENCE_EDITOR && (
        <PreferenceEditor onClose={() => setAppState(AppState.MAIN_APP)} />
      )}

      {appState === AppState.USER_INTRO && (
        <Onboarding type="USER" onComplete={handleUserOnboardingComplete} />
      )}

      {appState === AppState.ADMIN_DASHBOARD && (
        <AdminDashboard 
          onClose={() => setAppState(AppState.MAIN_APP)} 
          services={services}
          setServices={setServices}
          subscriptionPlans={subscriptionPlans}
          setSubscriptionPlans={setSubscriptionPlans}
          tickerSources={tickerSources}
          setTickerSources={setTickerSources}
          appTheme={appTheme}
          setAppTheme={setAppTheme}
          mapTheme={mapTheme}
          setMapTheme={setMapTheme}
          onboardingSlides={onboardingSlides}
          setOnboardingSlides={setOnboardingSlides}
          venues={venues}
          setVenues={setVenues}
        />
      )}

      {appState === AppState.PLANS && (
          <Plans onClose={() => setAppState(AppState.MAIN_APP)} onSelectVenue={setSelectedVenue} venues={venues} />
      )}

      {(appState === AppState.GUEST_MAP || appState === AppState.MAIN_APP || appState === AppState.PREFERENCES) && (
        <>
          {currentTab === 'map' && (
            <TopBar 
              appState={appState}
              viewMode={viewMode}
              onSearch={(q) => console.log(q)}
              toggleViewMode={() => setViewMode(v => v === 'MAP' ? 'LIST' : 'MAP')}
              isAdvancedOpen={isAdvancedFiltersOpen}
              toggleAdvanced={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
              locationName={locationName}
              cityVibeScore={cityVibeScore}
            />
          )}

          <div className="absolute inset-0 z-0">
            {currentTab === 'map' && (
               viewMode === 'MAP' ? (
                  <MapContainer 
                     venues={venues} 
                     onVenueSelect={setSelectedVenue} 
                     userLocation={userLocation}
                     mapState={mapState}
                     onMapStateChange={setMapState}
                     isDarkMode={isDarkMode}
                     mapTheme={mapTheme}
                     locationError={locationError}
                     onRetryLocation={() => {
                         triggerGeolocation();
                     }}
                     onBoundsChanged={handleMapBoundsChanged}
                     hasInitiallyCentered={hasInitiallyCentered}
                     onCenterComplete={() => setHasInitiallyCentered(true)}
                  />
               ) : (
                 <div className="pt-24 px-4 pb-24 overflow-y-auto h-full bg-gray-50">
                   {venues.map(venue => (
                     <div key={venue.id} className="bg-white rounded-xl p-3 mb-3 shadow-sm flex gap-3 border border-gray-100 relative">
                        <div onClick={() => setSelectedVenue(venue)} className="flex gap-3 flex-1 cursor-pointer">
                          <img src={venue.imageUrl} className="w-20 h-20 rounded-lg object-cover" />
                          <div className="flex-1">
                             <div className="flex justify-between items-start pr-8">
                               <h4 className="font-bold text-dark">{venue.name}</h4>
                               <span className="font-bold text-primary">{(venue.vibeScore/10).toFixed(1)}</span>
                             </div>
                             <p className="text-xs text-gray-500 mb-1">{venue.type} • {venue.district}</p>
                             <p className="text-xs text-gray-400 line-clamp-2">{venue.description}</p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(venue.id);
                          }}
                          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition ${
                            favorites.includes(venue.id)
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500'
                          }`}
                        >
                          <i className={`${favorites.includes(venue.id) ? 'fa-solid' : 'fa-regular'} fa-heart text-sm`}></i>
                        </button>
                     </div>
                   ))}
                 </div>
               )
            )}
            
            {currentTab === 'ai' && <AIChat />}

            {currentTab === 'profile' && (
              !isAuthenticated ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <i className="fa-solid fa-user-lock text-6xl text-gray-300 mb-4"></i>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Sign In Required</h2>
                  <p className="text-gray-600 mb-6">Please sign in to view your profile and manage your account.</p>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
                  >
                    Sign In
                  </button>
                </div>
              ) : (
                <Profile 
                onSwitchToAdmin={() => setAppState(AppState.ADMIN_DASHBOARD)} 
                themePreference={appTheme}
                setThemePreference={setAppTheme}
                mapTheme={mapTheme}
                setMapTheme={setMapTheme}
                onOpenPreferences={() => setAppState(AppState.PREFERENCE_EDITOR)}
                onOpenPlans={() => setAppState(AppState.PLANS)}
                onOpenFavorites={() => setShowFavorites(true)}
                favoritesCount={favorites.length}
                plansCount={plansCount}
                subscriptionPlans={subscriptionPlans}
                onLogout={handleLogout}
                userRole={userRole}
                userId={userId}
                userEmail={userEmail}
                userName={userName}
                onProfileUpdate={async () => {
                  // Refresh user profile data after update
                  const profile = await authService.getUserProfile();
                  if (profile) {
                    setUserName(profile.full_name || profile.first_name || '');
                    setUserEmail(profile.email || '');
                  }
                }}
              />
              )
            )}
            
            {currentTab === 'explore' && (
              <ExploreTab 
                locationName={locationName}
                onOpenPreferences={() => setAppState(AppState.PREFERENCE_FLOW)}
                hasCompletedPrefs={hasCompletedPrefs}
                isAuthenticated={isAuthenticated}
                onVenueSelect={setSelectedVenue}
                onOpenPlans={() => setAppState(AppState.PLANS)}
              />
            )}
          </div>

          <div 
            className="absolute bottom-20 left-0 right-0 bg-blue-900/90 backdrop-blur text-white text-[10px] py-1.5 overflow-hidden z-20 shadow-lg border-t border-blue-800/50 cursor-pointer group"
            onClick={() => setIsTickerPaused(!isTickerPaused)}
            title={isTickerPaused ? "Click to Resume" : "Click to Pause"}
          >
             <div 
               className="animate-marquee px-4 flex items-center whitespace-nowrap"
               style={{ animationPlayState: isTickerPaused ? 'paused' : 'running' }}
             >
               {activeTickerMessages.length > 0 ? activeTickerMessages.map((msg, i) => (
                 <React.Fragment key={i}>
                    <span className="mx-6 flex items-center gap-2">
                       <i className="fa-solid fa-bullhorn text-blue-300"></i> {msg}
                    </span>
                    <span className="mx-6 text-blue-400/50">|</span>
                 </React.Fragment>
               )) : (
                   <span className="mx-6">Welcome to Kunajoto - Your Nightlife Vibe Forecast</span>
               )}
             </div>
             {isTickerPaused && (
               <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] bg-black/50 px-1.5 rounded text-white">PAUSED</div>
             )}
          </div>

          <BottomNav currentTab={currentTab} setTab={handleTabChange} appState={appState} />
        </>
      )}

      {showAuthModal && (
        <AuthModal 
          onAuthSuccess={handleAuthSuccess} 
          onCancel={() => setShowAuthModal(false)}
          defaultMode={localStorage.getItem('kunajoto_has_account') === 'true' ? 'login' : 'signup'}
        />
      )}

      {selectedVenue && (
        <VenueDetail 
            venue={selectedVenue} 
            onClose={() => setSelectedVenue(null)} 
            isFavorite={favorites.includes(selectedVenue.id)}
            onToggleFavorite={toggleFavorite}
            onAddToPlan={async (venue) => {
              console.log('[App] Add to Plan clicked for venue:', venue.name);
              if (!isAuthenticated) {
                console.log('[App] User not authenticated');
                alert('Please log in to add venues to plans');
                setShowAuthModal(true);
                return;
              }
              
              try {
                // Fetch user's draft plans
                console.log('[App] Fetching user plans...');
                const plans = await dataService.fetchUserPlans();
                console.log('[App] Fetched plans:', plans);
                const draftPlans = plans.filter((p: any) => p.status === 'draft');
                console.log('[App] Draft plans:', draftPlans);
                
                // Always show selection modal (allows choosing existing or creating new)
                setPlanSelectionVenue(venue);
                setAvailablePlans(draftPlans);
                setShowPlanSelection(true);
              } catch (error) {
                console.error('[App] Error fetching plans:', error);
                alert(`Failed to load plans: ${error.message}`);
              }
            }}
        />
      )}

      {/* Favorites Screen */}
      {showFavorites && (
        <Favorites
          onClose={() => setShowFavorites(false)}
          onVenueClick={setSelectedVenue}
          onToggleFavorite={toggleFavorite}
          onExploreVenues={() => setCurrentTab('map')}
        />
      )}

      {/* Plan Selection Modal */}
      {showPlanSelection && planSelectionVenue && (
        <PlanSelectionModal
          venue={planSelectionVenue}
          plans={availablePlans}
          onSelectPlan={async (planId) => {
            try {
              console.log('[App] Adding venue to selected plan:', planId);
              await dataService.addVenueToPlan(planId, planSelectionVenue.id);
              const plan = availablePlans.find(p => p.id === planId);
              alert(`Added ${planSelectionVenue.name} to "${plan?.title || 'plan'}"!`);
            } catch (error) {
              console.error('[App] Error adding to plan:', error);
              alert(`Failed to add venue: ${error.message}`);
            }
          }}
          onCreateNew={async () => {
            try {
              console.log('[App] Creating new plan for venue:', planSelectionVenue.name);
              const newPlan = await dataService.createPlan(`Night Out - ${new Date().toLocaleDateString()}`);
              console.log('[App] New plan created:', newPlan);
              await dataService.addVenueToPlan(newPlan.id, planSelectionVenue.id);
              alert(`Added ${planSelectionVenue.name} to new plan!`);
            } catch (error) {
              console.error('[App] Error creating plan:', error);
              alert(`Failed to create plan: ${error.message}`);
            }
          }}
          onClose={() => setShowPlanSelection(false)}
        />
      )}

    </div>
  );
};

export default App;