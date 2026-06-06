'use client'
import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Spinner from '@/components/ui/Spinner'
import { daysSince, formatDateTime } from '@/lib/utils'
import Link from 'next/link'

interface DashboardData {
  metrics: {
    totalActive: number
    withoutAssessment: number
    overdueFollowUp: number
    withoutWorkout: number
  }
  urgentStudents: any[]
  recentActivity: {
    executions: any[]
    followUps: any[]
    assessments: any[]
  }
}

function MetricCard({
  icon,
  label,
  value,
  badge,
  badgeVariant = 'default',
  glowColor = 'primary',
}: {
  icon: string
  label: string
  value: number
  badge?: string
  badgeVariant?: 'default' | 'error' | 'secondary'
  glowColor?: 'primary' | 'secondary' | 'error'
}) {
  const glowMap = {
    primary: 'bg-primary/5 group-hover:bg-primary/10 border-surface-border group-hover:border-primary/40',
    secondary: 'bg-surface-card group-hover:border-secondary/40 border-surface-border',
    error: 'bg-surface-card border-primary/20 shadow-[0_0_15px_rgba(173,199,255,0.04)]',
  }
  const iconColorMap = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    error: 'text-primary',
  }
  const badgeStyles = {
    default: 'bg-primary/20 text-primary',
    error: 'bg-error/20 text-error',
    secondary: 'bg-secondary/20 text-secondary',
  }
  const glowBg = {
    primary: 'bg-primary/5 group-hover:bg-primary/10',
    secondary: 'bg-secondary/5 group-hover:bg-secondary/10',
    error: 'bg-primary/5 group-hover:bg-primary/10',
  }

  return (
    <div className={`bg-surface-card border ${glowMap[glowColor]} rounded-xl p-6 flex flex-col justify-between relative overflow-hidden group transition-colors duration-200`}>
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center">
          <span className={`material-symbols-outlined ${iconColorMap[glowColor]}`}>{icon}</span>
        </div>
        {badge && (
          <span className={`${badgeStyles[badgeVariant]} font-semibold text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1`}>
            {badgeVariant === 'error' && (
              <span className="material-symbols-outlined text-[12px]">warning</span>
            )}
            {badgeVariant === 'secondary' && (
              <span className="material-symbols-outlined text-[12px]">bolt</span>
            )}
            {badgeVariant === 'default' && (
              <span className="material-symbols-outlined text-[12px]">trending_up</span>
            )}
            {badge}
          </span>
        )}
      </div>
      <div>
        <p className="text-body-sm text-text-muted mb-1">{label}</p>
        <p className="text-[36px] leading-tight text-on-surface font-bold">{value}</p>
      </div>
      <div className={`absolute -bottom-10 -right-10 w-32 h-32 ${glowBg[glowColor]} blur-3xl rounded-full transition-all`} />
    </div>
  )
}

function UrgencyDot({ days }: { days: number }) {
  if (days > 15) return <span className="w-2 h-2 rounded-full bg-error inline-block shrink-0" />
  if (days >= 13) return <span className="w-2 h-2 rounded-full bg-warning inline-block shrink-0" />
  return <span className="w-2 h-2 rounded-full bg-success inline-block shrink-0" />
}

