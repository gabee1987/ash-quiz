/** Error from the API. `code` is the i18n key the server sent, e.g. 'errors.invalidCredentials'. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code)
    this.name = 'ApiError'
  }
}

/** i18n key for any thrown error: the server's code for an ApiError, a generic one otherwise. */
export function errorCode(error: unknown): string {
  return error instanceof ApiError ? error.code : 'errors.internal'
}

/** JSON fetch against the same-origin API. Throws ApiError for non-2xx answers and network failures. */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  // JSON bodies are strings; FormData (uploads) must let the browser set its own multipart boundary.
  if (typeof init.body === 'string' && !headers.has('content-type')) headers.set('content-type', 'application/json')

  let res: Response
  try {
    res = await fetch(path, { ...init, headers, credentials: 'same-origin' })
  } catch {
    throw new ApiError(0, 'errors.connectionLost')
  }
  if (res.status === 204) return undefined as T

  const body: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    const code =
      typeof body === 'object' && body !== null && typeof (body as { error?: unknown }).error === 'string'
        ? (body as { error: string }).error
        : 'errors.internal'
    throw new ApiError(res.status, code)
  }
  return body as T
}
