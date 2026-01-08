import React, { createContext, useContext, ReactNode } from 'react'
import { useKV } from '@github/spark/hooks'
import { AuthCredentials } from '@/lib/types'

interface AuthContextType {
  isAuthenticated: boolean
  login: (credentials: AuthCredentials) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const DEFAULT_USERNAME = 'admin'
const DEFAULT_PASSWORD = 'admin123'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useKV<boolean>('auth-session', false)

  const login = (credentials: AuthCredentials): boolean => {
    const username = DEFAULT_USERNAME
    const password = DEFAULT_PASSWORD
    
    if (credentials.username === username && credentials.password === password) {
      setIsAuthenticated(true)
      return true
    }
    return false
  }

  const logout = () => {
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated: isAuthenticated ?? false, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
