'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useFormatter } from 'next-intl';
import { useSession } from "next-auth/react";

interface Tournament {
  id: number
  name: string
  isFinished: boolean
  createdAt: string
  _count: {
    teams: number
    games: number
  }
}

export default function TournamentsPage() {
  const t = useTranslations('Tournaments');
  const format = useFormatter();
  const { data: session, status } = useSession();
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchTournaments = async () => {
    try {
      const response = await fetch('/api/tournaments')
      if (response.ok) {
        const data = await response.json()
        setTournaments(data)
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchTournaments();
    }
  }, [status, router]);

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center">{t('loading')}</div>
      </div>
    )
  }

  const handleDeleteTournament = async (tournamentId: number, tournamentName: string) => {
    if (!confirm(t('confirmDelete', { name: tournamentName }))) {
      return
    }

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Remove tournament from list
        setTournaments(tournaments.filter(t => t.id !== tournamentId))
      } else {
        const errorData = await response.json()
        alert(`${t('errorDelete')}: ${errorData.error || 'Ukjent feil'}`)
      }
    } catch (error) {
      console.error('Error deleting tournament:', error)
      alert(t('errorDelete'))
    }
  }

  const handleFinishTournament = async (tournamentId: number, tournamentName: string) => {
    if (!confirm(t('confirmFinish', { name: tournamentName }))) {
      return
    }

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isFinished: true }),
      })

      if (response.ok) {
        // Update tournament in list
        setTournaments(tournaments.map(t =>
          t.id === tournamentId ? { ...t, isFinished: true } : t
        ))
      } else {
        const errorData = await response.json()
        alert(`${t('errorFinish')}: ${errorData.error || 'Ukjent feil'}`)
      }
    } catch (error) {
      console.error('Error finishing tournament:', error)
      alert(t('errorFinish'))
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center">{t('loading')}</div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">{t('title')}</h1>
          <p className="mt-2 text-sm text-gray-700">
            {t('subtitle')}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/tournaments/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            {t('createButton')}
          </Link>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {t('table.tournament')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {t('table.teams')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {t('table.games')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {t('table.created')}
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">{t('table.actions')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tournaments.map((tournament) => (
                    <tr key={tournament.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{tournament.name}</div>
                          {tournament.isFinished && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {t('status.finished')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {tournament._count.teams} {t('teamsSuffix')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {tournament._count.games} {t('gamesSuffix')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format.dateTime(new Date(tournament.createdAt), { year: 'numeric', month: '2-digit', day: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <Link
                            href={`/tournaments/${tournament.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            {t('actions.manage')}
                          </Link>
                          {!tournament.isFinished && (
                            <button
                              onClick={() => handleFinishTournament(tournament.id, tournament.name)}
                              className="text-orange-600 hover:text-orange-900"
                            >
                              {t('actions.finish')}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteTournament(tournament.id, tournament.name)}
                            className="text-red-600 hover:text-red-900"
                          >
                            {t('actions.delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {tournaments.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">{t('empty.message')}</div>
          <Link
            href="/tournaments/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            {t('empty.createFirst')}
          </Link>
        </div>
      )}
    </div>
  )
}
