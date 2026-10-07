import { useEffect, useState } from 'react'

/** Milliseconds left until `endsAt` (server time), never negative. */
export function remainingMs(endsAt: number, clockOffset: number, localNow: number): number {
  return Math.max(0, endsAt - (localNow + clockOffset))
}

/** Remaining ms (rounded up to 100 ms), updated every animation frame until it reaches 0. */
export function useCountdown(endsAt: number | null, clockOffset: number): number {
  const compute = () => (endsAt === null ? 0 : Math.ceil(remainingMs(endsAt, clockOffset, Date.now()) / 100) * 100)
  const [remaining, setRemaining] = useState(compute)

  useEffect(() => {
    if (endsAt === null) {
      setRemaining(0)
      return
    }
    let frame = 0
    const tick = () => {
      const value = compute()
      setRemaining(value)
      if (value > 0) frame = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(frame)
    // compute only depends on endsAt and clockOffset.
  }, [endsAt, clockOffset])

  return remaining
}
