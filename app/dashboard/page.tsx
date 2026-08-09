'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import AppLayout from '@/components/layout/AppLayout'
import { daysSince, formatDateTime, getInitials } from '@/lib/utils'

type MetricKey = 'totalActive' | 'withoutAssessment' | 'overdueFollowUp' | 'withoutWorkout'

interface DashboardData {
  metrics: Record<MetricKey, number>
  urgentStudents: Array<{
    id: string
    name: string
    goal: string | null
    level: string | null
    lastContactAt: string | null
    daysSinceContact?: number
  }>
  recentActivity: {
    executions: Array<{
      id: string
      startedAt: string | null
      finishedAt: string | null
      Student?: { name?: string | null } | null
      Workout?: { title?: string | null } | null
      WorkoutSession?: { name?: string | null } | null
    }>
    followUps: Array<{
      id: string
      sentAt: string | null
      channel: string | null
      Student?: { name?: string | null } | null
    }>
    assessments: Array<{
      id: string
      assessedAt: string | null
      bodyFatPercent: number | null
      bmi: number | null
      Student?: { name?: string | null } | null
    }>
  }
}

const emptyMetrics: DashboardData['metrics'] = {
  totalActive: 0,
  withoutAssessment: 0,
  overdueFollowUp: 0,
  withoutWorkout: 0,
}

const quickActions = [
  { href: '/alunos/novo', icon: 'person_add', label: 'Novo aluno', detail: 'Cadastrar perfil' },
  { href: '/alunos', icon: 'groups', label: 'Alunos', detail: 'Ver cadastros' },
  { href: '/treinos', icon: 'fitness_center', label: 'Treinos', detail: 'Montar ou revisar' },
  { href: '/acompanhamento', icon: 'forum', label: 'Follow-up', detail: 'Mensagens pendentes' },
]

function DashboardSkeleton() {
  return (
    <AppLayout>
      <div className="p-4 md:p-8 xl:p-10 max-w-[1480px] mx-auto space-y-6 animate-pulse">
        <div className="h-24 rounded-lg bg-white/[0.04] border border-white/10" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-36 rounded-lg bg-white/[0.04] border border-white/10" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.65fr] gap-4">
          <div className="h-96 rounded-lg bg-white/[0.04] border border-white/10" />
          <div className="h-96 rounded-lg bg-white/[0.04] border border-white/10" />
        </div>
      </div>
    </AppLayout>
  )
}

