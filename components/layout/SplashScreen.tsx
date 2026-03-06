
import React from 'react';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] bg-primary flex flex-col items-center justify-center text-white animate-in fade-out duration-500 fill-mode-forwards">
      
      {/* Logo + Brand Block — centred, matching kunajoto.com style */}
      <div className="flex flex-col items-center animate-in zoom-in-95 duration-700">

        {/* Solid teardrop pin logo — mirrors kunajoto.com header icon */}
        <div className="mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="72"
            height="72"
            aria-label="Kunajoto pin logo"
          >
            {/* Filled white teardrop body */}
            <path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
              fill="white"
            />
            {/* Orange inner dot */}
            <circle cx="12" cy="9" r="2.5" fill="#FF6B35" />
          </svg>
        </div>

        {/* KUNAJOTO — Space Grotesk, bold, wide tracking */}
        <h1
          style={{
            fontFamily: "'Space Grotesk', 'Inter', sans-serif",
            fontWeight: 700,
            letterSpacing: '0.2em',
            fontSize: '2rem',
            textTransform: 'uppercase',
            lineHeight: 1,
            color: 'white',
            marginBottom: '0.5rem',
          }}
        >
          KUNAJOTO
        </h1>

        {/* Tagline — Space Grotesk, lighter, smaller tracking */}
        <p
          style={{
            fontFamily: "'Space Grotesk', 'Inter', sans-serif",
            fontWeight: 400,
            letterSpacing: '0.15em',
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.85)',
          }}
        >
          YOUR NIGHTLIFE VIBE FORECAST
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
