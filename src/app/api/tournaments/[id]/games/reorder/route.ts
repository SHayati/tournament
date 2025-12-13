import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const tournamentId = parseInt(id)
        const body = await request.json()
        const { gameId, direction } = body

        if (isNaN(tournamentId) || !gameId || !direction) {
            return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
        }

        // Get all games for this tournament ordered by sortOrder, then by id as fallback
        let games = await prisma.game.findMany({
            where: { tournamentId },
            orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]
        })

        // If all games have same sortOrder (e.g., all 0), initialize them
        const allSameSortOrder = games.every(g => g.sortOrder === games[0]?.sortOrder)
        if (allSameSortOrder && games.length > 1) {
            // Initialize sortOrder values
            await prisma.$transaction(
                games.map((game, index) =>
                    prisma.game.update({
                        where: { id: game.id },
                        data: { sortOrder: index + 1 }
                    })
                )
            )
            // Re-fetch after initialization
            games = await prisma.game.findMany({
                where: { tournamentId },
                orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]
            })
        }

        const currentIndex = games.findIndex(g => g.id === gameId)
        if (currentIndex === -1) {
            return NextResponse.json({ error: 'Game not found' }, { status: 404 })
        }

        const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
        if (swapIndex < 0 || swapIndex >= games.length) {
            return NextResponse.json({ error: 'Cannot move further' }, { status: 400 })
        }

        // Swap sortOrder values
        const currentGame = games[currentIndex]
        const swapGame = games[swapIndex]

        await prisma.$transaction([
            prisma.game.update({
                where: { id: currentGame.id },
                data: { sortOrder: swapGame.sortOrder }
            }),
            prisma.game.update({
                where: { id: swapGame.id },
                data: { sortOrder: currentGame.sortOrder }
            })
        ])

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error reordering games:', error)
        return NextResponse.json({ error: 'Failed to reorder games' }, { status: 500 })
    }
}
