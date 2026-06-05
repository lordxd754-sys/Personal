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
  Peito: 'bg-blue-500/10 text-blue-400',
  Costas: 'bg-green-500/10 text-green-400',
  Pernas: 'bg-orange-500/10 text-orange-400',
  Ombro: 'bg-purple-500/10 text-purple-400',
  Braços: 'bg-yellow-500/10 text-yellow-400',
  Abdominais: 'bg-red-500/10 text-red-400',
  Glúteos: 'bg-pink-500/10 text-pink-400',
  Cardio: 'bg-cyan-500/10 text-cyan-400',
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
      .then(r => r.json())
      .then(d => { setExercises(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [muscleGroup, equipment, level, type, search])

  useEffect(() => { fetchExercises() }, [fetchExercises])

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">Exercícios</h1>
            <p className="text-sm text-text-secondary mt-1">{exercises.length} exercício{exercises.length !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/exercicios/novo">
            <Button>
              <span className="material-symbols-outlined text-sm">add</span>
              Adicionar
            </Button>
          </Link>
        </div>

        {/* Muscle group chips */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {MUSCLE_GROUPS.map(mg => (
            <button
              key={mg}
              onClick={() => setMuscleGroup(mg)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                muscleGroup === mg
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-surface-high'
              }`}
            >
              {mg}
            </button>
          ))}
        </div>

        {/* Secondary filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
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
                <Card className="hover:border-primary/30 transition-colors cursor-pointer p-4 h-full">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${muscleGroupColors[ex.muscleGroup] ?? 'bg-surface-high text-text-secondary'}`}>
                      {ex.muscleGroup}
                    </span>
                    {ex.isCustom && <Badge variant="info" className="text-xs">Custom</Badge>}
                  </div>
                  <h3 className="text-sm font-medium text-text-primary mb-2 line-clamp-2">{ex.name}</h3>
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
