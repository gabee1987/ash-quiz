// @vitest-environment happy-dom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAutosave } from './use-autosave'

describe('useAutosave', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  function setup(initial: { v: number }, valid = true) {
    const save = vi.fn(async (_value: { v: number }) => {})
    const hook = renderHook(({ value, ok }) => useAutosave(value, { valid: ok, save, delay: 800 }), {
      initialProps: { value: initial, ok: valid },
    })
    return { save, hook }
  }

  it('does not save the initial value', async () => {
    const { save, hook } = setup({ v: 0 })
    await act(() => vi.advanceTimersByTimeAsync(2000))
    expect(save).not.toHaveBeenCalled()
    expect(hook.result.current).toBe('saved')
  })

  it('debounces: one save 800 ms after the last change, with the latest value', async () => {
    const { save, hook } = setup({ v: 0 })
    hook.rerender({ value: { v: 1 }, ok: true })
    await act(() => vi.advanceTimersByTimeAsync(500))
    hook.rerender({ value: { v: 2 }, ok: true })
    expect(hook.result.current).toBe('pending')
    await act(() => vi.advanceTimersByTimeAsync(799))
    expect(save).not.toHaveBeenCalled()
    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith({ v: 2 })
    expect(hook.result.current).toBe('saved')
  })

  it('never saves an invalid value', async () => {
    const { save, hook } = setup({ v: 0 })
    hook.rerender({ value: { v: 1 }, ok: false })
    await act(() => vi.advanceTimersByTimeAsync(2000))
    expect(save).not.toHaveBeenCalled()
    expect(hook.result.current).toBe('invalid')
  })

  it('reports a failed save as error', async () => {
    const save = vi.fn(async () => {
      throw new Error('offline')
    })
    const hook = renderHook(({ value }) => useAutosave(value, { valid: true, save }), { initialProps: { value: 1 } })
    hook.rerender({ value: 2 })
    await act(() => vi.advanceTimersByTimeAsync(800))
    expect(hook.result.current).toBe('error')
  })

  it('saves a waiting value immediately when the editor is left', async () => {
    const { save, hook } = setup({ v: 0 })
    hook.rerender({ value: { v: 7 }, ok: true })
    hook.unmount()
    expect(save).toHaveBeenCalledWith({ v: 7 })
  })
})
