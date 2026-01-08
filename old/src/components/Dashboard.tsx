import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ContainerCard } from '@/components/ContainerCard'
import { TerminalModal } from '@/components/TerminalModal'
import { useAuth } from '@/lib/auth'
import { getMockContainers } from '@/lib/mock-data'
import { Container } from '@/lib/types'
import { SignOut, ArrowClockwise, Package } from '@phosphor-icons/react'
import { toast } from 'sonner'

export function Dashboard() {
  const { logout } = useAuth()
  const [containers, setContainers] = useState<Container[]>([])
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null)
  const [isTerminalOpen, setIsTerminalOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchContainers = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setContainers(getMockContainers())
      setIsRefreshing(false)
    }, 500)
  }

  useEffect(() => {
    fetchContainers()
    const interval = setInterval(fetchContainers, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleOpenShell = (container: Container) => {
    setSelectedContainer(container)
    setIsTerminalOpen(true)
    toast.success(`Opening shell for ${container.name}`)
  }

  const handleCloseTerminal = () => {
    setIsTerminalOpen(false)
    setTimeout(() => setSelectedContainer(null), 300)
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
  }

  const handleRefresh = () => {
    fetchContainers()
    toast.success('Container list refreshed')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <Package className="text-accent" size={24} weight="duotone" />
              </div>
              <div>
                <h1 className="font-mono text-2xl font-bold tracking-tight">
                  Container Shell
                </h1>
                <p className="text-sm text-muted-foreground">
                  {containers.length} active {containers.length === 1 ? 'container' : 'containers'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="font-medium"
              >
                <ArrowClockwise 
                  size={16} 
                  className={isRefreshing ? 'animate-spin' : ''} 
                />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="font-medium"
              >
                <SignOut size={16} />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6">
        {containers.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center mb-4">
              <Package className="text-muted-foreground" size={40} weight="duotone" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No Active Containers</h2>
            <p className="text-muted-foreground max-w-md">
              There are currently no running containers to display. Start a container to see it appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {containers.map((container) => (
              <ContainerCard
                key={container.id}
                container={container}
                onOpenShell={() => handleOpenShell(container)}
              />
            ))}
          </div>
        )}
      </main>

      {selectedContainer && (
        <TerminalModal
          isOpen={isTerminalOpen}
          onClose={handleCloseTerminal}
          containerName={selectedContainer.name}
          containerId={selectedContainer.id}
        />
      )}
    </div>
  )
}
