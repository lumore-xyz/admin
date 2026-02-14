export type AdminSession = {
  accessToken: string
  user: {
    _id: string
    username: string
    email?: string
    isAdmin?: boolean
  }
}

const KEY = 'lumore_admin_session'

export const getAdminSession = (): AdminSession | null => {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AdminSession
  } catch {
    return null
  }
}

export const setAdminSession = (session: AdminSession) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(session))
}

export const clearAdminSession = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEY)
}
