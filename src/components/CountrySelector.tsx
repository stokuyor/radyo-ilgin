import React from 'react';
import { COUNTRIES } from '../data/stations';
import { retroAudio } from '../utils/audioEffects';
import { Globe } from 'lucide-react';

interface CountrySelectorProps {
  selectedCountryCode: string;
  isOtherCountriesMode: boolean;
  onSelectMainMode: (isOther: boolean) => void;
  onSelectCountryCode: (code: string) => void;
  nightMode?: boolean;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  selectedCountryCode,
  isOtherCountriesMode,
  onSelectMainMode,
  onSelectCountryCode,
  nightMode = false,
}) => {
  const otherCountries = COUNTRIES.filter((c) => c.code !== 'TR');

  return (
    <div className="w-full flex flex-col gap-2 select-none">
      {/* Primary 2-Way Toggle: TÜRKİYE vs DİĞER ÜLKELER */}
      <div
        className={`p-1 rounded-xl flex items-center gap-1 border transition-all ${
          nightMode
            ? 'bg-stone-950/90 border-amber-900/60 shadow-inner'
            : 'bg-stone-200/90 border-amber-800/30 shadow-sm'
        }`}
      >
        {/* Türkiye Tab Button */}
        <button
          type="button"
          onClick={() => {
            retroAudio.playSwitchClunk();
            onSelectMainMode(false);
          }}
          className={`flex-1 h-11 rounded-lg flex items-center justify-center gap-2 font-mono-retro font-bold text-xs sm:text-sm tracking-wide uppercase transition-all duration-150 cursor-pointer ${
            !isOtherCountriesMode
              ? 'bg-gradient-to-b from-amber-500 to-amber-600 text-stone-950 shadow-md border border-amber-300 font-extrabold'
              : nightMode
              ? 'text-amber-300/80 hover:text-amber-200 hover:bg-stone-900/60'
              : 'text-stone-700 hover:text-stone-950 hover:bg-white/60'
          }`}
        >
          <span className="text-base">🇹🇷</span>
          <span>TÜRKİYE RADYOLARI</span>
        </button>

        {/* Diğer Ülkeler Tab Button */}
        <button
          type="button"
          onClick={() => {
            retroAudio.playSwitchClunk();
            onSelectMainMode(true);
          }}
          className={`flex-1 h-11 rounded-lg flex items-center justify-center gap-2 font-mono-retro font-bold text-xs sm:text-sm tracking-wide uppercase transition-all duration-150 cursor-pointer ${
            isOtherCountriesMode
              ? 'bg-gradient-to-b from-amber-500 to-amber-600 text-stone-950 shadow-md border border-amber-300 font-extrabold'
              : nightMode
              ? 'text-amber-300/80 hover:text-amber-200 hover:bg-stone-900/60'
              : 'text-stone-700 hover:text-stone-950 hover:bg-white/60'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>DİĞER ÜLKELER</span>
        </button>
      </div>

      {/* Secondary Country Selector Strip when "DİĞER ÜLKELER" is selected */}
      {isOtherCountriesMode && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {otherCountries.map((country) => {
            const isSelected = selectedCountryCode === country.code;
            return (
              <button
                key={country.code}
                type="button"
                onClick={() => {
                  retroAudio.playKnobClick();
                  onSelectCountryCode(country.code);
                }}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-mono-retro font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-stone-950 font-bold border border-amber-300 shadow-sm'
                    : nightMode
                    ? 'bg-stone-900/90 text-amber-300/80 hover:text-amber-200 hover:bg-stone-850 border border-amber-900/40'
                    : 'bg-stone-100 text-stone-700 hover:text-stone-950 hover:bg-white border border-stone-300'
                }`}
              >
                <span>{country.flag}</span>
                <span>{country.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
