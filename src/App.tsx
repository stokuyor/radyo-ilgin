import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Power,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Radio as RadioIcon,
  Sparkles,
  Music,
} from 'lucide-react';
import { STATIONS, Station } from './data/stations';
import { FrequencyDialScale } from './components/FrequencyDialScale';
import { CountrySelector } from './components/CountrySelector';
import { AutoScanner } from './components/AutoScanner';
import { RetroRotaryKnob } from './components/RetroRotaryKnob';
import { FavoritesManager } from './components/FavoritesManager';
import { RecordingModule } from './components/RecordingModule';
import { retroAudio } from './utils/audioEffects';

export default function App() {
  // Theme state: dark / night mode vs daylight vintage mode
  const [nightMode, setNightMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nostalji_night_mode');
      return saved !== null ? saved === 'true' : true; // Default to cozy night tube mode
    }
    return true;
  });

  // Power state (Radio On / Off)
  const [isPoweredOn, setIsPoweredOn] = useState(true);

  // Audio Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  // Country filtering: 'TR' or 'ALL_WORLD' or specific code
  const [isOtherCountriesMode, setIsOtherCountriesMode] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState('ALL_WORLD');

  // Tuned frequency (in MHz)
  const [frequency, setFrequency] = useState<number>(91.4); // Default TRT FM

  // Auto-scan state
  const [isScanning, setIsScanning] = useState(false);
  const [scanningFrequency, setScanningFrequency] = useState<number | null>(null);

  // Favorites
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nostalji_favorites');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    // Default favorites
    return ['trt-fm', 'kral-fm', 'slow-turk', 'power-fm', 'joy-fm', 'bbc-world-service'];
  });

  // Has user interacted with the radio to enable audio
  const [hasUserStarted, setHasUserStarted] = useState(false);
  const [needsUserGesture, setNeedsUserGesture] = useState(false);

  // Audio element reference
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoScanTimerRef = useRef<number | null>(null);

  // Apply dark mode class to <html> for Tailwind custom-variant
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (nightMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('nostalji_night_mode', String(nightMode));
    }
  }, [nightMode]);

  // Persist favorites
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nostalji_favorites', JSON.stringify(favoriteIds));
    }
  }, [favoriteIds]);

  // Filter stations based on selected country mode
  const stationsInScope = useMemo(() => {
    if (!isOtherCountriesMode) {
      return STATIONS.filter((s) => s.country === 'TR');
    }
    if (selectedCountryCode === 'ALL_WORLD') {
      return STATIONS.filter((s) => s.country !== 'TR');
    }
    return STATIONS.filter((s) => s.country === selectedCountryCode);
  }, [isOtherCountriesMode, selectedCountryCode]);

  // Find station currently tuned
  const currentStation = useMemo(() => {
    return (
      stationsInScope.find(
        (st) => Math.abs(st.frequency - frequency) < 0.15
      ) || null
    );
  }, [stationsInScope, frequency]);

  // Calculate signal strength (1.0 if right on station, fades to 0 as you drift away)
  const signalStrength = useMemo(() => {
    if (!currentStation || !isPoweredOn) return 0;
    const diff = Math.abs(currentStation.frequency - frequency);
    if (diff < 0.05) return 1.0;
    if (diff < 0.15) return 0.7;
    if (diff < 0.25) return 0.35;
    return 0.05;
  }, [currentStation, frequency, isPoweredOn]);

  // Manage analog static noise when off-station
  useEffect(() => {
    if (!isPoweredOn || !hasUserStarted) {
      retroAudio.stopStatic();
      return;
    }
    if (isScanning) {
      retroAudio.setStaticVolume(0.35);
      return;
    }
    if (!currentStation) {
      retroAudio.setStaticVolume(0.25);
    } else if (signalStrength < 0.8) {
      retroAudio.setStaticVolume((1 - signalStrength) * 0.2);
    } else {
      retroAudio.stopStatic();
    }
  }, [isPoweredOn, hasUserStarted, isScanning, currentStation, signalStrength]);

  // Handle station audio stream changes safely with Autoplay policy guard
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!isPoweredOn || !currentStation || !hasUserStarted) {
      audio.pause();
      setIsPlaying(false);
      setIsLoadingAudio(false);
      setPlaybackError(null);
      return;
    }

    // Play station
    setPlaybackError(null);
    setIsLoadingAudio(true);

    const directUrl = currentStation.streamUrl;
    audio.src = directUrl;
    audio.load();

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setIsLoadingAudio(false);
          setNeedsUserGesture(false);
        })
        .catch((err) => {
          setIsLoadingAudio(false);
          // If browser Autoplay policy blocks audio before user interaction
          if (err && err.name === 'NotAllowedError') {
            setNeedsUserGesture(true);
            setIsPlaying(false);
            return;
          }

          // Format or network failure: fallback to local stream proxy gracefully
          const proxyUrl = `/api/stream-proxy?url=${encodeURIComponent(directUrl)}`;
          audio.src = proxyUrl;
          audio.load();
          audio
            .play()
            .then(() => {
              setIsPlaying(true);
              setIsLoadingAudio(false);
              setNeedsUserGesture(false);
            })
            .catch(() => {
              setIsPlaying(false);
              setIsLoadingAudio(false);
              setPlaybackError('Yayın akışı geçici olarak meşgul. Başka bir istasyon seçebilirsiniz.');
            });
        });
    }
  }, [currentStation, isPoweredOn, hasUserStarted]);

  // Handle Volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Toggle Power
  const togglePower = () => {
    retroAudio.playSwitchClunk();
    setIsPoweredOn((prev) => {
      const next = !prev;
      if (next) {
        setHasUserStarted(true);
        setNeedsUserGesture(false);
      } else if (audioRef.current) {
        audioRef.current.pause();
      }
      return next;
    });
  };

  // Toggle Theme
  const toggleNightMode = () => {
    retroAudio.playSwitchClunk();
    setNightMode((prev) => !prev);
  };

  // Toggle Favorite
  const handleToggleFavorite = (stationId: string) => {
    setFavoriteIds((prev) =>
      prev.includes(stationId)
        ? prev.filter((id) => id !== stationId)
        : [...prev, stationId]
    );
  };

  // Select station directly from preset or drawer
  const handleSelectStation = (station: Station) => {
    setHasUserStarted(true);
    setNeedsUserGesture(false);
    if (station.country === 'TR' && isOtherCountriesMode) {
      setIsOtherCountriesMode(false);
    } else if (station.country !== 'TR' && !isOtherCountriesMode) {
      setIsOtherCountriesMode(true);
      setSelectedCountryCode(station.country);
    }
    setFrequency(station.frequency);
    if (!isPoweredOn) {
      setIsPoweredOn(true);
    }
  };

  // Manual knob / dial frequency change
  const handleFrequencyChange = (newFreq: number) => {
    setHasUserStarted(true);
    setNeedsUserGesture(false);
    setFrequency(newFreq);
  };

  // Auto Scanner: Find Next Station
  const handleScanNext = useCallback(() => {
    setHasUserStarted(true);
    setNeedsUserGesture(false);
    if (!isPoweredOn) setIsPoweredOn(true);
    retroAudio.playKnobClick();

    // Sort stations by frequency ascending
    const sorted = [...stationsInScope].sort((a, b) => a.frequency - b.frequency);
    if (sorted.length === 0) return;

    // Find the next station with frequency > current
    const next = sorted.find((s) => s.frequency > frequency + 0.15) || sorted[0];
    setFrequency(next.frequency);
    retroAudio.playStationLockBeep();
  }, [frequency, isPoweredOn, stationsInScope]);

  // Auto Scanner: Find Prev Station
  const handleScanPrev = useCallback(() => {
    setHasUserStarted(true);
    setNeedsUserGesture(false);
    if (!isPoweredOn) setIsPoweredOn(true);
    retroAudio.playKnobClick();

    const sorted = [...stationsInScope].sort((a, b) => b.frequency - a.frequency);
    if (sorted.length === 0) return;

    const prev = sorted.find((s) => s.frequency < frequency - 0.15) || sorted[0];
    setFrequency(prev.frequency);
    retroAudio.playStationLockBeep();
  }, [frequency, isPoweredOn, stationsInScope]);

  // Auto Scanner: Continuous sweep scan across spectrum
  const handleAutoScanAll = useCallback(() => {
    setHasUserStarted(true);
    setNeedsUserGesture(false);
    if (isScanning) {
      if (autoScanTimerRef.current) clearInterval(autoScanTimerRef.current);
      setIsScanning(false);
      setScanningFrequency(null);
      return;
    }

    if (!isPoweredOn) setIsPoweredOn(true);
    setIsScanning(true);
    retroAudio.playSwitchClunk();

    let currentTestFreq = frequency;
    const sorted = [...stationsInScope].sort((a, b) => a.frequency - b.frequency);

    autoScanTimerRef.current = window.setInterval(() => {
      currentTestFreq = Math.round((currentTestFreq + 0.4) * 10) / 10;
      if (currentTestFreq > 108.0) {
        currentTestFreq = 87.5;
      }
      setScanningFrequency(currentTestFreq);
      setFrequency(currentTestFreq);
      retroAudio.playKnobClick(0.9);

      // Check if a station is within 0.2 MHz
      const foundStation = sorted.find(
        (s) => Math.abs(s.frequency - currentTestFreq) < 0.2
      );

      if (foundStation) {
        if (autoScanTimerRef.current) clearInterval(autoScanTimerRef.current);
        setIsScanning(false);
        setScanningFrequency(null);
        setFrequency(foundStation.frequency);
        retroAudio.playStationLockBeep();
      }
    }, 120);
  }, [frequency, isPoweredOn, isScanning, stationsInScope]);


  // Clean up auto scan timer on unmount
  useEffect(() => {
    return () => {
      if (autoScanTimerRef.current) clearInterval(autoScanTimerRef.current);
    };
  }, []);

  return (
    <div
      className={`min-h-screen w-full transition-colors duration-500 py-3 sm:py-6 px-2 sm:px-4 flex flex-col items-center justify-start ${
        nightMode
          ? 'bg-[#150d08] text-stone-100'
          : 'bg-[#ede5dc] text-stone-900'
      }`}
    >
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        preload="auto"
        onPlaying={() => {
          setIsPlaying(true);
          setIsLoadingAudio(false);
        }}
        onWaiting={() => setIsLoadingAudio(true)}
        onError={() => {
          setIsLoadingAudio(false);
          setIsPlaying(false);
        }}
      />

      {/* Main Container / Vintage Radio Casing */}
      <div className="w-full max-w-2xl mx-auto">
        {/* Outer Wooden Radio Chassis with Curved Bevels & Depth */}
        <div
          className={`rounded-3xl p-3 sm:p-5 transition-all duration-300 relative shadow-2xl ${
            nightMode
              ? 'vintage-wood-casing border-4 border-amber-950/80 shadow-[0_20px_50px_rgba(0,0,0,0.9),inset_0_1px_3px_rgba(245,158,11,0.2)]'
              : 'vintage-wood-casing-light border-4 border-[#5b3013] shadow-[0_15px_40px_rgba(70,30,10,0.35),inset_0_1px_3px_rgba(255,255,255,0.4)]'
          }`}
        >
          {/* Top Brass / Chrome Badge Plate & Master Controls */}
          <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-amber-500/20">
            {/* Vintage Radio Logo Badge */}
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg border flex items-center justify-center ${
                  nightMode
                    ? 'bg-black/60 border-amber-600/40 text-amber-400'
                    : 'bg-amber-100 border-amber-600/60 text-amber-900'
                }`}
              >
                <RadioIcon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h1 className="font-cinzel text-base sm:text-lg font-extrabold tracking-wider text-amber-400 drop-shadow-sm">
                  ILGIN RADYO
                </h1>
                <p className="text-[10px] font-mono-retro text-amber-500/70 tracking-widest uppercase">
                  TÜRKİYE & DÜNYA · ANALOG TUBE
                </p>
              </div>
            </div>

            {/* Quick Utility Switches: Gece Modu & Master Power */}
            <div className="flex items-center gap-2">
              {/* Gece Modu / Gündüz Modu Toggle Switch */}
              <button
                type="button"
                onClick={toggleNightMode}
                className={`h-10 px-3 rounded-xl flex items-center gap-1.5 text-xs font-mono-retro font-bold transition-all active:scale-95 shadow-sm cursor-pointer ${
                  nightMode
                    ? 'bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-600/40'
                    : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-400'
                }`}
                title={nightMode ? 'Gündüz Moduna Geç' : 'Gece Moduna Geç'}
                aria-label="Gece Modu / Gündüz Modu"
              >
                {nightMode ? (
                  <>
                    <Moon className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                    <span className="hidden xs:inline">Gece</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-4 h-4 text-amber-700 fill-amber-500/30" />
                    <span className="hidden xs:inline">Gündüz</span>
                  </>
                )}
              </button>

              {/* Master Power Switch with glowing pilot lamp */}
              <button
                type="button"
                onClick={togglePower}
                className={`h-10 px-3.5 rounded-xl flex items-center gap-1.5 text-xs font-mono-retro font-bold transition-all active:scale-95 shadow-md cursor-pointer ${
                  isPoweredOn
                    ? 'bg-gradient-to-b from-emerald-600 to-emerald-800 text-white border border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                    : 'bg-stone-800 text-stone-400 border border-stone-600'
                }`}
                title={isPoweredOn ? 'Radyoyu Kapat' : 'Radyoyu Aç'}
                aria-label="Güç Aç/Kapat"
              >
                <Power className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden xs:inline">
                  {isPoweredOn ? 'AÇIK' : 'KAPALI'}
                </span>
              </button>
            </div>
          </div>

          {/* Speaker Grill Cloth Fabric Texture with Center Warm Glow */}
          <div
            className={`rounded-2xl p-3 sm:p-4 mb-3 border shadow-inner transition-colors duration-300 relative overflow-hidden ${
              nightMode
                ? 'speaker-grill-pattern border-amber-950/60 shadow-[inset_0_4px_16px_rgba(0,0,0,0.8)]'
                : 'speaker-grill-light border-[#8c572b]/40 shadow-[inset_0_3px_10px_rgba(0,0,0,0.3)]'
            }`}
          >
            {/* Center Backlight Ambient Bulb Glow */}
            {isPoweredOn && (
              <div
                className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${
                  nightMode
                    ? 'bg-radial-gradient from-amber-600/15 via-transparent to-transparent opacity-80'
                    : 'bg-radial-gradient from-amber-400/20 via-transparent to-transparent opacity-60'
                }`}
              />
            )}

            {/* Speaker Cloth Front Inset: Volume Controls & Station Live Bar */}
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 bg-black/40 backdrop-blur-xs p-2.5 rounded-xl border border-amber-500/20">
              {/* Currently Playing Status & Start Action */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {(!hasUserStarted || needsUserGesture) && isPoweredOn ? (
                  <button
                    type="button"
                    onClick={() => {
                      setHasUserStarted(true);
                      setNeedsUserGesture(false);
                      retroAudio.playSwitchClunk();
                      if (audioRef.current && currentStation) {
                        audioRef.current.play().catch(() => {});
                      }
                    }}
                    className="h-9 px-3.5 rounded-lg flex items-center gap-2 text-xs font-mono-retro font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 border border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)] animate-pulse cursor-pointer"
                  >
                    <span className="text-sm">▶</span>
                    <span>RADYOYU BAŞLAT</span>
                  </button>
                ) : (
                  <div
                    className={`w-3 h-3 rounded-full shrink-0 transition-all ${
                      isPoweredOn && isPlaying
                        ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse'
                        : isLoadingAudio
                        ? 'bg-amber-400 animate-spin'
                        : 'bg-stone-700'
                    }`}
                  />
                )}
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-bold text-xs font-sans-retro text-amber-200 truncate">
                      {isPoweredOn
                        ? currentStation
                          ? currentStation.name
                          : 'Frekans Ayarlanıyor...'
                        : 'Radyo Kapalı'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono-retro text-stone-400 truncate block">
                    {isPoweredOn
                      ? !hasUserStarted
                        ? 'Başlatmak için butona veya kadrana dokunun'
                        : isLoadingAudio
                        ? 'Yayın Akışı Yükleniyor...'
                        : currentStation
                        ? `${currentStation.frequency.toFixed(1)} MHz · ${currentStation.countryName}`
                        : 'Boş Frekans (Hışırtı)'
                      : 'Açmak için Güç düğmesine basın'}
                  </span>
                </div>
              </div>

              {/* Volume Slider & Mute Toggle */}
              <div className="flex items-center gap-2 w-full sm:w-48 justify-end">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1.5 text-amber-400 hover:text-amber-200 rounded transition-colors"
                  title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
                  aria-label="Sesi Kapat / Aç"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    if (isMuted) setIsMuted(false);
                  }}
                  disabled={!isPoweredOn}
                  className="w-28 sm:w-32 h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  title="Ses Seviyesi"
                  aria-label="Ses Seviyesi"
                />
                <span className="text-[10px] font-mono-retro font-bold text-amber-400/90 w-8 text-right tabular-nums">
                  {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                </span>
              </div>
            </div>
          </div>

          {/* Playback Error Alert if any */}
          {playbackError && isPoweredOn && (
            <div className="mb-3 p-2 bg-red-950/60 border border-red-500/40 rounded-xl text-red-300 text-xs font-mono-retro flex items-center justify-between">
              <span>{playbackError}</span>
              <button
                type="button"
                onClick={() => handleScanNext()}
                className="underline hover:text-red-200 font-bold ml-2"
              >
                Sonraki İstasyon
              </button>
            </div>
          )}

          {/* BACKLIT ANALOG FREQUENCY GLASS SCALE */}
          <div className="mb-4">
            <FrequencyDialScale
              frequency={frequency}
              currentStation={currentStation}
              stationsInScope={stationsInScope}
              onSelectFrequency={handleFrequencyChange}
              nightMode={nightMode}
              signalStrength={signalStrength}
              isPlaying={isPlaying && isPoweredOn}
            />
          </div>

          {/* EXACT REQUESTED WORKFLOW SECTION ORDER:
              1. Türkiye ve Diğer Ülkeler Seçeneği
              2. Hemen altında otomatik frekans bulucu ile kanal değiştirme
              3. Hemen altında ise manuel yuvarlak retro tarzında frekans frekans gidebilme nostaljik buton
          */}
          <div className="flex flex-col gap-4">
            {/* 1. TÜRKİYE VE DİĞER ÜLKELER SEÇENEĞİ */}
            <div className="w-full">
              <CountrySelector
                selectedCountryCode={selectedCountryCode}
                isOtherCountriesMode={isOtherCountriesMode}
                onSelectMainMode={(isOther) => {
                  setIsOtherCountriesMode(isOther);
                  // Tune to first station of new scope
                  const targetList = isOther
                    ? STATIONS.filter((s) => s.country !== 'TR')
                    : STATIONS.filter((s) => s.country === 'TR');
                  if (targetList.length > 0) {
                    setFrequency(targetList[0].frequency);
                  }
                }}
                onSelectCountryCode={(code) => {
                  setSelectedCountryCode(code);
                  const targetList =
                    code === 'ALL_WORLD'
                      ? STATIONS.filter((s) => s.country !== 'TR')
                      : STATIONS.filter((s) => s.country === code);
                  if (targetList.length > 0) {
                    setFrequency(targetList[0].frequency);
                  }
                }}
                nightMode={nightMode}
              />
            </div>

            {/* 2. HEMEN ALTINDA OTOMATİK FREKANS BULUCU İLE KANAL DEĞİŞTİRME */}
            <div className="w-full">
              <AutoScanner
                onScanNext={handleScanNext}
                onScanPrev={handleScanPrev}
                onAutoScanAll={handleAutoScanAll}
                isScanning={isScanning}
                scanningFrequency={scanningFrequency}
                nightMode={nightMode}
                disabled={!isPoweredOn}
              />
            </div>

            {/* 3. HEMEN ALTINDA MANUEL YUVARLAK RETRO TARZINDA FREKANS FREKANS GİDEBİLME NOSTALJİK BUTON */}
            <div
              className={`p-3 sm:p-4 rounded-2xl border transition-all ${
                nightMode
                  ? 'bg-stone-950/90 border-amber-900/40 shadow-inner'
                  : 'bg-stone-100/90 border-amber-800/20 shadow-sm'
              }`}
            >
              <RetroRotaryKnob
                frequency={frequency}
                minFrequency={87.5}
                maxFrequency={108.0}
                step={0.1}
                onChange={handleFrequencyChange}
                disabled={!isPoweredOn}
                nightMode={nightMode}
              />
            </div>

            {/* 4. FAVORİYE EKLE ÖZELLİĞİ (PRESETLER & LİSTE) */}
            <div className="w-full">
              <FavoritesManager
                currentStation={currentStation}
                favoriteIds={favoriteIds}
                allStations={STATIONS}
                onToggleFavorite={handleToggleFavorite}
                onSelectStation={handleSelectStation}
                nightMode={nightMode}
              />
            </div>

            {/* 5. SES KAYDETME VE BİTİRİNCE CİHAZA İNDİRME ÖZELLİĞİ */}
            <div className="w-full">
              <RecordingModule
                currentStation={currentStation}
                audioRef={audioRef}
                isPlaying={isPlaying && isPoweredOn}
                nightMode={nightMode}
              />
            </div>
          </div>

          {/* Retro Brass Model Plate at bottom */}
          <div className="mt-4 pt-3 border-t border-amber-500/20 flex items-center justify-between text-[10px] font-mono-retro text-amber-600/70">
            <span>MODEL: IR-1974 MK II</span>
            <span>ILGIN RADYO SİSTEMİ</span>
            <span>HI-FI STEREO</span>
          </div>
        </div>
      </div>
    </div>
  );
}
