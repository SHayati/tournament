'use client';

import { signIn, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DebugLoginPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'loading') return;

        if (session) {
            // Already logged in, redirect home
            router.push('/');
            return;
        }

        // Auto-sign in with debug credentials
        signIn('debug-login', { redirect: true, callbackUrl: '/' });
    }, [session, status, router]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Debug mode: Auto-logging in as super-user...</p>
            </div>
        </div>
    );
}
