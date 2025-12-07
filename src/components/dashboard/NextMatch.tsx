'use client';
import { useTranslations } from 'next-intl';

export default function NextMatch({ data }: { data: any }) {
    const t = useTranslations('Dashboard');

    if (!data) return (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 flex items-center justify-center h-full">
            <p className="text-gray-400 italic">No upcoming matches scheduled</p>
        </div>
    );

    const isLive = data.status === 'IN_PROGRESS';

    return (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-20 text-6xl">⚽</div>

            <h3 className="text-lg font-semibold mb-4 text-indigo-100 uppercase tracking-wider">
                {isLive ? '🔴 LIVE NOW' : '📅 NEXT MATCH'}
            </h3>

            <div className="flex items-center justify-between space-x-4">
                <div className="text-center flex-1">
                    <div className="text-2xl font-bold mb-1">{data.homeTeam}</div>
                    <div className="text-sm opacity-80">HOME</div>
                </div>

                <div className="flex flex-col items-center">
                    <div className="text-xl font-bold bg-white/20 px-3 py-1 rounded-lg backdrop-blur-sm">
                        VS
                    </div>
                </div>

                <div className="text-center flex-1">
                    <div className="text-2xl font-bold mb-1">{data.awayTeam}</div>
                    <div className="text-sm opacity-80">AWAY</div>
                </div>
            </div>

            {!isLive && (
                <div className="mt-6 text-center text-sm font-medium bg-black/20 rounded-lg py-2">
                    {new Date(data.time).toLocaleString()}
                </div>
            )}
        </div>
    );
}
