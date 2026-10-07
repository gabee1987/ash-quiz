import { describe, expect, it, vi } from 'vitest'

// A fake Socket.IO client whose emitWithAck depends on `this`, like the real one.
const timed = {
  emitWithAck: vi.fn(function (this: unknown, event: string) {
    if (this !== timed) throw new TypeError('emitWithAck called without its socket')
    return event === 'slow' ? Promise.reject(new Error('timeout')) : Promise.resolve({ ok: true })
  }),
}
vi.mock('socket.io-client', () => ({
  io: () => ({ on: vi.fn(), off: vi.fn(), connect: vi.fn(), io: { on: vi.fn() }, timeout: () => timed }),
}))

const { emitAck } = await import('./socket')

describe('emitAck', () => {
  it('emits with the socket bound and returns the ack', async () => {
    await expect(emitAck('host:attach', { pin: '123456' })).resolves.toEqual({ ok: true })
    expect(timed.emitWithAck).toHaveBeenCalledWith('host:attach', { pin: '123456' })
  })

  it('turns a timeout into errors.connectionLost', async () => {
    // @ts-expect-error: deliberately unknown event to trigger the fake timeout
    await expect(emitAck('slow', {})).resolves.toEqual({ error: 'errors.connectionLost' })
  })
})
