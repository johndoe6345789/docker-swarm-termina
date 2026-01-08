import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { X, Terminal as TerminalIcon } from '@phosphor-icons/react'

interface TerminalModalProps {
  isOpen: boolean
  onClose: () => void
  containerName: string
  containerId: string
}

export function TerminalModal({ isOpen, onClose, containerName, containerId }: TerminalModalProps) {
  const [command, setCommand] = useState('')
  const [history, setHistory] = useState<Array<{ type: 'command' | 'output'; text: string }>>([
    { type: 'output', text: `Connected to container: ${containerName}` },
    { type: 'output', text: `Container ID: ${containerId}` },
    { type: 'output', text: 'Type commands below. This is a simulated terminal.' },
    { type: 'output', text: '' }
  ])
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history])

  const executeCommand = (cmd: string) => {
    if (!cmd.trim()) return

    const newHistory = [...history, { type: 'command' as const, text: `$ ${cmd}` }]

    let output = ''
    switch (cmd.trim().toLowerCase()) {
      case 'ls':
        output = 'bin  etc  home  lib  opt  root  tmp  usr  var'
        break
      case 'pwd':
        output = '/root'
        break
      case 'whoami':
        output = 'root'
        break
      case 'date':
        output = new Date().toString()
        break
      case 'help':
        output = 'Available commands: ls, pwd, whoami, date, help, clear, exit'
        break
      case 'clear':
        setHistory([
          { type: 'output', text: `Connected to container: ${containerName}` },
          { type: 'output', text: '' }
        ])
        setCommand('')
        return
      case 'exit':
        onClose()
        return
      default:
        output = `bash: ${cmd}: command not found`
    }

    newHistory.push({ type: 'output', text: output })
    newHistory.push({ type: 'output', text: '' })
    setHistory(newHistory)
    setCommand('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(command)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[600px] p-0 gap-0 bg-card">
        <DialogHeader className="px-6 py-4 border-b border-border flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded flex items-center justify-center">
              <TerminalIcon className="text-accent" size={20} weight="duotone" />
            </div>
            <div>
              <DialogTitle className="font-mono text-lg">
                {containerName}
              </DialogTitle>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                {containerId}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X size={18} />
          </Button>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 p-6" ref={scrollRef}>
            <div className="font-mono text-sm space-y-1">
              {history.map((entry, index) => (
                <div
                  key={index}
                  className={
                    entry.type === 'command'
                      ? 'text-accent font-medium'
                      : 'text-foreground'
                  }
                >
                  {entry.text}
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="px-6 py-4 border-t border-border bg-primary/5">
            <div className="flex items-center gap-2">
              <span className="text-accent font-mono font-medium">$</span>
              <Input
                ref={inputRef}
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command..."
                className="flex-1 font-mono bg-background border-input"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
