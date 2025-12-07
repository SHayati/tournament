import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await params
    const playerId = parseInt(id)

    if (isNaN(playerId)) {
      return NextResponse.json({ error: 'Invalid player ID' }, { status: 400 })
    }

    // Check if player exists
    const player = await prisma.player.findUnique({
      where: { id: playerId }
    })

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    // If player is assigned to a team, "free" them by setting teamId and tournamentId to null
    // If player is already unassigned, delete them completely
    if (player.teamId) {
      await prisma.player.update({
        where: { id: playerId },
        data: {
          teamId: null,
          tournamentId: null
        }
      })
    } else {
      await prisma.player.delete({
        where: { id: playerId }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting player:', error)
    return NextResponse.json({ error: 'Failed to delete player' }, { status: 500 })
  }
}
