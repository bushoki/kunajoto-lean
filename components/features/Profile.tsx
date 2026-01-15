
import React, { useState } from 'react';
import { UserRole, ThemePreference, SubscriptionPlan, MapTheme } from '../../types';
import { t } from '../../translations';
import AccountDetailsModal from './AccountDetailsModal';
import PrivacySettingsModal from './PrivacySettingsModal';

interface ProfileProps {
  onSwitchToAdmin: () => void;
  themePreference: ThemePreference;
  setThemePreference: (theme: ThemePreference) => void;
  mapTheme: MapTheme;
  setMapTheme: (theme: MapTheme) => void;
  onOpenPreferences: () => void;
  onOpenPlans: () => void;
  onOpenFavorites: () => void;
  favoritesCount: number;
  plansCount?: number;
  subscriptionPlans: SubscriptionPlan[];
  onLogout: () => void;
  userRole?: string;
  userEmail?: string;
  userName?: string;
  userId?: string;
  onProfileUpdate?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ 
  onSwitchToAdmin, 
  themePreference, 
  setThemePreference, 
  mapTheme,
  setMapTheme,
  onOpenPreferences, 
  onOpenPlans,
  onOpenFavorites,
  favoritesCount,
  plansCount = 0,
  subscriptionPlans,
  onLogout,
  userRole,
  userEmail,
  userName,
  userId,
  onProfileUpdate
}) => {
  const [safetyEnabled, setSafetyEnabled] = useState(false);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  
  // Find best active plan to show
  const activePlans = subscriptionPlans.filter(p => p.isActive && p.priceMonthly > 0).sort((a,b) => b.priceMonthly - a.priceMonthly);
  const displayPlan = activePlans.length > 0 ? activePlans[0] : null;

  return (
    <div className="h-full bg-gray-50 flex flex-col relative">
      
      {/* Admin Banner */}
      <div className="bg-dark text-white px-6 py-3 flex justify-between items-center z-10 shadow-sm">
         <h3 className="text-[10px] font-bold uppercase text-primary tracking-widest">Kunajoto</h3>
         <div className="flex gap-3 items-center">
           {(userRole === 'super_admin' || userRole === 'app_admin') && (
             <button onClick={onSwitchToAdmin} className="text-xs font-bold hover:text-primary transition">
               <i className="fa-solid fa-gear mr-1"></i> Switch to Admin View
             </button>
           )}
           <button 
             type="button"
             onMouseDown={(e) => {
               e.preventDefault();
               e.stopPropagation();
             }}
             onClick={(e) => {
               e.preventDefault();
               e.stopPropagation();
               console.log('🔴 Logout button clicked');
               onLogout();
             }}
             style={{ WebkitTapHighlightColor: 'transparent' }}
             className="text-xs font-bold text-red-400 hover:text-red-300 transition pointer-events-auto px-3 py-2 -mr-2 active:bg-red-900/20 rounded-lg touch-manipulation cursor-pointer select-none"
           >
             <i className="fa-solid fa-right-from-bracket mr-1"></i> Log out
           </button>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 pb-32">
        
        {/* Header */}
        <h1 className="text-3xl font-black text-dark mb-6">{t('nav.profile')}</h1>
        <p className="text-gray-500 text-sm -mt-4 mb-6">Control your settings, vibe and history</p>

        {/* User Card */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 mb-6 cursor-pointer hover:border-primary/30 transition" onClick={() => setShowAccountDetails(true)}>
           <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold">
             {userName ? userName.charAt(0).toUpperCase() : (userEmail ? userEmail.charAt(0).toUpperCase() : 'U')}
           </div>
           <div className="flex-1 overflow-hidden">
              <h3 className="font-bold text-dark truncate">{userName || userEmail?.split('@')[0] || 'User'}</h3>
              <p className="text-xs text-gray-500 truncate">{userEmail || 'No email'}</p>
           </div>
           <i className="fa-solid fa-chevron-right text-gray-300"></i>
        </div>

        {/* Subscription panel removed for kunajoto-lean */}

        {/* Actions Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
             <button 
               onClick={onOpenPlans}
               className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-primary/30 transition text-left"
             >
                 <i className="fa-solid fa-calendar-check text-xl text-primary mb-2"></i>
                 <div className="font-bold text-dark text-sm">My Plans</div>
                 <div className="text-[10px] text-gray-400">{plansCount} {plansCount === 1 ? 'Plan' : 'Plans'}</div>
             </button>
             <button 
               onClick={onOpenFavorites}
               className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-primary/30 transition text-left"
             >
                 <i className="fa-solid fa-heart text-xl text-red-500 mb-2"></i>
                 <div className="font-bold text-dark text-sm">Favorites</div>
                 <div className="text-[10px] text-gray-400">{favoritesCount} {favoritesCount === 1 ? 'Venue' : 'Venues'}</div>
             </button>
        </div>

        {/* Preferences */}
        <h3 className="font-bold text-dark mb-3">Preferences</h3>
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm mb-6">
           <button 
             onClick={onOpenPreferences}
             className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-50"
           >
              <div className="flex items-center gap-3">
                <i className="fa-solid fa-sliders text-primary/70"></i>
                <div className="text-left">
                  <div className="text-sm font-medium text-dark">Your vibe preferences</div>
                  <div className="text-[10px] text-gray-400">Vibe tags, music, budget, time & crowd size</div>
                </div>
              </div>
              <i className="fa-solid fa-chevron-right text-xs text-gray-300"></i>
           </button>
           
           {/* App Theme Toggle */}
           <div className="flex items-center justify-between p-4 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <i className="fa-solid fa-palette text-primary/70"></i>
                <div className="text-sm font-medium text-dark">{t('profile.settings.theme')}</div>
              </div>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                 {[ThemePreference.AUTO, ThemePreference.LIGHT, ThemePreference.DARK].map(theme => (
                   <button 
                     key={theme}
                     onClick={() => setThemePreference(theme)}
                     className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${themePreference === theme ? 'bg-white shadow text-dark' : 'text-gray-400'}`}
                   >
                     {theme === ThemePreference.AUTO ? 'Auto' : theme === ThemePreference.LIGHT ? 'Light' : 'Dark'}
                   </button>
                 ))}
              </div>
           </div>

           {/* Map Style Toggle */}
           <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <i className="fa-solid fa-map-location-dot text-primary/70"></i>
                <div className="text-left">
                   <div className="text-sm font-medium text-dark">Map Style</div>
                   <div className="text-[10px] text-gray-400">Overrides auto-dark mode</div>
                </div>
              </div>
              <select 
                value={mapTheme}
                onChange={(e) => setMapTheme(e.target.value as MapTheme)}
                className="bg-gray-100 border-none text-[10px] font-bold text-dark rounded-lg py-1.5 pl-2 pr-6 focus:ring-0 cursor-pointer"
              >
                 <option value={MapTheme.AUTO}>Auto (Time)</option>
                 <option value={MapTheme.LIGHT}>Light</option>
                 <option value={MapTheme.DARK}>Dark</option>
                 <option value={MapTheme.SATELLITE}>Satellite</option>
              </select>
           </div>
        </div>

        {/* Safety Section */}
        <h3 className="font-bold text-dark mb-3">{t('profile.safety.title')}</h3>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
           <div className="flex justify-between items-center mb-3">
              <p className="text-xs text-gray-500 w-2/3">{t('profile.safety.desc')}</p>
              <div 
                onClick={() => setSafetyEnabled(!safetyEnabled)}
                className={`w-10 h-6 rounded-full relative cursor-pointer transition duration-300 ${safetyEnabled ? 'bg-dark' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${safetyEnabled ? 'right-1' : 'left-1'}`}></div>
              </div>
           </div>
           <button className="w-full py-2 border border-gray-200 text-primary text-xs font-bold rounded-xl hover:bg-primary/5 transition">
             {t('profile.safety.btn')}
           </button>
        </div>

        {/* Privacy Settings Button */}
        <button 
          onClick={() => setShowPrivacySettings(true)}
          className="w-full p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-primary/30 transition text-left flex items-center justify-between mt-6"
        >
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-shield-halved text-xl text-primary/70"></i>
            <div>
              <div className="font-bold text-dark text-sm">Privacy & Security</div>
              <div className="text-[10px] text-gray-400">Manage your privacy settings and data</div>
            </div>
          </div>
          <i className="fa-solid fa-chevron-right text-xs text-gray-300"></i>
        </button>
      </div>

      {/* Modals */}
      {userId && userEmail && (
        <>
          {showAccountDetails && (
            <AccountDetailsModal
              onClose={() => setShowAccountDetails(false)}
              userId={userId}
              userEmail={userEmail}
              userName={userName}
              onUpdate={onProfileUpdate}
            />
          )}
          <PrivacySettingsModal
            isOpen={showPrivacySettings}
            onClose={() => setShowPrivacySettings(false)}
            userId={userId}
            userEmail={userEmail}
          />
        </>
      )}
    </div>
  );
};

export default Profile;
