import React, { useState } from 'react';

interface Plan {
  id: string;
  title: string;
  description?: string;
  venues?: any[];
}

interface PlanSelectionModalProps {
  venue: { id: string; name: string };
  plans: Plan[];
  onSelectPlan: (planId: string) => void;
  onCreateNew: () => void;
  onClose: () => void;
}

const PlanSelectionModal: React.FC<PlanSelectionModalProps> = ({
  venue,
  plans,
  onSelectPlan,
  onCreateNew,
  onClose
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-dark">Add to Plan</h2>
          <p className="text-sm text-gray-600 mt-1">Choose where to add <span className="font-semibold">{venue.name}</span></p>
        </div>

        {/* Plans List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {/* Create New Plan Option */}
          <button
            onClick={() => {
              onCreateNew();
              onClose();
            }}
            className="w-full p-4 border-2 border-dashed border-primary/30 rounded-xl hover:border-primary hover:bg-primary/5 transition text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <i className="fa-solid fa-plus text-primary"></i>
              </div>
              <div>
                <div className="font-bold text-dark">Create New Plan</div>
                <div className="text-xs text-gray-500">Start a fresh itinerary</div>
              </div>
            </div>
          </button>

          {/* Existing Plans */}
          {plans.length > 0 && (
            <>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-4 mb-2">
                Or add to existing plan
              </div>
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`w-full p-4 border-2 rounded-xl transition text-left ${
                    selectedPlanId === plan.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedPlanId === plan.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <i className="fa-solid fa-calendar-days"></i>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-dark">{plan.title}</div>
                      {plan.description && (
                        <div className="text-xs text-gray-500 line-clamp-1">{plan.description}</div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        {plan.venues?.length || 0} venue{(plan.venues?.length || 0) !== 1 ? 's' : ''}
                      </div>
                    </div>
                    {selectedPlanId === plan.id && (
                      <i className="fa-solid fa-check text-primary"></i>
                    )}
                  </div>
                </button>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 text-dark rounded-lg font-bold hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (selectedPlanId) {
                onSelectPlan(selectedPlanId);
                onClose();
              }
            }}
            disabled={!selectedPlanId}
            className={`flex-1 py-3 rounded-lg font-bold transition ${
              selectedPlanId
                ? 'bg-primary text-white hover:bg-primary-hover'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Add to Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanSelectionModal;
