'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import LastTournamentSummary from '@/components/dashboard/LastTournamentSummary';
import TopScorers from '@/components/dashboard/TopScorers';

export default function Home() {
  const t = useTranslations('Home');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">

      {/* Hero / Welcome Section */}
      <div className="text-center mb-10">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
          {t('title')}
        </h2>
        <p className="text-lg text-gray-600">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">

        {/* Main Column: Tournament Summary with Buttons & Upcoming Matches */}
        <div className="lg:col-span-2">
          {data?.lastTournament ? (
            <LastTournamentSummary
              data={data.lastTournament}
              upcomingMatches={data.upcomingMatches || []}
              tournamentDate={data.tournamentDate}
              onRefresh={fetchData}
            />
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 text-center">
              <p className="text-gray-500 mb-4">No tournament data available</p>
              <Link
                href="/tournaments/new"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Create Tournament
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar: Top Scorers */}
        <div className="lg:col-span-1">
          <TopScorers
            data={data?.topScorers || []}
            tournamentName={data?.tournamentName}
            tournamentDate={data?.tournamentDate}
          />
        </div>

      </div>
    </div>
  )
}
