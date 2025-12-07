'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface Game {
  id: number
  homeTeam: { id: number; name: string }
  awayTeam: { id: number; name: string }
  status: string
}

export default function StartGamePage() {
  const params = useParams()
  const router = useRouter()
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGame()
  }, [params.gameId])

  const fetchGame = async () => {
    try {
      const response = await fetch(`/api/tournaments/${params.id}/games/${params.gameId}`)
      if (response.ok) {
        const gameData = await response.json()
        setGame(gameData)
      }
    } catch (error) {
      console.error('Error fetching game:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartGame = async () => {
    try {
      const response = await fetch(`/api/tournaments/${params.id}/games/${params.gameId}/start`, {
        method: 'POST',
      })

      if (response.ok) {
        router.push(`/tournaments/${params.id}/games/${params.gameId}`)
      } else {
        const errorData = await response.json()
        alert(`Feil ved start av kamp: ${errorData.error || 'Ukjent feil'}`)
      }
    } catch (error) {
      console.error('Error starting game:', error)
      alert('Feil ved start av kamp')
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center">Laster...</div>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center text-red-600">Kamp ikke funnet</div>
      </div>
    )
  }

  if (game.status !== 'SCHEDULED') {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">
            Denne kampen kan ikke startes (Status: {game.status})
          </div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Tilbake
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-md mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Tilbake til kamper
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Start kamp</h1>
          <p className="mt-2 text-sm text-gray-700">
            Bekreft at du vil starte denne kampen
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="text-center">
            <div className="text-lg font-medium text-gray-900 mb-4">
              {game.homeTeam.name} vs {game.awayTeam.name}
            </div>
            <div className="text-sm text-gray-500 mb-6">
              Kampen vil bli startet og du kan begynne å registrere mål
            </div>
            <div className="text-xs text-gray-400">
              Status: Planlagt → Pågår
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={() => router.back()}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Avbryt
          </button>
          <button
            onClick={handleStartGame}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Start kamp
          </button>
        </div>
      </div>
    </div>
  )
}
