import { Container } from '@/lib/types'

export function getMockContainers(): Container[] {
  return [
    {
      id: 'cnt-1a2b3c4d',
      name: 'web-server-prod',
      image: 'nginx:alpine',
      status: 'running',
      uptime: '3d 14h 22m',
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      id: 'cnt-5e6f7g8h',
      name: 'api-backend',
      image: 'node:20-alpine',
      status: 'running',
      uptime: '12h 45m',
      createdAt: '2024-01-18T08:15:00Z'
    },
    {
      id: 'cnt-9i0j1k2l',
      name: 'postgres-db',
      image: 'postgres:16',
      status: 'running',
      uptime: '7d 3h 10m',
      createdAt: '2024-01-12T14:20:00Z'
    },
    {
      id: 'cnt-3m4n5o6p',
      name: 'redis-cache',
      image: 'redis:7-alpine',
      status: 'running',
      uptime: '2d 8h 55m',
      createdAt: '2024-01-16T16:45:00Z'
    }
  ]
}
