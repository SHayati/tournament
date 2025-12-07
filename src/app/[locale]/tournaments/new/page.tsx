'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl';

export default function NewTournamentPage() {
  const t = useTranslations('TournamentsNew');
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      console.log('Submitting tournament with name:', name)

      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      })

      console.log('Response status:', response.status)

      if (response.ok) {
        const tournament = await response.json()
        console.log('Tournament created:', tournament)
        router.push(`/tournaments/${tournament.id}/teams`)
      } else {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        alert(`${t('error')}: ${errorData.error || 'Ukjent feil'}`)
      }
    } catch (error) {
      console.error('Error creating tournament:', error)
      alert(`${t('error')}: ${error instanceof Error ? error.message : 'Ukjent feil'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-md mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">{t('title')}</h1>
          <p className="mt-2 text-sm text-gray-700">
            {t('subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              {t('form.label')}
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="name"
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder={t('form.placeholder')}
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {t('form.hint')}
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t('form.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t('form.submitting') : t('form.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
