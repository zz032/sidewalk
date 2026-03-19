import type { Scene } from '../types'
import { presentScene } from '../lib/scene/scenePresenter'

export default function ScenePanel({ scene, showHint = false }: { scene?: Scene; showHint?: boolean }) {
  if (!scene) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
        <div className="text-sm text-gray-400">Scene</div>
        <div className="mt-2 rounded-md bg-gray-800 p-4 text-gray-300">
          No scene yet. Click “Generate Scene”.
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <div className="text-sm text-gray-400">Scene</div>
      <SceneOverview scene={scene} showHint={showHint} />
    </div>
  )
}

function SceneOverview({ scene, showHint }: { scene: Scene; showHint: boolean }) {
  const presented = presentScene(scene)
  return (
    <div className="mt-3 space-y-3 text-gray-200">
      <div className="text-lg font-semibold text-gray-100">{presented.title}</div>
      <div>
        <div className="text-xs uppercase tracking-wide text-gray-400">Situation</div>
        <div className="mt-1 rounded-md bg-gray-800 p-3 leading-relaxed text-gray-100">{presented.situation}</div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-gray-400">Your Role</div>
        <div className="mt-1 text-gray-100">{presented.role}</div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-gray-400">Goal</div>
        <div className="mt-1 text-gray-100">{presented.goal}</div>
      </div>
    </div>
  )
}
