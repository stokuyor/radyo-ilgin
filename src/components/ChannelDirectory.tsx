import React, { useState, useMemo } from 'react';
import { Search, Radio, Music2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Station, CATEGORIES } from '../data/stations';
import { retroAudio } from '../utils/audioEffects';

interface ChannelDirectoryProps {
  stations: Station[];
  currentStation: Station | null;
  onSelectStation: (station: Station) => void;
  nightMode?: boolean;
}

export const ChannelDirectory: React.FC<ChannelDirectoryProps> = ({
  stations,
  currentStation,
  onSelectStation,
  nightMode = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');

  const filteredStations = useMemo(() => {
    return stations.filter((station) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        query === '' ||
        station.name.toLowerCase().includes(query) ||
        station.tagline.toLowerCase().includes(query) ||
        station.category.toLowerCase().includes(query) ||
        station.frequency.toFixed(1).includes(query);

      const matchesCategory =
        selectedCategory === 'Tümü' || station.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [stations, searchQuery, selectedCategory]);

  return (
    <div className="w-full">
      {/* Accordion / Directory Bar Header */}
      <button
        type="button"
        onClick={() => {
          retroAudio.playKnobClick();
          setIsOpen(!isOpen);
        }}
        className={`w-full p-2.5 sm:p-3 rounded-xl flex items-center justify-between border transition-all cursor-pointer shadow-sm ${
          nightMode
            ? 'bg-stone-950/80 hover:bg-stone-900 border-amber-900/50 text-amber-300'
            : 'bg-stone-100 hover:bg-stone-200 border-amber-800/30 text-stone-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-amber-500/20 text-amber-500">
            <Radio className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-xs sm:text-sm font-mono-retro font-bold uppercase tracking-wider">
              TÜM KANALLAR REHBERİ ({stations.length} İSTASYON)
            </p>
            <p className="text-[10px] font-mono-retro text-stone-500 dark:text-stone-400">
              Arama, tür filtreleri ve tek tıkla canlı frekansa bağlanma
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono-retro">
          <span className="hidden xs:inline text-[11px] font-bold text-amber-500">
            {isOpen ? 'Gizle' : 'Tümünü Gör'}
          </span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-amber-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-amber-500" />
          )}
        </div>
      </button>

      {/* Expandable Directory Content */}
      {isOpen && (
        <div
          className={`mt-2 p-3 rounded-2xl border transition-all shadow-xl ${
            nightMode
              ? 'bg-stone-950/95 border-amber-900/60 shadow-black/80'
              : 'bg-stone-50 border-amber-800/30 shadow-stone-500/20'
          }`}
        >
          {/* Search Box Input */}
          <div className="relative mb-2.5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Kanal veya tür ara... (Örn: Kral, TRT, Power, Arabesk, Diyanet)"
              className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs sm:text-sm font-mono-retro transition-colors outline-hidden border ${
                nightMode
                  ? 'bg-black/70 border-amber-900/50 text-amber-200 placeholder:text-stone-600 focus:border-amber-500'
                  : 'bg-white border-stone-300 text-stone-900 placeholder:text-stone-400 focus:border-amber-600'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-mono-retro text-stone-400 hover:text-stone-200 p-1"
              >
                Temizle
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2.5 scrollbar-none">
            {CATEGORIES.map((category) => {
              const isSelected = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    retroAudio.playKnobClick();
                    setSelectedCategory(category);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono-retro whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-stone-950 font-bold border border-amber-300 shadow-sm'
                      : nightMode
                      ? 'bg-stone-900 text-stone-400 hover:text-amber-200 hover:bg-stone-850 border border-stone-800'
                      : 'bg-stone-200 text-stone-700 hover:text-stone-950 hover:bg-stone-300 border border-stone-300'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>

          {/* Station List Results */}
          <div className="max-h-64 sm:max-h-72 overflow-y-auto space-y-1.5 pr-1">
            {filteredStations.length === 0 ? (
              <div className="text-center py-8 text-stone-500 text-xs font-mono-retro">
                Aramanızla eşleşen kanal bulunamadı.
              </div>
            ) : (
              filteredStations.map((station) => {
                const isSelected = currentStation?.id === station.id;

                return (
                  <button
                    key={station.id}
                    type="button"
                    onClick={() => {
                      retroAudio.playSwitchClunk();
                      onSelectStation(station);
                    }}
                    className={`w-full p-2 rounded-xl flex items-center justify-between transition-all cursor-pointer text-left border ${
                      isSelected
                        ? nightMode
                          ? 'bg-amber-950/70 border-amber-500 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                          : 'bg-amber-100 border-amber-500 text-amber-950 shadow-sm'
                        : nightMode
                        ? 'bg-stone-900/60 hover:bg-stone-900 border-stone-800/80 text-stone-200'
                        : 'bg-white hover:bg-stone-100 border-stone-200 text-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {/* Frequency Badge */}
                      <span className="font-mono-retro font-bold text-xs px-2 py-1 rounded bg-black/40 border border-amber-500/30 text-amber-400 tabular-nums shrink-0">
                        {station.frequency.toFixed(1)}
                      </span>

                      {/* Station Details */}
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-xs font-sans-retro truncate">
                            {station.name}
                          </p>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] font-mono-retro text-stone-400 truncate">
                          {station.tagline}
                        </p>
                      </div>
                    </div>

                    {/* Category Label */}
                    <span className="text-[10px] font-mono-retro px-2 py-0.5 rounded-full shrink-0 ml-2 bg-stone-800/40 text-stone-400">
                      {station.category}
                    </span>
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
