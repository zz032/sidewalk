'use client'
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="mt-2 text-gray-400">The UI hit a runtime error. Try reload.</p>
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => reset()}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Reload
        </button>
      </div>
      <pre className="mt-6 whitespace-pre-wrap rounded-md bg-gray-900 p-3 text-xs text-gray-400">
        {error?.message}
      </pre>
    </div>
  )
}
