'use client'
import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Spinner from '@/components/ui/Spinner'
import Link from 'next/link'
import { getInitials, daysSince } from '@/lib/utils'
import type { Student } from '@/types'

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ativo: 'bg-success/10 text-success border-success/20',
    pausado: 'bg-warning/10 text-warning border-warning/20',
    inativo: 'bg-surface-container text-text-muted border-surface-border',
  }
  const labels: Record<string, string> = { ativo: 'Ativo', pausado: 'Pausado', inativo: 'Inativo' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm font-semibold border ${styles[status] || styles.inativo}`}>
      {labels[status] || status}
    </span>
  )
}

type FilterTab = 'todos' | 'ativo' | 'inativo'

export default function AlunosPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<FilterTab>('todos')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (tab !== 'todos') params.set('status', tab)
    fetch(`/api/students?${params}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setStudents(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [search, tab])

  const activeCount = students.filter(s => s.status === 'ativo').length
  const inactiveCount = students.filter(s => s.status === 'inativo' || s.status === 'pausado').length

  return (
    <AppLayout>
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-40 flex items-center px-4 h-14 bg-surface-card/80 backdrop-blur-xl border-b border-surface-border">
        <span className="text-headline-lg-mobile font-bold text-on-surface flex-1">Alunos</span>
        <Link href="/alunos/novo">
          <button className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container">
            <span className="material-symbols-outlined">add</span>
          </button>
        </Link>
      </header>

      <div className="p-4 md:p-6 max-w-[1200px] mx-auto space-y-6">
        {/* Desktop header */}
        <div className="hidden md:flex items-end justify-between mt-2">
          <div>
            <h2 className="text-headline-lg text-on-surface">Alunos</h2>
            <p className="text-body-sm text-text-muted mt-1">Gerencie seus clientes e acompanhe o progresso.</p>
          </div>
          <Link href="/alunos/novo">
            <button className="bg-primary text-on-primary-container font-semibold text-label-caps px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-dim transition-colors active:scale-95">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Novo Aluno
            </button>
          </Link>
        </div>

        {/* Search + tabs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[20px]">search</span>
            <input
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container border border-surface-border rounded-lg text-on-surface placeholder:text-text-muted focus:outline-none focus:border-primary focus:shadow-[0_0_0_2px_rgba(173,199,255,0.1)] transition-all text-body-sm"
              placeholder="Buscar aluno por nome..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {([
              ['todos', `Todos (${students.length})`],
              ['ativo', `Ativos (${activeCount})`],
              ['inativo', `Inativos (${inactiveCount})`],
            ] as [FilterTab, string][]).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`px-4 py-2 rounded-full text-label-caps font-semibold transition-all duration-150 ${
                  tab === value
                    ? 'bg-primary-container text-on-primary-container'
                    : 'bg-surface-container border border-surface-border text-text-muted hover:text-on-surface'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner className="text-4xl text-primary" />
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="material-symbols-outlined text-5xl text-text-muted mb-4">group_off</span>
            <p className="text-title-md text-on-surface mb-1">Nenhum aluno encontrado</p>
            <p className="text-body-sm text-text-muted mb-6">
              {search ? 'Tente uma busca diferente' : 'Adicione seu primeiro aluno para começar'}
            </p>
            <Link href="/alunos/novo">
              <button className="bg-primary text-on-primary-container font-semibold text-label-caps px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-dim transition-colors">
                <span className="material-symbols-outlined text-[18px]">add</span>
                Adicionar Aluno
              </button>
            </Link>
          </div>
        ) : (
          /* Card grid — 3 cols desktop, 1 col mobile */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {students.map(student => {
              const days = daysSince(student.lastContactAt)
              const isInactive = student.status === 'inativo'
              return (
                <Link
                  key={student.id}
                  href={`/alunos/${student.id}`}
                  className={`bg-surface-card border rounded-xl p-5 flex flex-col gap-4 hover:border-primary/40 transition-colors duration-150 group cursor-pointer ${
                    isInactive ? 'border-surface-border opacity-70' : 'border-surface-border'
                  }`}
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-label-sm shrink-0">
                        {getInitials(student.name)}
                      </div>
                      <div>
                        <p className="text-label-md text-on-surface font-semibold">{student.name}</p>
                        <StatusBadge status={student.status} />
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted">
                      <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="grid grid-cols-2 gap-3 text-body-sm">
                    <div>
                      <p className="text-text-muted text-label-sm mb-0.5">Último contato</p>
                      <p className="text-on-surface font-medium">
                        {days === 0 ? 'Hoje' : days === 1 ? 'Ontem' : days < 999 ? `Há ${days} dias` : 'Nunca'}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-muted text-label-sm mb-0.5">Objetivo</p>
                      <p className="text-on-surface font-medium truncate">{student.goal || '—'}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
