
import React from 'react';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] bg-primary flex flex-col items-center justify-center text-white animate-in fade-out duration-500 fill-mode-forwards">
      <div className="flex flex-col items-center animate-in zoom-in-95 duration-700">
        <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/30">
          <i className="fa-solid fa-location-dot text-4xl text-white drop-shadow-md"></i>
        </div>
        
        <h1 className="text-4xl font-black tracking-wider mb-2 text-center uppercase drop-shadow-sm">
          Kunajoto
        </h1>
        <p className="text-white/90 font-medium tracking-wide text-sm uppercase">
          Your Nightlife Vibe Forecast
        </p>
      </div>

      {/* Loading Spinner */}
      <div className="absolute bottom-20">
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    </div>
  );
};

export default SplashScreen;
