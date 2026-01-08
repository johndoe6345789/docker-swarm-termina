import { AuthProvider, useAuth } from '@/lib/auth'
import { LoginForm } from '@/components/LoginForm'
import { Dashboard } from '@/components/Dashboard'
import { Toaster } from '@/components/ui/sonner'

function AppContent() {
  const { isAuthenticated } = useAuth()
  
  return isAuthenticated ? <Dashboard /> : <LoginForm />
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster position="top-right" />
    </AuthProvider>
  )
}

export default App