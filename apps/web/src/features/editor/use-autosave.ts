import { useCallback, useEffect, useRef, useState } from 'react'

export type SaveStatus = 'saved' | 'pending' | 'saving' | 'invalid' | 'error'

/**
 * Saves `value` `delay` ms after the last change, only while it is `valid`.
 * Saves run one after another; a value still waiting when the editor unmounts
 * is saved immediately so leaving the page does not lose the last edit.
 */
export function useAutosave<T>(
  value: T,
  { valid, save, delay = 800 }: { valid: boolean; save: (value: T) => Promise<void>; delay?: number },
): SaveStatus {
  const [status, setStatus] = useState<SaveStatus>('saved')
  const saveRef = useRef(save)
  saveRef.current = save
  const lastSaved = useRef(value)
  const waiting = useRef<{ value: T } | null>(null)
  const queue = useRef(Promise.resolve())

  const run = useCallback((next: T) => {
    waiting.current = null
    setStatus('saving')
    queue.current = queue.current.then(async () => {
      try {
        await saveRef.current(next)
        lastSaved.current = next
        if (waiting.current === null) setStatus('saved')
      } catch {
        setStatus('error')
      }
    })
  }, [])

  useEffect(() => {
    if (value === lastSaved.current) return
    if (!valid) {
      waiting.current = null
      setStatus('invalid')
      return
    }
    waiting.current = { value }
    setStatus('pending')
    const timer = setTimeout(() => run(value), delay)
    return () => clearTimeout(timer)
  }, [value, valid, delay, run])

  useEffect(
    () => () => {
      if (waiting.current) void saveRef.current(waiting.current.value).catch(() => {})
    },
    [],
  )

  return status
}
