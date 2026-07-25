'use client'
import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Spinner from '@/components/ui/Spinner'
import Link from 'next/link'
import type { Exercise } from '@/types'

const MUSCLE_GROUPS = ['Todos', 'Peito', 'Costas', 'Pernas', 'Ombro', 'Braços', 'Abdominais', 'Glúteos', 'Cardio']
const EQUIPMENT_OPTIONS = [
  { value: 'Todos', label: 'Todos equipamentos' },
  { value: 'Barra Livre', label: 'Barra Livre' },
  { value: 'Halter', label: 'Halter' },
  { value: 'Máquina', label: 'Máquina' },
  { value: 'Cabo', label: 'Cabo' },
  { value: 'Peso Corporal', label: 'Peso Corporal' },
]
const LEVEL_OPTIONS = [
  { value: 'Todos', label: 'Todos os níveis' },
  { value: 'Iniciante', label: 'Iniciante' },
  { value: 'Intermediário', label: 'Intermediário' },
  { value: 'Avançado', label: 'Avançado' },
]
const TYPE_OPTIONS = [
  { value: 'Todos', label: 'Todos os tipos' },
  { value: 'Composto', label: 'Composto' },
  { value: 'Isolador', label: 'Isolador' },
]

const muscleGroupColors: Record<string, string> = {
  Peito: 'bg-primary-container/15 text-primary border-primary-container/25',
  Costas: 'bg-success/10 text-success border-success/20',
  Pernas: 'bg-secondary/15 text-secondary border-secondary/25',
  Ombro: 'bg-primary/10 text-primary border-primary/20',
  Braços: 'bg-warning/10 text-warning border-warning/20',
  Abdominais: 'bg-error/10 text-error border-error/20',
  Glúteos: 'bg-primary-container/15 text-primary border-primary-container/25',
  Cardio: 'bg-white/[0.04] text-on-surface border-white/10',
}

export default function ExerciciosPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [muscleGroup, setMuscleGroup] = useState('Todos')
  const [equipment, setEquipment] = useState('Todos')
  const [level, setLevel] = useState('Todos')
  const [type, setType] = useState('Todos')
  const [search, setSearch] = useState('')

  const fetchExercises = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (muscleGroup !== 'Todos') params.set('muscleGroup', muscleGroup)
    if (equipment !== 'Todos') params.set('equipment', equipment)
    if (level !== 'Todos') params.set('level', level)
    if (type !== 'Todos') params.set('type', type)
    if (search) params.set('search', search)
    fetch(`/api/exercises?${params}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setExercises(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [muscleGroup, equipment, level, type, search])

  useEffect(() => { fetchExercises() }, [fetchExercises])

  return (
    <AppLayout>
      <div className="p-4 md:p-12 max-w-[1440px] mx-auto">
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-headline-lg-mobile md:text-display-lg text-text-primary">Exercícios</h1>
            <p className="text-body-md text-on-surface-variant mt-2">{exercises.length} exercício{exercises.length !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/exercicios/novo">
            <Button>
              <span className="material-symbols-outlined text-sm">add</span>
              Adicionar
            </Button>
          </Link>
        </div>

        {/* Muscle group chips */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-2 border-b border-white/5">
          {MUSCLE_GROUPS.map(mg => (
            <button
              key={mg}
              onClick={() => setMuscleGroup(mg)}
              className={`px-5 py-2 border-b-2 font-mono text-label-caps font-semibold whitespace-nowrap transition-colors ${
                muscleGroup === mg
                  ? 'border-primary-container text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {mg}
            </button>
          ))}
        </div>

        {/* Secondary filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="flex-1">
            <Input placeholder="Buscar exercício..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={equipment} onChange={e => setEquipment(e.target.value)} options={EQUIPMENT_OPTIONS} className="sm:w-48" />
          <Select value={level} onChange={e => setLevel(e.target.value)} options={LEVEL_OPTIONS} className="sm:w-44" />
          <Select value={type} onChange={e => setType(e.target.value)} options={TYPE_OPTIONS} className="sm:w-40" />
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner className="text-4xl" /></div>
        ) : exercises.length === 0 ? (
          <Card className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-text-secondary block mb-2">fitness_center</span>
            <p className="text-lg font-medium text-text-primary mb-1">Nenhum exercício encontrado</p>
            <p className="text-sm text-text-secondary">Tente ajustar os filtros ou adicione um novo exercício</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {exercises.map(ex => (
              <Link key={ex.id} href={`/exercicios/${ex.id}`}>
                <Card className="hover:border-primary-container/40 hover:shadow-[0_0_18px_rgba(124,58,237,0.14)] transition-all cursor-pointer p-5 h-full">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border font-mono text-[10px] font-semibold uppercase ${muscleGroupColors[ex.muscleGroup] ?? 'bg-surface-high text-text-secondary border-white/10'}`}>
                      {ex.muscleGroup}
                    </span>
                    {ex.isCustom && <Badge variant="info" className="text-xs">Custom</Badge>}
                  </div>
                  <h3 className="text-title-md text-text-primary mb-3 line-clamp-2">{ex.name}</h3>
                  <div className="flex flex-wrap gap-1 mt-auto">
                    {ex.equipment && <Badge variant="neutral" className="text-xs">{ex.equipment}</Badge>}
                    {ex.level && <Badge variant="neutral" className="text-xs">{ex.level}</Badge>}
                    {ex.type && <Badge variant="neutral" className="text-xs">{ex.type}</Badge>}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
