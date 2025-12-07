'use client';

interface TopScorersProps {
    data: any[];
    tournamentName?: string;
    tournamentDate?: string;
}

export default function TopScorers({ data, tournamentName, tournamentDate }: TopScorersProps) {
    // Format date as "30 NOV 2025"
    const formattedDate = tournamentDate
        ? new Date(tournamentDate).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }).toUpperCase()
        : '';

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    👟 Top Scorers
                </h3>
                {(tournamentName || formattedDate) && (
                    <p className="text-xs text-gray-500 mt-1">
                        {tournamentName}{formattedDate && ` • ${formattedDate}`}
                    </p>
                )}
            </div>

            <div className="space-y-3">
                {data.map((player, i) => (
                    <div key={player.id} className="flex items-center justify-between border-b border-gray-50 last:border-0 pb-3 last:pb-0">
                        <div className="flex items-center space-x-3">
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                                ${i === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}
                            `}>
                                {i + 1}
                            </div>
                            <div>
                                <div className="font-semibold text-gray-800">{player.name}</div>
                                <div className="text-xs text-gray-500">{player.teamName}</div>
                            </div>
                        </div>
                        <div className="font-bold text-lg text-blue-600">
                            {player.goals} ⚽
                        </div>
                    </div>
                ))}

                {data.length === 0 && (
                    <div className="text-center text-gray-400 py-4 italic">
                        No goals scored yet
                    </div>
                )}
            </div>
        </div>
    );
}
