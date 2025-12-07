'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface Player {
  id: number
  name: string
  number: number
  teamId: number
}

interface Team {
  id: number
  name: string
  players: Player[]
}

interface Goal {
  id: number
  gameId: number
  playerId: number
  teamId: number
  minute?: number
  player: Player
}

interface Game {
  id: number
  homeTeamId: number
  awayTeamId: number
  homeScore: number
  awayScore: number
  status: string
  homeTeam: Team
  awayTeam: Team
  goals: Goal[]
}

export default function GamePage() {
  const params = useParams()
  const router = useRouter()
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPlayer, setSelectedPlayer] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchGame()
  }, [params.id])

  const fetchGame = async () => {
    try {
      const response = await fetch(`/api/games/${params.id}`)
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

  const startGame = async () => {
    try {
      const response = await fetch(`/api/games/${params.id}/start`, {
        method: 'POST',
      })

      if (response.ok) {
        setGame(prev => prev ? { ...prev, status: 'IN_PROGRESS' } : null)
      } else {
        alert('Feil ved start av kamp')
      }
    } catch (error) {
      console.error('Error starting game:', error)
      alert('Feil ved start av kamp')
    }
  }

  const finishGame = async () => {
    try {
      const response = await fetch(`/api/games/${params.id}/finish`, {
        method: 'POST',
      })

      if (response.ok) {
        setGame(prev => prev ? { ...prev, status: 'FINISHED' } : null)
      } else {
        alert('Feil ved avslutning av kamp')
      }
    } catch (error) {
      console.error('Error finishing game:', error)
      alert('Feil ved avslutning av kamp')
    }
  }

  const addGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedPlayer) {
      alert('Velg en spiller')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/games/${params.id}/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: parseInt(selectedPlayer)
        }),
      })

      if (response.ok) {
        const goal = await response.json()
        setGame(prev => prev ? {
          ...prev,
          goals: [...prev.goals, goal],
          homeScore: goal.teamId === prev.homeTeamId ? prev.homeScore + 1 : prev.homeScore,
          awayScore: goal.teamId === prev.awayTeamId ? prev.awayScore + 1 : prev.awayScore
        } : null)
        setSelectedPlayer('')
      } else {
        const error = await response.json()
        alert(error.error || 'Feil ved registrering av mål')
      }
    } catch (error) {
      console.error('Error adding goal:', error)
      alert('Feil ved registrering av mål')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getAllPlayers = () => {
    if (!game) return []
    return [...game.homeTeam.players, ...game.awayTeam.players]
  }

  const getPlayerTeam = (playerId: number) => {
    if (!game) return null
    if (game.homeTeam.players.some(p => p.id === playerId)) {
      return game.homeTeam
    }
    if (game.awayTeam.players.some(p => p.id === playerId)) {
      return game.awayTeam
    }
    return null
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

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Tilbake til kamper
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">
          {game.homeTeam.name} vs {game.awayTeam.name}
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          Status: {game.status === 'SCHEDULED' ? 'Planlagt' : game.status === 'IN_PROGRESS' ? 'Pågår' : 'Ferdig'}
        </p>
      </div>

      {/* Game Score */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {game.homeScore} - {game.awayScore}
          </div>
          <div className="text-lg text-gray-600">
            {game.homeTeam.name} vs {game.awayTeam.name}
          </div>
        </div>
      </div>

      {/* Game Controls */}
      {game.status === 'SCHEDULED' && (
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Kamp kontroller</h2>
          <button
            onClick={startGame}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            Start kamp
          </button>
        </div>
      )}

      {game.status === 'IN_PROGRESS' && (
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Registrer mål</h2>
          <form onSubmit={addGoal} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="player" className="block text-sm font-medium text-gray-700">
                Spiller
              </label>
              <select
                id="player"
                required
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Velg spiller</option>
                {getAllPlayers().map((player) => {
                  const team = getPlayerTeam(player.id)
                  return (
                    <option key={player.id} value={player.id}>
                      #{player.number} {player.name} ({team?.name})
                    </option>
                  )
                })}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isSubmitting || !selectedPlayer}
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Registrerer...' : 'Registrer mål'}
              </button>
            </div>
          </form>
          <div className="mt-4">
            <button
              onClick={finishGame}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              Avslutt kamp
            </button>
          </div>
        </div>
      )}

      {/* Goals List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Mål</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {game.goals.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              Ingen mål registrert ennå
            </div>
          ) : (
            game.goals
              .sort((a, b) => (a.minute || 0) - (b.minute || 0))
              .map((goal) => {
                const team = getPlayerTeam(goal.playerId)
                return (
                  <div key={goal.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-3">
                        ⚽
                      </span>
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          #{goal.player.number} {goal.player.name}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          ({team?.name})
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
          )}
        </div>
      </div>
    </div>
  )
}
