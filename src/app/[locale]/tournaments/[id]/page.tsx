import { Link } from '@/i18n/navigation'
import { prisma } from '@/lib/prisma'
import { getTranslations, getFormatter } from 'next-intl/server'

async function getTournament(tournamentId: number) {
  return await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      teams: {
        include: {
          players: {
            orderBy: {
              number: 'asc'
            }
          },
          _count: {
            select: {
              players: true
            }
          }
        }
      },
      games: {
        include: {
          homeTeam: true,
          awayTeam: true,
          goals: {
            include: {
              player: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      },
      _count: {
        select: {
          teams: true,
          games: true
        }
      }
    }
  })
}

async function StatusBadge({ status, t }: { status: string, t: any }) {
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

export default async function TournamentPage({ params }: { params: Promise<{ id: string, locale: string }> }) {
  const { id } = await params
  const tournamentId = parseInt(id)
  const tournament = await getTournament(tournamentId)
  const t = await getTranslations('TournamentDetail');
  const format = await getFormatter();

  if (!tournament) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center text-red-600">{t('notFound')}</div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <Link
          href="/tournaments"
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          {t('back')}
        </Link>
        <div className="flex items-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            {tournament.name}
          </h1>
          {tournament.isFinished && (
            <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
              {t('status.finished')}
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-700">
          {t('created')}: {format.dateTime(new Date(tournament.createdAt), { year: 'numeric', month: '2-digit', day: '2-digit' })}
        </p>
      </div>

      {/* Tournament Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">⚽</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{t('stats.teams')}</dt>
                  <dd className="text-lg font-medium text-gray-900">{tournament._count.teams}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🏆</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{t('stats.games')}</dt>
                  <dd className="text-lg font-medium text-gray-900">{tournament._count.games}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">👥</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{t('stats.players')}</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {tournament.teams.reduce((sum, team) => sum + team._count.players, 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {!tournament.isFinished ? (
          <>
            <Link
              href={`/tournaments/${tournamentId}/teams`}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">⚽</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{t('actions.manageTeams')}</h3>
                  <p className="text-sm text-gray-500">{t('actions.manageTeamsDesc')}</p>
                </div>
              </div>
            </Link>

            <Link
              href={`/tournaments/${tournamentId}/games`}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">🏆</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{t('actions.manageGames')}</h3>
                  <p className="text-sm text-gray-500">{t('actions.manageGamesDesc')}</p>
                </div>
              </div>
            </Link>
          </>
        ) : (
          <div className="md:col-span-2 bg-gray-50 p-6 rounded-lg">
            <div className="text-center">
              <div className="text-gray-500 text-lg mb-2">{t('finishedMessage.title')}</div>
              <p className="text-sm text-gray-400">
                {t('finishedMessage.desc')}
              </p>
            </div>
          </div>
        )}

        <Link
          href={`/tournaments/${tournamentId}/standings`}
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">📊</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{t('actions.viewStandings')}</h3>
              <p className="text-sm text-gray-500">{t('actions.viewStandingsDesc')}</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Games List */}
      {tournament.games.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              {tournament.isFinished ? t('gamesList.all') : t('gamesList.recent')}
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {(tournament.isFinished ? tournament.games : tournament.games.slice(-5)).map((game, index) => (
              <div key={game.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 mr-4">
                    #{tournament.isFinished ? index + 1 : (tournament.games.length - 5 + index + 1)}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {game.homeTeam.name} vs {game.awayTeam.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {game.homeScore} - {game.awayScore}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <StatusBadge status={game.status} t={t} />
                  <Link
                    href={`/tournaments/${tournamentId}/games/${game.id}`}
                    className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                  >
                    {tournament.isFinished ? t('gamesList.viewDetails') : (game.status === 'IN_PROGRESS' ? t('gamesList.recordGoals') : t('gamesList.viewDetails'))}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
