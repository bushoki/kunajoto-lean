module.exports = {
  darkMode: "class",
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#FF6B35', // Vibrant Orange
          hover: '#E85A2D',
          light: '#FF8A5E',
        },
        dark: {
          DEFAULT: '#121212',
          surface: '#1E1E1E',
          lighter: '#2C2C2C'
        },
        vibe: {
          low: '#3B82F6',   // Blue/Cold
          med: '#22C55E',   // Green/Moderate
          high: '#EAB308',  // Yellow/Warm
          hot: '#EF4444'    // Red/Hot
        }
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
        breathe: 'breathe 2s ease-in-out infinite',
        'venue-pulse': 'venue-pulse 2s infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        breathe: {
          '0%': { opacity: 0.4, transform: 'translate(-50%, -50%) scale(1)' },
          '50%': { opacity: 0, transform: 'translate(-50%, -50%) scale(2.5)' },
          '100%': { opacity: 0.4, transform: 'translate(-50%, -50%) scale(1)' },
        },
        'venue-pulse': {
          '0%': { transform: 'translate(-50%, -50%) scale(1)', opacity: 0.6 },
          '70%': { transform: 'translate(-50%, -50%) scale(1.6)', opacity: 0 },
          '100%': { transform: 'translate(-50%, -50%) scale(1)', opacity: 0 },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
