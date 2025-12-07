import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import prisma from "./db"

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            allowDangerousEmailAccountLinking: true,
        }),
    ],
    callbacks: {
        async signIn({ user }) {
            if (!user.email) return false;
            const existingUser = await prisma.user.findUnique({
                where: { email: user.email },
            });
            if (!existingUser) {
                return false;
            }
            return true;
        },
        async session({ session, user }) {
            if (session.user) {
                // @ts-ignore
                session.user.id = user.id;
                // @ts-ignore
                session.user.isAdmin = user.isAdmin;
            }
            return session
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
}
