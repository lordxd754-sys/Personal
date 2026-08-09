'use client'
import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Link from 'next/link'
import { getInitials, daysSince } from '@/lib/utils'
import type { Student } from '@/types'

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ativo: 'bg-secondary/20 text-secondary border-secondary/20',
    pausado: 'bg-warning/10 text-warning border-warning/20',
    inativo: 'bg-white/[0.04] text-text-muted border-white/10',
  }
  const labels: Record<string, string> = { ativo: 'Ativo', pausado: 'Pausado', inativo: 'Inativo' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-mono text-label-sm font-semibold uppercase border ${styles[status] || styles.inativo}`}>
      {labels[status] || status}
    </span>
  )
}

type FilterTab = 'todos' | 'ativo' | 'inativo'

export default function AlunosPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [tab, setTab] = useState<FilterTab>('todos')

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const controller = new AbortController()
    if (students.length === 0) setLoading(true)
    else setRefreshing(true)
    const params = new URLSearchParams()
    params.set('view', 'list')
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (tab !== 'todos') params.set('status', tab)
    fetch(`/api/students?${params}`, { signal: controller.signal })
      .then(r => r.ok ? r.json() : null)
      .then(d => { setStudents(Array.isArray(d) ? d : []) })
      .catch(() => {})
      .finally(() => {
        if (controller.signal.aborted) return
        setLoading(false)
        setRefreshing(false)
      })
    return () => controller.abort()
  }, [debouncedSearch, tab])

  const activeCount = students.filter(s => s.status === 'ativo').length
  const inactiveCount = students.filter(s => s.status === 'inativo' || s.status === 'pausado').length

  return (
    <AppLayout>
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-40 flex items-center px-4 h-14 bg-surface/70 backdrop-blur-xl border-b border-white/10">
        <span className="text-headline-lg-mobile font-bold text-on-surface flex-1">Alunos</span>
        <Link href="/alunos/novo">
          <button className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-on-secondary">
            <span className="material-symbols-outlined">add</span>
          </button>
        </Link>
      </header>

      <div className="p-4 md:p-12 max-w-[1440px] mx-auto space-y-8">
        {/* Desktop header */}
        <div className="hidden md:flex items-end justify-between mt-2">
          <div>
            <h2 className="text-display-lg text-on-surface">Alunos</h2>
            <p className="text-body-md text-on-surface-variant mt-2">Gerencie seus clientes e acompanhe o progresso.</p>
          </div>
          <Link href="/alunos/novo">
            <button className="bg-secondary text-on-secondary font-mono font-semibold text-label-caps px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-secondary-container hover:text-on-secondary-container transition-all active:scale-95 shadow-[0_0_18px_rgba(233,195,73,0.10)]">
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
              className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface placeholder:text-text-muted focus:outline-none focus:border-primary-container focus:shadow-[0_0_0_2px_rgba(124,58,237,0.18)] transition-all text-body-sm"
              placeholder="Buscar aluno por nome..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {refreshing && (
            <div className="flex items-center gap-2 text-text-muted font-mono text-label-caps px-1">
              <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
              Atualizando
            </div>
          )}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {([
              ['todos', `Todos (${students.length})`],
              ['ativo', `Ativos (${activeCount})`],
              ['inativo', `Inativos (${inactiveCount})`],
            ] as [FilterTab, string][]).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`px-5 py-2 border-b-2 font-mono text-label-caps font-semibold whitespace-nowrap transition-all duration-150 ${
                  tab === value
                    ? 'border-primary-container text-primary'
                    : 'border-transparent text-text-muted hover:text-on-surface'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {[0, 1, 2, 3, 4, 5, 6, 7].map(item => (
              <div key={item} className="h-48 rounded-lg border border-white/10 bg-white/[0.04] animate-pulse" />
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="material-symbols-outlined text-5xl text-text-muted mb-4">group_off</span>
            <p className="text-title-md text-on-surface mb-1">Nenhum aluno encontrado</p>
            <p className="text-body-sm text-text-muted mb-6">
              {search ? 'Tente uma busca diferente' : 'Adicione seu primeiro aluno para começar'}
            </p>
            <Link href="/alunos/novo">
              <button className="bg-secondary text-on-secondary font-mono font-semibold text-label-caps px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-secondary-container transition-colors">
                <span className="material-symbols-outlined text-[18px]">add</span>
                Adicionar Aluno
              </button>
            </Link>
          </div>
        ) : (
          /* Card grid — 3 cols desktop, 1 col mobile */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {students.map(student => {
              const days = daysSince(student.lastContactAt)
              const isInactive = student.status === 'inativo'
              return (
                <Link
                  key={student.id}
                  href={`/alunos/${student.id}`}
                  className={`bg-surface-card backdrop-blur-xl border rounded-lg p-6 flex flex-col gap-4 hover:border-primary-container/40 hover:shadow-[0_0_18px_rgba(124,58,237,0.16)] transition-all duration-200 group cursor-pointer ${
                    isInactive ? 'border-surface-border opacity-70' : 'border-surface-border'
                  }`}
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-primary-container/10 border border-primary-container/30 flex items-center justify-center text-primary font-bold text-title-md shrink-0 group-hover:border-primary-container transition-colors">
                        {getInitials(student.name)}
                      </div>
                      <div>
                        <p className="text-title-md text-on-surface font-semibold">{student.name}</p>
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
                      <p className="font-mono text-text-muted text-[10px] uppercase mb-0.5">Último contato</p>
                      <p className="font-mono text-on-surface text-label-sm">
                        {days === 0 ? 'Hoje' : days === 1 ? 'Ontem' : days < 999 ? `Há ${days} dias` : 'Nunca'}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-text-muted text-[10px] uppercase mb-0.5">Objetivo</p>
                      <p className="font-mono text-on-surface text-label-sm truncate">{student.goal || '—'}</p>
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
