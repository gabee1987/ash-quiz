import { afterAll, beforeAll, expect, it } from 'vitest'
import { createUser } from '../src/auth/users.js'
import type { Db } from '../src/db/index.js'
import { assignIds } from '../src/routes/quizzes.js'
import { buildTestApp, sessionCookie } from './helpers/app.js'
import { describeDb, withTestDb } from './helpers/test-db.js'

const quizBody = {
  title: 'Test quiz',
  questions: [
    {
      type: 'single',
      text: 'Pick A',
      options: [
        { id: 'a', text: 'A' },
        { id: 'b', text: 'B' },
      ],
      correctOptionId: 'a',
    },
    { type: 'truefalse', text: 'True?', correct: true },
  ],
}

it('assignIds fills missing question and option ids and keeps existing ones', () => {
  const out = assignIds(quizBody) as typeof quizBody & { questions: { id: string; options?: { id: string }[] }[] }
  expect(out.questions[0]!.id).toMatch(/^[\w-]{8}$/)
  expect(out.questions[0]!.options!.map((o) => o.id)).toEqual(['a', 'b'])
  expect(out.questions[1]!.id).not.toBe(out.questions[0]!.id)
  expect(assignIds('not an object')).toBe('not an object')
})

describeDb('quiz routes (database)', () => {
  let db: Db
  let cleanup: () => Promise<void>
  let built: Awaited<ReturnType<typeof buildTestApp>>
  let alice: { cookie: string }
  let bob: { cookie: string }

  beforeAll(async () => {
    ;({ db, cleanup } = await withTestDb())
    built = await buildTestApp(db)
    for (const name of ['test_alice', 'test_bob']) await createUser(db, name, 'test-password-123')
    const login = async (username: string) =>
      sessionCookie(
        await built.app.inject({
          method: 'POST',
          url: '/api/auth/login',
          payload: { username, password: 'test-password-123' },
        }),
      )
    alice = { cookie: await login('test_alice') }
    bob = { cookie: await login('test_bob') }
  })
  afterAll(async () => {
    await built.app.close()
    await cleanup()
  })

  const req = (who: { cookie: string }, method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, payload?: object) =>
    built.app.inject({ method, url, headers: { cookie: who.cookie }, ...(payload ? { payload } : {}) })

  it('requires a session', async () => {
    const res = await built.app.inject({ method: 'GET', url: '/api/quizzes' })
    expect(res.statusCode).toBe(401)
  })

  it('creates a quiz with server-side ids and lists only own quizzes', async () => {
    const created = await req(alice, 'POST', '/api/quizzes', quizBody)
    expect(created.statusCode).toBe(201)
    const quiz = created.json().quiz
    expect(quiz.id).toBeTruthy()
    expect(quiz.description).toBe('')
    expect(quiz.questions.every((q: { id: string }) => q.id.length === 8)).toBe(true)
    expect(quiz.questions[0].timeLimitSec).toBe(20)

    const aliceList = (await req(alice, 'GET', '/api/quizzes')).json().quizzes
    expect(aliceList).toEqual([{ id: quiz.id, title: 'Test quiz', questionCount: 2, updatedAt: expect.any(String) }])
    expect((await req(bob, 'GET', '/api/quizzes')).json().quizzes).toEqual([])
  })

  it('gets, replaces and deletes for the owner, 403 for anyone else, 404 when missing', async () => {
    const id = (await req(alice, 'POST', '/api/quizzes', quizBody)).json().quiz.id
    const url = `/api/quizzes/${id}`

    expect((await req(bob, 'GET', url)).statusCode).toBe(403)
    expect((await req(bob, 'PUT', url, quizBody)).statusCode).toBe(403)
    const bobDelete = await req(bob, 'DELETE', url)
    expect(bobDelete.statusCode).toBe(403)
    expect(bobDelete.json()).toEqual({ error: 'errors.forbidden' })

    expect((await req(alice, 'GET', url)).json().quiz.title).toBe('Test quiz')
    const put = await req(alice, 'PUT', url, { ...quizBody, title: 'Renamed' })
    expect(put.statusCode).toBe(200)
    expect(put.json().quiz.title).toBe('Renamed')

    expect((await req(alice, 'DELETE', url)).statusCode).toBe(204)
    const gone = await req(alice, 'GET', url)
    expect(gone.statusCode).toBe(404)
    expect(gone.json()).toEqual({ error: 'errors.notFound' })
  })

  it('duplicates with fresh ids, keeps the correct answer and uses the given title', async () => {
    const original = (await req(alice, 'POST', '/api/quizzes', quizBody)).json().quiz
    const res = await req(alice, 'POST', `/api/quizzes/${original.id}/duplicate`, { title: 'Test quiz (copy)' })
    expect(res.statusCode).toBe(201)
    const copy = res.json().quiz
    expect(copy.id).not.toBe(original.id)
    expect(copy.title).toBe('Test quiz (copy)')
    expect(copy.questions[0].id).not.toBe(original.questions[0].id)
    const option = copy.questions[0].options.find((o: { text: string }) => o.text === 'A')
    expect(copy.questions[0].correctOptionId).toBe(option.id)
    expect((await req(bob, 'POST', `/api/quizzes/${original.id}/duplicate`, {})).statusCode).toBe(403)
  })

  it('rejects a correct answer that points to no option', async () => {
    const bad = { ...quizBody, questions: [{ ...quizBody.questions[0], correctOptionId: 'zzz' }] }
    const res = await req(alice, 'POST', '/api/quizzes', bad)
    expect(res.statusCode).toBe(400)
    expect(res.json().issues).toContainEqual({ path: 'questions.0.correctOptionId', code: 'custom' })
  })

  it('answers 400 with issues for an invalid body', async () => {
    const res = await req(alice, 'POST', '/api/quizzes', { title: '', questions: [{ type: 'single', text: 'x' }] })
    expect(res.statusCode).toBe(400)
    const body = res.json()
    expect(body.error).toBe('errors.invalidInput')
    expect(body.issues.length).toBeGreaterThan(0)
  })
})
