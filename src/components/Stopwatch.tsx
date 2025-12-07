'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl';
import { useSession } from "next-auth/react";

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  return `${mm}:${ss}`
}

export default function Stopwatch() {
  const t = useTranslations('Stopwatch');
  const { data: session } = useSession();
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const [targetSeconds, setTargetSeconds] = useState(0)
  const [isBuzzing, setIsBuzzing] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const hasPlayedWhistle = useRef(false)
  const isInitialLoad = useRef(true)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/sounds/whistle.mp3');
    audioRef.current.preload = 'auto';
  }, []);

  // Play whistle using Web Audio API as fallback
  const playBeep = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;

      [0, 0.15, 0.3].forEach((delay) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = 800 + (delay * 200);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, ctx.currentTime + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.12);

        oscillator.start(ctx.currentTime + delay);
        oscillator.stop(ctx.currentTime + delay + 0.12);
      });
    } catch (e) {
      console.log('Web Audio fallback failed:', e);
    }
  }, []);

  const playWhistleAndBuzz = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play()
        .catch(() => {
          playBeep();
        });
    } else {
      playBeep();
    }

    setIsBuzzing(true);
    setTimeout(() => setIsBuzzing(false), 600);
  }, [playBeep]);

  // Sync with server
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/stopwatch');
      if (res.ok) {
        const data = await res.json();
        setTargetSeconds(data.targetSeconds);

        if (data.running) {
          setRunning(true);

          if (data.targetSeconds > 0 && data.elapsedSeconds >= data.targetSeconds) {
            setSeconds(data.targetSeconds);
            setFinished(true);

            // Only play whistle if game just ended (within 5 seconds of target)
            const secondsPastFinish = data.elapsedSeconds - data.targetSeconds;
            if (!hasPlayedWhistle.current && secondsPastFinish < 5) {
              playWhistleAndBuzz();
              hasPlayedWhistle.current = true;
            }
          } else {
            setSeconds(data.elapsedSeconds);
            setFinished(false);
          }
        } else {
          setRunning(false);
          setSeconds(0);
          setFinished(false);
          hasPlayedWhistle.current = false;
        }
      }
    } catch (e) {
      console.error("Failed to sync stopwatch", e);
    }
  }, [playWhistleAndBuzz]);

  useEffect(() => {
    fetchState().then(() => {
      // Mark initial load as complete after first fetch
      isInitialLoad.current = false;
    });
    const syncInterval = setInterval(fetchState, 2000);
    return () => clearInterval(syncInterval);
  }, [fetchState]);

  // Local tick for smooth display
  useEffect(() => {
    if (running && !finished) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          const newS = s + 1;
          if (targetSeconds > 0 && newS >= targetSeconds) {
            return targetSeconds; // Cap at target
          }
          return newS;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running, finished, targetSeconds]);

  // Separate effect to detect when seconds reach target (for whistle)
  useEffect(() => {
    if (targetSeconds > 0 && seconds >= targetSeconds && running && !finished) {
      setFinished(true);
      if (!hasPlayedWhistle.current) {
        playWhistleAndBuzz();
        hasPlayedWhistle.current = true;
      }
    }
  }, [seconds, targetSeconds, running, finished, playWhistleAndBuzz]);

  useEffect(() => {
    const handler = async (e: any) => {
      if (e?.detail?.seconds !== undefined) {
        const newTarget = e.detail.seconds;
        setTargetSeconds(newTarget);
        hasPlayedWhistle.current = false;
        await fetch('/api/stopwatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'setTarget', targetSeconds: newTarget })
        });
      }
    };
    window.addEventListener('stopwatchTargetChange' as any, handler);
    return () => window.removeEventListener('stopwatchTargetChange' as any, handler);
  }, []);

  const handleStart = async () => {
    if (!session) return;
    if (running) return;

    hasPlayedWhistle.current = false;
    setFinished(false);

    await fetch('/api/stopwatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start' })
    });
    fetchState();
  };

  const handleStop = async () => {
    if (!session) return;

    await fetch('/api/stopwatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'stop' })
    });
    hasPlayedWhistle.current = false;
    fetchState();
  };

  const handleReset = async () => {
    if (!session) return;

    hasPlayedWhistle.current = false;
    setFinished(false);
    setSeconds(0);

    await fetch('/api/stopwatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset' })
    });
    fetchState();
  };

  const showControls = !!session;

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="px-4 py-2 bg-gray-900 text-white rounded-lg shadow-lg hover:bg-gray-800 transition-colors text-sm"
      >
        ⏱️ Show Timer
      </button>
    );
  }

  return (
    <div className={`
      relative flex flex-col items-center justify-center p-4 rounded-xl shadow-2xl transition-all duration-300
      ${finished ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gradient-to-br from-gray-900 to-black'}
      ${isBuzzing ? 'animate-buzz' : ''}
      border-2 border-white/10 backdrop-blur-md min-w-[280px]
    `}>
      {/* Close button */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white text-xs transition-colors"
        title="Hide timer"
      >
        ✕
      </button>

      {/* Decorative top line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

      <div className="flex items-center space-x-6">
        {/* Time Display */}
        <div className="flex flex-col items-center">
          <span className={`font-mono text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b ${finished ? 'from-white to-green-100' : 'from-blue-400 to-cyan-300'} drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] select-none`}>
            {formatTime(seconds)}
          </span>

          {/* Game Duration Display - black text when finished for visibility */}
          <div className={`mt-2 text-xs font-mono ${finished ? 'text-black font-semibold' : 'text-gray-400'}`}>
            {targetSeconds > 0
              ? `Game duration: ${Math.floor(targetSeconds / 60)} min`
              : 'No time limit set'
            }
          </div>
        </div>

        {/* Controls - keep same colors regardless of finished state */}
        {showControls && (
          <div className="flex flex-col space-y-2">
            <button
              type="button"
              onClick={running ? handleStop : handleStart}
              disabled={finished}
              className={`p-3 rounded-full shadow-lg transition-transform active:scale-95 flex items-center justify-center border border-white/10
                ${running
                  ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400'
                  : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                }
                ${finished ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {running ? '⏸' : '▶'}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="p-3 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 shadow-lg transition-transform active:scale-95 border border-white/10 flex items-center justify-center"
            >
              🔄
            </button>
          </div>
        )}
      </div>

      {/* Finished Status */}
      {finished && (
        <div className="absolute -bottom-8 bg-green-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg animate-bounce">
          ⏱️ Time's Up!
        </div>
      )}

      <style jsx global>{`
        @keyframes buzz {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          10% { transform: translateX(-4px) rotate(-2deg); }
          20% { transform: translateX(4px) rotate(2deg); }
          30% { transform: translateX(-4px) rotate(-2deg); }
          40% { transform: translateX(4px) rotate(2deg); }
          50% { transform: translateX(-3px) rotate(-1deg); }
          60% { transform: translateX(3px) rotate(1deg); }
          70% { transform: translateX(-2px) rotate(-1deg); }
          80% { transform: translateX(2px) rotate(1deg); }
          90% { transform: translateX(-1px) rotate(0deg); }
        }
        .animate-buzz {
          animation: buzz 0.6s ease-in-out;
        }
      `}</style>
    </div>
  );
}
