'use client'
import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { formatDateTime, daysSince } from '@/lib/utils'
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

function MetricCard({ icon, label, value, colorClass }: { icon: string; label: string; value: number; colorClass: string }) {
  return (
    <Card className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClass}`}>
        <span className="material-symbols-outlined text-xl">{icon}</span>
      </div>
      <div>
        <p className="text-headline-md text-text-primary font-semibold">{value}</p>
        <p className="text-body-sm text-text-secondary">{label}</p>
      </div>
    </Card>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'executions' | 'followUps' | 'assessments'>('executions')

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
          <Spinner className="text-4xl" />
        </div>
      </AppLayout>
    )
  }

  const urgencyBadge = (days: number) => {
    if (days > 15) return <Badge variant="error">🔴 {days}d</Badge>
    if (days >= 13) return <Badge variant="warning">🟡 {days}d</Badge>
    return <Badge variant="success">🟢 {days}d</Badge>
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-headline-lg text-text-primary">Dashboard</h1>
          <p className="text-body-md text-text-secondary mt-1">Visão geral dos seus alunos</p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard icon="groups" label="Alunos ativos" value={data?.metrics.totalActive ?? 0} colorClass="bg-blue-500/10 text-blue-400" />
          <MetricCard icon="assignment" label="Sem avaliação" value={data?.metrics.withoutAssessment ?? 0} colorClass="bg-warning/10 text-warning" />
          <MetricCard icon="schedule" label="Follow-up vencido" value={data?.metrics.overdueFollowUp ?? 0} colorClass="bg-error/10 text-error" />
          <MetricCard icon="fitness_center" label="Sem treino ativo" value={data?.metrics.withoutWorkout ?? 0} colorClass="bg-orange-500/10 text-orange-400" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Urgent students */}
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-title-md text-text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-warning">priority_high</span>
                Próximas Ações
              </h2>
              {!data?.urgentStudents.length ? (
                <p className="text-body-sm text-text-secondary text-center py-8">Nenhum aluno precisa de atenção urgente 🎉</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {data.urgentStudents.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-surface-high rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-label-sm font-bold">
                          {s.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div>
                          <p className="text-label-md text-text-primary">{s.name}</p>
                          <p className="text-label-sm text-text-secondary">{s.goal || 'Sem objetivo definido'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {urgencyBadge(s.daysSinceContact)}
                        <Link href={`/alunos/${s.id}`}>
                          <Button size="sm" variant="secondary">Ver</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Recent activity */}
          <div>
            <Card>
              <h2 className="text-title-md text-text-primary mb-4">Atividade Recente</h2>
              <div className="flex gap-1 mb-4">
                {([['executions', 'Treinos'], ['followUps', 'Follow-ups'], ['assessments', 'Avaliações']] as const).map(([tab, label]) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 rounded-full text-label-sm transition-colors ${activeTab === tab ? 'bg-primary text-on-primary' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                {activeTab === 'executions' && (data?.recentActivity?.executions || []).map((e: any) => (
                  <div key={e.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-surface-high">
                    <span className="material-symbols-outlined text-primary text-base">fitness_center</span>
                    <div className="min-w-0">
                      <p className="text-label-md text-text-primary truncate">{e.Student?.name}</p>
                      <p className="text-label-sm text-text-secondary">{e.WorkoutSession?.name || e.Workout?.title}</p>
                    </div>
                  </div>
                ))}
                {activeTab === 'followUps' && (data?.recentActivity?.followUps || []).map((f: any) => (
                  <div key={f.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-surface-high">
                    <span className="material-symbols-outlined text-blue-400 text-base">mail</span>
                    <div className="min-w-0">
                      <p className="text-label-md text-text-primary truncate">{f.Student?.name}</p>
                      <p className="text-label-sm text-text-secondary">{formatDateTime(f.sentAt)}</p>
                    </div>
                  </div>
                ))}
                {activeTab === 'assessments' && (data?.recentActivity?.assessments || []).map((a: any) => (
                  <div key={a.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-surface-high">
                    <span className="material-symbols-outlined text-warning text-base">monitoring</span>
                    <div className="min-w-0">
                      <p className="text-label-md text-text-primary truncate">{a.Student?.name}</p>
                      <p className="text-label-sm text-text-secondary">{a.weight}kg · {a.bodyFatPercent}% gordura</p>
                    </div>
                  </div>
                ))}
                {activeTab === 'executions' && !data?.recentActivity?.executions?.length && (
                  <p className="text-label-sm text-text-secondary text-center py-4">Nenhuma execução registrada</p>
                )}
                {activeTab === 'followUps' && !data?.recentActivity?.followUps?.length && (
                  <p className="text-label-sm text-text-secondary text-center py-4">Nenhum follow-up registrado</p>
                )}
                {activeTab === 'assessments' && !data?.recentActivity?.assessments?.length && (
                  <p className="text-label-sm text-text-secondary text-center py-4">Nenhuma avaliação registrada</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
