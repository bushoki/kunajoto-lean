import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, UserRole, Venue, Coordinates, MapState, ThemePreference, Service, SubscriptionPlan, TickerSource, MapTheme, OnboardingSlide, UserPreferences } from './types';
import { MOCK_VENUES, PARTNER_SERVICES, MOCK_SUBSCRIPTION_PLANS, MOCK_TICKER_SOURCES, getVibeColor, ONBOARDING_SLIDES } from './constants';
import { t, setLocale } from './translations';
import MapContainer from './components/map/MapContainer';
import TopBar from './components/layout/TopBar';
import BottomNav from './components/layout/BottomNav';
import VenueDetail from './components/features/VenueDetail';
import AIChat from './components/features/AIChat';
import Profile from './components/features/Profile';
import AdminDashboard from './components/admin/AdminDashboard';
import SplashScreen from './components/layout/SplashScreen';
import AuthRequired from './components/features/AuthRequired';
import Onboarding from './components/features/Onboarding';
import Plans from './components/features/Plans';
import Favorites from './components/features/Favorites';
import PlanSelectionModal from './components/features/PlanSelectionModal';
import CityGauge from './components/features/CityGauge';
import ExploreTab from './components/features/ExploreTab';

// Services
import { authService } from './services/authService';
import { dataService } from './services/dataService';
import { supabase } from './src/supabaseClient';
import { getCurrentLocation, isLocationInTargetCities, getSelectedCity, setSelectedCity, TARGET_CITIES } from './services/locationService';
import LocationRestrictionModal from './components/features/LocationRestrictionModal';

