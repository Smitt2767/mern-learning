import { Button } from '@/components/ui/button'
import { env } from '@/env'
import type { OAuthProvider } from '@mern/shared'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  const initiateOAuth = (provider: OAuthProvider) => {
    // Simple browser redirect — the backend handles the full OAuth dance.
    // Cookies are set server-side (HttpOnly), so no token handling needed here.
    window.location.href = `${env.VITE_SERVER_URL}/api/auth/signin/${provider}`
  }

  return (
    <div className="p-4 flex gap-4">
      <Button onClick={() => initiateOAuth('google')}>Login with Google</Button>
      <Button onClick={() => initiateOAuth('github')}>Login with Github</Button>
    </div>
  )
}
