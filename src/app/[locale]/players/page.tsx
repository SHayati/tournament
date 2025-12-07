'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';

interface Player {
  id: number
  name: string
  isActive: boolean
}

interface PlayerStats {
  id: number
  name: string
  isActive: boolean
  wins: number
  draws: number
  losses: number
  goalsScored: number
  ownGoals: number
  tournamentsParticipated: number
}

export default function PlayersHomePage() {
  const t = useTranslations('Players');
  const { data: session } = useSession();
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const loadData = async () => {
    try {
      const [statsRes, playersRes] = await Promise.all([
        fetch('/api/players/stats'),
        fetch('/api/players')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setPlayerStats(statsData)
      }
      if (playersRes.ok) {
        const playersData = await playersRes.json()
        setPlayers(playersData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) return;

    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlayerName.trim() })
      });

      if (res.ok) {
        setNewPlayerName('');
        setIsAdding(false);
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add player');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdatePlayer = async (id: number, data: { name?: string; isActive?: boolean }) => {
    try {
      const res = await fetch('/api/players', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data })
      });

      if (res.ok) {
        setEditingId(null);
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleActive = async (player: Player) => {
    await handleUpdatePlayer(player.id, { isActive: !player.isActive });
  };

  const handleSaveEdit = async (id: number) => {
    if (!editName.trim()) return;
    await handleUpdatePlayer(id, { name: editName.trim() });
  };

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center">{t('loading')}</div>
      </div>
    )
  }

  // Merge player data with stats
  const mergedPlayers = players.map(player => {
    const stats = playerStats.find(s => s.id === player.id);
    return {
      ...player,
      wins: stats?.wins || 0,
      draws: stats?.draws || 0,
      losses: stats?.losses || 0,
      goalsScored: stats?.goalsScored || 0,
      ownGoals: stats?.ownGoals || 0,
      tournamentsParticipated: stats?.tournamentsParticipated || 0
    };
  });

  return (
    <div className="px-4 py-6 sm:px-0 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{t('title')}</h1>

        {session && (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            ➕ Add Player
          </button>
        )}
      </div>

      {/* Add Player Form */}
      {isAdding && (
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Add New Player</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Player name"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
            />
            <button
              onClick={handleAddPlayer}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
            >
              Save
            </button>
            <button
              onClick={() => { setIsAdding(false); setNewPlayerName(''); }}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Player Statistics Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">{t('statsTitle')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.player')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.tournaments')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.won')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.draw')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.lost')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.goals')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.ownGoals')}
                </th>
                {session && (
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mergedPlayers.length === 0 ? (
                <tr>
                  <td colSpan={session ? 9 : 8} className="px-6 py-8 text-center text-gray-500">
                    {t('empty')}
                  </td>
                </tr>
              ) : (
                mergedPlayers
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((player) => (
                    <tr key={player.id} className={`hover:bg-gray-50 ${!player.isActive ? 'opacity-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === player.id ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(player.id)}
                            autoFocus
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-900">{player.name}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${player.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                          }`}>
                          {player.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {player.tournamentsParticipated}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {player.wins}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {player.draws}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {player.losses}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {player.goalsScored}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {player.ownGoals}
                        </span>
                      </td>
                      {session && (
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                          {editingId === player.id ? (
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleSaveEdit(player.id)}
                                className="text-green-600 hover:text-green-800"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="text-gray-600 hover:text-gray-800"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => { setEditingId(player.id); setEditName(player.name); }}
                                className="text-blue-600 hover:text-blue-800"
                                title="Edit name"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleToggleActive(player)}
                                className={player.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}
                                title={player.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {player.isActive ? '⏸' : '▶'}
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}