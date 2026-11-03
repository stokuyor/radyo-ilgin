import React from 'react';
import { Search, SkipBack, SkipForward, Radio } from 'lucide-react';

interface AutoScannerProps {
  onScanNext: () => void;
  onScanPrev: () => void;
  onAutoScanAll: () => void;
  isScanning: boolean;
  scanningFrequency: number | null;
  nightMode?: boolean;
  disabled?: boolean;
}

export const AutoScanner: React.FC<AutoScannerProps> = ({
  onScanNext,
  onScanPrev,
  onAutoScanAll,
  isScanning,
  scanningFrequency,
  nightMode = false,
  disabled = false,
}) => {
  return (
    <div className="w-full">
      {/* Header Label */}
      <div className="flex items-center justify-between mb-1.5 px-1">
        <div className="flex items-center gap-1.5">
          <Radio
            className={`w-3.5 h-3.5 ${
              isScanning
                ? 'text-amber-400 animate-spin'
                : nightMode
                ? 'text-amber-500/80'
                : 'text-amber-800/80'
            }`}
          />
          <span
            className={`text-[11px] font-mono-retro font-bold uppercase tracking-wider ${
              nightMode ? 'text-amber-300/90' : 'text-amber-950'
            }`}
          >
            OTOMATİK FREKANS BULUCU
          </span>
        </div>

        {/* Live Scan Status Pill */}
        {isScanning && (
          <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded-full text-[10px] font-mono-retro text-amber-300 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Frekans Aranıyor: {scanningFrequency?.toFixed(1) || '...'} MHz</span>
          </div>
        )}
      </div>

      {/* Buttons Panel: Prev Station, Auto Scan Seek, Next Station */}
      <div
        className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
          nightMode
            ? 'bg-stone-950/80 border-amber-900/50 shadow-inner'
            : 'bg-stone-200/80 border-amber-800/20 shadow-sm'
        }`}
      >
        {/* Previous Station Button */}
        <button
          type="button"
          onClick={onScanPrev}
          disabled={disabled || isScanning}
          className={`flex-1 h-12 rounded-lg flex items-center justify-center gap-1.5 text-xs font-mono-retro font-bold tracking-tight transition-all active:scale-[0.98] shadow-sm ${
            nightMode
              ? 'bg-stone-900 hover:bg-stone-850 text-amber-300 border border-amber-800/40 active:border-amber-400'
              : 'bg-gradient-to-b from-stone-50 to-stone-200 hover:from-white hover:to-stone-100 text-stone-800 border border-stone-300 active:border-amber-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          title="Önceki Frekanstaki İstasyonu Bul"
        >
          <SkipBack className="w-4 h-4 stroke-[2.2]" />
          <span className="hidden xs:inline">Önceki Kanal</span>
          <span className="xs:hidden">Geri</span>
        </button>

        {/* Central Prominent Auto-Scan Button */}
        <button
          type="button"
          onClick={onAutoScanAll}
          disabled={disabled}
          className={`flex-[1.4] h-12 rounded-lg flex items-center justify-center gap-2 text-xs sm:text-sm font-mono-retro font-bold uppercase tracking-wider transition-all active:scale-[0.98] shadow-md ${
            isScanning
              ? 'bg-amber-600 text-stone-950 animate-pulse border-2 border-amber-300'
              : nightMode
              ? 'bg-gradient-to-b from-amber-600 via-amber-700 to-amber-900 hover:from-amber-500 hover:to-amber-800 text-amber-100 border border-amber-500/50 shadow-[0_2px_10px_rgba(217,119,6,0.3)]'
              : 'bg-gradient-to-b from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-white border border-amber-400/80 shadow-[0_2px_8px_rgba(180,83,9,0.3)]'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          title="Tüm frekans bandını tara ve sıradaki yayına kilitlen"
        >
          <Search className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? 'ARANIYOR...' : 'OTOMATİK TARA'}</span>
        </button>

        {/* Next Station Button */}
        <button
          type="button"
          onClick={onScanNext}
          disabled={disabled || isScanning}
          className={`flex-1 h-12 rounded-lg flex items-center justify-center gap-1.5 text-xs font-mono-retro font-bold tracking-tight transition-all active:scale-[0.98] shadow-sm ${
            nightMode
              ? 'bg-stone-900 hover:bg-stone-850 text-amber-300 border border-amber-800/40 active:border-amber-400'
              : 'bg-gradient-to-b from-stone-50 to-stone-200 hover:from-white hover:to-stone-100 text-stone-800 border border-stone-300 active:border-amber-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          title="Sonraki Frekanstaki İstasyonu Bul"
        >
          <span className="hidden xs:inline">Sonraki Kanal</span>
          <span className="xs:hidden">İleri</span>
          <SkipForward className="w-4 h-4 stroke-[2.2]" />
        </button>
      </div>
    </div>
  );
};
