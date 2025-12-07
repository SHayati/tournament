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

export default function TeamPlayersPage() {
  const params = useParams()
  const router = useRouter()
  const [team, setTeam] = useState<Team | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [newPlayer, setNewPlayer] = useState({ name: '', number: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTeam()
  }, [params.id])

  const fetchTeam = async () => {
    try {
      const response = await fetch(`/api/teams/${params.id}`)
      if (response.ok) {
        const teamData = await response.json()
        setTeam(teamData)
        setPlayers(teamData.players || [])
      }
    } catch (error) {
      console.error('Error fetching team:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (players.length >= 10) {
      alert('Et lag kan maksimalt ha 10 spillere')
      return
    }

    const number = parseInt(newPlayer.number)
    if (isNaN(number) || number < 1 || number > 150) {
      alert('Spillernummer må være mellom 1 og 150')
      return
    }

    if (players.some(p => p.number === number)) {
      alert('Dette spillernummeret er allerede i bruk')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/teams/${params.id}/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newPlayer.name.trim(),
          number: number
        }),
      })

      if (response.ok) {
        const player = await response.json()
        setPlayers([...players, player])
        setNewPlayer({ name: '', number: '' })
      } else {
        const error = await response.json()
        alert(error.error || 'Feil ved opprettelse av spiller')
      }
    } catch (error) {
      console.error('Error creating player:', error)
      alert('Feil ved opprettelse av spiller')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeletePlayer = async (playerId: number) => {
    if (!confirm('Er du sikker på at du vil fjerne denne spilleren fra laget?')) {
      return
    }

    try {
      const response = await fetch(`/api/players/${playerId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setPlayers(players.filter(p => p.id !== playerId))
      } else {
        alert('Feil ved fjerning av spiller')
      }
    } catch (error) {
      console.error('Error removing player:', error)
      alert('Feil ved fjerning av spiller')
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center">Laster...</div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center text-red-600">Lag ikke funnet</div>
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
          ← Tilbake til lag
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">
          Spillere for {team.name}
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          Administrer spillere for dette laget ({players.length}/10 spillere)
        </p>
      </div>

      {/* Add new player form */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Legg til ny spiller</h2>
        <form onSubmit={handleAddPlayer} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="playerName" className="block text-sm font-medium text-gray-700">
              Spillernavn
            </label>
            <input
              type="text"
              id="playerName"
              required
              value={newPlayer.name}
              onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="F.eks. Erling Haaland"
            />
          </div>
          <div>
            <label htmlFor="playerNumber" className="block text-sm font-medium text-gray-700">
              Spillernummer
            </label>
            <input
              type="number"
              id="playerNumber"
              required
              min="1"
              max="99"
              value={newPlayer.number}
              onChange={(e) => setNewPlayer({ ...newPlayer, number: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="F.eks. 9"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSubmitting || players.length >= 10 || !newPlayer.name.trim() || !newPlayer.number}
              className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Legger til...' : 'Legg til spiller'}
            </button>
          </div>
        </form>
        {players.length >= 10 && (
          <p className="mt-2 text-sm text-red-600">
            Maksimalt 10 spillere per lag
          </p>
        )}
      </div>

      {/* Players list */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Spillere</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {players.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              Ingen spillere lagt til ennå
            </div>
          ) : (
            players
              .sort((a, b) => a.number - b.number)
              .map((player) => (
                <div key={player.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-3">
                      #{player.number}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{player.name}</span>
                  </div>
                  <button
                    onClick={() => handleDeletePlayer(player.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Fjern fra lag
                  </button>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  )
}
