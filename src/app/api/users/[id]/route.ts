import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;

    // Check if target user is super admin
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (targetUser?.email === 'irangreenpaper@gmail.com') {
        return new NextResponse('Cannot modify super admin', { status: 403 });
    }

    // Prevent deleting self
    if (session.user.id === id) {
        return new NextResponse('Cannot delete self', { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;

    // Check if target user is super admin
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (targetUser?.email === 'irangreenpaper@gmail.com') {
        return new NextResponse('Cannot modify super admin', { status: 403 });
    }

    const body = await request.json();
    const { isAdmin } = body;

    await prisma.user.update({
        where: { id },
        data: { isAdmin }
    });

    return NextResponse.json({ success: true });
}
