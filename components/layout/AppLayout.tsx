'use client'
import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [overdueCount, setOverdueCount] = useState(0)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.metrics?.overdueFollowUp !== undefined) {
          setOverdueCount(d.metrics.overdueFollowUp)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar overdueCount={overdueCount} />
      <main className="flex-1 overflow-x-hidden pb-24 md:pb-0 md:pl-0">
        {children}
      </main>
      <BottomNav overdueCount={overdueCount} />
    </div>
  )
}
