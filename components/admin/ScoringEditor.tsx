import React, { useState, useEffect } from 'react';

interface ScoringFactor {
  id: string;
  name: string;
  description: string;
  basePoints: number;
  weight: number;
  enabled: boolean;
}

interface ScoringEditorProps {
  onSave: (factors: ScoringFactor[]) => void;
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const DEFAULT_FACTORS: ScoringFactor[] = [
  {
    id: 'day_of_week',
    name: 'Day of Week',
    description: 'Friday/Saturday boost for nightlife',
    basePoints: 20,
    weight: 1.0,
    enabled: true
  },
  {
    id: 'time_of_day',
    name: 'Time of Day',
    description: 'Peak hours 10pm-3am',
    basePoints: 15,
    weight: 1.0,
    enabled: true
  },
  {
    id: 'weather',
    name: 'Weather',
    description: 'Real-time weather impact',
    basePoints: 12,
    weight: 1.0,
    enabled: true
  },
  {
    id: 'venue_type',
    name: 'Venue Type',
    description: 'Nightclub > Bar > Restaurant',
    basePoints: 15,
    weight: 1.0,
    enabled: true
  },
  {
    id: 'venue_quality',
    name: 'Venue Quality',
    description: 'Rating and price level',
    basePoints: 30,
    weight: 1.0,
    enabled: true
  },
  {
    id: 'venue_density',
    name: 'Venue Density',
    description: 'District popularity',
    basePoints: 12,
    weight: 1.0,
    enabled: true
  },
  {
    id: 'engagement',
    name: 'User Engagement',
    description: 'Favorites, check-ins, reviews',
    basePoints: 25,
    weight: 1.0,
    enabled: true
  },
  {
    id: 'ai_adjustment',
    name: 'AI Adjustment',
    description: 'Gemini contextual analysis',
    basePoints: 15,
    weight: 1.0,
    enabled: true
  }
];

const ScoringEditor: React.FC<ScoringEditorProps> = ({ onSave, showNotification }) => {
  const [factors, setFactors] = useState<ScoringFactor[]>(DEFAULT_FACTORS);
  const [previewScore, setPreviewScore] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    calculatePreview();
  }, [factors]);

  const calculatePreview = () => {
    // Calculate a sample score with current settings
    const totalPoints = factors
      .filter(f => f.enabled)
      .reduce((sum, f) => sum + (f.basePoints * f.weight), 0);
    
    // Normalize to 0-100 scale (assuming max possible is sum of all base points)
    const maxPossible = factors.reduce((sum, f) => sum + f.basePoints, 0);
    const normalized = Math.min(100, (totalPoints / maxPossible) * 100);
    
    setPreviewScore(Math.round(normalized));
  };

  const updateFactor = (id: string, field: keyof ScoringFactor, value: any) => {
    setFactors(prev => prev.map(f => 
      f.id === id ? { ...f, [field]: value } : f
    ));
    setHasChanges(true);
  };

  const resetToDefaults = () => {
    setFactors(DEFAULT_FACTORS);
    setHasChanges(false);
    showNotification('Reset to default values', 'info');
  };

  const handleSave = () => {
    onSave(factors);
    setHasChanges(false);
    showNotification('✅ Scoring configuration saved! Recalculating all venue scores...', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Preview Card */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-lg mb-1 text-gray-900">Real-Time Score Preview</h4>
            <p className="text-sm text-gray-700 font-medium">
              Sample score with current settings
            </p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold text-blue-600">
              {(previewScore / 10).toFixed(1)}
            </div>
            <div className="text-sm text-gray-700 font-medium">out of 10</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4 bg-white rounded-full h-3 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${previewScore}%` }}
          />
        </div>
      </div>

      {/* Factors List */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Scoring Factors</h3>
          <div className="flex gap-2">
            {hasChanges && (
              <button
                onClick={resetToDefaults}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Reset to Defaults
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`px-4 py-2 text-sm rounded-lg transition ${
                hasChanges
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Save Changes
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {factors.map((factor) => (
            <div 
              key={factor.id}
              className={`p-4 rounded-lg border transition ${
                factor.enabled 
                  ? 'bg-white border-gray-200' 
                  : 'bg-gray-50 border-gray-100 opacity-60'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Enable Toggle */}
                <div className="pt-1">
                  <input
                    type="checkbox"
                    checked={factor.enabled}
                    onChange={(e) => updateFactor(factor.id, 'enabled', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                {/* Factor Info */}
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">
                    {factor.name}
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    {factor.description}
                  </div>

                  {/* Controls */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Base Points */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Base Points (max)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={factor.basePoints}
                        onChange={(e) => updateFactor(factor.id, 'basePoints', parseInt(e.target.value) || 0)}
                        disabled={!factor.enabled}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Weight */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Weight Multiplier
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="2"
                        step="0.1"
                        value={factor.weight}
                        onChange={(e) => updateFactor(factor.id, 'weight', parseFloat(e.target.value) || 0)}
                        disabled={!factor.enabled}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Effective Points */}
                  <div className="mt-2 text-sm">
                    <span className="text-gray-600">Effective points: </span>
                    <span className="font-bold text-blue-600">
                      {(factor.basePoints * factor.weight).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h4 className="font-bold mb-3">Configuration Summary</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {factors.filter(f => f.enabled).length}
            </div>
            <div className="text-xs text-gray-700 font-medium">Active Factors</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {factors.reduce((sum, f) => f.enabled ? sum + (f.basePoints * f.weight) : sum, 0).toFixed(0)}
            </div>
            <div className="text-xs text-gray-700 font-medium">Max Possible Points</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {(factors.reduce((sum, f) => f.enabled ? sum + f.weight : sum, 0) / factors.filter(f => f.enabled).length).toFixed(2)}
            </div>
            <div className="text-xs text-gray-700 font-medium">Avg Weight</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoringEditor;
