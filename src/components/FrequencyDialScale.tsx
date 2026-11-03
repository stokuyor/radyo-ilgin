import React from 'react';
import { Station } from '../data/stations';

interface FrequencyDialScaleProps {
  frequency: number;
  minFrequency?: number;
  maxFrequency?: number;
  currentStation: Station | null;
  stationsInScope: Station[];
  onSelectFrequency: (freq: number) => void;
  nightMode?: boolean;
  signalStrength: number; // 0 to 1
  isPlaying: boolean;
}

export const FrequencyDialScale: React.FC<FrequencyDialScaleProps> = ({
  frequency,
  minFrequency = 87.5,
  maxFrequency = 108.0,
  currentStation,
  stationsInScope,
  onSelectFrequency,
  nightMode = false,
  signalStrength,
  isPlaying,
}) => {
  const freqRange = maxFrequency - minFrequency;
  const needlePercent = Math.min(
    100,
    Math.max(0, ((frequency - minFrequency) / freqRange) * 100)
  );

  // Scale frequency markers every 2 MHz: 88, 90, 92, 94, 96, 98, 100, 102, 104, 106, 108
  const majorFrequencies = [88, 90, 92, 94, 96, 98, 100, 102, 104, 106, 108];

  // Magic Eye (Büyülü Göz) gap calculation: when signal is 1, gap is 0 (closed phosphor bar)
  // When signal is 0, gap is wide (open)
  const magicEyeGap = Math.max(2, Math.round((1 - signalStrength) * 32));

  return (
    <div className="w-full select-none">
      {/* Outer Brass / Chrome Dial Bezel Frame */}
      <div
        className={`relative rounded-xl p-2.5 sm:p-3 transition-colors duration-300 ${
          nightMode
            ? 'bg-stone-950 border-2 border-amber-900/60 shadow-[inset_0_4px_12px_rgba(0,0,0,0.9),0_2px_8px_rgba(0,0,0,0.8)]'
            : 'bg-stone-900 border-2 border-amber-600/60 shadow-[inset_0_3px_8px_rgba(0,0,0,0.7),0_2px_8px_rgba(40,20,10,0.2)]'
        }`}
      >
        {/* Vintage Top Status Bar: Signal Meter, Station Name, Magic Eye Tube */}
        <div className="flex items-center justify-between gap-2 mb-2 px-1">
          {/* Analog Signal S-Meter */}
          <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded border border-amber-500/20">
            <span className="text-[9px] font-mono-retro font-bold text-amber-500/90 tracking-tighter">
              SİNYAL
            </span>
            <div className="flex items-center gap-0.5 h-2.5">
              {[1, 2, 3, 4, 5].map((lvl) => {
                const isActive = signalStrength >= lvl * 0.18;
                return (
                  <div
                    key={lvl}
                    className={`w-1.5 h-full rounded-xs transition-colors duration-200 ${
                      isActive
                        ? lvl > 3
                          ? 'bg-emerald-400 shadow-[0_0_4px_#34d399]'
                          : 'bg-amber-400 shadow-[0_0_3px_#fbbf24]'
                        : 'bg-stone-800'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Current Tuned Station Name or Frequency */}
          <div className="text-center truncate px-2">
            <span
              className={`font-mono-retro text-xs sm:text-sm font-bold tracking-wider uppercase transition-colors ${
                currentStation && isPlaying
                  ? nightMode
                    ? 'text-amber-300 drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]'
                    : 'text-amber-200 drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]'
                  : 'text-stone-500'
              }`}
            >
              {currentStation ? currentStation.name : `${frequency.toFixed(1)} MHz (Boş Frekans)`}
            </span>
          </div>

          {/* Magic Eye Tube (EM84 "Büyülü Göz" Tuning Valve) */}
          <div
            className="flex items-center gap-1.5 bg-black/50 px-2 py-1 rounded border border-emerald-500/30"
            title="Büyülü Göz (EM84 Vakum Tüpü Ayar Göstergesi)"
          >
            <span className="text-[9px] font-mono-retro font-bold text-emerald-400/80 tracking-tighter hidden xs:inline">
              VAKUM
            </span>
            {/* Green Phosphor Tube Bars */}
            <div className="relative w-12 h-3 bg-stone-950 rounded-xs flex items-center justify-between px-0.5 overflow-hidden border border-emerald-900/60 shadow-[inset_0_0_4px_rgba(16,185,129,0.3)]">
              {/* Left phosphor bar */}
              <div
                className="h-2 bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-xs shadow-[0_0_6px_#10b981] transition-all duration-150"
                style={{
                  width: `${Math.max(2, (44 - magicEyeGap) / 2)}px`,
                }}
              />
              {/* Center gap */}
              <div
                className="h-2.5 bg-stone-900/90 mx-auto transition-all duration-150"
                style={{ width: `${magicEyeGap}px` }}
              />
              {/* Right phosphor bar */}
              <div
                className="h-2 bg-gradient-to-l from-emerald-500 to-emerald-300 rounded-xs shadow-[0_0_6px_#10b981] transition-all duration-150"
                style={{
                  width: `${Math.max(2, (44 - magicEyeGap) / 2)}px`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Backlit Analog Glass Scale Area */}
        <div
          className={`relative rounded-lg p-3 sm:p-4 overflow-hidden border transition-all duration-300 ${
            nightMode
              ? 'bg-[#120803] border-amber-800/50 shadow-[inset_0_0_35px_rgba(245,158,11,0.25)]'
              : 'bg-[#211309] border-amber-700/60 shadow-[inset_0_0_25px_rgba(251,191,36,0.2)]'
          }`}
          style={{
            backgroundImage: nightMode
              ? 'radial-gradient(ellipse at 50% 50%, rgba(245, 158, 11, 0.15) 0%, rgba(10, 4, 1, 0.95) 100%)'
              : 'radial-gradient(ellipse at 50% 50%, rgba(251, 191, 36, 0.18) 0%, rgba(20, 10, 4, 0.9) 100%)',
          }}
        >
          {/* Glass Glare Sheen Reflection */}
          <div className="absolute inset-0 dial-glass-glare pointer-events-none" />

          {/* Scale Header: FM MHz & Wave Bands */}
          <div className="flex items-center justify-between text-[10px] font-mono-retro font-bold text-amber-500/70 mb-2 border-b border-amber-500/20 pb-1">
            <span>FM STEREO BAND</span>
            <span className="tracking-widest">87.5 — 108.0 MHz</span>
            <span>HIGH FIDELITY</span>
          </div>

          {/* Station Markers Band above ticks */}
          <div className="relative h-6 w-full mb-1">
            {stationsInScope.map((st) => {
              const posPercent = ((st.frequency - minFrequency) / freqRange) * 100;
              const isMatch = Math.abs(frequency - st.frequency) < 0.15;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => onSelectFrequency(st.frequency)}
                  className={`absolute -top-1 -translate-x-1/2 cursor-pointer transition-all ${
                    isMatch
                      ? 'text-amber-300 font-bold scale-110 z-10'
                      : 'text-amber-500/60 hover:text-amber-400 font-medium'
                  }`}
                  style={{ left: `${posPercent}%` }}
                  title={`${st.name} (${st.frequency.toFixed(1)} MHz)`}
                >
                  <span className="text-[9px] font-mono-retro tracking-tighter block whitespace-nowrap">
                    {st.name.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Dial Ruler Ticks (Frequencies) */}
          <div className="relative h-9 w-full flex items-end">
            {/* Ticks Container */}
            <div className="absolute inset-0 flex justify-between items-end">
              {Array.from({ length: 42 }).map((_, index) => {
                const isMajor = index % 4 === 0;
                const isMedium = index % 2 === 0;
                return (
                  <div
                    key={index}
                    className={`w-[1px] transition-colors ${
                      isMajor
                        ? 'h-5 bg-amber-400 shadow-[0_0_2px_#f59e0b]'
                        : isMedium
                        ? 'h-3 bg-amber-500/60'
                        : 'h-1.5 bg-amber-600/40'
                    }`}
                  />
                );
              })}
            </div>

            {/* Glowing Orange Needle Line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 pointer-events-none transition-all duration-150 z-20 flex flex-col items-center"
              style={{
                left: `${needlePercent}%`,
                transform: 'translateX(-50%)',
              }}
            >
              {/* Needle Top Jewel */}
              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
              {/* Illuminated Vertical Needle */}
              <div className="w-[2px] flex-1 bg-gradient-to-b from-red-500 via-amber-400 to-red-600 shadow-[0_0_10px_#f97316]" />
              {/* Needle Bottom Arrow */}
              <div className="w-1.5 h-1.5 rotate-45 bg-red-500" />
            </div>
          </div>

          {/* Major Frequency Numbers Below Ticks */}
          <div className="relative w-full flex justify-between mt-1 pt-1 border-t border-amber-500/20 text-[10px] sm:text-[11px] font-mono-retro font-bold text-amber-400/90 tabular-nums">
            {majorFrequencies.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onSelectFrequency(f)}
                className="hover:text-amber-200 cursor-pointer p-0.5"
                title={`${f} MHz frekansına git`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Station Tagline & Category Sub-bar */}
        <div className="flex items-center justify-between text-[11px] mt-2 px-1 text-amber-500/80 font-mono-retro">
          <div className="truncate max-w-[70%]">
            {currentStation ? (
              <span>
                {currentStation.countryName} · {currentStation.tagline}
              </span>
            ) : (
              <span>Analog Frekans Arama Modu</span>
            )}
          </div>
          <div className="shrink-0 flex items-center gap-1 text-[10px]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isPlaying && currentStation
                  ? 'bg-amber-400 shadow-[0_0_5px_#fbbf24]'
                  : 'bg-stone-700'
              }`}
            />
            <span>{currentStation?.category || 'FM'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
