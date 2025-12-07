import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params // signature kept; fetch globally unassigned ACTIVE players only
    const players = await prisma.player.findMany({
      where: {
        teamId: null,
        isActive: true  // Only show active players for team assignment
      },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(players)
  } catch (error) {
    console.error('Error listing unassigned players:', error)
    return NextResponse.json({ error: 'Failed to list players' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tournamentId = parseInt(id)
    const body = await request.json()
    const name: string | undefined = body.name
    const numberRaw = body.number
    const numberParsed: number = typeof numberRaw === 'number' ? numberRaw : parseInt(numberRaw, 10)
    if (isNaN(tournamentId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Player name is required' }, { status: 400 })
    }
    if (!numberParsed || isNaN(numberParsed) || numberParsed < 1 || numberParsed > 150) {
      return NextResponse.json({ error: 'Player number must be between 1 and 150' }, { status: 400 })
    }

    // Prevent duplicate numbers among globally unassigned players
    const existing = await prisma.player.findFirst({
      where: { teamId: null, number: numberParsed }
    })
    if (existing) {
      return NextResponse.json({ error: `Spillernummer ${numberParsed} finnes allerede i turneringens spillerpool` }, { status: 400 })
    }

    const player = await prisma.player.create({
      data: {
        name: name.trim(),
        number: numberParsed,
        tournamentId: isNaN(tournamentId) ? null : tournamentId,
        teamId: null
      }
    })

    return NextResponse.json(player)
  } catch (error) {
    console.error('Error creating unassigned player:', error)
    return NextResponse.json({ error: 'Failed to create player' }, { status: 500 })
  }
}


