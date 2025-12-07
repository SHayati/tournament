'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl';

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  return `${mm}:${ss}`
}

export default function Stopwatch() {
  const t = useTranslations('Stopwatch');
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const pathname = usePathname()
  const [targetSeconds, setTargetSeconds] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('stopwatchTargetSeconds')
      return saved ? parseInt(saved, 10) : 0
    } catch { return 0 }
  })

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1)
      }, 1000)
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [running])

  // Observe target changes from Setup
  useEffect(() => {
    const handler = (e: any) => {
      if (e?.detail?.seconds !== undefined) {
        setTargetSeconds(e.detail.seconds)
      }
    }
    window.addEventListener('stopwatchTargetChange' as any, handler)
    return () => window.removeEventListener('stopwatchTargetChange' as any, handler)
  }, [])

  // Stop at target time and auto-finish game if on game page
  useEffect(() => {
    if (!running) return
    if (!targetSeconds || targetSeconds <= 0) return
    if (seconds === targetSeconds) {
      // Stop timer
      setRunning(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }

      // Auto-finish game if we're on a game page
      const gamePageMatch = pathname.match(/^\/tournaments\/(\d+)\/games\/(\d+)$/)
      if (gamePageMatch) {
        const tournamentId = gamePageMatch[1]
        const gameId = gamePageMatch[2]

        // Call finish game API
        fetch(`/api/tournaments/${tournamentId}/games/${gameId}/finish`, {
          method: 'POST',
        })
          .then(response => {
            if (response.ok) {
              // Reload the page to show updated game status
              window.location.reload()
            }
          })
          .catch(error => {
            console.error('Error auto-finishing game:', error)
          })
      }
    }
  }, [seconds, targetSeconds, running, pathname])

  const handleToggle = () => {
    setRunning((r) => !r)
  }
  const handleReset = () => setSeconds(0)

  return (
    <div className="flex items-center space-x-3">
      {running ? (
        <button
          type="button"
          onClick={handleToggle}
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md transition-all duration-200 transform hover:scale-105"
          aria-label={t('pause')}
        >
          ⏸️ {t('pause')}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleToggle}
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-md transition-all duration-200 transform hover:scale-105"
          aria-label={t('start')}
        >
          ▶️ {t('start')}
        </button>
      )}
      <div className="relative">
        <span className="font-mono text-3xl font-bold px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg select-none border-2 border-white/20">
          {formatTime(seconds)}
        </span>
        {running && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse border-2 border-white"></div>
        )}
      </div>
      <button
        type="button"
        onClick={handleReset}
        className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-gray-400 to-gray-500 text-white hover:from-gray-500 hover:to-gray-600 shadow-md transition-all duration-200 transform hover:scale-105"
        aria-label={t('reset')}
      >
        🔄 {t('reset')}
      </button>
    </div>
  )
}


