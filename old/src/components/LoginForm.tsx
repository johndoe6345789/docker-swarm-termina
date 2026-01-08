import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { LockKey } from '@phosphor-icons/react'
import { useAuth } from '@/lib/auth'
import { toast } from 'sonner'

export function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isShaking, setIsShaking] = useState(false)
  const { login } = useAuth()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const success = login({ username, password })
    
    if (!success) {
      setIsShaking(true)
      toast.error('Invalid credentials')
      setTimeout(() => setIsShaking(false), 500)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/20">
      <Card 
        className={`w-full max-w-sm p-6 space-y-6 ${isShaking ? 'animate-shake' : ''}`}
      >
        <div className="flex flex-col items-center space-y-2">
          <div className="w-16 h-16 bg-accent/10 rounded-lg flex items-center justify-center mb-2">
            <LockKey className="text-accent" size={32} weight="duotone" />
          </div>
          <h1 className="font-mono text-2xl font-bold tracking-tight">Container Shell</h1>
          <p className="text-sm text-muted-foreground text-center">
            Enter your credentials to access container management
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-xs uppercase tracking-wider">
              Username
            </Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              autoComplete="username"
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs uppercase tracking-wider">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              autoComplete="current-password"
              className="font-mono"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-medium"
          >
            Access Dashboard
          </Button>
        </form>

        <div className="text-xs text-center text-muted-foreground border-t border-border pt-4">
          Default: admin / admin123
        </div>
      </Card>
    </div>
  )
}
