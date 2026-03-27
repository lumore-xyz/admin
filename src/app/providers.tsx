'use client'

import { GoogleOAuthProvider } from '@react-oauth/google'
import { useEffect } from 'react'
import { bootstrapAdminSession } from '@/lib/admin-auth'

export default function Providers({ children }: { children: React.ReactNode }) {
  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'missing-google-client-id'

  useEffect(() => {
    bootstrapAdminSession().catch((error) => {
      console.error('[admin-auth] Session bootstrap failed:', error)
    })
  }, [])

  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>
}
