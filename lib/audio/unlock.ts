let unlocked = false

export function ensureMediaUnlocked(): Promise<void> {
  if (unlocked) return Promise.resolve()

  return new Promise((resolve) => {
    const tryUnlock = async () => {
      try {
        // Try AudioContext resume
        const AC: any = (window as any).AudioContext || (window as any).webkitAudioContext
        if (AC) {
          const ctx = new AC()
          await ctx.resume().catch(() => {})
          // Play a tiny silent buffer to satisfy iOS gesture requirement
          const buffer = ctx.createBuffer(1, 1, 22050)
          const source = ctx.createBufferSource()
          source.buffer = buffer
          source.connect(ctx.destination)
          source.start(0)
          source.stop(ctx.currentTime + 0.01)
        }

        // Also attempt HTMLAudioElement silent play
        const a = new Audio()
        // 1ms silent mp3 (smallest possible data URI)
        a.src =
          'data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCA//////////////////////////////////////////8AAAAAA'
        a.volume = 0
        a.play().catch(() => {})

        unlocked = true
      } catch {
        // ignore
      } finally {
        cleanup()
        resolve()
      }
    }

    const events = ['pointerdown', 'touchstart', 'click', 'keydown']
    const handler = () => tryUnlock()
    const cleanup = () => events.forEach((ev) => window.removeEventListener(ev, handler, { once: true } as any))
    events.forEach((ev) => window.addEventListener(ev, handler, { once: true } as any))

    // If already in a user gesture (e.g., called from a click), run immediately
    setTimeout(() => {
      if (!unlocked) tryUnlock()
    }, 0)
  })
}

export function isMediaUnlocked() {
  return unlocked
}

