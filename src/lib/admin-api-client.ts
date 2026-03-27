import {
  clearAdminSession,
  getAdminSession,
  refreshAdminAccessToken,
} from './admin-auth'

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
  const sendRequest = async (accessToken?: string) =>
    fetch(`${baseURL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })

  let session = getAdminSession()
  let res = await sendRequest(session?.accessToken)

  if (res.status === 401 && path !== '/auth/refresh-token') {
    if (session?.refreshToken) {
      const nextAccessToken = await refreshAdminAccessToken()

      if (nextAccessToken) {
        res = await sendRequest(nextAccessToken)
      } else if (typeof window !== 'undefined') {
        clearAdminSession()
        window.location.replace('/auth/login')
      }
    } else if (typeof window !== 'undefined') {
      clearAdminSession()
      window.location.replace('/auth/login')
    }
  }

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
