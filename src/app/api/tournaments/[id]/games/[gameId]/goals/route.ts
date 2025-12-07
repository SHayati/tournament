import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; gameId: string }> }
) {
  try {
    const { id, gameId } = await params
    const tournamentId = parseInt(id)
    const gameIdNum = parseInt(gameId)
    const { playerId, ownGoal } = await request.json()

    if (isNaN(tournamentId) || isNaN(gameIdNum)) {
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 })
    }

    if (!playerId) {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 })
    }

    // Check if game exists and belongs to tournament
    const game = await prisma.game.findFirst({
      where: {
        id: gameIdNum,
        tournamentId: tournamentId
      }
    })

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    if (game.status !== 'IN_PROGRESS' && game.status !== 'FINISHED') {
      return NextResponse.json({ error: 'Game is not in progress or finished' }, { status: 400 })
    }

    // Check if player exists and belongs to one of the teams in the game
    const player = await prisma.player.findFirst({
      where: {
        id: playerId,
        team: {
          OR: [
            { id: game.homeTeamId },
            { id: game.awayTeamId }
          ]
        }
      },
      include: {
        team: true
      }
    })

    if (!player) {
      return NextResponse.json({ error: 'Player not found or not part of this game' }, { status: 400 })
    }

    // Determine credited team: own goal -> opposite team
    // Verify player has a team
    if (!player.teamId) {
      return NextResponse.json({ error: 'Player is not assigned to a team' }, { status: 400 })
    }

    // Determine credited team: own goal -> opposite team
    const creditedTeamId = ownGoal ?
      (player.teamId === game.homeTeamId ? game.awayTeamId : game.homeTeamId) :
      player.teamId

    // Create the goal
    const goal = await prisma.goal.create({
      data: {
        gameId: gameIdNum,
        playerId: playerId,
        teamId: creditedTeamId,
        ownGoal: Boolean(ownGoal)
      },
      include: {
        player: true
      }
    })

    // Update game score with credited team
    const isHomeCredited = creditedTeamId === game.homeTeamId
    await prisma.game.update({
      where: { id: gameIdNum },
      data: {
        homeScore: isHomeCredited ? game.homeScore + 1 : game.homeScore,
        awayScore: isHomeCredited ? game.awayScore : game.awayScore + 1
      }
    })

    return NextResponse.json(goal)
  } catch (error) {
    console.error('Error adding goal:', error)
    return NextResponse.json({ error: 'Failed to add goal' }, { status: 500 })
  }
}
