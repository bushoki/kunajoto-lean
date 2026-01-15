
import React, { useState, useEffect } from 'react';
import { Service, DataSource, SubscriptionPlan, Affiliate, TickerSource, ThemePreference, MapTheme, OnboardingSlide, Venue } from '../../types';
import { MOCK_DATA_SOURCES, MOCK_AFFILIATES } from '../../constants';
import { supabase } from '../../src/supabaseClient';
import ScoringEditor from './ScoringEditor';

interface AdminDashboardProps {
  onClose: () => void;
  services: Service[];
  setServices: (services: Service[]) => void;
  subscriptionPlans: SubscriptionPlan[];
  setSubscriptionPlans: (plans: SubscriptionPlan[]) => void;
  tickerSources: TickerSource[];
  setTickerSources: (sources: TickerSource[]) => void;
  appTheme: ThemePreference;
  setAppTheme: (t: ThemePreference) => void;
  mapTheme: MapTheme;
  setMapTheme: (t: MapTheme) => void;
  onboardingSlides: OnboardingSlide[];
  setOnboardingSlides: (slides: OnboardingSlide[]) => void;
  venues?: Venue[]; // In real app, this comes from DB
  setVenues?: (venues: Venue[]) => void; // In real app, this updates DB
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onClose, 
  services, 
  setServices,
  subscriptionPlans,
  setSubscriptionPlans,
  tickerSources,
  setTickerSources,
  appTheme,
  setAppTheme,
  mapTheme,
  setMapTheme,
  onboardingSlides,
  setOnboardingSlides,
  venues: propVenues,
  setVenues: propSetVenues
}) => {
  const [activeTab, setActiveTab] = useState<'SOURCES' | 'SERVICES' | 'MONETIZATION' | 'TICKER' | 'DESIGN' | 'USERS' | 'PREFERENCES' | 'ONBOARDING' | 'RECOMMENDATIONS' | 'VIBE_SCORES' | 'PLANS'>('RECOMMENDATIONS');
  const [affiliates, setAffiliates] = useState<Affiliate[]>(MOCK_AFFILIATES);
  const [dataSources, setDataSources] = useState<DataSource[]>(MOCK_DATA_SOURCES);
  // Local venue state for demo if not passed from parent
  const [adminVenues, setAdminVenues] = useState<Venue[]>(propVenues || []);
  
  // Plans statistics state
  const [plansStats, setPlansStats] = useState({
    total: 0,
    scheduled: 0,
    completed: 0,
    draft: 0
  });
  
  // Notification state
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch plans statistics on mount
  useEffect(() => {
    const fetchPlansStats = async () => {
      try {
        const { data: plans, error } = await supabase
          .from('plans')
          .select('status');
        
        if (error) throw error;
        
        if (plans) {
          const stats = {
            total: plans.length,
            scheduled: plans.filter(p => p.status === 'scheduled').length,
            completed: plans.filter(p => p.status === 'completed').length,
            draft: plans.filter(p => p.status === 'draft').length
          };
          setPlansStats(stats);
        }
      } catch (error) {
        console.error('Error fetching plans stats:', error);
      }
    };
    
    fetchPlansStats();
  }, []);
  
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };
  
  // Form States
  const [newAffiliateName, setNewAffiliateName] = useState('');
  const [newAffiliateId, setNewAffiliateId] = useState('');
  const [newServiceName, setNewServiceName] = useState('');

  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceProvider, setNewSourceProvider] = useState('Google');
  const [newSourceInterval, setNewSourceInterval] = useState('1h');

  const toggleService = (id: string) => {
    const updated = services.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s);
    setServices(updated);
  };

  const togglePlan = (id: string) => {
    const updated = subscriptionPlans.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p);
    setSubscriptionPlans(updated);
  };

  const toggleTickerSource = (id: string) => {
    const updated = tickerSources.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t);
    setTickerSources(updated);
  };

  const toggleVenuePromotion = (id: string) => {
    const updated = adminVenues.map(v => v.id === id ? { ...v, isPromoted: !v.isPromoted } : v);
    setAdminVenues(updated);
    if (propSetVenues) {
        propSetVenues(updated);
    }
  };

  const addAffiliate = () => {
    if (!newAffiliateName || !newAffiliateId) return;
    const newAff: Affiliate = {
      id: Date.now().toString(),
      partnerName: newAffiliateName,
      affiliateId: newAffiliateId
    };
    setAffiliates([...affiliates, newAff]);
    setNewAffiliateName('');
    setNewAffiliateId('');
  };

  const deleteAffiliate = (id: string) => {
    setAffiliates(affiliates.filter(a => a.id !== id));
  };

  const addDataSource = () => {
    if (!newSourceName) return;
    const newDS: DataSource = {
        id: Date.now().toString(),
        name: newSourceName,
        provider: newSourceProvider as any,
        status: 'Syncing',
        interval: newSourceInterval,
        lastSync: 'Pending'
    };
    setDataSources([...dataSources, newDS]);
    setNewSourceName('');
  };

  const removeDataSource = (id: string) => {
      setDataSources(dataSources.filter(d => d.id !== id));
  };

  // Onboarding Slide Management
  const updateSlide = (index: number, field: keyof OnboardingSlide, value: string) => {
    const updated = [...onboardingSlides];
    updated[index] = { ...updated[index], [field]: value };
    setOnboardingSlides(updated);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-50 flex flex-col animate-in slide-in-from-right duration-300 font-sans">
      {/* Admin Header */}
      <div className="bg-[#1c1c1c] text-white p-6 pt-12 flex justify-between items-center shadow-md border-b border-gray-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <div className="text-[10px] text-green-400 font-bold uppercase tracking-widest">Supabase Connected</div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Mission Control</h1>
        </div>
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
      
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-20 right-6 z-[110] p-4 rounded-lg shadow-lg animate-in slide-in-from-right duration-300 ${
          notification.type === 'success' ? 'bg-green-500 text-white' :
          notification.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          <div className="flex items-center gap-3">
            <i className={`fa-solid ${
              notification.type === 'success' ? 'fa-check-circle' :
              notification.type === 'error' ? 'fa-exclamation-circle' :
              'fa-info-circle'
            } text-xl`}></i>
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-6 overflow-x-auto hide-scrollbar">
        {[
          { id: 'RECOMMENDATIONS', label: 'Recommendations Engine' },
          { id: 'VIBE_SCORES', label: 'Vibe Scores' },
          { id: 'PLANS', label: 'User Plans' },
          { id: 'SOURCES', label: 'Data Sources' },
          { id: 'SERVICES', label: 'Services' },
          { id: 'MONETIZATION', label: 'Monetization' },
          { id: 'TICKER', label: 'Ticker & Notifications' },
          { id: 'ONBOARDING', label: 'Onboarding Content' },
          { id: 'DESIGN', label: 'Design & Theme' },
          { id: 'USERS', label: 'User Claims' },
          { id: 'PREFERENCES', label: 'User Preferences' },
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-4 text-sm font-semibold border-b-2 transition whitespace-nowrap ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
        
        {/* VIBE_SCORES TAB */}
        {activeTab === 'VIBE_SCORES' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-lg mb-4">Vibe Score System Status</h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{adminVenues.length}</div>
                  <div className="text-xs text-gray-700 font-medium">Total Venues Scored</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {adminVenues.filter(v => v.vibeConfidence === 'Hot' || v.vibeConfidence === 'Popping').length}
                  </div>
                  <div className="text-xs text-gray-700 font-medium">High Confidence (Hot/Popping)</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {adminVenues.filter(v => v.vibeConfidence === 'Warming' || v.vibeConfidence === 'Dead').length}
                  </div>
                  <div className="text-xs text-gray-700 font-medium">Low Confidence (Warming/Dead)</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={async () => {
                    try {
                      setIsLoading(true);
                      showNotification('Recalculating vibe scores...', 'info');
                      
                      const { data: { session } } = await supabase.auth.getSession();
                      if (!session) {
                        showNotification('Please log in to recalculate scores', 'error');
                        setIsLoading(false);
                        return;
                      }
                      
                      const response = await fetch('https://grnekxrkypgighmxyveh.supabase.co/functions/v1/auto-refresh-vibes', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${session.access_token}`
                        }
                      });
                      
                      const result = await response.json();
                      
                      if (response.ok) {
                        showNotification(`✅ Success! Updated ${result.updated_count} venues. ${result.is_weekend ? '🎉 Weekend boost applied!' : ''} ${result.is_peak_hours ? '🔥 Peak hours active!' : ''}`, 'success');
                        setTimeout(() => window.location.reload(), 2000);
                      } else {
                        showNotification(`❌ Failed: ${result.error || 'Unknown error'}`, 'error');
                      }
                    } catch (error) {
                      showNotification(`❌ Error: ${error.message}`, 'error');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  className="py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '⏳ Processing...' : '🔄 Auto-Refresh Vibe Scores'}
                </button>
                <button 
                  onClick={async () => {
                    try {
                      setIsLoading(true);
                      showNotification('Generating AI narratives...', 'info');
                      
                      const { data: { session } } = await supabase.auth.getSession();
                      if (!session) {
                        showNotification('Please log in to generate narratives', 'error');
                        setIsLoading(false);
                        return;
                      }
                      
                      const response = await fetch('https://grnekxrkypgighmxyveh.supabase.co/functions/v1/generate-ai-narratives', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${session.access_token}`
                        },
                        body: JSON.stringify({ batch_size: 20 })
                      });
                      
                      const result = await response.json();
                      
                      if (response.ok) {
                        showNotification(`✅ Generated ${result.generated_count} AI narratives! ${result.using_gemini ? '🤖 Using Gemini AI' : '📝 Using fallback'}`, 'success');
                      } else {
                        showNotification(`❌ Failed: ${result.error || 'Unknown error'}`, 'error');
                      }
                    } catch (error) {
                      showNotification(`❌ Error: ${error.message}`, 'error');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  className="py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '⏳ Generating...' : '🤖 Generate AI Narratives'}
                </button>
              </div>
              <div className="mt-4 text-xs text-gray-600">
                <strong>Note:</strong> Auto-refresh uses 8-factor dynamic scoring with real-time weather data.
              </div>
            </div>

            {/* Scoring Configuration */}
            <ScoringEditor 
              onSave={(factors) => {
                // In production, this would save to database and trigger recalculation
                console.log('Saving scoring factors:', factors);
                // Automatically trigger refresh after save
                setTimeout(async () => {
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session) {
                      await fetch('https://grnekxrkypgighmxyveh.supabase.co/functions/v1/auto-refresh-vibes', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${session.access_token}`
                        }
                      });
                    }
                  } catch (error) {
                    console.error('Auto-refresh after config save failed:', error);
                  }
                }, 1000);
              }}
              showNotification={showNotification}
            />

            {/* City Aggregation */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-lg mb-4">City Vibe Aggregation</h3>
              <p className="text-sm text-gray-600 mb-4">
                Aggregate individual venue scores into city-level vibe data for the CityGauge component.
              </p>
              <button 
                  onClick={async () => {
                    try {
                      setIsLoading(true);
                      showNotification('Aggregating city vibe scores...', 'info');
                      
                      const { data: { session } } = await supabase.auth.getSession();
                      if (!session) {
                        showNotification('Please log in to aggregate city vibes', 'error');
                        setIsLoading(false);
                        return;
                      }
                      
                      const response = await fetch('https://grnekxrkypgighmxyveh.supabase.co/functions/v1/aggregate-city-vibes', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${session.access_token}`
                        }
                      });
                      
                      const result = await response.json();
                      
                      if (response.ok) {
                        showNotification(`✅ Aggregated ${result.cities_processed || 0} cities from ${result.total_venues || 0} venues!`, 'success');
                      } else {
                        showNotification(`❌ Failed: ${result.error || 'Unknown error'}`, 'error');
                      }
                    } catch (error) {
                      showNotification(`❌ Error: ${error.message}`, 'error');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fa-solid fa-city mr-2"></i>
                {isLoading ? '⏳ Aggregating...' : 'Aggregate City Vibe Scores'}
              </button>
            </div>
            
            {/* Data Sources Status */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-lg mb-4">Data Sources Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <div className="font-bold text-sm text-gray-900">Google Places API</div>
                    <div className="text-xs text-gray-700">Venue quality data</div>
                  </div>
                  <div className="text-green-600 font-bold text-xs">✓ Active</div>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <div className="font-bold text-sm text-gray-900">WeatherAPI.com</div>
                    <div className="text-xs text-gray-700">Weather adjustments</div>
                  </div>
                  <div className="text-green-600 font-bold text-xs">✓ Active</div>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <div className="font-bold text-sm text-gray-900">Gemini AI</div>
                    <div className="text-xs text-gray-700">Contextual interpretation</div>
                  </div>
                  <div className="text-green-600 font-bold text-xs">✓ Active</div>
                </div>
              </div>
            </div>
            
            {/* Visual Scoring Configurator */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-lg mb-4">8-Factor Dynamic Scoring System</h3>
              <p className="text-sm text-gray-700 mb-4">Adjust the weight of each scoring component. Changes apply globally to all venues.</p>
              
              <div className="space-y-4">
                {[
                  { id: 'base_score', label: 'Base Score', desc: 'District + Venue Type (20-50 pts)', defaultValue: 1.0 },
                  { id: 'venue_quality', label: 'Venue Quality', desc: 'Rating + Price Level (0-30 pts)', defaultValue: 1.0 },
                  { id: 'venue_density', label: 'Venue Density', desc: 'Nearby Venues Boost (0-12 pts)', defaultValue: 1.0 },
                  { id: 'day_of_week', label: 'Day of Week', desc: 'Weekend vs Weekday (0-20 pts)', defaultValue: 1.0 },
                  { id: 'time_of_day', label: 'Time of Day', desc: 'Peak Hours Boost (0-15 pts)', defaultValue: 1.0 },
                  { id: 'weather', label: 'Weather', desc: 'Weather Conditions (-20 to +12 pts)', defaultValue: 1.0 },
                  { id: 'engagement', label: 'In-App Engagement', desc: 'Favorites + Check-ins + Reviews (0-25 pts)', defaultValue: 1.0 },
                  { id: 'ai_adjustment', label: 'AI Adjustment', desc: 'Gemini Contextual Analysis (-15 to +15 pts)', defaultValue: 1.0 }
                ].map(component => (
                  <div key={component.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-bold text-sm text-gray-900">{component.label}</div>
                        <div className="text-xs text-gray-600">{component.desc}</div>
                      </div>
                      <div className="text-lg font-bold text-primary">{component.defaultValue.toFixed(1)}x</div>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="2" 
                      step="0.1" 
                      defaultValue={component.defaultValue}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        e.target.nextElementSibling.textContent = `${value.toFixed(1)}x`;
                        // TODO: Save to database
                        console.log(`[Admin] ${component.id}_weight changed to ${value}`);
                      }}
                    />
                    <div className="text-xs text-gray-500 mt-1">Drag to adjust weight (0.0x - 2.0x)</div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex gap-3">
                <button 
                  onClick={async () => {
                    alert('Scoring weights saved! (TODO: Implement database save)');
                  }}
                  className="flex-1 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-hover"
                >
                  Save Weights
                </button>
                <button 
                  onClick={() => {
                    // Reset all sliders to 1.0
                    document.querySelectorAll('input[type="range"]').forEach((slider: any) => {
                      slider.value = 1.0;
                      slider.nextElementSibling.textContent = '1.0x';
                    });
                    alert('All weights reset to default (1.0x)');
                  }}
                  className="flex-1 py-3 bg-gray-100 text-dark rounded-lg font-bold hover:bg-gray-200"
                >
                  Reset to Default
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* PLANS TAB */}
        {activeTab === 'PLANS' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-lg mb-4">User Plans Analytics</h3>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{plansStats.total}</div>
                  <div className="text-xs text-gray-600">Total Active Plans</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{plansStats.scheduled}</div>
                  <div className="text-xs text-gray-600">Scheduled Plans</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{plansStats.completed}</div>
                  <div className="text-xs text-gray-600">Completed Plans</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">{plansStats.draft}</div>
                  <div className="text-xs text-gray-600">Draft Plans</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-lg mb-4">Plan Templates</h3>
              <p className="text-sm text-gray-500 mb-4">Create curated experiences for users to discover</p>
              <button className="w-full py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-hover">
                Create New Template
              </button>
            </div>
          </div>
        )}
        
        {/* RECOMMENDATIONS TAB */}
        {activeTab === 'RECOMMENDATIONS' && (
           <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">Featured Venue Management</h3>
                    <div className="text-xs bg-orange-50 text-orange-600 px-3 py-1 rounded-full font-bold border border-orange-100">
                       Hybrid Engine Active
                    </div>
                 </div>
                 <p className="text-sm text-gray-500 mb-6">
                    Manage which venues appear in the "Recommended for You" section. The algorithm combines User Persona matches + Popularity + these Paid Promotions.
                 </p>

                 <div className="overflow-hidden rounded-xl border border-gray-200">
                    <table className="w-full text-left text-sm">
                       <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                          <tr>
                             <th className="p-4 font-bold uppercase text-[10px]">Venue</th>
                             <th className="p-4 font-bold uppercase text-[10px]">District</th>
                             <th className="p-4 font-bold uppercase text-[10px]">Current Score</th>
                             <th className="p-4 font-bold uppercase text-[10px]">Promoted Status</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100 bg-white">
                          {adminVenues.map(venue => (
                             <tr key={venue.id} className="hover:bg-gray-50">
                                <td className="p-4 font-bold text-dark flex items-center gap-3">
                                   <img src={venue.imageUrl} className="w-8 h-8 rounded-full object-cover" />
                                   {venue.name}
                                </td>
                                <td className="p-4 text-gray-500 text-xs">{venue.district}</td>
                                <td className="p-4">
                                   <span className="font-bold" style={{ color: venue.vibeScore >= 90 ? '#EF4444' : '#EAB308' }}>
                                      {(venue.vibeScore/10).toFixed(1)}
                                   </span>
                                </td>
                                <td className="p-4">
                                   <button 
                                     onClick={() => toggleVenuePromotion(venue.id)}
                                     className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition ${venue.isPromoted ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-400'}`}
                                   >
                                      <i className={`fa-solid ${venue.isPromoted ? 'fa-star' : 'fa-star-half-stroke'}`}></i>
                                      {venue.isPromoted ? 'Featured' : 'Standard'}
                                   </button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        )}

        {/* ONBOARDING TAB */}
        {activeTab === 'ONBOARDING' && (
           <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                 <h3 className="font-bold text-lg mb-4">Manage Intro Slides</h3>
                 <div className="space-y-6">
                    {onboardingSlides.map((slide, index) => (
                       <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                          <div className="flex justify-between items-center mb-3">
                             <span className="text-xs font-bold text-gray-400 uppercase">Slide {index + 1}</span>
                             <i className="fa-solid fa-grip-lines text-gray-300 cursor-move"></i>
                          </div>
                          <div className="space-y-3">
                             <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Title</label>
                                <input 
                                  type="text" 
                                  value={slide.title}
                                  onChange={(e) => updateSlide(index, 'title', e.target.value)}
                                  className="w-full p-2 text-sm border border-gray-200 rounded-lg font-bold text-dark"
                                />
                             </div>
                             <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Description</label>
                                <textarea 
                                  value={slide.desc}
                                  onChange={(e) => updateSlide(index, 'desc', e.target.value)}
                                  className="w-full p-2 text-xs border border-gray-200 rounded-lg"
                                  rows={2}
                                />
                             </div>
                             <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Image URL</label>
                                <div className="flex gap-2">
                                   <input 
                                      type="text" 
                                      value={slide.image}
                                      onChange={(e) => updateSlide(index, 'image', e.target.value)}
                                      className="flex-1 p-2 text-xs border border-gray-200 rounded-lg font-mono text-gray-600"
                                   />
                                   <img src={slide.image} className="w-10 h-10 rounded object-cover border border-gray-200" />
                                </div>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        )}

        {/* MONETIZATION TAB */}
        {activeTab === 'MONETIZATION' && (
          <div className="space-y-8">
            
            {/* Subscriptions */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-lg mb-2">Subscription Plans (A/B Testing)</h3>
              <p className="text-sm text-gray-500 mb-6">Toggle plans to control what users see in the Premium Upgrade screen.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {subscriptionPlans.map(plan => (
                   <div key={plan.id} className={`p-5 rounded-2xl border relative ${plan.isActive ? 'border-primary bg-orange-50' : 'border-gray-200 bg-gray-50 opacity-75'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-black text-xl">{plan.name}</h4>
                        <button onClick={() => togglePlan(plan.id)} className="text-2xl">
                          <i className={`fa-solid fa-toggle-${plan.isActive ? 'on text-primary' : 'off text-gray-300'}`}></i>
                        </button>
                      </div>
                      <div className="text-lg font-bold text-gray-700 mb-4">${plan.priceMonthly}<span className="text-xs font-normal text-gray-400">/mo</span></div>
                      <ul className="space-y-2 mb-4">
                        {plan.perks.slice(0, 3).map((perk, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-center gap-2">
                            <i className="fa-solid fa-check text-green-500"></i> {perk}
                          </li>
                        ))}
                      </ul>
                      <div className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{plan.isActive ? 'LIVE' : 'DISABLED'}</div>
                   </div>
                 ))}
              </div>
            </div>

            {/* Affiliates */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-lg mb-4">Affiliate Partners</h3>
              <div className="flex gap-2 mb-6">
                 <input 
                   type="text" 
                   placeholder="Partner Name" 
                   value={newAffiliateName}
                   onChange={(e) => setNewAffiliateName(e.target.value)}
                   className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                 />
                 <input 
                   type="text" 
                   placeholder="Affiliate ID" 
                   value={newAffiliateId}
                   onChange={(e) => setNewAffiliateId(e.target.value)}
                   className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                 />
                 <button onClick={addAffiliate} className="bg-dark text-white px-4 rounded-lg text-sm font-bold">Add</button>
              </div>
              
              <div className="space-y-2">
                {affiliates.map(aff => (
                  <div key={aff.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="font-bold text-sm w-1/3">{aff.partnerName}</span>
                    <code className="text-xs text-blue-600 font-mono bg-blue-50 px-2 py-1 rounded">{aff.affiliateId}</code>
                    <button onClick={() => deleteAffiliate(aff.id)} className="text-gray-400 hover:text-red-500"><i className="fa-solid fa-trash"></i></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TICKER TAB */}
        {activeTab === 'TICKER' && (
           <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                 <h3 className="font-bold text-lg mb-4">Ticker Content Sources</h3>
                 <div className="space-y-4">
                    {tickerSources.map(source => (
                       <div key={source.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex justify-between items-center mb-2">
                             <div className="flex items-center gap-2">
                                <i className={`fa-solid ${source.type === 'API' ? 'fa-rss' : 'fa-keyboard'} text-gray-400`}></i>
                                <span className="font-bold text-dark">{source.name}</span>
                             </div>
                             <button onClick={() => toggleTickerSource(source.id)}>
                                <i className={`fa-solid fa-toggle-${source.isActive ? 'on text-green-500' : 'off text-gray-300'} text-xl`}></i>
                             </button>
                          </div>
                          {source.type === 'Manual' && (
                             <textarea 
                               className="w-full p-2 text-xs border border-gray-200 rounded-lg mt-2" 
                               defaultValue={source.content}
                               rows={2}
                             />
                          )}
                       </div>
                    ))}
                 </div>
                 <button className="w-full mt-4 py-3 border border-dashed border-gray-300 rounded-xl text-gray-500 text-xs font-bold hover:bg-gray-50">
                    + Add Notification Source
                 </button>
              </div>
           </div>
        )}

        {/* DESIGN TAB */}
        {activeTab === 'DESIGN' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-lg mb-6">Dual Theme Control</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* App Theme */}
                 <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">App UI Theme</label>
                    <div className="space-y-2">
                       {[ThemePreference.AUTO, ThemePreference.LIGHT, ThemePreference.DARK].map(theme => (
                          <button 
                            key={theme}
                            onClick={() => setAppTheme(theme)}
                            className={`w-full p-3 rounded-lg border flex justify-between items-center transition ${appTheme === theme ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-gray-200 text-gray-500'}`}
                          >
                             <span>{theme}</span>
                             {appTheme === theme && <i className="fa-solid fa-check"></i>}
                          </button>
                       ))}
                    </div>
                 </div>

                 {/* Map Theme */}
                 <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Map Layer Style</label>
                    <div className="space-y-2">
                       {[MapTheme.AUTO, MapTheme.LIGHT, MapTheme.DARK, MapTheme.SATELLITE].map(theme => (
                          <button 
                            key={theme}
                            onClick={() => setMapTheme(theme)}
                            className={`w-full p-3 rounded-lg border flex justify-between items-center transition ${mapTheme === theme ? 'border-blue-500 bg-blue-50 text-blue-600 font-bold' : 'border-gray-200 text-gray-500'}`}
                          >
                             <span>{theme}</span>
                             {mapTheme === theme && <i className="fa-solid fa-layer-group"></i>}
                          </button>
                       ))}
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}
        
        {/* SERVICES TAB */}
        {activeTab === 'SERVICES' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-lg mb-4">Manage Third-Party Providers</h3>
              <div className="space-y-3">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs" style={{backgroundColor: service.color}}>
                          <i className={`fa-solid ${service.icon}`}></i>
                       </div>
                       <span className="font-bold text-sm text-dark">{service.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <button onClick={() => toggleService(service.id)} className="text-gray-400 hover:text-dark">
                          <i className={`fa-solid fa-toggle-${service.isActive ? 'on text-green-500' : 'off'} text-xl`}></i>
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SOURCES TAB */}
        {activeTab === 'SOURCES' && (
          <div className="space-y-6">
             <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Ingestion Pipelines</h3>
                  <button className="text-xs font-bold text-primary border border-primary/20 px-3 py-1.5 rounded-full hover:bg-primary/5">
                    <i className="fa-solid fa-rotate mr-1"></i> Sync All
                  </button>
               </div>

               {/* Add Source Form */}
               <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Add New Pipeline</h4>
                  <div className="flex flex-wrap gap-2">
                     <input 
                       type="text" 
                       placeholder="Source Name (e.g. Ticketmaster NY)" 
                       className="flex-1 p-2 text-sm border border-gray-200 rounded-lg"
                       value={newSourceName}
                       onChange={(e) => setNewSourceName(e.target.value)}
                     />
                     <select 
                        className="p-2 text-sm border border-gray-200 rounded-lg"
                        value={newSourceProvider}
                        onChange={(e) => setNewSourceProvider(e.target.value)}
                     >
                        <option value="Google">Google Places</option>
                        <option value="Yelp">Yelp Fusion</option>
                        <option value="Eventbrite">Eventbrite</option>
                        <option value="Other">Custom API</option>
                     </select>
                     <select 
                        className="p-2 text-sm border border-gray-200 rounded-lg"
                        value={newSourceInterval}
                        onChange={(e) => setNewSourceInterval(e.target.value)}
                     >
                        <option value="15m">Every 15m (Hot)</option>
                        <option value="1h">Hourly (Std)</option>
                        <option value="6h">Every 6h (Slow)</option>
                     </select>
                     <button 
                        onClick={addDataSource}
                        className="bg-dark text-white px-4 py-2 rounded-lg text-sm font-bold"
                     >
                        Add
                     </button>
                  </div>
               </div>

               <div className="space-y-3">
                  {dataSources.map(ds => (
                      <div key={ds.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <div>
                             <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${ds.status === 'Active' ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`}></div>
                                <span className="font-bold text-sm text-dark">{ds.name}</span>
                                <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 rounded text-gray-600">{ds.provider}</span>
                             </div>
                             <div className="text-xs text-gray-500 mt-1">Syncs: {ds.interval} • Last: {ds.lastSync}</div>
                          </div>
                          <div className="flex gap-2">
                             <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500"><i className="fa-solid fa-rotate"></i></button>
                             <button onClick={() => removeDataSource(ds.id)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500"><i className="fa-solid fa-trash"></i></button>
                          </div>
                      </div>
                  ))}
               </div>
            </div>
          </div>
        )}
        
        {/* USERS TAB */}
        {activeTab === 'USERS' && (
           <div className="space-y-4">
             {[1, 2].map((i) => (
               <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                 <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                   <i className="fa-solid fa-store text-gray-500"></i>
                 </div>
                 <div className="flex-1">
                   <h4 className="font-bold text-sm">Club Nova {i}</h4>
                   <p className="text-xs text-gray-500">Claimed by: manager@{i}.com</p>
                 </div>
                 <div className="flex gap-2">
                   <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><i className="fa-solid fa-xmark"></i></button>
                   <button className="p-2 text-green-500 hover:bg-green-50 rounded-lg"><i className="fa-solid fa-check"></i></button>
                 </div>
               </div>
             ))}
           </div>
        )}

        {/* PREFERENCES TAB */}
        {activeTab === 'PREFERENCES' && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <div className="flex items-start gap-3">
                <i className="fa-solid fa-info-circle text-blue-500 mt-0.5"></i>
                <div>
                  <h4 className="font-bold text-sm text-blue-900 mb-1">User Preferences Analytics</h4>
                  <p className="text-xs text-blue-700">View aggregate user preference data to understand your audience better. This helps optimize venue recommendations and partnerships.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-xs font-bold text-gray-400 uppercase mb-2">Top Music Genres</div>
                <div className="space-y-2">
                  {['House', 'Hip Hop', 'Techno', 'Pop', 'Afrobeats'].map((genre, i) => (
                    <div key={genre} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{genre}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(5-i)*20}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-gray-500">{(5-i)*20}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-xs font-bold text-gray-400 uppercase mb-2">Budget Preferences</div>
                <div className="space-y-2">
                  {['$$', '$$$', '$', '$$$$'].map((tier, i) => (
                    <div key={tier} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{tier}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-500 rounded-full" style={{ width: `${[45, 30, 15, 10][i]}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-gray-500">{[45, 30, 15, 10][i]}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-xs font-bold text-gray-400 uppercase mb-2">Popular Missions</div>
                <div className="space-y-2">
                  {['Meet People', 'Dance & Sweat', 'Chill & Talk', 'Impress Date'].map((mission, i) => (
                    <div key={mission} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{mission}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${[60, 45, 30, 20][i]}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-gray-500">{[60, 45, 30, 20][i]}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-xs font-bold text-gray-400 uppercase mb-2">Timing Preferences</div>
                <div className="space-y-2">
                  {['Prime Time', 'Late Night', 'Happy Hour', 'Afters'].map((time, i) => (
                    <div key={time} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{time}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500 rounded-full" style={{ width: `${[70, 50, 35, 15][i]}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-gray-500">{[70, 50, 35, 15][i]}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-xs font-bold text-gray-400 uppercase mb-3">Travel Mode Users</div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-700">Locals</span>
                    <span className="text-sm font-bold text-gray-900">75%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-700">Travelers</span>
                    <span className="text-sm font-bold text-gray-900">25%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: '25%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 rounded-xl text-white">
              <h4 className="font-bold mb-2">💡 Insights & Recommendations</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <i className="fa-solid fa-check-circle mt-0.5"></i>
                  <span>House music is the most popular genre - consider partnering with more House music venues</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="fa-solid fa-check-circle mt-0.5"></i>
                  <span>45% of users prefer moderate pricing ($$) - optimize recommendations for this tier</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="fa-solid fa-check-circle mt-0.5"></i>
                  <span>Prime Time (21:00-00:00) is the most popular - focus marketing efforts on this window</span>
                </li>
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
