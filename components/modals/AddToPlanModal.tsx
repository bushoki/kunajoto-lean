import React, { useState, useEffect } from 'react';
import { Venue } from '../../types';
import { dataService } from '../../services/dataService';

interface AddToPlanModalProps {
  venue: Venue;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Plan {
  id: string;
  title: string;
  date: string;
  status: string;
}

const AddToPlanModal: React.FC<AddToPlanModalProps> = ({ venue, onClose, onSuccess }) => {
  const [view, setView] = useState<'choose' | 'create' | 'select'>('choose');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanNotes, setNewPlanNotes] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    if (view === 'select') {
      loadPlans();
    }
  }, [view]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await dataService.fetchUserPlans();
      setPlans(data || []);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newPlanTitle.trim()) {
      alert('Please enter a plan title');
      return;
    }

    try {
      setLoading(true);
      
      // Create new plan
      const newPlan = await dataService.createPlan(newPlanTitle, newPlanNotes);
      
      // Add venue to the new plan
      await dataService.addVenueToPlan(newPlan.id, venue.id);
      
      alert(`✅ Added ${venue.name} to new plan "${newPlanTitle}"!`);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating plan and adding venue:', error);
      alert(`Failed: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToExisting = async () => {
    if (!selectedPlanId) {
      alert('Please select a plan');
      return;
    }

    try {
      setLoading(true);
      await dataService.addVenueToPlan(selectedPlanId, venue.id);
      
      const selectedPlan = plans.find(p => p.id === selectedPlanId);
      alert(`✅ Added ${venue.name} to "${selectedPlan?.title}"!`);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error adding venue to plan:', error);
      alert(`Failed: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-lg">Add to Plan</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-dark">
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Venue Info */}
          <div className="mb-4 p-3 bg-gray-50 rounded-xl flex items-center gap-3">
            <img 
              src={venue.imageUrl} 
              alt={venue.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm truncate">{venue.name}</div>
              <div className="text-xs text-gray-500">{venue.district}</div>
            </div>
          </div>

          {/* Choose View */}
          {view === 'choose' && (
            <div className="space-y-3">
              <button
                onClick={() => setView('create')}
                className="w-full p-4 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-plus-circle text-xl"></i>
                  <span>Create New Plan</span>
                </div>
                <i className="fa-solid fa-chevron-right"></i>
              </button>

              <button
                onClick={() => setView('select')}
                className="w-full p-4 bg-gray-100 text-dark rounded-xl font-bold hover:bg-gray-200 transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-list text-xl"></i>
                  <span>Add to Existing Plan</span>
                </div>
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          )}

          {/* Create New Plan View */}
          {view === 'create' && (
            <div className="space-y-4">
              <button
                onClick={() => setView('choose')}
                className="text-sm text-gray-500 hover:text-dark flex items-center gap-2"
              >
                <i className="fa-solid fa-arrow-left"></i>
                Back
              </button>

              <div>
                <label className="block text-sm font-bold text-dark mb-2">Plan Title *</label>
                <input
                  type="text"
                  value={newPlanTitle}
                  onChange={(e) => setNewPlanTitle(e.target.value)}
                  placeholder="e.g., Friday Night Out"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-dark mb-2">Notes (Optional)</label>
                <textarea
                  value={newPlanNotes}
                  onChange={(e) => setNewPlanNotes(e.target.value)}
                  placeholder="Add any notes..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary resize-none"
                  disabled={loading}
                />
              </div>

              <button
                onClick={handleCreateAndAdd}
                disabled={loading || !newPlanTitle.trim()}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Plan & Add Venue'}
              </button>
            </div>
          )}

          {/* Select Existing Plan View */}
          {view === 'select' && (
            <div className="space-y-4">
              <button
                onClick={() => setView('choose')}
                className="text-sm text-gray-500 hover:text-dark flex items-center gap-2"
              >
                <i className="fa-solid fa-arrow-left"></i>
                Back
              </button>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : plans.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <i className="fa-regular fa-calendar-xmark text-4xl mb-3"></i>
                  <p className="text-sm">No plans yet. Create one first!</p>
                  <button
                    onClick={() => setView('create')}
                    className="mt-4 px-6 py-2 bg-primary text-white rounded-full text-sm font-bold hover:bg-primary-hover"
                  >
                    Create Plan
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {plans.map(plan => (
                      <button
                        key={plan.id}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`w-full p-3 rounded-xl border-2 transition text-left ${
                          selectedPlanId === plan.id
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-bold text-sm">{plan.title}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(plan.date).toLocaleDateString()} • {plan.status}
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleAddToExisting}
                    disabled={loading || !selectedPlanId}
                    className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Adding...' : 'Add to Selected Plan'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddToPlanModal;
