'use client';

import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";

export default function LoginPage() {
    const t = useTranslations('Auth');

    return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <div className="mt-6">
                        <button
                            onClick={() => signIn('google', { callbackUrl: '/' })}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            {t('signInWithGoogle')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
