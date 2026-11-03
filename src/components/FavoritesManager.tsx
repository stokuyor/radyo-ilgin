import React, { useState } from 'react';
import { Heart, Star, ChevronDown, ChevronUp, Trash2, Radio } from 'lucide-react';
import { Station } from '../data/stations';
import { retroAudio } from '../utils/audioEffects';

interface FavoritesManagerProps {
  currentStation: Station | null;
  favoriteIds: string[];
  allStations: Station[];
  onToggleFavorite: (stationId: string) => void;
  onSelectStation: (station: Station) => void;
  nightMode?: boolean;
}

export const FavoritesManager: React.FC<FavoritesManagerProps> = ({
  currentStation,
  favoriteIds,
  allStations,
  onToggleFavorite,
  onSelectStation,
  nightMode = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isCurrentFavorite = currentStation
    ? favoriteIds.includes(currentStation.id)
    : false;

  const favoriteStations = allStations.filter((s) =>
    favoriteIds.includes(s.id)
  );

  // Preset buttons (up to 6 top favorites or default first favorites)
  const presets = favoriteStations.slice(0, 6);

  return (
    <div className="w-full">
      {/* Top Bar with Star / Favorite Button and Expand Toggle */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          {/* Add / Remove from Favorites Toggle Button */}
          <button
            type="button"
            onClick={() => {
              if (currentStation) {
                retroAudio.playSwitchClunk();
                onToggleFavorite(currentStation.id);
              }
            }}
            disabled={!currentStation}
            className={`h-10 px-3.5 rounded-lg flex items-center gap-2 font-mono-retro font-bold text-xs uppercase tracking-wider transition-all active:scale-95 shadow-sm ${
              !currentStation
                ? 'opacity-40 cursor-not-allowed bg-stone-300 dark:bg-stone-800 text-stone-500'
                : isCurrentFavorite
                ? 'bg-amber-500 text-stone-950 border border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                : nightMode
                ? 'bg-stone-900 hover:bg-stone-800 text-amber-300 border border-amber-800/50'
                : 'bg-stone-100 hover:bg-white text-stone-800 border border-stone-300'
            }`}
            title={
              isCurrentFavorite
                ? 'Favorilerden Çıkar'
                : 'Şu anki frekansı favorilere ekle'
            }
          >
            <Heart
              className={`w-4 h-4 transition-transform ${
                isCurrentFavorite
                  ? 'fill-stone-950 text-stone-950 scale-110'
                  : 'text-amber-500'
              }`}
            />
            <span>
              {isCurrentFavorite ? 'Favorilerde' : 'Favoriye Ekle'}
            </span>
          </button>
        </div>

        {/* View All Favorites Drawer Button */}
        <button
          type="button"
          onClick={() => {
            retroAudio.playKnobClick();
            setIsExpanded(!isExpanded);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono-retro font-medium transition-colors ${
            nightMode
              ? 'text-amber-400/80 hover:text-amber-300 hover:bg-stone-900/60'
              : 'text-amber-900/80 hover:text-amber-950 hover:bg-amber-100/60'
          }`}
        >
          <Star className="w-3.5 h-3.5 text-amber-500" />
          <span>Kayıtlı Kanallar ({favoriteStations.length})</span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Retro Pushbutton Preset Bar (P1, P2, P3, P4, P5, P6) */}
      <div
        className={`p-2 rounded-xl border transition-all ${
          nightMode
            ? 'bg-stone-950/70 border-amber-900/40'
            : 'bg-stone-200/70 border-amber-800/20'
        }`}
      >
        <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const presetStation = presets[index];
            const isSelected =
              currentStation && presetStation?.id === currentStation.id;

            return (
              <button
                key={index}
                type="button"
                onClick={() => {
                  if (presetStation) {
                    retroAudio.playSwitchClunk();
                    onSelectStation(presetStation);
                  }
                }}
                disabled={!presetStation}
                className={`flex-1 min-w-[50px] h-11 rounded-lg flex flex-col items-center justify-center transition-all active:translate-y-0.5 shadow-sm ${
                  !presetStation
                    ? 'bg-stone-300/40 dark:bg-stone-900/40 border border-dashed border-stone-400/30 text-stone-500 cursor-default'
                    : isSelected
                    ? 'bg-amber-500 text-stone-950 font-bold border-2 border-amber-300 shadow-[0_2px_8px_rgba(245,158,11,0.5)]'
                    : nightMode
                    ? 'bg-stone-900 hover:bg-stone-850 text-amber-300 border border-amber-800/40 active:border-amber-400'
                    : 'bg-gradient-to-b from-stone-50 to-stone-200 hover:from-white hover:to-stone-100 text-stone-800 border border-stone-300 active:border-amber-600'
                }`}
                title={
                  presetStation
                    ? `${presetStation.name} (${presetStation.frequency.toFixed(1)} MHz)`
                    : `Hafıza Tuşu P${index + 1} (Boş)`
                }
              >
                <span className="text-[10px] font-mono-retro font-bold">
                  P{index + 1}
                </span>
                <span className="text-[9px] font-mono-retro truncate max-w-[46px]">
                  {presetStation ? presetStation.frequency.toFixed(1) : '---'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Expandable Drawer for All Favorites */}
      {isExpanded && (
        <div
          className={`mt-2 p-3 rounded-xl border max-h-56 overflow-y-auto transition-all ${
            nightMode
              ? 'bg-stone-950 border-amber-900/50 shadow-2xl'
              : 'bg-stone-50 border-amber-800/30 shadow-lg'
          }`}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-500/20 text-xs font-mono-retro font-bold text-amber-500">
            <span>FAVORİ KANALLARIM</span>
            <span className="text-[10px] text-stone-400">
              {favoriteStations.length} Kanal
            </span>
          </div>

          {favoriteStations.length === 0 ? (
            <div className="py-6 text-center text-xs font-mono-retro text-stone-500">
              <Radio className="w-6 h-6 mx-auto mb-1.5 opacity-40 text-amber-500" />
              Henüz favori radyo eklemediniz. Bir istasyon çalarken "Favoriye Ekle"
              butonuna basarak ekleyebilirsiniz.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {favoriteStations.map((station) => {
                const isActive = currentStation?.id === station.id;
                return (
                  <div
                    key={station.id}
                    className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                      isActive
                        ? nightMode
                          ? 'bg-amber-950/80 border border-amber-600/50 text-amber-300'
                          : 'bg-amber-100 border border-amber-400 text-amber-950'
                        : nightMode
                        ? 'hover:bg-stone-900 text-stone-200'
                        : 'hover:bg-stone-200/80 text-stone-800'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        retroAudio.playSwitchClunk();
                        onSelectStation(station);
                      }}
                      className="flex-1 text-left flex items-center gap-2 cursor-pointer truncate"
                    >
                      <span className="text-xs font-mono-retro font-bold px-1.5 py-0.5 rounded bg-black/30 border border-amber-500/20 text-amber-400">
                        {station.frequency.toFixed(1)}
                      </span>
                      <div className="truncate">
                        <p className="text-xs font-bold font-sans-retro truncate">
                          {station.name}
                        </p>
                        <p className="text-[10px] font-mono-retro text-stone-400 truncate">
                          {station.countryName} · {station.category}
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        retroAudio.playKnobClick();
                        onToggleFavorite(station.id);
                      }}
                      className="p-1.5 text-stone-400 hover:text-red-400 rounded-md transition-colors"
                      title="Favorilerden sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
