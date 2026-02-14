import { getAdminSession } from './admin-auth'

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

type ApiMethod = 'GET' | 'POST' | 'PATCH'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export const apiRequest = async <T>(
  path: string,
  method: ApiMethod = 'GET',
  body?: unknown
): Promise<T> => {
  const session = getAdminSession()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (session?.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`
  }

  const res = await fetch(`${baseURL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const payload = await res.json().catch(() => null)
  if (!res.ok) {
    const message =
      payload?.message ||
      payload?.error ||
      `Request failed with status ${res.status}`
    throw new ApiError(message, res.status)
  }

  return payload as T
}
