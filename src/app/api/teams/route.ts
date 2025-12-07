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
    const teams = await prisma.team.findMany({
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
    return NextResponse.json(teams)
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let { name, tournamentId } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 })
    }

    // If no tournamentId provided, find the most recent one (fallback)
    if (!tournamentId) {
      const latestTournament = await prisma.tournament.findFirst({
        orderBy: { createdAt: 'desc' }
      });

      if (latestTournament) {
        tournamentId = latestTournament.id;
      }
    }

    // If still no tournamentId, we cannot create a team
    if (!tournamentId) {
      return NextResponse.json({ error: 'No tournament found to assign team to' }, { status: 400 })
    }

    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        tournamentId: parseInt(tournamentId as string) // Ensure it's a number
      }
    })

    return NextResponse.json(team)
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 })
  }
}
