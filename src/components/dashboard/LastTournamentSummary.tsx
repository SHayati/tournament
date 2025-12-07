'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface Props {
    data: {
        name: string;
        standings: any[];
    };
    upcomingMatches: any[];
    tournamentDate?: string;
    onRefresh: () => void;
}

export default function LastTournamentSummary({ data, upcomingMatches, tournamentDate, onRefresh }: Props) {
    const t = useTranslations('Home');

    // Format date as "7 DEC 2025"
    const formattedDate = tournamentDate
        ? new Date(tournamentDate).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }).toUpperCase()
        : '';

    if (!data) return null;

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            {/* Header with tournament name and date */}
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">🏆 {data.name}</h3>
                    {formattedDate && (
                        <p className="text-xs text-gray-500">{formattedDate}</p>
                    )}
                </div>
                <span className="text-xs text-gray-400 animate-pulse">Live Updates</span>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-3 gap-2 mb-6">
                <Link
                    href="/tournaments"
                    className="bg-gray-50 border border-gray-200 hover:border-blue-500 hover:bg-blue-50 text-gray-700 font-medium py-2 px-3 rounded-lg transition duration-200 flex flex-col items-center justify-center text-center text-xs"
                >
                    <span className="text-lg mb-0.5">🏆</span>
                    <span>{t('manageTournaments')}</span>
                </Link>
                <Link
                    href="/tournaments/new"
                    className="bg-gray-50 border border-gray-200 hover:border-green-500 hover:bg-green-50 text-gray-700 font-medium py-2 px-3 rounded-lg transition duration-200 flex flex-col items-center justify-center text-center text-xs"
                >
                    <span className="text-lg mb-0.5">➕</span>
                    <span>{t('createTournament')}</span>
                </Link>
                <Link
                    href="/standings"
                    className="bg-gray-50 border border-gray-200 hover:border-purple-500 hover:bg-purple-50 text-gray-700 font-medium py-2 px-3 rounded-lg transition duration-200 flex flex-col items-center justify-center text-center text-xs"
                >
                    <span className="text-lg mb-0.5">📊</span>
                    <span>{t('viewStandings')}</span>
                </Link>
            </div>

            {/* Standings Table */}
            <div className="overflow-x-auto mb-6">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="py-2 px-3 text-left font-semibold text-gray-600">Team</th>
                            <th className="py-2 px-3 text-center text-gray-600">P</th>
                            <th className="py-2 px-3 text-center text-gray-600">W</th>
                            <th className="py-2 px-3 text-center text-gray-600">D</th>
                            <th className="py-2 px-3 text-center text-gray-600">L</th>
                            <th className="py-2 px-3 text-center font-bold text-gray-800">Pts</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.standings.map((team: any, i: number) => (
                            <tr key={team.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                                <td className="py-2 px-3 font-medium text-gray-800">
                                    {i === 0 && '🥇 '}
                                    {i === 1 && '🥈 '}
                                    {i === 2 && '🥉 '}
                                    {team.name}
                                </td>
                                <td className="py-2 px-3 text-center text-gray-600">{team.played}</td>
                                <td className="py-2 px-3 text-center text-gray-600">{team.wins}</td>
                                <td className="py-2 px-3 text-center text-gray-600">{team.draws}</td>
                                <td className="py-2 px-3 text-center text-gray-600">{team.losses}</td>
                                <td className="py-2 px-3 text-center font-bold text-blue-600">{team.points}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Upcoming Matches */}
            {upcomingMatches && upcomingMatches.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">⚽ Upcoming Matches</h4>
                    <div className="space-y-2">
                        {upcomingMatches.map((match: any) => (
                            <div
                                key={match.id}
                                className={`flex items-center justify-between p-3 rounded-lg ${match.status === 'IN_PROGRESS'
                                        ? 'bg-red-50 border border-red-200'
                                        : 'bg-gray-50 border border-gray-200'
                                    }`}
                            >
                                <div className="flex items-center space-x-2 flex-1">
                                    <span className="font-medium text-gray-800 text-sm">{match.homeTeam}</span>
                                    {match.status === 'IN_PROGRESS' ? (
                                        <span className="text-sm font-bold text-red-600">
                                            {match.homeScore} - {match.awayScore}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400">vs</span>
                                    )}
                                    <span className="font-medium text-gray-800 text-sm">{match.awayTeam}</span>
                                </div>
                                {match.status === 'IN_PROGRESS' && (
                                    <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                                        🔴 LIVE
                                    </span>
                                )}
                                {match.status === 'SCHEDULED' && (
                                    <span className="text-xs text-gray-500">Scheduled</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {upcomingMatches && upcomingMatches.length === 0 && (
                <div className="border-t border-gray-100 pt-4">
                    <p className="text-sm text-gray-400 italic text-center">No upcoming matches scheduled</p>
                </div>
            )}
        </div>
    );
}
