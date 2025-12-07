'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Team {
  id: number
  name: string
}

export default function NewGamePage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [homeTeamId, setHomeTeamId] = useState('')
  const [awayTeamId, setAwayTeamId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams')
      if (response.ok) {
        const teamsData = await response.json()
        setTeams(teamsData)
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (homeTeamId === awayTeamId) {
      alert('Hjemmelag og bortelag kan ikke være det samme')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          homeTeamId: parseInt(homeTeamId),
          awayTeamId: parseInt(awayTeamId)
        }),
      })

      if (response.ok) {
        const game = await response.json()
        router.push(`/games/${game.id}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Feil ved opprettelse av kamp')
      }
    } catch (error) {
      console.error('Error creating game:', error)
      alert('Feil ved opprettelse av kamp')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center">Laster...</div>
      </div>
    )
  }

  if (teams.length < 2) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center">
          <div className="text-gray-500 text-lg mb-4">
            Du trenger minst 2 lag for å opprette en kamp
          </div>
          <button
            onClick={() => router.push('/teams/new')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Opprett lag
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-md mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Opprett ny kamp</h1>
          <p className="mt-2 text-sm text-gray-700">
            Velg hjemmelag og bortelag for kampen
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="homeTeam" className="block text-sm font-medium text-gray-700">
              Hjemmelag
            </label>
            <select
              id="homeTeam"
              required
              value={homeTeamId}
              onChange={(e) => setHomeTeamId(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Velg hjemmelag</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="awayTeam" className="block text-sm font-medium text-gray-700">
              Bortelag
            </label>
            <select
              id="awayTeam"
              required
              value={awayTeamId}
              onChange={(e) => setAwayTeamId(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Velg bortelag</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !homeTeamId || !awayTeamId || homeTeamId === awayTeamId}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Oppretter...' : 'Opprett kamp'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
