import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Container as ContainerType } from '@/lib/types'
import { Terminal, Package, Play } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface ContainerCardProps {
  container: ContainerType
  onOpenShell: () => void
}

export function ContainerCard({ container, onOpenShell }: ContainerCardProps) {
  const statusColors = {
    running: 'border-l-accent',
    stopped: 'border-l-muted-foreground',
    paused: 'border-l-yellow-500'
  }

  return (
    <Card 
      className={cn(
        "p-6 border-l-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/10",
        statusColors[container.status]
      )}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 bg-accent/10 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
              <Package className="text-accent" size={20} weight="duotone" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-mono font-medium text-lg truncate">
                {container.name}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {container.image}
              </p>
            </div>
          </div>
          
          <Badge 
            variant={container.status === 'running' ? 'default' : 'secondary'}
            className={cn(
              "flex items-center gap-1.5 flex-shrink-0",
              container.status === 'running' && "bg-accent/20 text-accent border-accent/30"
            )}
          >
            {container.status === 'running' && (
              <Play size={12} weight="fill" className="animate-pulse-glow" />
            )}
            {container.status}
          </Badge>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Container ID
            </div>
            <div className="font-mono text-foreground">
              {container.id}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Uptime
            </div>
            <div className="font-mono text-foreground">
              {container.uptime}
            </div>
          </div>
        </div>

        <Button
          onClick={onOpenShell}
          disabled={container.status !== 'running'}
          className="w-full bg-primary hover:bg-accent hover:text-accent-foreground transition-colors font-medium"
        >
          <Terminal size={18} weight="bold" />
          Open Shell
        </Button>
      </div>
    </Card>
  )
}
