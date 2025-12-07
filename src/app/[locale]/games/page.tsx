import Link from 'next/link'
import { prisma } from '@/lib/prisma'

async function getGames() {
  return await prisma.game.findMany({
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
  })
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'SCHEDULED':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Planlagt</span>
    case 'IN_PROGRESS':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pågår</span>
    case 'FINISHED':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Ferdig</span>
    default:
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>
  }
}

export default async function GamesPage() {
  const games = await getGames()

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Kamper</h1>
          <p className="mt-2 text-sm text-gray-700">
            Administrer kamper og registrer mål
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <div className="flex space-x-3">
            <Link
              href="/games/new"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:w-auto"
            >
              Opprett ny kamp
            </Link>
            <Link
              href="/standings"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
            >
              Vis tabell
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      #
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Kamp
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Resultat
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Handlinger</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {games.map((game, index) => (
                    <tr key={game.id}>
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {game.homeTeam.name} vs {game.awayTeam.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {game.homeScore} - {game.awayScore}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {game.status === 'SCHEDULED' ? (
                          <Link
                            href={`/games/${game.id}`}
                            className="text-green-600 hover:text-green-900"
                          >
                            Start spill
                          </Link>
                        ) : game.status === 'IN_PROGRESS' ? (
                          <Link
                            href={`/games/${game.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Registrer mål
                          </Link>
                        ) : (
                          <Link
                            href={`/games/${game.id}`}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Se detaljer
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {games.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">Ingen kamper opprettet ennå</div>
          <Link
            href="/games/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            Opprett din første kamp
          </Link>
        </div>
      )}
    </div>
  )
}
