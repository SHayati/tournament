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
    const teamId = parseInt(params.id)
    const { name, number } = await request.json()

    if (isNaN(teamId)) {
      return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 })
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Player name is required' }, { status: 400 })
    }

    if (!number || isNaN(number) || number < 1 || number > 150) {
      return NextResponse.json({ error: 'Player number must be between 1 and 150' }, { status: 400 })
    }

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        _count: {
          select: {
            players: true
          }
        }
      }
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    if (team._count.players >= 10) {
      return NextResponse.json({ error: 'Team already has maximum number of players (10)' }, { status: 400 })
    }

    // Check if player number is already taken
    const existingPlayer = await prisma.player.findFirst({
      where: {
        teamId: teamId,
        number: number
      }
    })

    if (existingPlayer) {
      return NextResponse.json({ error: 'Player number already taken' }, { status: 400 })
    }

    const player = await prisma.player.create({
      data: {
        name: name.trim(),
        number: number,
        teamId: teamId,
        tournamentId: team.tournamentId
      }
    })

    // Store team composition for historical tracking
    await prisma.teamComposition.create({
      data: {
        tournamentId: team.tournamentId,
        teamId: teamId,
        playerId: player.id
      }
    })

    return NextResponse.json(player)
  } catch (error) {
    console.error('Error creating player:', error)
    return NextResponse.json({ error: 'Failed to create player' }, { status: 500 })
  }
}
