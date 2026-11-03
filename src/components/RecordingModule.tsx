import React, { useState } from 'react';
import { Square, Download, Disc, CheckCircle2, AlertCircle } from 'lucide-react';
import { Station } from '../data/stations';
import { streamRecorder, RecordingResult } from '../utils/recorder';
import { retroAudio } from '../utils/audioEffects';

interface RecordingModuleProps {
  currentStation: Station | null;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  nightMode?: boolean;
}

export const RecordingModule: React.FC<RecordingModuleProps> = ({
  currentStation,
  audioRef,
  isPlaying,
  nightMode = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [lastDownload, setLastDownload] = useState<RecordingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    if (!currentStation || !isPlaying) {
      setToastMessage('Kayıt yapabilmek için lütfen önce bir radyo yayını başlatın.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    retroAudio.playSwitchClunk();
    setLastDownload(null);
    setElapsedSeconds(0);

    const started = await streamRecorder.startRecording(
      audioRef.current,
      currentStation.streamUrl,
      (seconds) => {
        setElapsedSeconds(seconds);
      }
    );

    if (started) {
      setIsRecording(true);
      setToastMessage('Canlı yayın kaydı başladı...');
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  const handleStopAndDownload = async () => {
    if (!isRecording) return;
    setIsProcessing(true);
    retroAudio.playSwitchClunk();

    try {
      const stationName = currentStation?.name || 'Radyo';
      const result = await streamRecorder.stopAndDownload(stationName);

      setIsRecording(false);
      setIsProcessing(false);

      if (result) {
        setLastDownload(result);
        const sizeMb = (result.sizeBytes / (1024 * 1024)).toFixed(2);
        setToastMessage(
          `✓ Kayıt tamamlandı! Ses dosyası cihazınıza indirildi: ${result.fileName} (${formatTime(result.durationSeconds)}, ${sizeMb} MB)`
        );
        setTimeout(() => setToastMessage(null), 6000);
      } else {
        setToastMessage(
          'Kayıt çok kısa sürdüğü için ses dosyası oluşturulamadı. Lütfen en az 3-4 saniye kaydedin.'
        );
        setTimeout(() => setToastMessage(null), 5000);
      }
    } catch {
      setIsRecording(false);
      setIsProcessing(false);
      setToastMessage('Kayıt indirilirken bir sorun oluştu.');
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  return (
    <div className="w-full">
      {/* Box Header */}
      <div className="flex items-center justify-between mb-1.5 px-1">
        <div className="flex items-center gap-1.5">
          <Disc
            className={`w-3.5 h-3.5 ${
              isRecording
                ? 'text-red-500 animate-spin'
                : nightMode
                ? 'text-amber-500/80'
                : 'text-amber-900/80'
            }`}
          />
          <span
            className={`text-[11px] font-mono-retro font-bold uppercase tracking-wider ${
              nightMode ? 'text-amber-300/90' : 'text-amber-950'
            }`}
          >
            CANLI YAYIN KAYDEDİCİ
          </span>
        </div>

        {/* Vintage Red Jewel Indicator Lamp */}
        <div className="flex items-center gap-1.5">
          <div
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              isRecording
                ? 'bg-red-500 shadow-[0_0_10px_#ef4444] animate-pulse ring-2 ring-red-400/50'
                : 'bg-stone-700/60'
            }`}
          />
          <span
            className={`text-[10px] font-mono-retro font-bold ${
              isRecording ? 'text-red-400 animate-pulse' : 'text-stone-500'
            }`}
          >
            {isRecording ? 'KAYDEDİLİYOR' : 'HAZIR'}
          </span>
        </div>
      </div>

      {/* Main Recording Surface Card */}
      <div
        className={`p-3 rounded-xl border transition-all ${
          nightMode
            ? 'bg-stone-950/80 border-amber-900/40 shadow-inner'
            : 'bg-stone-200/90 border-amber-800/20 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Nixie / Segment Elapsed Time & VU Bar */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            {/* Glowing Digital Time Display */}
            <div
              className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${
                nightMode
                  ? 'bg-black border-amber-900/50 text-amber-400 shadow-[inset_0_0_8px_rgba(245,158,11,0.2)]'
                  : 'bg-stone-900 border-stone-700 text-amber-300 shadow-inner'
              }`}
            >
              <span className="text-[10px] font-mono-retro text-stone-500 uppercase">
                SÜRE:
              </span>
              <span className="font-mono-retro font-bold text-base tabular-nums tracking-widest text-amber-400">
                {formatTime(elapsedSeconds)}
              </span>
            </div>

            {/* Vintage Stereo VU Tape Meters */}
            <div className="flex flex-col gap-1 w-28 sm:w-32">
              <div className="flex items-center justify-between text-[8px] font-mono-retro text-stone-500 px-0.5">
                <span>L</span>
                <span>VU METER</span>
                <span>R</span>
              </div>
              <div className="flex items-center gap-1">
                {/* Left Channel Level */}
                <div className="flex-1 h-2 bg-stone-900 rounded-xs overflow-hidden flex gap-0.5 p-0.5">
                  {[1, 2, 3, 4, 5, 6].map((bar) => {
                    const active = isRecording || isPlaying;
                    return (
                      <div
                        key={bar}
                        className={`flex-1 rounded-xs transition-opacity duration-100 ${
                          active
                            ? bar > 5
                              ? 'bg-red-500 shadow-[0_0_2px_#ef4444]'
                              : bar > 4
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                            : 'bg-stone-800 opacity-20'
                        }`}
                        style={{
                          opacity: active ? (bar <= (elapsedSeconds % 5) + 2 ? 1 : 0.25) : 0.2,
                        }}
                      />
                    );
                  })}
                </div>
                {/* Right Channel Level */}
                <div className="flex-1 h-2 bg-stone-900 rounded-xs overflow-hidden flex gap-0.5 p-0.5">
                  {[1, 2, 3, 4, 5, 6].map((bar) => {
                    const active = isRecording || isPlaying;
                    return (
                      <div
                        key={bar}
                        className={`flex-1 rounded-xs transition-opacity duration-100 ${
                          active
                            ? bar > 5
                              ? 'bg-red-500 shadow-[0_0_2px_#ef4444]'
                              : bar > 4
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                            : 'bg-stone-800 opacity-20'
                        }`}
                        style={{
                          opacity: active ? (bar <= ((elapsedSeconds + 1) % 5) + 2 ? 1 : 0.25) : 0.2,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="w-full sm:w-auto flex items-center justify-end">
            {!isRecording ? (
              <button
                type="button"
                onClick={handleStartRecording}
                disabled={!isPlaying || !currentStation}
                className={`w-full sm:w-auto h-12 px-5 rounded-lg flex items-center justify-center gap-2 font-mono-retro font-bold text-xs sm:text-sm uppercase tracking-wide transition-all active:scale-[0.98] shadow-md cursor-pointer ${
                  isPlaying && currentStation
                    ? 'bg-gradient-to-b from-stone-800 to-stone-950 hover:from-stone-750 hover:to-black text-amber-200 border border-amber-600/40 shadow-stone-900/50'
                    : 'bg-stone-300 dark:bg-stone-800 text-stone-500 border border-stone-400/40 cursor-not-allowed opacity-60'
                }`}
                title="Şu an çalan yayını kaydetmeye başla"
              >
                <div className="w-3 h-3 rounded-full bg-red-600 shadow-[0_0_6px_#dc2626]" />
                <span>Ses Kaydet</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStopAndDownload}
                disabled={isProcessing}
                className="w-full sm:w-auto h-12 px-5 rounded-lg flex items-center justify-center gap-2 font-mono-retro font-bold text-xs sm:text-sm uppercase tracking-wide transition-all active:scale-[0.98] shadow-lg bg-gradient-to-b from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white border-2 border-red-400 shadow-red-950/60 cursor-pointer animate-pulse"
                title="Kaydı durdur ve ses dosyasını telefona/bilgisayara indir"
              >
                <Square className="w-4 h-4 fill-white" />
                <Download className="w-4 h-4" />
                <span>{isProcessing ? 'İndiriliyor...' : 'Kaydı Bitir ve İndir'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Toast / Download Feedback */}
        {toastMessage && (
          <div
            className={`mt-2.5 p-2 rounded-lg text-xs font-mono-retro flex items-center gap-2 animate-fade-in ${
              isRecording
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
            }`}
          >
            {isRecording ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            )}
            <span className="truncate">{toastMessage}</span>
          </div>
        )}

        {/* Last Download Receipt */}
        {lastDownload && !toastMessage && (
          <div className="mt-2 pt-2 border-t border-amber-500/10 flex items-center justify-between text-[11px] font-mono-retro text-stone-400">
            <span className="truncate">Son İndirilen: {lastDownload.fileName}</span>
            <span className="text-emerald-400 font-bold shrink-0 ml-2">✓ İndirildi</span>
          </div>
        )}
      </div>
    </div>
  );
};
