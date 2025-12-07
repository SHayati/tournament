import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const gameId = parseInt(params.id)
    const { playerId } = await request.json()

    if (isNaN(gameId)) {
      return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 })
    }

    if (!playerId) {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 })
    }

    // Check if game exists and is in progress
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        homeTeam: {
          include: {
            players: true
          }
        },
        awayTeam: {
          include: {
            players: true
          }
        }
      }
    })

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    if (game.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: 'Game is not in progress' }, { status: 400 })
    }

    // Check if player exists and belongs to one of the teams
    const player = await prisma.player.findUnique({
      where: { id: playerId }
    })

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    const isHomePlayer = game.homeTeam.players.some((p: { id: number }) => p.id === playerId)
    const isAwayPlayer = game.awayTeam.players.some((p: { id: number }) => p.id === playerId)

    if (!isHomePlayer && !isAwayPlayer) {
      return NextResponse.json({ error: 'Player does not belong to either team in this game' }, { status: 400 })
    }

    const teamId = isHomePlayer ? game.homeTeamId : game.awayTeamId

    // Create the goal
    const goal = await prisma.goal.create({
      data: {
        gameId: gameId,
        playerId: playerId,
        teamId: teamId
      },
      include: {
        player: true
      }
    })

    // Update game scores
    const isHomeGoal = teamId === game.homeTeamId
    await prisma.game.update({
      where: { id: gameId },
      data: {
        homeScore: isHomeGoal ? game.homeScore + 1 : game.homeScore,
        awayScore: !isHomeGoal ? game.awayScore + 1 : game.awayScore
      }
    })

    return NextResponse.json(goal)
  } catch (error) {
    console.error('Error adding goal:', error)
    return NextResponse.json({ error: 'Failed to add goal' }, { status: 500 })
  }
}
