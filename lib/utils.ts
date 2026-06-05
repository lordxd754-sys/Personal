import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function daysSince(date: string | Date | null | undefined): number {
  if (!date) return 999
  const diff = Date.now() - new Date(date).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function getUrgencyColor(days: number): 'red' | 'yellow' | 'green' {
  if (days > 15) return 'red'
  if (days >= 13) return 'yellow'
  return 'green'
}

export function calculateBodyFat(
  skinfolds: {
    triceps?: number | null
    subscapular?: number | null
    pectoral?: number | null
    midaxillary?: number | null
    suprailiac?: number | null
    abdominal?: number | null
    thigh?: number | null
  },
  age: number
): { bodyFatPercent: number; density: number } | null {
  const values = [
    skinfolds.triceps,
    skinfolds.subscapular,
    skinfolds.pectoral,
    skinfolds.midaxillary,
    skinfolds.suprailiac,
    skinfolds.abdominal,
    skinfolds.thigh,
  ]

  if (values.some((v) => v === null || v === undefined || isNaN(v as number))) {
    return null
  }

  const sum = values.reduce((acc, v) => acc! + v!, 0) as number
  const density =
    1.112 -
    0.00043499 * sum +
    0.00000055 * sum * sum -
    0.00028826 * age

  const bodyFatPercent = (4.95 / density - 4.5) * 100

  return { bodyFatPercent, density }
}

export function calculateBMI(weight: number, heightCm: number): number {
  const heightM = heightCm / 100
  return weight / (heightM * heightM)
}

export function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}
