import AppLayout from '@/components/layout/AppLayout'
import StudentForm from '@/components/forms/StudentForm'

export default function NovoAlunoPage() {
  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-headline-lg text-text-primary">Novo Aluno</h1>
          <p className="text-body-sm text-text-secondary mt-1">Preencha os dados do aluno</p>
        </div>
        <StudentForm />
      </div>
    </AppLayout>
  )
}
