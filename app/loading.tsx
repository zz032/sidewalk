export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-56 rounded bg-gray-800" />
        <div className="h-40 rounded bg-gray-900" />
        <div className="h-6 w-72 rounded bg-gray-800" />
        <div className="h-64 rounded bg-gray-900" />
      </div>
    </main>
  )
}
