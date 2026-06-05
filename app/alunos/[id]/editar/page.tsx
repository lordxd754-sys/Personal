'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import StudentForm from '@/components/forms/StudentForm'
import Spinner from '@/components/ui/Spinner'
import type { Student } from '@/types'

export default function EditarAlunoPage() {
  const params = useParams()
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/students/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        setStudent(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params.id])

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-16">
          <Spinner className="text-4xl" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-headline-lg text-text-primary">Editar Aluno</h1>
          <p className="text-body-sm text-text-secondary mt-1">{student?.name}</p>
        </div>
        <StudentForm initial={student ?? undefined} studentId={params.id as string} />
      </div>
    </AppLayout>
  )
}
