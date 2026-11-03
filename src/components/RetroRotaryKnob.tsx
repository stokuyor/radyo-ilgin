import React, { useRef, useState, useEffect, useCallback } from 'react';
import { retroAudio } from '../utils/audioEffects';
import { ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';

interface RetroRotaryKnobProps {
  frequency: number;
  minFrequency?: number;
  maxFrequency?: number;
  step?: number;
  onChange: (newFreq: number) => void;
  disabled?: boolean;
  nightMode?: boolean;
}

export const RetroRotaryKnob: React.FC<RetroRotaryKnobProps> = ({
  frequency,
  minFrequency = 87.5,
  maxFrequency = 108.0,
  step = 0.1,
  onChange,
  disabled = false,
  nightMode = false,
}) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastAngleRef = useRef<number | null>(null);

  // Map frequency to a continuous visual rotation angle (e.g. 0 to 300 degrees)
  const freqRange = maxFrequency - minFrequency;
  const rotationAngle = ((frequency - minFrequency) / freqRange) * 300 - 150;

  const handleStep = useCallback(
    (direction: -1 | 1) => {
      if (disabled) return;
      const next = Math.round((frequency + direction * step) * 10) / 10;
      const clamped = Math.min(maxFrequency, Math.max(minFrequency, next));
      if (clamped !== frequency) {
        retroAudio.playKnobClick(direction > 0 ? 1.05 : 0.95);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(8);
        }
        onChange(clamped);
      }
    },
    [disabled, frequency, maxFrequency, minFrequency, onChange, step]
  );

  // Mouse / Touch rotation drag
  const calculateAngleFromCenter = (clientX: number, clientY: number): number => {
    if (!knobRef.current) return 0;
    const rect = knobRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    return deg;
  };

  const startDrag = (clientX: number, clientY: number) => {
    if (disabled) return;
    setIsDragging(true);
    lastAngleRef.current = calculateAngleFromCenter(clientX, clientY);
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || disabled || lastAngleRef.current === null) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const currentAngle = calculateAngleFromCenter(clientX, clientY);
      let deltaAngle = currentAngle - lastAngleRef.current;

      // Handle angle wrap-around (-180 to 180)
      if (deltaAngle > 180) deltaAngle -= 360;
      if (deltaAngle < -180) deltaAngle += 360;

      // Sensitivity: ~10 degrees = 0.1 MHz
      if (Math.abs(deltaAngle) >= 8) {
        const stepCount = Math.sign(deltaAngle);
        handleStep(stepCount as -1 | 1);
        lastAngleRef.current = currentAngle;
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
      lastAngleRef.current = null;
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMove, { passive: false });
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
      window.addEventListener('touchcancel', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('touchcancel', handleEnd);
    };
  }, [isDragging, disabled, handleStep]);

  return (
    <div className="flex flex-col items-center select-none w-full">
      {/* Knob Label & Step Indicator */}
      <div className="flex items-center justify-between w-full max-w-[280px] mb-2 px-1">
        <span
          className={`text-[11px] font-mono-retro font-bold uppercase tracking-wider ${
            nightMode ? 'text-amber-300/80' : 'text-amber-900/90'
          }`}
        >
          MANUEL FREKANS KADRANI
        </span>
        <span
          className={`text-xs font-mono-retro tabular-nums font-bold px-2 py-0.5 rounded ${
            nightMode
              ? 'bg-amber-950/80 text-amber-400 border border-amber-500/30'
              : 'bg-amber-100/90 text-amber-950 border border-amber-300'
          }`}
        >
          {frequency.toFixed(1)} MHz
        </span>
      </div>

      {/* Main Knob and Quick Step Buttons */}
      <div className="flex items-center justify-center gap-3 w-full">
        {/* Step Down Button */}
        <button
          type="button"
          onClick={() => handleStep(-1)}
          disabled={disabled || frequency <= minFrequency}
          className={`h-11 w-11 rounded-full flex flex-col items-center justify-center transition-all active:scale-95 shadow-md ${
            nightMode
              ? 'bg-stone-900 hover:bg-stone-800 text-amber-400 border border-amber-700/40 active:border-amber-400 shadow-black/60'
              : 'bg-gradient-to-b from-stone-100 to-stone-300 hover:from-white hover:to-stone-200 text-stone-800 border border-stone-400 active:border-amber-600 shadow-stone-600/30'
          } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
          title="Frekansı 0.1 Düşür"
          aria-label="Frekansı 0.1 Düşür"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          <span className="text-[9px] font-mono-retro font-bold -mt-0.5">-0.1</span>
        </button>

        {/* Rotary Dial / Round Knob */}
        <div
          ref={knobRef}
          onMouseDown={(e) => {
            e.preventDefault();
            startDrag(e.clientX, e.clientY);
          }}
          onTouchStart={(e) => {
            startDrag(e.touches[0].clientX, e.touches[0].clientY);
          }}
          className={`relative h-28 w-28 sm:h-32 sm:w-32 rounded-full cursor-grab active:cursor-grabbing p-1.5 transition-shadow duration-200 ${
            nightMode
              ? 'bg-stone-950 shadow-[0_10px_25px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,180,60,0.15)] ring-2 ring-amber-700/50'
              : 'bg-stone-800 shadow-[0_10px_20px_rgba(40,20,10,0.4),inset_0_2px_4px_rgba(255,255,255,0.4)] ring-2 ring-amber-600/60'
          }`}
          style={{ touchAction: 'none' }}
        >
          {/* Outer Knurled Bakelite Bezel with Tick Marks */}
          <div
            className={`w-full h-full rounded-full relative flex items-center justify-center overflow-hidden ${
              nightMode
                ? 'bg-gradient-to-b from-stone-900 via-stone-950 to-black'
                : 'bg-gradient-to-b from-stone-700 via-stone-800 to-stone-900'
            }`}
          >
            {/* 12 Notches Around the Bezel */}
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-0.5 h-2 top-1 origin-bottom"
                style={{
                  transformOrigin: '50% 54px',
                  transform: `rotate(${i * 30}deg)`,
                  backgroundColor: nightMode ? 'rgba(217, 119, 6, 0.4)' : 'rgba(251, 191, 36, 0.6)',
                }}
              />
            ))}

            {/* Inner Rotating Brass Core */}
            <div
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full relative shadow-inner flex items-center justify-center transition-transform duration-75"
              style={{
                transform: `rotate(${rotationAngle}deg)`,
                background: nightMode
                  ? 'radial-gradient(circle at 35% 35%, #78350f 0%, #451a03 50%, #1c0a02 100%)'
                  : 'radial-gradient(circle at 35% 35%, #d97706 0%, #b45309 45%, #78350f 100%)',
                boxShadow: nightMode
                  ? 'inset 0 2px 6px rgba(255,190,80,0.3), inset 0 -3px 8px rgba(0,0,0,0.9)'
                  : 'inset 0 2px 6px rgba(255,255,255,0.6), inset 0 -3px 8px rgba(0,0,0,0.8)',
              }}
            >
              {/* Metallic Center Cap with Ribbed Texture */}
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center relative ${
                  nightMode
                    ? 'bg-gradient-to-tr from-stone-950 via-amber-950 to-stone-900 border border-amber-600/40'
                    : 'bg-gradient-to-tr from-amber-700 via-amber-500 to-amber-200 border border-amber-300'
                }`}
              >
                {/* Vintage Finger Indentation / Dimple */}
                <div
                  className={`w-4 h-4 rounded-full shadow-inner ${
                    nightMode
                      ? 'bg-black/80 border border-amber-900/60'
                      : 'bg-amber-900/40 border border-amber-200/60'
                  }`}
                />
              </div>

              {/* Indicator Notch / Brass Pointer Dot */}
              <div
                className={`absolute top-1.5 w-2 h-3.5 rounded-full shadow ${
                  nightMode
                    ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]'
                    : 'bg-white shadow-[0_0_4px_rgba(255,255,255,0.9)]'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Step Up Button */}
        <button
          type="button"
          onClick={() => handleStep(1)}
          disabled={disabled || frequency >= maxFrequency}
          className={`h-11 w-11 rounded-full flex flex-col items-center justify-center transition-all active:scale-95 shadow-md ${
            nightMode
              ? 'bg-stone-900 hover:bg-stone-800 text-amber-400 border border-amber-700/40 active:border-amber-400 shadow-black/60'
              : 'bg-gradient-to-b from-stone-100 to-stone-300 hover:from-white hover:to-stone-200 text-stone-800 border border-stone-400 active:border-amber-600 shadow-stone-600/30'
          } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
          title="Frekansı 0.1 Artır"
          aria-label="Frekansı 0.1 Artır"
        >
          <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          <span className="text-[9px] font-mono-retro font-bold -mt-0.5">+0.1</span>
        </button>
      </div>

      {/* Subtle Tactile Hint */}
      <div className="flex items-center gap-1.5 mt-2">
        <RotateCw
          className={`w-3 h-3 ${nightMode ? 'text-amber-500/60' : 'text-amber-800/60'}`}
        />
        <p
          className={`text-[10px] font-mono-retro tracking-tight ${
            nightMode ? 'text-amber-400/60' : 'text-amber-900/70'
          }`}
        >
          Döndürerek veya butonlarla hassas ayar yapın
        </p>
      </div>
    </div>
  );
};