function MetricTile({
  icon,
  title,
  value,
  description,
  tone = 'neutral',
  progress,
}: {
  icon: string
  title: string
  value: number
  description: string
  tone?: 'neutral' | 'good' | 'warn' | 'danger'
  progress?: number
}) {
  const toneClasses = {
    neutral: 'text-primary border-primary/20 bg-primary/10',
    good: 'text-success border-success/20 bg-success/10',
    warn: 'text-warning border-warning/20 bg-warning/10',
    danger: 'text-error border-error/25 bg-error/10',
  }
  const barClasses = {
    neutral: 'bg-primary',
    good: 'bg-success',
    warn: 'bg-warning',
    danger: 'bg-error',
  }

  return (
    <div className="rounded-lg border border-white/10 bg-surface-card p-4 md:p-5 min-h-36">
      <div className="flex items-start justify-between gap-3">
        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${toneClasses[tone]}`}>
          <span className="material-symbols-outlined text-[22px]">{icon}</span>
        </div>
        <span className="font-mono text-[11px] text-text-muted uppercase">Agora</span>
      </div>
      <div className="mt-5">
        <p className="font-mono text-label-caps uppercase text-text-muted">{title}</p>
        <p className="text-[34px] leading-none font-bold text-on-surface mt-1">{value}</p>
        <p className="text-body-sm text-on-surface-variant mt-2">{description}</p>
      </div>
      {progress != null && (
        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden mt-4">
          <div className={`h-full rounded-full ${barClasses[tone]}`} style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }} />
        </div>
      )}
    </div>
  )
}

function SectionHeader({ title, actionHref, actionLabel }: { title: string; actionHref?: string; actionLabel?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <h3 className="text-title-md text-on-surface">{title}</h3>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="font-mono text-label-caps text-secondary hover:text-secondary-container transition-colors">
          {actionLabel}
        </Link>
      )}
    </div>
  )
}

function AttentionList({ students }: { students: DashboardData['urgentStudents'] }) {
  if (students.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-surface-card p-8 text-center">
        <span className="material-symbols-outlined text-4xl text-success">check_circle</span>
        <p className="text-label-md text-on-surface mt-3">Acompanhamento em dia</p>
        <p className="text-body-sm text-text-muted mt-1">Nenhum aluno passou do limite de contato.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-white/10 bg-surface-card overflow-hidden">
      {students.slice(0, 7).map((student) => {
        const days = student.daysSinceContact ?? daysSince(student.lastContactAt)
        const isCritical = days > 15
        return (
          <Link key={student.id} href={`/alunos/${student.id}`} className="grid grid-cols-[auto_1fr_auto] gap-3 items-center p-4 border-b border-white/5 last:border-b-0 hover:bg-white/[0.04] transition-colors">
            <div className={`w-11 h-11 rounded-lg border flex items-center justify-center font-bold ${isCritical ? 'border-error/25 bg-error/10 text-error' : 'border-warning/25 bg-warning/10 text-warning'}`}>
              {getInitials(student.name)}
            </div>
            <div className="min-w-0">
              <p className="text-label-md text-on-surface truncate">{student.name}</p>
              <p className="text-body-sm text-text-muted truncate">{student.goal || 'Sem objetivo registrado'}</p>
            </div>
            <div className="text-right">
              <p className={`font-mono text-label-caps ${isCritical ? 'text-error' : 'text-warning'}`}>{days}d</p>
              <p className="text-[11px] text-text-muted uppercase">sem contato</p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

function ActivityFeed({ data }: { data: DashboardData['recentActivity'] }) {
  const items = [
    ...data.executions.map((item) => ({
      id: `execution-${item.id}`,
      icon: 'task_alt',
      tone: 'text-success',
      title: `${item.Student?.name || 'Aluno'} concluiu um treino`,
      detail: item.WorkoutSession?.name || item.Workout?.title || 'Sessão registrada',
      time: item.finishedAt || item.startedAt,
    })),
    ...data.followUps.map((item) => ({
      id: `followup-${item.id}`,
      icon: 'forum',
      tone: 'text-secondary',
      title: `Follow-up para ${item.Student?.name || 'aluno'}`,
      detail: item.channel || 'Mensagem enviada',
      time: item.sentAt,
    })),
    ...data.assessments.map((item) => ({
      id: `assessment-${item.id}`,
      icon: 'monitoring',
      tone: 'text-primary',
      title: `Avaliação de ${item.Student?.name || 'aluno'}`,
      detail: item.bodyFatPercent != null ? `${item.bodyFatPercent}% gordura corporal` : item.bmi != null ? `IMC ${item.bmi}` : 'Resultado salvo',
      time: item.assessedAt,
    })),
  ]
    .sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime())
    .slice(0, 8)

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-surface-card p-8 text-center">
        <span className="material-symbols-outlined text-4xl text-text-muted">history</span>
        <p className="text-body-sm text-text-muted mt-3">Nenhuma atividade recente</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-white/10 bg-surface-card p-4">
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.id} className="grid grid-cols-[auto_1fr] gap-3 rounded-lg p-3 hover:bg-white/[0.04] transition-colors">
            <div className={`w-9 h-9 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center ${item.tone}`}>
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
            </div>
            <div className="min-w-0">
              <p className="text-body-sm text-on-surface truncate">{item.title}</p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                <span className="text-label-sm text-text-muted">{item.detail}</span>
                <span className="text-text-muted/50">•</span>
                <time className="font-mono text-label-sm text-text-muted">{formatDateTime(item.time)}</time>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/dashboard', { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Erro ao carregar dashboard')))
      .then((payload: DashboardData) => {
        setData(payload)
        setError('')
        window.dispatchEvent(new CustomEvent('orquestra-dashboard-metrics', { detail: payload.metrics }))
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [])

  const metrics = data?.metrics || emptyMetrics
  const activeWorkouts = Math.max(metrics.totalActive - metrics.withoutWorkout, 0)
  const assessmentCoverage = metrics.totalActive > 0
    ? Math.round(((metrics.totalActive - metrics.withoutAssessment) / metrics.totalActive) * 100)
    : 0
  const workoutCoverage = metrics.totalActive > 0
    ? Math.round((activeWorkouts / metrics.totalActive) * 100)
    : 0

  const operationStatus = useMemo(() => {
    if (metrics.overdueFollowUp > 0) return { label: 'Atenção', tone: 'text-error', icon: 'priority_high' }
    if (metrics.withoutWorkout > 0 || metrics.withoutAssessment > 0) return { label: 'Ajustes', tone: 'text-warning', icon: 'tune' }
    return { label: 'Em dia', tone: 'text-success', icon: 'verified' }
  }, [metrics])

  if (loading) return <DashboardSkeleton />

  return (
    <AppLayout>
      <div className="p-4 md:p-8 xl:p-10 max-w-[1480px] mx-auto space-y-6">
        <section className="rounded-lg border border-white/10 bg-surface-card p-5 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-center gap-4 min-w-0">
              <img
                src="/orquestra-mark.png"
                alt="Orquestra"
                className="w-14 h-14 rounded-lg object-cover border border-secondary/40 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-headline-lg-mobile md:text-headline-lg text-on-surface">Dashboard Orquestra</h1>
                  <span className={`hidden sm:inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[11px] uppercase ${operationStatus.tone}`}>
                    <span className="material-symbols-outlined text-[14px]">{operationStatus.icon}</span>
                    {operationStatus.label}
                  </span>
                </div>
                <p className="text-body-sm md:text-body-md text-on-surface-variant mt-1">Resumo rápido dos alunos, treinos e acompanhamentos.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:flex gap-2">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  title={action.detail}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 hover:bg-white/[0.06] hover:border-secondary/30 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px] text-secondary align-middle mr-2">{action.icon}</span>
                  <span className="font-mono text-label-caps text-on-surface">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>
          {error && (
            <p className="mt-4 rounded-lg border border-error/25 bg-error/10 px-4 py-3 text-body-sm text-error">{error}</p>
          )}
        </section>

        <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
          <MetricTile
            icon="groups"
            title="Alunos ativos"
            value={metrics.totalActive}
            description="Base atual em acompanhamento."
            progress={100}
          />
          <MetricTile
            icon="fitness_center"
            title="Com treino"
            value={activeWorkouts}
            description={`${workoutCoverage}% dos ativos com treino pronto.`}
            tone={metrics.withoutWorkout > 0 ? 'warn' : 'good'}
            progress={workoutCoverage}
          />
          <MetricTile
            icon="monitoring"
            title="Sem avaliação"
            value={metrics.withoutAssessment}
            description={`${assessmentCoverage}% já possuem avaliação.`}
            tone={metrics.withoutAssessment > 0 ? 'warn' : 'good'}
            progress={assessmentCoverage}
          />
          <MetricTile
            icon="notifications_active"
            title="Follow-ups"
            value={metrics.overdueFollowUp}
            description={metrics.overdueFollowUp > 0 ? 'Precisam de contato agora.' : 'Nenhum atraso crítico.'}
            tone={metrics.overdueFollowUp > 0 ? 'danger' : 'good'}
            progress={metrics.totalActive > 0 ? Math.round(((metrics.totalActive - metrics.overdueFollowUp) / metrics.totalActive) * 100) : 100}
          />
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1.25fr_0.75fr] gap-4">
          <div>
            <SectionHeader title="Fila de Atenção" actionHref="/acompanhamento" actionLabel="Acompanhar" />
            <AttentionList students={data?.urgentStudents || []} />
          </div>

          <div>
            <SectionHeader title="Atividade Recente" actionHref="/alunos" actionLabel="Abrir alunos" />
            <ActivityFeed data={data?.recentActivity || { executions: [], followUps: [], assessments: [] }} />
          </div>
        </section>
      </div>
    </AppLayout>
  )
}
