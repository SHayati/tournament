import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const games = await prisma.game.findMany({
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
        createdAt: 'desc'
      }
    })
    return NextResponse.json(games)
  } catch (error) {
    console.error('Error fetching games:', error)
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { homeTeamId, awayTeamId } = await request.json()

    if (!homeTeamId || !awayTeamId) {
      return NextResponse.json({ error: 'Both home team and away team are required' }, { status: 400 })
    }

    if (homeTeamId === awayTeamId) {
      return NextResponse.json({ error: 'Home team and away team cannot be the same' }, { status: 400 })
    }

    // Check if both teams exist
    const teams = await prisma.team.findMany({
      where: {
        id: {
          in: [homeTeamId, awayTeamId]
        }
      }
    })

    if (teams.length !== 2) {
      return NextResponse.json({ error: 'One or both teams not found' }, { status: 404 })
    }

    // Since we validated both teams exist, we can use the tournamentId from the first team
    // (Assuming both teams operate within valid tournaments, practically they should be in the same one for a game)
    const tournamentId = teams[0].tournamentId;

    const game = await prisma.game.create({
      data: {
        homeTeamId: homeTeamId,
        awayTeamId: awayTeamId,
        tournamentId: tournamentId,
        status: 'SCHEDULED'
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
