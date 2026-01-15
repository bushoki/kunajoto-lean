
import React, { useState } from 'react';
import { OnboardingSlide } from '../../types';
import { USER_ONBOARDING_SLIDES, ONBOARDING_SLIDES } from '../../constants';

interface OnboardingProps {
  onComplete: (skipped: boolean) => void;
  type: 'GUEST' | 'USER';
  slides?: OnboardingSlide[]; // Allow dynamic slides
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, type, slides: propSlides }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  // Use prop slides for GUEST if provided and non-empty, otherwise fallback to constants
  const slides = (type === 'GUEST' && propSlides && propSlides.length > 0)
    ? propSlides
    : (type === 'GUEST' ? ONBOARDING_SLIDES : USER_ONBOARDING_SLIDES);

  // Safety check: if slides is still empty, skip onboarding
  if (!slides || slides.length === 0) {
    // Auto-skip if no slides available
    setTimeout(() => onComplete(true), 0);
    return null;
  }

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Finished all slides - mark as completed (not skipped)
      onComplete(false);
    }
  };

  const handleSkip = () => {
    // Skipped - pass true so we don't persist 'done' state
    onComplete(true);
  };

  return (
    <div className="absolute inset-0 bg-dark z-50 flex flex-col text-white">
      {/* Image Background Layer */}
      <div className="flex-1 relative overflow-hidden">
        <div 
           className="absolute inset-0 bg-cover bg-center transition-all duration-500 ease-in-out"
           style={{ 
             backgroundImage: `url(${slides[currentIndex].image})`,
             // Artistic / Handdrawn Effect using CSS Filters
             filter: 'contrast(1.2) grayscale(0.8) sepia(0.2)' 
           }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/50 to-transparent mix-blend-multiply"></div>
        </div>
      </div>

      {/* Content Layer */}
      <div className="relative px-6 pb-10 pt-4 flex flex-col h-1/2 justify-end bg-gradient-to-t from-dark to-transparent">
        <div className="mb-8">
           {/* Updated Typography to match Splash Screen: Uppercase, Font Black, Tracking Wider */}
           <h1 className="text-3xl font-black mb-3 leading-tight tracking-wider text-primary font-sans uppercase drop-shadow-sm">
             {slides[currentIndex].title}
           </h1>
           <p className="text-gray-300 text-lg leading-relaxed font-light">
             {slides[currentIndex].desc}
           </p>
        </div>

        {/* Indicators */}
        <div className="flex gap-2 mb-8">
          {slides.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-8 bg-primary' : 'w-2 bg-gray-600'}`}
            ></div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between">
          <button 
            onClick={handleSkip}
            className="text-gray-400 font-medium px-4 py-2 hover:text-white transition"
          >
            Skip
          </button>
          
          <button 
            onClick={handleNext}
            className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-primary/30 transition-all transform active:scale-95 flex items-center gap-2"
          >
            {currentIndex === slides.length - 1 ? (type === 'GUEST' ? 'Explore' : 'Finish') : 'Next'}
            <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
