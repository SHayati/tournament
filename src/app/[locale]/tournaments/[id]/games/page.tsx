'use client'

import { Link, useRouter } from '@/i18n/navigation'
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';

interface Game {
  id: number
  homeTeam: { id: number; name: string }
  awayTeam: { id: number; name: string }
  homeScore: number
  awayScore: number
  status: string
  sortOrder: number
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
  const { data: session } = useSession();
  const params = useParams()
  const router = useRouter()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [draggedId, setDraggedId] = useState<number | null>(null)
  const [dragOverId, setDragOverId] = useState<number | null>(null)
  const touchStartY = useRef<number>(0)
  const touchGameId = useRef<number | null>(null)

  useEffect(() => {
    fetchTournament()
  }, [params.id])

  const fetchTournament = async () => {
    try {
      const response = await fetch(`/api/tournaments/${params.id}/games`)
      if (response.ok) {
        const games = await response.json()
        setTournament({
          id: parseInt(params.id as string),
          name: 'Tournament',
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
        router.push(`/tournaments/${params.id}/games/${gameId}`)
      } else {
        const errorData = await response.json()
        alert(`Error starting game: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error starting game:', error)
      alert('Error starting game')
    }
  }

  const handleDeleteGame = async (gameId: number, gameName: string) => {
    if (!confirm(`Are you sure you want to delete the game "${gameName}"? This cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/tournaments/${params.id}/games/${gameId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setTournament(prev => prev ? {
          ...prev,
          games: prev.games.filter(g => g.id !== gameId)
        } : null)
      } else {
        const errorData = await response.json()
        alert(`Error deleting game: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting game:', error)
      alert('Error deleting game')
    }
  }

  const handleMoveGame = async (gameId: number, direction: 'up' | 'down') => {
    try {
      const response = await fetch(`/api/tournaments/${params.id}/games/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, direction })
      })

      if (response.ok) {
        fetchTournament()
      }
    } catch (error) {
      console.error('Error reordering game:', error)
    }
  }

  const handleDragStart = (e: React.DragEvent, gameId: number) => {
    setDraggedId(gameId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, gameId: number) => {
    e.preventDefault()
    if (draggedId !== gameId) {
      setDragOverId(gameId)
    }
  }

  const handleDragLeave = () => {
    setDragOverId(null)
  }

  const handleDrop = async (e: React.DragEvent, targetGameId: number) => {
    e.preventDefault()
    if (draggedId && draggedId !== targetGameId && tournament) {
      const sortedGames = [...tournament.games].sort((a, b) => a.sortOrder - b.sortOrder)
      const draggedIndex = sortedGames.findIndex(g => g.id === draggedId)
      const targetIndex = sortedGames.findIndex(g => g.id === targetGameId)

      if (draggedIndex !== -1 && targetIndex !== -1) {
        const direction = draggedIndex < targetIndex ? 'down' : 'up'
        const steps = Math.abs(targetIndex - draggedIndex)

        // Move step by step
        for (let i = 0; i < steps; i++) {
          await handleMoveGame(draggedId, direction)
        }
      }
    }
    setDraggedId(null)
    setDragOverId(null)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverId(null)
  }

  // Touch handlers for mobile drag
  const handleTouchStart = (e: React.TouchEvent, gameId: number) => {
    touchStartY.current = e.touches[0].clientY
    touchGameId.current = gameId
  }

  const handleTouchEnd = async (e: React.TouchEvent) => {
    if (!touchGameId.current) return

    const touchEndY = e.changedTouches[0].clientY
    const diff = touchStartY.current - touchEndY

    // If swiped more than 50px, move the game
    if (Math.abs(diff) > 50) {
      const direction = diff > 0 ? 'up' : 'down'
      await handleMoveGame(touchGameId.current, direction)
    }

    touchGameId.current = null
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
        <div className="text-center">Loading...</div>
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
  const sortedGames = [...tournament.games].sort((a, b) => a.sortOrder - b.sortOrder)

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
          {session && (
            <p className="text-xs text-gray-500 mt-1">💡 Drag rows or use arrows to reorder. Swipe on touch screens.</p>
          )}
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
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      #
                    </th>
                    {session && (
                      <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
                        ↕
                      </th>
                    )}
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
                  {sortedGames.map((game, index) => (
                    <tr
                      key={game.id}
                      draggable={!!session}
                      onDragStart={(e) => handleDragStart(e, game.id)}
                      onDragOver={(e) => handleDragOver(e, game.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, game.id)}
                      onDragEnd={handleDragEnd}
                      onTouchStart={(e) => session && handleTouchStart(e, game.id)}
                      onTouchEnd={(e) => session && handleTouchEnd(e)}
                      className={`
                        ${session ? 'cursor-move' : ''}
                        ${draggedId === game.id ? 'opacity-50 bg-blue-50' : ''}
                        ${dragOverId === game.id ? 'bg-blue-100 border-2 border-blue-400' : ''}
                        transition-colors duration-150
                      `}
                    >
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {index + 1}
                      </td>
                      {session && (
                        <td className="px-2 py-4 whitespace-nowrap text-center">
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleMoveGame(game.id, 'up')}
                              disabled={index === 0}
                              className={`text-sm ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'}`}
                              title="Move up"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => handleMoveGame(game.id, 'down')}
                              disabled={index === sortedGames.length - 1}
                              className={`text-sm ${index === sortedGames.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'}`}
                              title="Move down"
                            >
                              ▼
                            </button>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {game.homeTeam.name} vs {game.awayTeam.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(game.createdAt).toLocaleDateString('en-GB')}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          {game.status === 'SCHEDULED' && (
                            <button
                              onClick={() => handleStartGame(game.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              {t('actions.start')}
                            </button>
                          )}
                          {game.status === 'IN_PROGRESS' && (
                            <Link
                              href={`/tournaments/${tournamentId}/games/${game.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              {t('actions.recordGoals')}
                            </Link>
                          )}
                          {game.status === 'FINISHED' && (
                            <>
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
                            </>
                          )}
                          {session && (
                            <button
                              onClick={() => handleDeleteGame(game.id, `${game.homeTeam.name} vs ${game.awayTeam.name}`)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete game"
                            >
                              🗑️
                            </button>
                          )}
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

      {tournament.games.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">{t('empty')}</div>
        </div>
      )}
    </div>
  )
}
