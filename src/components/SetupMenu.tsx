'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl';
import LanguageSwitcher from './LanguageSwitcher';
import { useSession, signIn, signOut } from "next-auth/react";
import { Link } from '@/i18n/navigation';

export default function SetupMenu() {
  const t = useTranslations('SetupMenu');
  const tAuth = useTranslations('Auth');
  const { data: session } = useSession();
  const [open, setOpen] = useState(false)
  const [minutes, setMinutes] = useState<string>('0')
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Load existing value
    try {
      const saved = localStorage.getItem('stopwatchTargetSeconds')
      if (saved) {
        const m = Math.floor(parseInt(saved, 10) / 60)
        setMinutes(String(m))
      }
    } catch { }

    const onClick = (e: MouseEvent) => {
      if (open && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [open])

  const saveTarget = (mins: number) => {
    const secs = Math.max(0, Math.floor(mins * 60))
    try {
      localStorage.setItem('stopwatchTargetSeconds', String(secs))
    } catch { }
    // Notify listeners in the same tab
    try {
      window.dispatchEvent(new CustomEvent('stopwatchTargetChange', { detail: { seconds: secs } }))
    } catch { }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen(!open)
        }}
        className="px-3 py-1.5 text-sm rounded bg-gray-100 text-gray-800 hover:bg-gray-200"
      >
        {t('settings')}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 p-4 z-[100]">
          {session ? (
            <>
              <div className="mb-2 text-sm font-medium text-gray-900">{t('title')}</div>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder={t('placeholder')}
                value={minutes}
                onChange={(e) => {
                  // allow empty during typing
                  setMinutes(e.target.value)
                  const m = parseInt(e.target.value, 10)
                  if (!isNaN(m)) {
                    saveTarget(m)
                  } else if (e.target.value === '') {
                    saveTarget(0) // treat empty as no limit
                  }
                }}
                className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm px-3 py-2 text-black"
              />
              <p className="mt-2 text-xs text-gray-500">{t('hint')}</p>
            </>
          ) : null}

          <div className="mt-4 pt-4 border-t border-gray-200">
            <LanguageSwitcher />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
            {/* @ts-ignore */}
            {session?.user?.isAdmin && (
              <Link href="/users" className="block text-sm text-gray-700 hover:text-blue-600">
                {tAuth('users')}
              </Link>
            )}
            {session ? (
              <button
                onClick={() => signOut()}
                className="block w-full text-left text-sm text-red-600 hover:text-red-700"
              >
                {tAuth('logout')}
              </button>
            ) : (
              <button
                onClick={() => signIn('google')}
                className="block w-full text-left text-sm text-blue-600 hover:text-blue-700"
              >
                {tAuth('login')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


