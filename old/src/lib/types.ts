export interface Container {
  id: string
  name: string
  image: string
  status: 'running' | 'stopped' | 'paused'
  uptime: string
  createdAt: string
}

export interface AuthCredentials {
  username: string
  password: string
}

export interface TerminalSession {
  containerId: string
  containerName: string
  isActive: boolean
}
