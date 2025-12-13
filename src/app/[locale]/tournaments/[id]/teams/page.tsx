import { Link } from '@/i18n/navigation'
import { prisma } from '@/lib/prisma'
import { getTranslations } from 'next-intl/server'
import TeamsList from '@/components/TeamsList'

async function getTournamentWithTeams(tournamentId: number) {
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
      }
    }
  })
}

export default async function TournamentTeamsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tournamentId = parseInt(id)
  const tournament = await getTournamentWithTeams(tournamentId)
  const t = await getTranslations('Teams');

  if (!tournament) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center text-red-600">{t('notFound')}</div>
      </div>
    )
  }

  const translations = {
    noPlayers: t('noPlayers'),
    managePlayers: t('managePlayers')
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
        <h1 className="text-2xl font-semibold text-gray-900">
          {t('title', { name: tournament.name })}
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          {t('subtitle')}
        </p>
      </div>

      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h2 className="text-lg font-medium text-gray-900">{t('teamsHeader')}</h2>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href={`/tournaments/${tournamentId}/teams/new`}
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
                      {t('table.team')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {t('table.playerCount')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {t('table.players')}
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">{t('table.actions')}</span>
                    </th>
                  </tr>
                </thead>
                <TeamsList
                  teams={tournament.teams}
                  tournamentId={tournamentId}
                  translations={translations}
                />
              </table>
            </div>
          </div>
        </div>
      </div>

      {tournament.teams.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">{t('empty')}</div>
        </div>
      )}
    </div>
  )
}
