import Logo from '@/assets/icons/logo.svg?react'
import { Link } from '@tanstack/react-router'
import { Button } from '../ui/button'

export default function Header() {
  return (
    <div className="h-16 bg-card text-card-foreground border-b px-4 lg:px-6">
      <div className="container mx-auto flex items-center gap-10 h-full">
        <Link to="/">
          <Logo className="text-primary h-7 w-auto" />
        </Link>
        <div className="ml-auto">
          <Button>Sign In</Button>
        </div>
      </div>
    </div>
  )
}
