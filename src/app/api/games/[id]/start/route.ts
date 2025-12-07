import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await params
    const gameId = parseInt(id)

    if (isNaN(gameId)) {
      return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 })
    }

    const game = await prisma.game.findUnique({
      where: { id: gameId }
    })

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    if (game.status !== 'SCHEDULED') {
      return NextResponse.json({ error: 'Game is not in scheduled status' }, { status: 400 })
    }

    const updatedGame = await prisma.game.update({
      where: { id: gameId },
      data: {
        status: 'IN_PROGRESS',
        timerStart: new Date()
      }
    })

    return NextResponse.json(updatedGame)
  } catch (error) {
    console.error('Error starting game:', error)
    return NextResponse.json({ error: 'Failed to start game' }, { status: 500 })
  }
}
