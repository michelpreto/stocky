// lib/offline-queue.ts
import type { BaixaInput } from '@/types/operator'

const QUEUE_KEY = 'almoxcontrol:offline-queue'

export interface QueueItem {
  id: string
  data: BaixaInput
  queuedAt: number
}

function read(): QueueItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function write(items: QueueItem[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items))
}

export function enqueue(data: BaixaInput): string {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const items = read()
  items.push({ id, data, queuedAt: Date.now() })
  write(items)
  return id
}

export function dequeue(id: string): void {
  write(read().filter((item) => item.id !== id))
}

export function getAll(): QueueItem[] {
  return read()
}

export function clearQueue(): void {
  write([])
}
