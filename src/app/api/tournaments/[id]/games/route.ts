import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tournamentId = parseInt(id)

    if (isNaN(tournamentId)) {
      return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 })
    }

    const games = await prisma.game.findMany({
      where: { tournamentId },
      include: {
        homeTeam: true,
        awayTeam: true,
        goals: {
          include: {
            player: true
          }
        }
      },
      orderBy: [
        { sortOrder: 'asc' },
        { id: 'asc' }  // Fallback for games with same sortOrder
      ]
    })
    return NextResponse.json(games)
  } catch (error) {
    console.error('Error fetching games:', error)
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tournamentId = parseInt(id)
    const { homeTeamId, awayTeamId } = await request.json()

    if (isNaN(tournamentId)) {
      return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 })
    }

    if (!homeTeamId || !awayTeamId) {
      return NextResponse.json({ error: 'Both home and away team IDs are required' }, { status: 400 })
    }

    if (homeTeamId === awayTeamId) {
      return NextResponse.json({ error: 'Home and away teams cannot be the same' }, { status: 400 })
    }

    // Check if tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    // Check if teams exist and belong to tournament
    const teams = await prisma.team.findMany({
      where: {
        id: { in: [homeTeamId, awayTeamId] },
        tournamentId: tournamentId
      }
    })

    if (teams.length !== 2) {
      return NextResponse.json({ error: 'One or both teams not found in tournament' }, { status: 400 })
    }

    // Get max sortOrder for this tournament
    const maxOrder = await prisma.game.findFirst({
      where: { tournamentId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true }
    })

    const game = await prisma.game.create({
      data: {
        tournamentId: tournamentId,
        homeTeamId: homeTeamId,
        awayTeamId: awayTeamId,
        status: 'SCHEDULED',
        sortOrder: (maxOrder?.sortOrder ?? 0) + 1
      },
      include: {
        homeTeam: true,
        awayTeam: true
      }
    })

    return NextResponse.json(game)
  } catch (error) {
    console.error('Error creating game:', error)
    return NextResponse.json({ error: 'Failed to create game' }, { status: 500 })
  }
}
