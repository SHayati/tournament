'use client'

import { useState } from 'react'
import { Link } from '@/i18n/navigation'

interface Player {
    id: number
    name: string
    number: number
}

interface Team {
    id: number
    name: string
    players: Player[]
    _count: { players: number }
}

interface Props {
    teams: Team[]
    tournamentId: number
    translations: {
        noPlayers: string
        managePlayers: string
    }
}

export default function TeamsList({ teams: initialTeams, tournamentId, translations }: Props) {
    const [teams, setTeams] = useState(initialTeams)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editName, setEditName] = useState('')

    const handleStartEdit = (team: Team) => {
        setEditingId(team.id)
        setEditName(team.name)
    }

    const handleSave = async (teamId: number) => {
        if (!editName.trim()) return

        try {
            const res = await fetch(`/api/tournaments/${tournamentId}/teams/${teamId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName.trim() })
            })

            if (res.ok) {
                setTeams(teams.map(t =>
                    t.id === teamId ? { ...t, name: editName.trim() } : t
                ))
                setEditingId(null)
            } else {
                alert('Failed to update team name')
            }
        } catch (e) {
            console.error(e)
            alert('Error updating team')
        }
    }

    const handleCancel = () => {
        setEditingId(null)
        setEditName('')
    }

    return (
        <tbody className="bg-white divide-y divide-gray-200">
            {teams.map((team) => (
                <tr key={team.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === team.id ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="border border-gray-300 rounded px-2 py-1 text-sm w-40"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSave(team.id)
                                        if (e.key === 'Escape') handleCancel()
                                    }}
                                    autoFocus
                                />
                                <button
                                    onClick={() => handleSave(team.id)}
                                    className="text-green-600 hover:text-green-800 font-medium"
                                >
                                    ✓
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="text-gray-600 hover:text-gray-800"
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">{team.name}</span>
                                <button
                                    onClick={() => handleStartEdit(team)}
                                    className="text-blue-500 hover:text-blue-700 text-sm"
                                    title="Edit team name"
                                >
                                    ✏️
                                </button>
                            </div>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {team._count.players} players
                        </span>
                    </td>
                    <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                            {team.players.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                    {team.players.map((player) => (
                                        <span key={player.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            #{player.number} {player.name}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <span className="text-gray-500">{translations.noPlayers}</span>
                            )}
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                            href={`/tournaments/${tournamentId}/teams/${team.id}/players`}
                            className="text-blue-600 hover:text-blue-900"
                        >
                            {translations.managePlayers}
                        </Link>
                    </td>
                </tr>
            ))}
        </tbody>
    )
}
