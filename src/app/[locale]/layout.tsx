import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';
import Stopwatch from '@/components/Stopwatch';
import SetupMenu from '@/components/SetupMenu';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Link } from '@/i18n/navigation';

const inter = Inter({ subsets: ['latin'] });

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Common' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

import { Providers } from '@/components/Providers';

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  // Helper to access translations directly here for server rendering part
  const t = (key: string) => {
    // @ts-ignore
    return messages?.Navigation?.[key] || key;
  };

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <div className="min-h-screen bg-gray-50">
              <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="grid grid-cols-3 items-center h-14">
                    <div className="flex items-center">
                      <h1 className="hidden sm:block text-lg font-semibold text-gray-900">
                        {/* @ts-ignore */}
                        {messages?.Common?.title || 'Persia Fotball turnering'}
                      </h1>
                    </div>
                    <div className="flex justify-center md:col-start-2">
                      {/* Stopwatch moved below header */}
                    </div>
                    <nav className="flex items-center justify-end space-x-1 col-start-3">

                      <Link href="/" className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-white rounded-md hover:bg-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                        {t('home')}
                      </Link>
                      <Link href="/players" className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-white rounded-md hover:bg-purple-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50">
                        {t('players')}
                      </Link>
                      <Link href="/tournaments" className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-white rounded-md hover:bg-green-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/50">
                        {t('tournaments')}
                      </Link>
                      <Link href="/standings" className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-white rounded-md hover:bg-indigo-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                        {t('standings')}
                      </Link>
                      <SetupMenu />
                    </nav>
                  </div>
                </div>
              </header>
              <div className="flex justify-center mt-4 px-4 sticky top-2 z-50">
                <Stopwatch />
              </div>
              <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {children}
              </main>
            </div>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