const App: React.FC = () => {
  // Check if user has seen onboarding
  const hasSeenOnboarding = localStorage.getItem('kunajoto_lean_onboarding_seen') === 'true';
  
  // Start with ONBOARDING if first time, otherwise SPLASH
  const [appState, setAppState] = useState<AppState>(
    hasSeenOnboarding ? AppState.SPLASH : AppState.GUEST_INTRO
  );
  
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('guest');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  const [currentTab, setCurrentTab] = useState('explore'); // Changed default to 'explore'
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
  
  // Location Control State
  const [selectedCity, setSelectedCityState] = useState<string>(getSelectedCity() || TARGET_CITIES[0]);
  const [showLocationRestriction, setShowLocationRestriction] = useState(false);
  const [detectedCity, setDetectedCity] = useState<string>('');
  
  // Map Persistence State
  const [mapState, setMapState] = useState<MapState>({
    center: { lat: 20, lng: 0 }, 
    zoom: 2 
  });
  const [hasInitiallyCentered, setHasInitiallyCentered] = useState(false);

  // Theme State
  const [appTheme, setAppTheme] = useState<ThemePreference>(ThemePreference.AUTO);
  const [mapTheme, setMapTheme] = useState<MapTheme>(MapTheme.DARK);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // City Vibe Score State
  const [cityVibeScore, setCityVibeScore] = useState<number | undefined>(undefined);

  // Handle onboarding completion
  const handleOnboardingComplete = (skipped: boolean) => {
    // Mark onboarding as seen
    localStorage.setItem('kunajoto_lean_onboarding_seen', 'true');
    // Move to splash screen
    setAppState(AppState.SPLASH);
  };

  // Splash screen timeout (only runs when in SPLASH state)
  useEffect(() => {
    console.log('[App] Current appState:', appState);
    if (appState !== AppState.SPLASH) return;

    console.log('[App] Splash screen started, will check auth in 3 seconds...');
    const splashTimer = setTimeout(async () => {
      console.log('[App] Splash timer completed, checking authentication...');
      try {
        const session = await authService.getSession();
        console.log('[App] Session check result:', session ? 'Authenticated' : 'Not authenticated');
        if (session) {
          // User is authenticated, go to main app
          console.log('[App] Moving to MAIN_APP state');
          setAppState(AppState.MAIN_APP);
          setCurrentTab('explore'); // Land on explore tab
        } else {
          // User is not authenticated, show auth required screen
          console.log('[App] Moving to AUTH_REQUIRED state');
          setAppState(AppState.AUTH_REQUIRED);
        }
      } catch (error) {
        console.error('[App] Error during splash screen auth check:', error);
        // On error, show auth required
        setAppState(AppState.AUTH_REQUIRED);
      }
    }, 3000); // 3 second splash

    return () => clearTimeout(splashTimer);
  }, [appState]);

  // --- 0. INIT DATA & AUTH ---
  useEffect(() => {
    // 1. Check for existing session
    const initAuth = async () => {
       const session = await authService.getSession();
       if (session) {
         setIsAuthenticated(true);
         setUserId(session.user.id);
         
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
       } else {
         // No session - user is not authenticated
         console.log('⚠️ No session found - user not authenticated');
         setIsAuthenticated(false);
         setUserId('');
         setUserRole('guest');
         setUserEmail('');
         setUserName('');
       }
    };
    initAuth();

    // 2. Listen for auth changes (Realtime)
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        setIsAuthenticated(!!session);
        
        if (session) {
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
   * Handle map bounds change with debouncing
   */
  const handleMapBoundsChanged = useCallback((bounds: { north: number; south: number; east: number; west: number }, zoom: number) => {
    if (boundsDebounceTimer.current) {
      clearTimeout(boundsDebounceTimer.current);
    }
    
    boundsDebounceTimer.current = setTimeout(async () => {
      console.log('[App] Map bounds changed, fetching venues in new viewport...');
      
      try {
        const data = await dataService.fetchVenuesInBounds(bounds, zoom);
        setVenues(data);
        
        // Sync favorites
        if (isAuthenticated) {
          const favs = await dataService.fetchFavorites();
          setFavorites(favs.map((f: any) => f.venue_id));
        }
      } catch (error) {
        console.error('[App] Error fetching venues in bounds:', error);
      }
    }, 500);
  }, [isAuthenticated]);

  const loadVenues = async () => {
    try {
      const data = await dataService.fetchVenues();
      setVenues(data);
      
      if (isAuthenticated) {
        const favs = await dataService.fetchFavorites();
        setFavorites(favs.map((f: any) => f.venue_id));
      }
    } catch (error) {
      console.error('[App] Error loading venues:', error);
    }
  };

  useEffect(() => {
    loadVenues();
  }, [isAuthenticated]);

  // Geolocation - Simple version from kunajoto-fire-
  useEffect(() => {
    if (navigator.geolocation && !locationFoundRef.current) {
      console.log('📍 [App] Starting geolocation...');
      
      // Set a timeout to ensure we don't block forever
      const geoTimeout = setTimeout(() => {
        if (!locationFoundRef.current) {
          console.warn('⏱️ [App] Geolocation timeout, using default city');
          locationFoundRef.current = true;
          setLocationName(TARGET_CITIES[0]);
          if (!getSelectedCity()) {
            handleCitySelection(TARGET_CITIES[0]);
          }
        }
      }, 5000); // 5 second timeout
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          clearTimeout(geoTimeout);
          if (locationFoundRef.current) return;
          
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(coords);
          setMapState({ center: coords, zoom: 14 });
          setHasInitiallyCentered(true);
          locationFoundRef.current = true;
          
          console.log('✅ [App] Geolocation success:', coords);

          try {
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.lat},${coords.lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
            );
            const data = await response.json();
            if (data.results && data.results[0]) {
              const cityComponent = data.results[0].address_components.find((c: any) =>
                c.types.includes('locality')
              );
              const cityName = cityComponent ? cityComponent.long_name : 'Unknown';
              setLocationName(cityName);
              setDetectedCity(cityName);
              
              console.log('🏙️ [App] City detected:', cityName);
              
              // Check if in target city
              const isTarget = isLocationInTargetCities(cityName);
              if (isTarget) {
                handleCitySelection(cityName);
              } else if (!getSelectedCity()) {
                // Show location selector for non-target cities
                setShowLocationRestriction(true);
              }
            }
          } catch (error) {
            console.error('[App] Geocoding error:', error);
            setLocationName('Unknown');
            if (!getSelectedCity()) {
              handleCitySelection(TARGET_CITIES[0]);
            }
          }
        },
        (error) => {
          clearTimeout(geoTimeout);
          console.error('[App] Geolocation error:', error);
          locationFoundRef.current = true;
          setLocationError('Unable to determine location');
          setLocationName('Location unavailable');
          // Default to first target city
          if (!getSelectedCity()) {
            handleCitySelection(TARGET_CITIES[0]);
          }
        },
        {
          timeout: 5000,
          maximumAge: 300000,
          enableHighAccuracy: false // Use false for faster response
        }
      );
    }
  }, []);

  // Handle city selection
  const handleCitySelection = (city: string) => {
    setSelectedCityState(city);
    setSelectedCity(city); // Save to localStorage
    setLocationName(city);
    console.log('[App] City selected:', city);
  };

  const handleAuthSuccess = async () => {
    console.log('🔑 [handleAuthSuccess] Starting auth success flow...');
    
    try {
      // Get current session
      const session = await authService.getSession();
      if (!session?.user) {
        console.error('❌ [handleAuthSuccess] No session found');
        return;
      }
      
      console.log('✅ [handleAuthSuccess] Session found:', session.user.id);
      
      setIsAuthenticated(true);
      setUserId(session.user.id); // FIX: Set userId to prevent ghost user
      
      // Load user data
      try {
        const profile = await authService.getUserProfile();
        if (profile) {
          setUserRole(profile.default_role || 'guest');
          setUserEmail(profile.email || session.user.email || '');
          setUserName(profile.full_name || profile.first_name || session.user.email?.split('@')[0] || 'User');
          console.log('✅ [handleAuthSuccess] Profile loaded:', { email: profile.email, name: profile.full_name });
        } else {
          // Fallback to session data
          const email = session.user.email || '';
          const name = session.user.user_metadata?.full_name || session.user.user_metadata?.first_name || session.user.email?.split('@')[0] || 'User';
          setUserEmail(email);
          setUserName(name);
          console.log('⚠️ [handleAuthSuccess] No profile, using session data:', { email, name });
        }
      } catch (profileError) {
        console.error('⚠️ [handleAuthSuccess] Profile load error:', profileError);
        // Continue anyway with session data
        const email = session.user.email || '';
        const name = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User';
        setUserEmail(email);
        setUserName(name);
      }
      
      console.log('🚀 [handleAuthSuccess] Transitioning to MAIN_APP...');
      
      // Go to main app, landing on explore tab
      setAppState(AppState.MAIN_APP);
      setCurrentTab('explore');
      
      console.log('📍 [handleAuthSuccess] Loading venues...');
      
      // Load venues and favorites (don't await to avoid blocking UI)
      loadVenues().catch(err => {
        console.error('⚠️ [handleAuthSuccess] Venue load error:', err);
      });
      
      console.log('✅ [handleAuthSuccess] Auth success flow complete!');
    } catch (error) {
      console.error('❌ [handleAuthSuccess] Critical error:', error);
      // Still try to show the app
      setAppState(AppState.MAIN_APP);
      setCurrentTab('explore');
    }
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      setIsAuthenticated(false);
      setUserId('');
      setUserRole('guest');
      setUserEmail('');
      setUserName('');
      setFavorites([]);
      setAppState(AppState.AUTH_REQUIRED);
      setCurrentTab('explore');
      // Reset Explore Tab content selection to default on logout
      localStorage.removeItem('kunajoto_selected_content_type');
    } catch (error) {
      console.error('[App] Logout error:', error);
    }
  };

  const toggleFavorite = async (venueId: string) => {
    if (!isAuthenticated) {
      alert('Please log in to save favorites');
      return;
    }

    try {
      if (favorites.includes(venueId)) {
        await dataService.removeFavorite(venueId);
        setFavorites(favorites.filter(id => id !== venueId));
      } else {
        await dataService.addFavorite(venueId);
        setFavorites([...favorites, venueId]);
      }
    } catch (error) {
      console.error('[App] Error toggling favorite:', error);
    }
  };

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
  };

  const activeTickerMessages = tickerSources
    .filter(s => s.isActive)
    .map(s => s.content || s.name);

  const mockCityForecast = [
     { day: 'Mon', score: 7.2 },
     { day: 'Tue', score: 6.8 },
     { day: 'Wed', score: 7.5 },
     { day: 'Thu', score: 8.1 },
     { day: 'Fri', score: 9.2 },
     { day: 'Sat', score: 9.5 },
     { day: 'Sun', score: 6.5 },
  ];

  return (
    <div className={`relative w-full h-screen overflow-hidden font-sans ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-dark'}`}>
      
      {appState === AppState.GUEST_INTRO && (
        <Onboarding 
          type="GUEST" 
          onComplete={handleOnboardingComplete} 
          slides={onboardingSlides}
        />
      )}

      {appState === AppState.SPLASH && <SplashScreen />}

      {appState === AppState.AUTH_REQUIRED && (
        <AuthRequired onAuthSuccess={handleAuthSuccess} />
      )}

      {/* Location Restriction Modal */}
      {showLocationRestriction && (
        <LocationRestrictionModal
          detectedCity={detectedCity || 'your location'}
          onSelectCity={handleCitySelection}
          onClose={() => setShowLocationRestriction(false)}
        />
      )}

      {appState === AppState.ADMIN_DASHBOARD && (
        <AdminDashboard 
          userId={userId}
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

      {appState === AppState.MAIN_APP && (
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

          <div className="absolute top-0 left-0 right-0 bottom-20 overflow-y-auto">
            {currentTab === 'map' && (
              viewMode === 'MAP' ? (
                <MapContainer
                  venues={venues}
                  onVenueSelect={setSelectedVenue}
                  userLocation={userLocation}
                  mapState={mapState}
                  setMapState={setMapState}
                  hasInitiallyCentered={hasInitiallyCentered}
                  setHasInitiallyCentered={setHasInitiallyCentered}
                  mapTheme={mapTheme}
                  onBoundsChanged={handleMapBoundsChanged}
                />
              ) : (
                <div className="h-full overflow-y-auto p-4 bg-gray-50">
                  <h2 className="text-xl font-bold mb-4">Venues List</h2>
                  <div className="space-y-3">
                    {venues.map((venue) => (
                      <div
                        key={venue.id}
                        onClick={() => setSelectedVenue(venue)}
                        className="bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <h3 className="font-semibold">{venue.name}</h3>
                        <p className="text-sm text-gray-600">{venue.district}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            {currentTab === 'citygauge' && (
              <CityGauge
                locationName={locationName}
                onOpenPreferences={() => {}}
                hasCompletedPrefs={true}
                isAuthenticated={isAuthenticated}
              />
            )}
            
            {currentTab === 'ai' && <AIChat />}

            {currentTab === 'profile' && (
              <Profile 
                onSwitchToAdmin={() => setAppState(AppState.ADMIN_DASHBOARD)} 
                themePreference={appTheme}
                setThemePreference={setAppTheme}
                mapTheme={mapTheme}
                setMapTheme={setMapTheme}
                onOpenPreferences={() => {}}
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
                  const profile = await authService.getUserProfile();
                  if (profile) {
                    setUserName(profile.full_name || profile.first_name || '');
                    setUserEmail(profile.email || '');
                  }
                }}
              />
            )}
            
            {currentTab === 'explore' && (
              <ExploreTab 
                locationName={locationName}
                selectedCity={selectedCity}
                onCityChange={handleCitySelection}
                onOpenPreferences={() => {}}
                hasCompletedPrefs={true}
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
                   <span className="mx-6">Welcome to Kunajoto Lean - Your Nightlife Discovery</span>
               )}
             </div>
             {isTickerPaused && (
               <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] bg-black/50 px-1.5 rounded text-white">PAUSED</div>
             )}
          </div>

          <BottomNav currentTab={currentTab} setTab={handleTabChange} appState={appState} />
        </>
      )}

      {selectedVenue && (
        <VenueDetail 
            venue={selectedVenue} 
            onClose={() => setSelectedVenue(null)} 
            isFavorite={favorites.includes(selectedVenue.id)}
            onToggleFavorite={toggleFavorite}
            onAddToPlan={async (venue) => {
              if (!isAuthenticated) {
                alert('Please log in to add venues to plans');
                return;
              }
              
              try {
                const plans = await dataService.fetchUserPlans();
                const draftPlans = plans.filter((p: any) => p.status === 'draft');
                
                setPlanSelectionVenue(venue);
                setAvailablePlans(draftPlans);
                setShowPlanSelection(true);
              } catch (error: any) {
                console.error('[App] Error fetching plans:', error);
                alert(`Failed to load plans: ${error.message}`);
              }
            }}
        />
      )}

      {showFavorites && (
        <Favorites
          onClose={() => setShowFavorites(false)}
          onVenueClick={setSelectedVenue}
          onToggleFavorite={toggleFavorite}
          onExploreVenues={() => setCurrentTab('map')}
        />
      )}

      {showPlanSelection && planSelectionVenue && (
        <PlanSelectionModal
          venue={planSelectionVenue}
          plans={availablePlans}
          onSelectPlan={async (planId) => {
            try {
              await dataService.addVenueToPlan(planId, planSelectionVenue.id);
              const plan = availablePlans.find(p => p.id === planId);
              alert(`Added ${planSelectionVenue.name} to "${plan?.title || 'plan'}"!`);
            } catch (error: any) {
              console.error('[App] Error adding to plan:', error);
              alert(`Failed to add venue: ${error.message}`);
            }
          }}
          onCreateNew={async () => {
            try {
              const newPlan = await dataService.createPlan(`Night Out - ${new Date().toLocaleDateString()}`);
              await dataService.addVenueToPlan(newPlan.id, planSelectionVenue.id);
              alert(`Added ${planSelectionVenue.name} to new plan!`);
            } catch (error: any) {
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
