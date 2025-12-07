'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface Player {
  id: number
  name: string
  number: number
  teamId: number
}

interface Goal {
  id: number
  player: Player
  createdAt: string
  ownGoal: boolean
}

interface Game {
  id: number
  homeTeam: { id: number; name: string }
  awayTeam: { id: number; name: string }
  homeScore: number
  awayScore: number
  status: string
  goals: Goal[]
}

export default function EditGamePage() {
  const params = useParams()
  const router = useRouter()
  const [game, setGame] = useState<Game | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedHomePlayerId, setSelectedHomePlayerId] = useState('')
  const [selectedAwayPlayerId, setSelectedAwayPlayerId] = useState('')
  const [ownGoal, setOwnGoal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchGame()
    fetchPlayers()
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

  const fetchPlayers = async () => {
    try {
      const response = await fetch(`/api/tournaments/${params.id}/teams`)
      if (response.ok) {
        const teams = await response.json()
        const allPlayers: Player[] = []
        teams.forEach((team: any) => {
          team.players.forEach((player: Player) => {
            allPlayers.push(player)
          })
        })
        setPlayers(allPlayers)
      }
    } catch (error) {
      console.error('Error fetching players:', error)
    }
  }

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const chosenPlayerId = selectedHomePlayerId || selectedAwayPlayerId

    if (!chosenPlayerId) {
      alert('Velg en spiller')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(`/api/tournaments/${params.id}/games/${params.gameId}/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: parseInt(chosenPlayerId),
          ownGoal: ownGoal
        }),
      })

      if (response.ok) {
        await fetchGame()
        setSelectedHomePlayerId('')
        setSelectedAwayPlayerId('')
        setOwnGoal(false)
      } else {
        const errorData = await response.json()
        alert(`Feil ved registrering av mål: ${errorData.error || 'Ukjent feil'}`)
      }
    } catch (error) {
      console.error('Error adding goal:', error)
      alert('Feil ved registrering av mål')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteGoal = async (goalId: number) => {
    if (!confirm('Er du sikker på at du vil slette dette målet?')) {
      return
    }

    try {
      const response = await fetch(`/api/tournaments/${params.id}/games/${params.gameId}/goals/${goalId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchGame()
      } else {
        const errorData = await response.json()
        alert(`Feil ved sletting av mål: ${errorData.error || 'Ukjent feil'}`)
      }
    } catch (error) {
      console.error('Error deleting goal:', error)
      alert('Feil ved sletting av mål')
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

  const homeTeamPlayers = players.filter(p => p.teamId === game.homeTeam.id)
  const awayTeamPlayers = players.filter(p => p.teamId === game.awayTeam.id)

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
          Rediger kamp: {game.homeTeam.name} vs {game.awayTeam.name}
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          Legg til eller fjern mål for denne kampen
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

      {/* Add Goal Form */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Legg til mål</h2>
        <form onSubmit={handleAddGoal} className="space-y-4">
          <div className="flex flex-col md:flex-row justify-center items-center gap-4">
            <div className="w-full md:w-1/4">
              <label htmlFor="player-home" className="block text-sm font-medium text-gray-700 text-center">
                {game.homeTeam.name}
              </label>
              <select
                id="player-home"
                value={selectedHomePlayerId}
                onChange={(e) => {
                  setSelectedHomePlayerId(e.target.value)
                  if (e.target.value) setSelectedAwayPlayerId('')
                }}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Velg spiller</option>
                {homeTeamPlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    #{player.number} {player.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-1/4">
              <label htmlFor="player-away" className="block text-sm font-medium text-gray-700 text-center">
                {game.awayTeam.name}
              </label>
              <select
                id="player-away"
                value={selectedAwayPlayerId}
                onChange={(e) => {
                  setSelectedAwayPlayerId(e.target.value)
                  if (e.target.value) setSelectedHomePlayerId('')
                }}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Velg spiller</option>
                {awayTeamPlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    #{player.number} {player.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="inline-flex items-center space-x-2">
              <input
                type="checkbox"
                checked={ownGoal}
                onChange={(e) => setOwnGoal(e.target.checked)}
                className="h-4 w-4 text-red-600 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Selvmål</span>
            </label>
            <button
              type="submit"
              disabled={submitting || (!selectedHomePlayerId && !selectedAwayPlayerId)}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Registrerer...' : 'Legg til mål'}
            </button>
          </div>
        </form>
      </div>

      {/* Goals List */}
      {game.goals.length > 0 && (
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Mål ({game.goals.length})</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {game.goals.map((goal, index) => (
              <div key={goal.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 mr-4">
                    {index + 1}.
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-3">
                    #{goal.player.number}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {goal.player.name} {goal.ownGoal && <span className="text-red-500">(Selvmål)</span>}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500">
                    {new Date(goal.createdAt).toLocaleTimeString('no-NO', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                  >
                    Slett
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {game.goals.length === 0 && (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <div className="text-gray-500 text-lg">Ingen mål registrert ennå</div>
        </div>
      )}
    </div>
  )
}
