'use client'
import { useRef, useState } from 'react'
import { createSTTRecorder, transcribeAudio } from '../lib/audio'

export default function MicrophoneButton({
  onText,
}: {
  onText?: (text: string) => void
}) {
  const recRef = useRef<ReturnType<typeof createSTTRecorder> | null>(null)
  const [recording, setRecording] = useState(false)

  const handleClick = async () => {
    if (!recording) {
      if (!recRef.current) recRef.current = createSTTRecorder(16000)
      await recRef.current.start()
      setRecording(true)
    } else {
      const blob = await recRef.current!.stop()
      setRecording(false)
      try {
        const text = await transcribeAudio(blob)
        onText?.(text)
      } catch {
      }
    }
  }

  return (
    <button
      onClick={handleClick}
      className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-800 bg-gray-900 px-4 py-3 text-sm font-medium text-gray-200 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
    >
      <span>🎤</span>
      <span>{recording ? 'Recording… click to stop' : 'Microphone'}</span>
    </button>
  )
}
