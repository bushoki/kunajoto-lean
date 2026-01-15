
import React from 'react';
import { AppState } from '../../types';
import { t } from '../../translations';

interface BottomNavProps {
  currentTab: string;
  setTab: (tab: string) => void;
  appState: AppState;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentTab, setTab, appState }) => {
  // Only show bottom nav in main app or guest map
  if (appState !== AppState.MAIN_APP && appState !== AppState.GUEST_MAP) return null;

  const tabs = [
    { id: 'explore', icon: 'fa-compass', label: t('nav.dashboard') }, // Changed ID to 'explore' and Icon to 'fa-compass'
    { id: 'map', icon: 'fa-map-location-dot', label: t('nav.map') },
    { id: 'ai', icon: 'custom-ai', label: t('nav.ai') },
    { id: 'profile', icon: 'fa-user', label: t('nav.profile') },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 pb-6 flex justify-between items-center z-40">
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <button 
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-primary transform -translate-y-1' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {tab.id === 'ai' ? (
              <div className="relative flex items-center justify-center w-6 h-6">
                 {/* Map Pin Silhouette */}
                 <i className={`fa-solid fa-location-dot text-xl ${isActive ? 'text-primary' : 'text-gray-400'}`}></i>
                 {/* AI Stars Inside */}
                 <i className={`fa-solid fa-wand-magic-sparkles absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[10px] ${isActive ? 'text-white' : 'text-gray-100'}`}></i>
              </div>
            ) : (
              <i className={`fa-solid ${tab.icon} text-xl`}></i>
            )}
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;
