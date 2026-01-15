
import React, { useState } from 'react';
import { t } from '../../translations';
import { UserPreferences } from '../../types';

interface PreferenceFlowProps {
  onComplete: (wasSkipped: boolean, preferences?: UserPreferences) => void;
}

const PreferenceFlow: React.FC<PreferenceFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Complex State for 5 Steps
  const [prefs, setPrefs] = useState<UserPreferences>({
    isTravelMode: false,
    mission: [],
    music: [],
    crowdGroup: 'Small Group',
    crowdDensity: 'Buzzing',
    timing: ['Prime Time'],
    budgetMode: 'VIBE',
    budgetTier: '$$',
    budgetRange: [20, 100]
  });

  // --- OPTIONS DATA ---
  const missionOptions = [
    { id: 'Meet People', icon: 'fa-user-group' },
    { id: 'Dance & Sweat', icon: 'fa-fire' },
    { id: 'Impress Date', icon: 'fa-heart' },
    { id: 'Chill & Talk', icon: 'fa-martini-glass' },
    { id: 'Business', icon: 'fa-briefcase' }
  ];

  const musicOptions = ['House', 'Hip Hop', 'Techno', 'Jazz', 'Pop', 'Reggaeton', 'Rock', 'Afrobeats', 'Amapiano', 'R&B', 'Indie'];
  
  const crowdGroupOptions = ['Solo', 'Date', 'Small Group', 'Big Squad'];
  const crowdDensityOptions = ['Intimate', 'Buzzing', 'Packed', 'Raging'];
  
  const timingOptions = [
    { id: 'Happy Hour', label: '17:00 - 20:00' },
    { id: 'Prime Time', label: '21:00 - 00:00' },
    { id: 'Late Night', label: '00:00 - 03:00' },
    { id: 'Afters', label: '03:00+' }
  ];

  const budgetTiers = ['$', '$$', '$$$', '$$$$'];

  // --- HANDLERS ---

  const toggleSelection = (field: keyof UserPreferences, value: string) => {
    setPrefs(prev => {
      const current = prev[field] as string[];
      const exists = current.includes(value);
      return {
        ...prev,
        [field]: exists ? current.filter(v => v !== value) : [...current, value]
      };
    });
  };

  const handleNext = async () => {
    if (step < 4) {
      setStep(prev => prev + 1);
    } else {
      // Save to localStorage for immediate access
      localStorage.setItem('kunajoto_user_prefs', JSON.stringify(prefs));
      // Pass preferences to parent for database save
      onComplete(false, prefs);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(prev => prev - 1);
  };

  // Load existing preferences on mount
  React.useEffect(() => {
    const loadPreferences = async () => {
      try {
        // Try localStorage first (faster)
        const localPrefs = localStorage.getItem('kunajoto_user_prefs');
        if (localPrefs) {
          const parsed = JSON.parse(localPrefs);
          setPrefs(parsed);
          console.log('✅ Loaded preferences from localStorage');
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading preferences:', error);
        setIsLoading(false);
      }
    };
    loadPreferences();
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="absolute inset-0 z-[60] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-[60] bg-gray-50 flex flex-col font-sans animate-in fade-in duration-300">
      
      {/* --- HEADER --- */}
      <div className="pt-12 pb-4 px-6 bg-white shadow-sm z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-black text-dark tracking-tight">{t('prefs.title')}</h2>
            <p className="text-xs text-gray-500 font-medium">{t('prefs.subtitle')}</p>
          </div>
          
          {/* Travel Mode Toggle */}
          <div className="flex flex-col items-end">
            <div 
              onClick={() => setPrefs(p => ({...p, isTravelMode: !p.isTravelMode}))}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-colors border ${prefs.isTravelMode ? 'bg-primary/10 border-primary text-primary' : 'bg-gray-100 border-gray-200 text-gray-400'}`}
            >
               <i className="fa-solid fa-plane text-xs"></i>
               <span className="text-[10px] font-bold uppercase tracking-wide">{t('prefs.travel_mode')}</span>
               <div className={`w-6 h-3 rounded-full relative transition-colors ${prefs.isTravelMode ? 'bg-primary' : 'bg-gray-300'}`}>
                 <div className={`absolute top-0.5 w-2 h-2 bg-white rounded-full shadow transition-all ${prefs.isTravelMode ? 'right-0.5' : 'left-0.5'}`}></div>
               </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className={`h-1 rounded-full flex-1 transition-all duration-500 ${i <= step ? 'bg-primary' : 'bg-gray-200'}`}></div>
          ))}
        </div>
      </div>

      {/* --- CONTENT SCROLL --- */}
      <div className="flex-1 overflow-y-auto p-6 pb-32">
        
        {/* STEP 0: MISSION */}
        {step === 0 && (
          <div className="animate-in slide-in-from-right duration-300 space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary text-2xl">
                <i className="fa-solid fa-bullseye"></i>
              </div>
              <h3 className="text-xl font-bold text-dark">{t('prefs.step1.title')}</h3>
              <p className="text-sm text-gray-500">{t('prefs.step1.desc')}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {missionOptions.map(m => (
                <button
                  key={m.id}
                  onClick={() => toggleSelection('mission', m.id)}
                  className={`p-4 rounded-2xl border text-left transition-all active:scale-95 flex flex-col gap-2 ${
                    prefs.mission.includes(m.id) 
                    ? 'bg-dark text-white border-dark shadow-lg' 
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary/30'
                  }`}
                >
                  <i className={`fa-solid ${m.icon} text-xl ${prefs.mission.includes(m.id) ? 'text-primary' : 'text-gray-300'}`}></i>
                  <span className="font-bold text-sm">{m.id}</span>
                </button>
              ))}
            </div>
            
            <div className="mt-8 flex items-center gap-3 bg-blue-50 p-3 rounded-xl border border-blue-100">
              <i className="fa-solid fa-lightbulb text-blue-400"></i>
              <p className="text-xs text-blue-800 font-medium">{t('prefs.step1.tip')}</p>
            </div>
          </div>
        )}

        {/* STEP 1: MUSIC */}
        {step === 1 && (
          <div className="animate-in slide-in-from-right duration-300">
             <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-500 text-2xl">
                <i className="fa-solid fa-music"></i>
              </div>
              <h3 className="text-xl font-bold text-dark">{t('prefs.step2.title')}</h3>
              <p className="text-sm text-gray-500">{t('prefs.step2.desc')}</p>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              {musicOptions.map(genre => (
                <button
                  key={genre}
                  onClick={() => toggleSelection('music', genre)}
                  className={`px-5 py-2.5 rounded-full font-bold text-sm border transition-all active:scale-95 ${
                    prefs.music.includes(genre)
                      ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-200'
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>

            <div className="mt-8 flex items-center gap-3 bg-purple-50 p-3 rounded-xl border border-purple-100">
              <i className="fa-solid fa-lightbulb text-purple-400"></i>
              <p className="text-xs text-purple-800 font-medium">{t('prefs.step2.tip')}</p>
            </div>
          </div>
        )}

        {/* STEP 2: CROWD */}
        {step === 2 && (
          <div className="animate-in slide-in-from-right duration-300 space-y-8">
             <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500 text-2xl">
                <i className="fa-solid fa-users"></i>
              </div>
              <h3 className="text-xl font-bold text-dark">{t('prefs.step3.title')}</h3>
              <p className="text-sm text-gray-500">{t('prefs.step3.desc')}</p>
            </div>

            {/* Group Size */}
            <div>
               <label className="block text-xs font-bold text-gray-400 uppercase mb-3">I'm with...</label>
               <div className="grid grid-cols-2 gap-3">
                 {crowdGroupOptions.map(opt => (
                   <button
                     key={opt}
                     onClick={() => setPrefs(p => ({...p, crowdGroup: opt}))}
                     className={`py-3 rounded-xl text-sm font-bold border transition ${prefs.crowdGroup === opt ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-500 border-gray-200'}`}
                   >
                     {opt}
                   </button>
                 ))}
               </div>
            </div>

            {/* Density Slider */}
            <div>
               <label className="block text-xs font-bold text-gray-400 uppercase mb-3">Crowd Energy</label>
               <input 
                 type="range" 
                 min="0" max="3" 
                 value={crowdDensityOptions.indexOf(prefs.crowdDensity)} 
                 onChange={(e) => setPrefs(p => ({...p, crowdDensity: crowdDensityOptions[parseInt(e.target.value)]}))}
                 className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
               />
               <div className="flex justify-between mt-2">
                  {crowdDensityOptions.map((opt, i) => (
                    <span key={opt} className={`text-[10px] font-bold transition ${prefs.crowdDensity === opt ? 'text-green-600' : 'text-gray-300'}`}>{opt}</span>
                  ))}
               </div>
            </div>

            <div className="flex items-center gap-3 bg-green-50 p-3 rounded-xl border border-green-100">
              <i className="fa-solid fa-lightbulb text-green-400"></i>
              <p className="text-xs text-green-800 font-medium">{t('prefs.step3.tip')}</p>
            </div>
          </div>
        )}

        {/* STEP 3: TIMING */}
        {step === 3 && (
           <div className="animate-in slide-in-from-right duration-300 space-y-6">
             <div className="text-center mb-6">
               <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-500 text-2xl">
                 <i className="fa-solid fa-clock"></i>
               </div>
               <h3 className="text-xl font-bold text-dark">{t('prefs.step4.title')}</h3>
               <p className="text-sm text-gray-500">{t('prefs.step4.desc')}</p>
             </div>

             <div className="space-y-3">
                {timingOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => toggleSelection('timing', opt.id)}
                    className={`w-full p-4 rounded-2xl border flex items-center justify-between transition active:scale-95 ${
                      prefs.timing.includes(opt.id)
                      ? 'bg-orange-500 text-white border-orange-500 shadow-lg'
                      : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <i className={`fa-regular ${prefs.timing.includes(opt.id) ? 'fa-circle-check' : 'fa-circle'} text-lg`}></i>
                      <span className="font-bold text-sm">{opt.id}</span>
                    </div>
                    <span className="text-xs font-mono opacity-80">{opt.label}</span>
                  </button>
                ))}
             </div>

             <div className="mt-8 flex items-center gap-3 bg-orange-50 p-3 rounded-xl border border-orange-100">
              <i className="fa-solid fa-lightbulb text-orange-400"></i>
              <p className="text-xs text-orange-800 font-medium">{t('prefs.step4.tip')}</p>
            </div>
           </div>
        )}

        {/* STEP 4: BUDGET */}
        {step === 4 && (
           <div className="animate-in slide-in-from-right duration-300 space-y-6">
             <div className="text-center mb-6">
               <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4 text-teal-500 text-2xl">
                 <i className="fa-solid fa-wallet"></i>
               </div>
               <h3 className="text-xl font-bold text-dark">{t('prefs.step5.title')}</h3>
               <p className="text-sm text-gray-500">{t('prefs.step5.desc')}</p>
             </div>

             {/* Mode Switcher */}
             <div className="bg-gray-100 p-1 rounded-xl flex mb-6">
               <button 
                 onClick={() => setPrefs(p => ({...p, budgetMode: 'VIBE'}))}
                 className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition ${prefs.budgetMode === 'VIBE' ? 'bg-white shadow text-dark' : 'text-gray-400'}`}
               >
                 {t('prefs.budget.vibe')}
               </button>
               <button 
                 onClick={() => setPrefs(p => ({...p, budgetMode: 'EXACT'}))}
                 className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition ${prefs.budgetMode === 'EXACT' ? 'bg-white shadow text-dark' : 'text-gray-400'}`}
               >
                 {t('prefs.budget.exact')}
               </button>
             </div>

             {prefs.budgetMode === 'VIBE' ? (
               <div className="flex flex-col gap-3">
                  {budgetTiers.map((b, i) => (
                    <button
                      key={b}
                      onClick={() => setPrefs(p => ({ ...p, budgetTier: b }))}
                      className={`p-5 rounded-2xl font-bold text-left border transition-all active:scale-95 flex justify-between items-center ${
                        prefs.budgetTier === b
                          ? 'bg-teal-500 text-white border-teal-500 shadow-lg shadow-teal-200'
                          : 'bg-white text-dark border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-xl tracking-widest">{b}</span>
                      <span className="text-xs font-medium opacity-80">
                        {i === 0 ? 'Cheap Eats' : i === 1 ? 'Moderate' : i === 2 ? 'Upscale' : 'Luxury'}
                      </span>
                    </button>
                  ))}
               </div>
             ) : (
               <div className="bg-white p-6 rounded-2xl border border-gray-200 text-center">
                  <div className="text-4xl font-black text-teal-600 mb-2">
                    ${prefs.budgetRange[0]} - ${prefs.budgetRange[1] === 500 ? '500+' : prefs.budgetRange[1]}
                  </div>
                  <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-6">Per Person</div>
                  
                  <input 
                    type="range" 
                    min="0" max="500" step="10"
                    value={prefs.budgetRange[1]}
                    onChange={(e) => setPrefs(p => ({...p, budgetRange: [prefs.budgetRange[0], parseInt(e.target.value)]}))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-2">
                    <span>$0</span>
                    <span>$250</span>
                    <span>$500+</span>
                  </div>
               </div>
             )}
             
             <div className="mt-8 flex items-center gap-3 bg-teal-50 p-3 rounded-xl border border-teal-100">
              <i className="fa-solid fa-lightbulb text-teal-400"></i>
              <p className="text-xs text-teal-800 font-medium">{t('prefs.step5.tip')}</p>
            </div>
           </div>
        )}
      </div>

      {/* --- FOOTER ACTIONS --- */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100 flex justify-between items-center z-20">
        <div className="flex gap-4">
          {step > 0 && (
            <button onClick={handleBack} className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200">
              <i className="fa-solid fa-arrow-left"></i>
            </button>
          )}
          <button 
            onClick={() => onComplete(true)} 
            className="text-gray-400 font-bold text-xs hover:text-dark transition py-2.5"
          >
            {t('prefs.skip')}
          </button>
        </div>
        
        <button 
          onClick={handleNext}
          className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-primary/30 transition-all transform active:scale-95 flex items-center gap-2"
        >
          {step === 4 ? t('prefs.finish') : 'Next'}
          {step < 4 && <i className="fa-solid fa-arrow-right"></i>}
        </button>
      </div>
    </div>
  );
};

export default PreferenceFlow;
