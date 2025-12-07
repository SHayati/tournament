import Link from 'next/link'
import { prisma } from '@/lib/prisma'

async function getTeams() {
  return await prisma.team.findMany({
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
  })
}

export default async function TeamsPage() {
  const teams = await getTeams()

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Lag</h1>
          <p className="mt-2 text-sm text-gray-700">
            Administrer lag og spillere i turneringen
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/teams/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            Opprett nytt lag
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
                      Lag
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Antall spillere
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Spillere
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Handlinger</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teams.map((team) => (
                    <tr key={team.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{team.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {team._count.players}/10 spillere
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
                            <span className="text-gray-500">Ingen spillere</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/teams/${team.id}/players`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Administrer spillere
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {teams.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">Ingen lag opprettet ennå</div>
          <Link
            href="/teams/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Opprett ditt første lag
          </Link>
        </div>
      )}
    </div>
  )
}
