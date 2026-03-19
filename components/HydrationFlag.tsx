'use client'
import { useEffect } from 'react'

export default function HydrationFlag() {
  useEffect(() => {
    ;(window as any).__APP_HYDRATED__ = true
  }, [])
  return null
}
