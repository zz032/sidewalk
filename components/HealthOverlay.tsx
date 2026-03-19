'use client'
import { useEffect, useState } from 'react'

export default function HealthOverlay() {
  const [errorText, setErrorText] = useState<string | null>(null)
  const [offline, setOffline] = useState<boolean>(false)

  useEffect(() => {
    const onErr = (e: ErrorEvent) => {
      setErrorText(e?.message || 'Runtime error')
    }
    const onRej = (e: PromiseRejectionEvent) => {
      const msg = (e?.reason && (e.reason.message || String(e.reason))) || 'Unhandled rejection'
      setErrorText(msg)
    }
    const onOnline = () => setOffline(false)
    const onOffline = () => setOffline(true)
    window.addEventListener('error', onErr)
    window.addEventListener('unhandledrejection', onRej)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    setOffline(!navigator.onLine)
    return () => {
      window.removeEventListener('error', onErr)
      window.removeEventListener('unhandledrejection', onRej)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  if (!errorText && !offline) return null
  return (
    <div className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-7xl p-2">
        {offline && (
          <div className="rounded-md border border-yellow-700 bg-yellow-950 px-3 py-2 text-sm text-yellow-200">
            Network offline
          </div>
        )}
        {errorText && (
          <div className="mt-2 rounded-md border border-red-700 bg-red-950 px-3 py-2 text-sm text-red-200">
            {errorText}
          </div>
        )}
      </div>
    </div>
  )
}
