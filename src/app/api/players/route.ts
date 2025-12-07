import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const players = await prisma.player.findMany({
      orderBy: [{ name: 'asc' }]
    })
    return NextResponse.json(players)
  } catch (error) {
    console.error('Error fetching players:', error)
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const name: string | undefined = body.name

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Player name is required' }, { status: 400 })
    }

    const player = await prisma.player.create({
      data: {
        name: name.trim(),
        number: 0,
        isActive: true,
        teamId: null,
        tournamentId: null
      }
    })

    return NextResponse.json(player)
  } catch (error) {
    console.error('Error creating player:', error)
    return NextResponse.json({ error: 'Failed to create player' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (isActive !== undefined) updateData.isActive = isActive

    const player = await prisma.player.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(player)
  } catch (error) {
    console.error('Error updating player:', error)
    return NextResponse.json({ error: 'Failed to update player' }, { status: 500 })
  }
}
