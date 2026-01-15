import React, { useState, useEffect } from 'react';
import { Venue } from '../../types';
import { getVibeColor } from '../../constants';
import { dataService } from '../../services/dataService';

interface PlansProps {
  onClose: () => void;
  onSelectVenue: (venue: Venue) => void;
  venues: Venue[];
}

interface Plan {
  id: string;
  title: string;
  description?: string;
  status: string;
  scheduled_date?: string;
  created_at: string;
  plan_venues: Array<{
    id: string;
    venue_id: string;
    order_index: number;
    venues: {
      id: string;
      name: string;
      type: string;
      image_url: string;
      latitude: number;
      longitude: number;
      vibe_score: number;
      vibe_confidence: string;
      district: string;
    };
  }>;
}

const Plans: React.FC<PlansProps> = ({ onClose, onSelectVenue, venues }) => {
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'PAST' | 'DRAFTS'>('UPCOMING');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanDescription, setNewPlanDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.error('[Plans] Loading timeout after 15 seconds');
        setLoading(false);
        alert('Loading plans is taking longer than expected. Please refresh the page.');
      }
    }, 15000);

    loadPlans();

    return () => clearTimeout(timeout);
  }, []);

  const loadPlans = async (retryCount = 0) => {
    try {
      console.log(`[Plans] Loading plans... (attempt ${retryCount + 1})`);
      setLoading(true);
      
      const data = await dataService.fetchUserPlans();
      console.log('[Plans] Loaded plans:', data);
      
      if (!data) {
        console.warn('[Plans] fetchUserPlans returned null/undefined');
      }
      
      setPlans(data || []);
      console.log('[Plans] Plans state updated, count:', (data || []).length);
    } catch (error) {
      console.error(`[Plans] Error loading plans (attempt ${retryCount + 1}):`, error);
      console.error('[Plans] Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
      
      // Retry up to 2 times with exponential backoff
      if (retryCount < 2) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s
        console.log(`[Plans] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return loadPlans(retryCount + 1);
      }
      
      alert(`Failed to load plans after ${retryCount + 1} attempts. Error: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!newPlanTitle.trim()) {
      console.log('[Plans] Create plan aborted: empty title');
      alert('Please enter a plan title');
      return;
    }

    if (isCreating) {
      console.log('[Plans] Already creating plan, ignoring click');
      return;
    }

    try {
      setIsCreating(true);
      console.log('[Plans] Creating plan:', { title: newPlanTitle, description: newPlanDescription });
      const newPlan = await dataService.createPlan(newPlanTitle, newPlanDescription);
      console.log('[Plans] Plan created successfully:', newPlan);
      
      // Clear form and close modal
      setNewPlanTitle('');
      setNewPlanDescription('');
      setShowCreateModal(false);
      
      console.log('[Plans] Reloading plans...');
      await loadPlans();
      console.log('[Plans] Plans reloaded');
      
      alert('Plan created successfully!');
    } catch (error) {
      console.error('[Plans] Error creating plan:', error);
      alert(`Failed to create plan: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
      await dataService.deletePlan(planId);
      await loadPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('Failed to delete plan. Please try again.');
    }
  };

  const filteredPlans = plans.filter(p => {
    if (activeTab === 'UPCOMING') return p.status === 'scheduled' || p.status === 'active';
    if (activeTab === 'PAST') return p.status === 'completed';
    return p.status === 'draft';
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleVenueClick = (planVenue: Plan['plan_venues'][0]) => {
    const venue: Venue = {
      id: planVenue.venues.id,
      name: planVenue.venues.name,
      type: planVenue.venues.type,
      imageUrl: planVenue.venues.image_url || 'https://picsum.photos/400/300',
      coordinates: { lat: planVenue.venues.latitude, lng: planVenue.venues.longitude },
      vibeScore: planVenue.venues.vibe_score,
      vibeConfidence: planVenue.venues.vibe_confidence,
      vibeTrend: 'Stable',
      district: planVenue.venues.district,
      description: '',
      priceLevel: 2,
      isPromoted: false,
      isFavorite: false
    };
    onSelectVenue(venue);
  };

  return (
    <div className="absolute inset-0 z-[50] bg-gray-50 flex flex-col font-sans animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="bg-white p-6 pt-12 shadow-sm border-b border-gray-200 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-dark">My Plans</h1>
          <p className="text-xs text-gray-500 font-medium">Manage your night out</p>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
           <i className="fa-solid fa-xmark"></i>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        {['UPCOMING', 'PAST', 'DRAFTS'].map(tab => {
          const count = plans.filter(p => {
            if (tab === 'UPCOMING') return p.status === 'scheduled' || p.status === 'active';
            if (tab === 'PAST') return p.status === 'completed';
            return p.status === 'draft';
          }).length;
          
          return (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition ${activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-dark'} flex items-center justify-center gap-2`}
            >
              <span>{tab}</span>
              {count > 0 && (
                <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold ${activeTab === tab ? 'bg-primary text-white' : 'bg-gray-300 text-gray-600'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <i className="fa-regular fa-calendar-xmark text-4xl mb-3"></i>
            <p className="text-sm">No {activeTab.toLowerCase()} plans found.</p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-6 py-2 bg-primary text-white rounded-full text-sm font-bold hover:bg-primary-hover"
            >
              Create Your First Plan
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPlans.map(plan => (
              <div key={plan.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-dark text-lg">{plan.title}</h3>
                    {plan.description && (
                      <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <i className="fa-regular fa-clock"></i> {formatDate(plan.scheduled_date || plan.created_at)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleDeletePlan(plan.id)}
                      className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center hover:text-red-500"
                    >
                      <i className="fa-solid fa-trash text-xs"></i>
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-gray-50/50">
                  <div className="text-[10px] font-bold uppercase text-gray-400 mb-2">
                    Itinerary ({plan.plan_venues?.length || 0} venues)
                  </div>
                  {plan.plan_venues && plan.plan_venues.length > 0 ? (
                    <div className="space-y-2">
                      {plan.plan_venues
                        .sort((a, b) => a.order_index - b.order_index)
                        .map((pv, idx) => (
                          <div 
                            key={pv.id} 
                            onClick={() => handleVenueClick(pv)}
                            className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-100 cursor-pointer hover:border-primary/30"
                          >
                            <div className="w-6 h-6 rounded-full bg-dark text-white flex items-center justify-center text-xs font-bold">
                              {idx + 1}
                            </div>
                            <img 
                              src={pv.venues.image_url || 'https://picsum.photos/400/300'} 
                              className="w-10 h-10 rounded object-cover" 
                              alt={pv.venues.name}
                            />
                            <div className="flex-1">
                              <div className="font-bold text-xs">{pv.venues.name}</div>
                              <div className="text-[10px] text-gray-500">{pv.venues.type}</div>
                            </div>
                            <div 
                              className="text-[10px] font-bold" 
                              style={{ color: getVibeColor(pv.venues.vibe_score) }}
                            >
                              {(pv.venues.vibe_score / 10).toFixed(1)}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 text-center py-4">
                      No venues added yet
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setShowCreateModal(true)}
        className="absolute bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center text-xl hover:bg-primary-hover transition transform active:scale-95"
      >
        <i className="fa-solid fa-plus"></i>
      </button>

      {/* Create Plan Modal */}
      {showCreateModal && (
        <div className="absolute inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl">
            <h3 className="font-bold text-lg mb-4 text-dark">Create New Plan</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Plan Title</label>
                <input
                  type="text"
                  value={newPlanTitle}
                  onChange={(e) => setNewPlanTitle(e.target.value)}
                  placeholder="e.g., Friday Night Out"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-dark focus:outline-none focus:border-primary"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Description (Optional)</label>
                <textarea
                  value={newPlanDescription}
                  onChange={(e) => setNewPlanDescription(e.target.value)}
                  placeholder="Add details about your plan..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-dark focus:outline-none focus:border-primary resize-none"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowCreateModal(false);
                  setNewPlanTitle('');
                  setNewPlanDescription('');
                }}
                className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-sm text-gray-600"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreatePlan}
                disabled={!newPlanTitle.trim() || isCreating}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Creating...
                  </span>
                ) : (
                  'Create Plan'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Plans;
