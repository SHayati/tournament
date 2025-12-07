import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);

    // Basic protection: must be logged in. 
    // Ideally check for admin, but for now we list all if logged in.
    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const users = await prisma.user.findMany({
        where: {
            email: {
                not: 'irangreenpaper@gmail.com'
            }
        },
        select: {
            id: true,
            email: true,
            name: true,
            isAdmin: true,
            createdAt: true
        },
        orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(users);
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session?.user?.isAdmin) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const body = await request.json();
        const { email, name } = body;

        if (!email) {
            return new NextResponse('Email is required', { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return new NextResponse('User already exists', { status: 409 });
        }

        const newUser = await prisma.user.create({
            data: {
                email,
                name,
                isAdmin: false, // Default to not admin
            },
        });

        return NextResponse.json(newUser);
    } catch (error) {
        console.error('Error creating user:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
