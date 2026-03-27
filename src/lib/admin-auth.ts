export type AdminSession = {
  accessToken?: string
  refreshToken?: string
  user: {
    _id: string
    username: string
    email?: string
    isAdmin?: boolean
  }
}

const KEY = 'lumore_admin_session'
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

type JwtPayload = {
  exp?: number
}

let refreshRequest: Promise<string | null> | null = null

const isBrowser = () => typeof window !== 'undefined'

const decodeJwtPayload = (token: string): JwtPayload | null => {
  try {
    const payloadSegment = token.split('.')[1]
    if (!payloadSegment || typeof atob !== 'function') return null

    const base64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    return JSON.parse(atob(padded)) as JwtPayload
  } catch {
    return null
  }
}

const persistAdminSession = (session: AdminSession) => {
  if (!isBrowser()) return
  localStorage.setItem(KEY, JSON.stringify(session))
}

export const getAdminSession = (): AdminSession | null => {
  if (!isBrowser()) return null

  const raw = localStorage.getItem(KEY)
  if (!raw) return null

  try {
    const session = JSON.parse(raw) as AdminSession
    if (!session?.user?._id) {
      return null
    }

    return session
  } catch {
    return null
  }
}

export const setAdminSession = (session: AdminSession) => {
  if (!isBrowser()) return
  persistAdminSession(session)
}

export const updateAdminAccessToken = (accessToken: string) => {
  const session = getAdminSession()
  if (!session) return

  persistAdminSession({
    ...session,
    accessToken,
  })
}

export const clearAdminSession = () => {
  if (!isBrowser()) return
  localStorage.removeItem(KEY)
}

export const isTokenExpired = (
  token: string | null | undefined,
  skewSeconds = 30
) => {
  if (!token) return true

  const payload = decodeJwtPayload(token)
  if (!payload?.exp) return false

  const nowInSeconds = Math.floor(Date.now() / 1000)
  return payload.exp <= nowInSeconds + skewSeconds
}

export const refreshAdminAccessToken = async (): Promise<string | null> => {
  if (refreshRequest) {
    return refreshRequest
  }

  refreshRequest = (async () => {
    const session = getAdminSession()
    const refreshToken = session?.refreshToken

    if (!session?.user?._id || !refreshToken) {
      clearAdminSession()
      return null
    }

    try {
      const res = await fetch(`${BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken,
        }),
      })

      const payload = await res.json().catch(() => null)
      const nextAccessToken =
        typeof payload?.accessToken === 'string' ? payload.accessToken : null

      if (!res.ok || !nextAccessToken) {
        throw new Error(payload?.message || payload?.error || 'Refresh failed')
      }

      persistAdminSession({
        ...session,
        accessToken: nextAccessToken,
      })
      return nextAccessToken
    } catch (error) {
      console.error('[admin-auth] Token refresh failed:', error)
      clearAdminSession()
      return null
    } finally {
      refreshRequest = null
    }
  })()

  return refreshRequest
}

export const bootstrapAdminSession = async () => {
  const session = getAdminSession()
  if (!session?.user?.isAdmin) {
    return false
  }

  if (session.accessToken && !isTokenExpired(session.accessToken)) {
    return true
  }

  if (!session.refreshToken) {
    clearAdminSession()
    return false
  }

  const nextAccessToken = await refreshAdminAccessToken()
  return Boolean(nextAccessToken && getAdminSession()?.user?.isAdmin)
}
