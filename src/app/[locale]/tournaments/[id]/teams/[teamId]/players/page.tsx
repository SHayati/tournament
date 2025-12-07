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
  const [unassignedPlayers, setUnassignedPlayers] = useState<Player[]>([])
  const [selectedPoolPlayerId, setSelectedPoolPlayerId] = useState('')
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    fetchTeam()
    fetchUnassigned()
  }, [params.teamId])

  const fetchTeam = async () => {
    try {
      const response = await fetch(`/api/tournaments/${params.id}/teams/${params.teamId}`)
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

  const fetchUnassigned = async () => {
    try {
      const response = await fetch(`/api/tournaments/${params.id}/players`)
      if (response.ok) {
        const data = await response.json()
        setUnassignedPlayers(data)
      }
    } catch (error) {
      console.error('Error fetching unassigned players:', error)
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
      const response = await fetch(`/api/tournaments/${params.id}/teams/${params.teamId}/players`, {
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

  const handleAssignFromPool = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPoolPlayerId) return
    if (players.length >= 10) {
      alert('Et lag kan maksimalt ha 10 spillere')
      return
    }
    setAssigning(true)
    try {
      const response = await fetch(`/api/tournaments/${params.id}/teams/${params.teamId}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromPlayerId: parseInt(selectedPoolPlayerId, 10) })
      })
      if (response.ok) {
        const player = await response.json()
        setPlayers([...players, player])
        setSelectedPoolPlayerId('')
        setUnassignedPlayers(unassignedPlayers.filter(p => p.id !== player.id))
      } else {
        const error = await response.json()
        alert(error.error || 'Feil ved tildeling av spiller')
      }
    } catch (error) {
      console.error('Error assigning player:', error)
      alert('Feil ved tildeling av spiller')
    } finally {
      setAssigning(false)
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
        // Remove from team players list
        setPlayers(players.filter(p => p.id !== playerId))
        // Refresh unassigned players list to show the freed player
        fetchUnassigned()
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

      {/* Removed manual add player form as per request */}

      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <form onSubmit={handleAssignFromPool} className="flex gap-3 items-end">
          <select
            value={selectedPoolPlayerId}
            onChange={(e) => setSelectedPoolPlayerId(e.target.value)}
            className="block w-1/2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Velg spiller</option>
            {unassignedPlayers.sort((a,b)=>a.number-b.number).map((p) => (
              <option key={p.id} value={p.id}>{`#${p.number} ${p.name}`}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={assigning || !selectedPoolPlayerId || players.length >= 10}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {assigning ? 'Legger til...' : 'Legg til spiller'}
          </button>
        </form>
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
