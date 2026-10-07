import { afterAll, beforeAll, expect, it } from 'vitest'
import { createUser } from '../src/auth/users.js'
import type { Db } from '../src/db/index.js'
import { quizzes } from '../src/db/schema.js'
import { fixtureQuiz } from '../src/game/fixtures.js'
import { buildTestApp, sessionCookie } from './helpers/app.js'
import { describeDb, withTestDb } from './helpers/test-db.js'

describeDb('game routes (database)', () => {
  let db: Db
  let cleanup: () => Promise<void>
  let built: Awaited<ReturnType<typeof buildTestApp>>
  let alice: string
  let bob: string

  beforeAll(async () => {
    ;({ db, cleanup } = await withTestDb())
    built = await buildTestApp(db)
    for (const name of ['test_alice', 'test_bob']) {
      const user = await createUser(db, name, 'test-password-123')
      await db.insert(quizzes).values({ id: `quiz-${name}`, ownerId: user.id, title: `Quiz ${name}`, questions: fixtureQuiz().questions })
    }
    const login = async (username: string) =>
      sessionCookie(
        await built.app.inject({ method: 'POST', url: '/api/auth/login', payload: { username, password: 'test-password-123' } }),
      )
    alice = await login('test_alice')
    bob = await login('test_bob')
  })
  afterAll(async () => {
    await built.app.close()
    await cleanup()
  })

  const create = (cookie: string, payload: object) =>
    built.app.inject({ method: 'POST', url: '/api/games', headers: { cookie }, payload })

  it('creates a lobby for an own quiz and returns a 6-digit pin', async () => {
    const res = await create(alice, { quizId: 'quiz-test_alice' })
    expect(res.statusCode).toBe(201)
    const { pin } = res.json()
    expect(pin).toMatch(/^[1-9][0-9]{5}$/)
    expect(built.manager.get(pin)!.state.phase).toBe('lobby')
  })

  it('requires a session, an own quiz and valid settings', async () => {
    expect((await built.app.inject({ method: 'POST', url: '/api/games', payload: { quizId: 'x' } })).statusCode).toBe(401)
    expect((await create(alice, { quizId: 'quiz-test_bob' })).statusCode).toBe(403)
    expect((await create(alice, { quizId: 'missing' })).statusCode).toBe(404)
    const noTeams = await create(alice, { quizId: 'quiz-test_alice', settings: { mode: 'team' } })
    expect(noTeams.statusCode).toBe(400)
    expect(noTeams.json()).toEqual({ error: 'errors.invalidInput' })
  })

  it('returns host metadata with the join URL to the owner only', async () => {
    const { pin } = (await create(alice, { quizId: 'quiz-test_alice' })).json()
    const res = await built.app.inject({ method: 'GET', url: `/api/games/${pin}`, headers: { cookie: alice } })
    expect(res.json()).toEqual({
      pin,
      quizTitle: 'Quiz test_alice',
      mode: 'classic',
      phase: 'lobby',
      joinUrl: `http://localhost:3000/?pin=${pin}`,
    })
    expect((await built.app.inject({ method: 'GET', url: `/api/games/${pin}`, headers: { cookie: bob } })).statusCode).toBe(403)
  })

  it('returns public info without auth, and only mode, teams, phase and title', async () => {
    const settings = { mode: 'team', teamNames: ['Red', 'Blue'] }
    const { pin } = (await create(alice, { quizId: 'quiz-test_alice', settings })).json()
    const res = await built.app.inject({ method: 'GET', url: `/api/games/${pin}/public` })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({
      quizTitle: 'Quiz test_alice',
      mode: 'team',
      phase: 'lobby',
      teams: [
        { id: 'team-1', name: 'Red' },
        { id: 'team-2', name: 'Blue' },
      ],
    })
    const missing = await built.app.inject({ method: 'GET', url: '/api/games/999999/public' })
    expect(missing.statusCode).toBe(404)
    expect(missing.json()).toEqual({ error: 'errors.gameNotFound' })
  })
})
