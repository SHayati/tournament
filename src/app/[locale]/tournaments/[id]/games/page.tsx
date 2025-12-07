'use client'

import { Link, useRouter } from '@/i18n/navigation'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl';

interface Game {
  id: number
  homeTeam: { id: number; name: string }
  awayTeam: { id: number; name: string }
  homeScore: number
  awayScore: number
  status: string
  createdAt: string
  goals: any[]
}

interface Tournament {
  id: number
  name: string
  teams: any[]
  games: Game[]
}

export default function TournamentGamesPage() {
  const t = useTranslations('Games');
  const params = useParams()
  const router = useRouter()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTournament()
  }, [params.id])

  const fetchTournament = async () => {
    try {
      const response = await fetch(`/api/tournaments/${params.id}/games`)
      if (response.ok) {
        const games = await response.json()
        // Create a mock tournament object with games
        setTournament({
          id: parseInt(params.id as string),
          name: 'Tournament', // Ideally fetch tournament name too or pass it
          teams: [],
          games: games
        })
      }
    } catch (error) {
      console.error('Error fetching tournament:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartGame = async (gameId: number) => {
    try {
      const response = await fetch(`/api/tournaments/${params.id}/games/${gameId}/start`, {
        method: 'POST',
      })

      if (response.ok) {
        // Redirect to game details page
        router.push(`/tournaments/${params.id}/games/${gameId}`)
      } else {
        const errorData = await response.json()
        alert(`Feil ved start av kamp: ${errorData.error || 'Ukjent feil'}`)
      }
    } catch (error) {
      console.error('Error starting game:', error)
      alert('Feil ved start av kamp')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{t('status.scheduled')}</span>
      case 'IN_PROGRESS':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">{t('status.inProgress')}</span>
      case 'FINISHED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">{t('status.finished')}</span>
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center">Laster...</div>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center text-red-600">{t('notFound')}</div>
      </div>
    )
  }

  const tournamentId = tournament.id

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <Link
          href={`/tournaments/${tournamentId}`}
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          {t('back')}
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">
          {t('title', { name: tournament.name })}
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          {t('subtitle')}
        </p>
      </div>

      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h2 className="text-lg font-medium text-gray-900">{t('gamesHeader')}</h2>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href={`/tournaments/${tournamentId}/games/new`}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            {t('createButton')}
          </Link>
        </div>
      </div>

      <div className="flow-root">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      #
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {t('table.match')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {t('table.result')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {t('table.goals')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {t('table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tournament.games.map((game, index) => (
                    <tr key={game.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {game.homeTeam.name} vs {game.awayTeam.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(game.createdAt).toLocaleDateString('no-NO')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {game.homeScore} - {game.awayScore}
                        </div>
                        {getStatusBadge(game.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {t('goalsCount', { count: game.goals.length })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {game.status === 'SCHEDULED' && (
                          <button
                            onClick={() => handleStartGame(game.id)}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            {t('actions.start')}
                          </button>
                        )}
                        {game.status === 'IN_PROGRESS' && (
                          <Link
                            href={`/tournaments/${tournamentId}/games/${game.id}`}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            {t('actions.recordGoals')}
                          </Link>
                        )}
                        {game.status === 'FINISHED' && (
                          <div className="flex space-x-3">
                            <Link
                              href={`/tournaments/${tournamentId}/games/${game.id}`}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              {t('actions.details')}
                            </Link>
                            <Link
                              href={`/tournaments/${tournamentId}/games/${game.id}/edit`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              {t('actions.edit')}
                            </Link>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {tournament.games.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">{t('empty')}</div>
        </div>
      )}
    </div>
  )
}