const activityIconMap: Record<string, { icon: string; color: string }> = {
  execution: { icon: 'done_all', color: 'text-primary' },
  followup: { icon: 'forum', color: 'text-secondary' },
  assessment: { icon: 'monitoring', color: 'text-text-muted' },
  student: { icon: 'person_add', color: 'text-text-muted' },
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && d.metrics) setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Spinner className="text-4xl text-primary" />
        </div>
      </AppLayout>
    )
  }

  const metrics = data?.metrics
  const activeWorkouts = metrics ? metrics.totalActive - metrics.withoutWorkout : 0

  const recentItems = [
    ...(data?.recentActivity?.executions || []).map((e: any) => ({
      id: `exec-${e.id}`,
      type: 'execution',
      text: <><span className="font-bold">{e.Student?.name}</span> concluiu o treino</>,
      time: formatDateTime(e.executedAt),
    })),
    ...(data?.recentActivity?.followUps || []).map((f: any) => ({
      id: `fu-${f.id}`,
      type: 'followup',
      text: <>Follow-up enviado para <span className="font-bold">{f.Student?.name}</span></>,
      time: formatDateTime(f.sentAt),
    })),
    ...(data?.recentActivity?.assessments || []).map((a: any) => ({
      id: `as-${a.id}`,
      type: 'assessment',
      text: <>Avaliação registrada: <span className="font-bold">{a.Student?.name}</span></>,
      time: formatDateTime(a.date),
    })),
  ].slice(0, 6)

  return (
    <AppLayout>
      {/* Top bar (mobile) */}
      <header className="md:hidden sticky top-0 z-40 flex justify-between items-center px-4 h-14 bg-surface-card/80 backdrop-blur-xl border-b border-surface-border">
        <span className="text-headline-lg-mobile font-bold text-primary">PT Manager</span>
        <div className="flex items-center gap-3">
          <button className="text-primary"><span className="material-symbols-outlined">notifications</span></button>
          <div className="w-8 h-8 rounded-full bg-surface-container border border-surface-border flex items-center justify-center">
            <span className="material-symbols-outlined text-text-muted text-base">person</span>
          </div>
        </div>
      </header>

      <div className="p-4 md:p-6 max-w-[1200px] mx-auto space-y-6 md:space-y-10">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2 md:mt-0">
          <div>
            <h2 className="text-headline-lg-mobile md:text-headline-lg text-on-surface">Visão Geral</h2>
            <p className="text-body-sm text-text-muted mt-1">Bem-vindo de volta. Aqui está o resumo do seu dia.</p>
          </div>
          <button className="self-start md:self-auto px-4 py-2 bg-surface-container rounded-lg border border-surface-border text-on-surface text-label-caps hover:bg-surface-container-high transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            Hoje
          </button>
        </div>

        {/* Metrics bento grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            icon="groups"
            label="Total de Alunos"
            value={metrics?.totalActive ?? 0}
            badge="+12%"
            badgeVariant="default"
            glowColor="primary"
          />
          <MetricCard
            icon="fitness_center"
            label="Treinos Ativos"
            value={activeWorkouts > 0 ? activeWorkouts : (metrics?.totalActive ?? 0)}
            badge="Ativos"
            badgeVariant="secondary"
            glowColor="secondary"
          />
          <MetricCard
            icon="monitoring"
            label="Acompanhamentos Pendentes"
            value={metrics?.overdueFollowUp ?? 0}
            badge={metrics?.overdueFollowUp ? 'Requer Atenção' : 'Em dia'}
            badgeVariant={metrics?.overdueFollowUp ? 'error' : 'default'}
            glowColor="error"
          />
        </div>

        {/* Main split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Urgent students */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-title-md text-on-surface">Próximas Ações</h3>
              <Link href="/alunos" className="text-primary text-label-caps hover:underline">
                Ver todos
              </Link>
            </div>
            <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
              {!data?.urgentStudents.length ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <span className="material-symbols-outlined text-4xl text-success mb-3">check_circle</span>
                  <p className="text-body-sm text-on-surface font-medium">Nenhum aluno precisa de atenção urgente</p>
                  <p className="text-label-sm text-text-muted mt-1">Tudo em dia!</p>
                </div>
              ) : (
                <div className="divide-y divide-surface-border">
                  {data.urgentStudents.slice(0, 5).map((s: any) => {
                    const days = daysSince(s.lastContactAt)
                    return (
                      <Link key={s.id} href={`/alunos/${s.id}`}>
                        <div className="p-4 flex items-center gap-4 hover:bg-surface-container/40 transition-colors cursor-pointer group">
                          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary font-bold text-label-sm shrink-0 border border-surface-border">
                            {s.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-label-md text-on-surface truncate">{s.name}</p>
                            <p className="text-body-sm text-text-muted truncate">{s.goal || 'Sem objetivo definido'}</p>
                          </div>
                          <div className="hidden sm:flex items-center gap-2">
                            <UrgencyDot days={days} />
                            <span className="text-label-sm text-text-muted">{days}d sem contato</span>
                            <span className="material-symbols-outlined text-text-muted text-xl group-hover:text-primary transition-colors">chevron_right</span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: Recent activity */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-title-md text-on-surface">Atividades Recentes</h3>
            </div>
            <div className="bg-surface-card border border-surface-border rounded-xl p-4">
              {recentItems.length === 0 ? (
                <p className="text-body-sm text-text-muted text-center py-6">Nenhuma atividade recente</p>
              ) : (
                <div className="space-y-5 relative before:absolute before:left-[1.125rem] before:top-0 before:h-full before:w-px before:bg-gradient-to-b before:from-transparent before:via-surface-border before:to-transparent">
                  {recentItems.map((item) => {
                    const { icon, color } = activityIconMap[item.type] || activityIconMap.execution
                    return (
                      <div key={item.id} className="relative flex items-start gap-4">
                        <div className={`w-9 h-9 rounded-full border border-surface-border bg-surface-card ${color} flex items-center justify-center shrink-0 z-10`}>
                          <span className="material-symbols-outlined text-[16px]">{icon}</span>
                        </div>
                        <div className="pt-1 min-w-0">
                          <p className="text-body-sm text-on-surface leading-snug">{item.text}</p>
                          <time className="text-label-sm text-text-muted">{item.time}</time>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
