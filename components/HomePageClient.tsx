'use client'
import { useState } from 'react'
import ScenePanel from './ScenePanel'
import ChatPanel from './ChatPanel'
import { generateScene } from '../lib/scene'
import type { Scene } from '../types'

export default function HomePageClient() {
  const [scene, setScene] = useState<Scene | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const s = await generateScene(6)
      setScene(s)
      setShowHint(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <section className="lg:col-span-3 space-y-4 lg:sticky lg:top-6 self-start">
        <h1 className="text-2xl font-semibold">AI Language Roleplay</h1>
        <div className="flex gap-2">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
          >
            {loading ? 'Generating…' : 'Generate Scene'}
          </button>
          <button
            onClick={() => setShowHint((v) => !v)}
            disabled={!scene}
            className="inline-flex items-center rounded-md border border-gray-700 bg-gray-900 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {showHint ? 'Hide Closure Hint' : 'Show Closure Hint'}
          </button>
        </div>
        <ScenePanel scene={scene ?? undefined} showHint={showHint} />
      </section>
      <section className="lg:col-span-9 space-y-4">
        <ChatPanel scene={scene ?? undefined} />
      </section>
    </main>
  )
}
