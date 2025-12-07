import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import prisma from "./db"

const isDebugMode = process.env.DEBUG === 'true';
const SUPER_USER_EMAIL = 'irangreenpaper@gmail.com';

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    session: {
        // Use JWT for debug mode to work with CredentialsProvider
        strategy: isDebugMode ? 'jwt' : 'database',
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            allowDangerousEmailAccountLinking: true,
        }),
        // Debug mode: auto-login as super-user
        ...(isDebugMode ? [
            CredentialsProvider({
                id: 'debug-login',
                name: 'Debug Login',
                credentials: {},
                async authorize() {
                    // Auto-return super-user in debug mode
                    const superUser = await prisma.user.findUnique({
                        where: { email: SUPER_USER_EMAIL }
                    });
                    if (superUser) {
                        return {
                            id: superUser.id,
                            email: superUser.email,
                            name: superUser.name,
                            isAdmin: superUser.isAdmin,
                        };
                    }
                    return null;
                }
            })
        ] : []),
    ],
    callbacks: {
        async signIn({ user, account }) {
            // Always allow debug-login provider
            if (account?.provider === 'debug-login') return true;

            if (!user.email) return false;
            const existingUser = await prisma.user.findUnique({
                where: { email: user.email },
            });
            if (!existingUser) {
                return false;
            }
            return true;
        },
        async jwt({ token, user }) {
            // Persist isAdmin to JWT token
            if (user) {
                token.id = user.id;
                // @ts-ignore
                token.isAdmin = user.isAdmin;
            }
            return token;
        },
        async session({ session, user, token }) {
            if (session.user) {
                // For JWT strategy (debug mode), use token
                if (token) {
                    session.user.id = token.id as string;
                    session.user.isAdmin = token.isAdmin as boolean;
                }
                // For database strategy, use user
                if (user) {
                    session.user.id = user.id;
                    // @ts-ignore
                    session.user.isAdmin = user.isAdmin;
                }
            }
            return session
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
}
