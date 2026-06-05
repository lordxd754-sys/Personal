'use client'
import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Select from '@/components/ui/Select'
import Spinner from '@/components/ui/Spinner'
import Link from 'next/link'
import { getInitials, daysSince } from '@/lib/utils'
import type { Student } from '@/types'

function UrgencyBadge({ days }: { days: number }) {
  if (days > 15) return <Badge variant="error"><span className="w-1.5 h-1.5 rounded-full bg-error inline-block mr-1" />{days}d</Badge>
  if (days >= 13) return <Badge variant="warning"><span className="w-1.5 h-1.5 rounded-full bg-warning inline-block mr-1" />{days}d</Badge>
  if (days < 999) return <Badge variant="success"><span className="w-1.5 h-1.5 rounded-full bg-success inline-block mr-1" />{days}d</Badge>
  return <Badge variant="neutral">Nunca</Badge>
}

function LevelBadge({ level }: { level: string }) {
  const variants: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
    iniciante: 'success',
    intermediario: 'warning',
    avancado: 'error',
  }
  const labels: Record<string, string> = {
    iniciante: 'Iniciante',
    intermediario: 'Intermediário',
    avancado: 'Avançado',
  }
  return <Badge variant={variants[level] || 'default'}>{labels[level] || level}</Badge>
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, 'success' | 'warning' | 'neutral' | 'default'> = {
    ativo: 'success',
    pausado: 'warning',
    inativo: 'neutral',
  }
  const labels: Record<string, string> = {
    ativo: 'Ativo',
    pausado: 'Pausado',
    inativo: 'Inativo',
  }
  return <Badge variant={map[status] || 'default'}>{labels[status] || status}</Badge>
}

export default function AlunosPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ativo')
  const [levelFilter, setLevelFilter] = useState('all')

  function fetchStudents() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (levelFilter !== 'all') params.set('level', levelFilter)
    fetch(`/api/students?${params}`)
      .then(r => r.json())
      .then(d => { setStudents(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchStudents() }, [search, statusFilter, levelFilter])

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-headline-lg text-text-primary">Alunos</h1>
            <p className="text-body-sm text-text-secondary mt-1">{students.length} aluno{students.length !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/alunos/novo">
            <Button>
              <span className="material-symbols-outlined text-base">add</span>
              Novo aluno
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="mb-6 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome ou e-mail..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Todos os status' },
                { value: 'ativo', label: 'Ativo' },
                { value: 'pausado', label: 'Pausado' },
                { value: 'inativo', label: 'Inativo' },
              ]}
              className="sm:w-44"
            />
            <Select
              value={levelFilter}
              onChange={e => setLevelFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Todos os níveis' },
                { value: 'iniciante', label: 'Iniciante' },
                { value: 'intermediario', label: 'Intermediário' },
                { value: 'avancado', label: 'Avançado' },
              ]}
              className="sm:w-44"
            />
          </div>
        </Card>

        {/* Student list */}
        {loading ? (
          <div className="flex justify-center py-16"><Spinner className="text-4xl" /></div>
        ) : students.length === 0 ? (
          <Card className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-text-secondary mb-4 block">group_off</span>
            <p className="text-title-md text-text-primary mb-2">Nenhum aluno encontrado</p>
            <p className="text-body-sm text-text-secondary mb-6">
              {search ? 'Tente uma busca diferente' : 'Adicione seu primeiro aluno para começar'}
            </p>
            <Link href="/alunos/novo"><Button>Adicionar aluno</Button></Link>
          </Card>
        ) : (
          <div className="grid gap-3">
            {students.map(student => {
              const days = daysSince(student.lastContactAt)
              return (
                <Link key={student.id} href={`/alunos/${student.id}`}>
                  <Card className="hover:border-primary/30 transition-colors cursor-pointer p-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-label-md shrink-0">
                        {getInitials(student.name)}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-label-md text-text-primary">{student.name}</p>
                          <StatusBadge status={student.status} />
                          <LevelBadge level={student.level} />
                        </div>
                        <p className="text-label-sm text-text-secondary mt-0.5 truncate">
                          {student.goal || 'Sem objetivo definido'}
                          {student.city ? ` · ${student.city}${student.state ? '/' + student.state : ''}` : ''}
                        </p>
                      </div>
                      {/* Last contact */}
                      <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                        <p className="text-label-sm text-text-secondary">Último contato</p>
                        <UrgencyBadge days={days} />
                      </div>
                      <span className="material-symbols-outlined text-text-secondary text-xl">chevron_right</span>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
