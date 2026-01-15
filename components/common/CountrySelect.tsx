import React, { useState, useRef, useEffect } from 'react';
import { ALL_COUNTRIES, POPULAR_COUNTRIES, Country } from '../../utils/countries';

interface CountrySelectProps {
  value: string;
  onChange: (country: string) => void;
  disabled?: boolean;
  className?: string;
}

const CountrySelect: React.FC<CountrySelectProps> = ({ 
  value, 
  onChange, 
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get selected country name
  const selectedCountry = ALL_COUNTRIES.find(c => c.name === value);

  // Filter countries based on search
  const filteredCountries = ALL_COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show popular countries first if no search
  const displayCountries = searchTerm 
    ? filteredCountries 
    : [...POPULAR_COUNTRIES, { code: 'divider', name: '---' } as Country, ...ALL_COUNTRIES];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus search input when dropdown opens
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (country: Country) => {
    if (country.code === 'divider') return;
    onChange(country.name);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Selected Value Display */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-3 text-left bg-gray-50 border border-gray-200 rounded-xl text-sm text-dark transition ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/30 cursor-pointer'
        } ${isOpen ? 'border-primary/50 ring-2 ring-primary/10' : ''}`}
      >
        <div className="flex items-center justify-between">
          <span className={selectedCountry ? 'text-dark' : 'text-gray-400'}>
            {selectedCountry ? selectedCountry.name : 'Select a country'}
          </span>
          <i className={`fa-solid fa-chevron-down text-xs text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-100 sticky top-0 bg-white">
            <div className="relative">
              <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search countries..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
              />
            </div>
          </div>

          {/* Countries List */}
          <div className="overflow-y-auto max-h-64">
            {displayCountries.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                No countries found
              </div>
            ) : (
              displayCountries.map((country, index) => {
                if (country.code === 'divider') {
                  return (
                    <div key="divider" className="border-t border-gray-200 my-1"></div>
                  );
                }

                const isSelected = country.name === value;
                const isPopular = POPULAR_COUNTRIES.some(c => c.code === country.code) && !searchTerm;

                return (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleSelect(country)}
                    className={`w-full px-4 py-2.5 text-left text-sm transition hover:bg-gray-50 flex items-center justify-between ${
                      isSelected ? 'bg-primary/5 text-primary font-medium' : 'text-dark'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {country.name}
                      {isPopular && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-bold">
                          POPULAR
                        </span>
                      )}
                    </span>
                    {isSelected && (
                      <i className="fa-solid fa-check text-primary text-xs"></i>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountrySelect;
