'use client'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { formatDate } from '@/lib/utils'
import type { PhysicalAssessment, Student } from '@/types'

const CLASSIFICATION_COLORS: Record<string, string> = {
  'Atlético': 'text-blue-400 bg-blue-500/10',
  'Excelente': 'text-emerald-400 bg-emerald-500/10',
  'Bom': 'text-emerald-400 bg-emerald-500/10',
  'Acima da média': 'text-amber-400 bg-amber-500/10',
  'Obesidade leve': 'text-red-400 bg-red-500/10',
  'Obesidade severa': 'text-red-400 bg-red-500/10',
}

function value(value: number | string | null | undefined, suffix = '') {
  if (value === null || value === undefined || value === '') return '—'
  return `${value}${suffix}`
}

function ReportSection({
  title,
  items,
}: {
  title: string
  items: [string, number | string | null | undefined, string?][]
}) {
  return (
    <Card className="break-inside-avoid">
      <h2 className="text-title-md text-text-primary mb-4">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.map(([label, itemValue, suffix]) => (
          <div key={label} className="bg-surface-high rounded-md p-3">
            <p className="text-label-sm text-text-secondary">{label}</p>
            <p className="text-title-md text-text-primary mt-1">{value(itemValue, suffix)}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function AssessmentReportPage() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = params.id as string
  const [assessment, setAssessment] = useState<PhysicalAssessment | null>(null)
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadReport() {
      setLoading(true)
      setError('')
      try {
        const assessmentRes = await fetch(`/api/assessments/${assessmentId}`)
        const assessmentData = await assessmentRes.json()
        if (!assessmentRes.ok) throw new Error(assessmentData.error || 'Erro ao carregar avaliação')
        setAssessment(assessmentData)

        const studentRes = await fetch(`/api/students/${assessmentData.studentId}`)
        const studentData = await studentRes.json()
        if (studentRes.ok) setStudent(studentData)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setLoading(false)
      }
    }

    loadReport()
  }, [assessmentId])

  const sumSkinfolds = useMemo(() => {
    if (!assessment) return null
    const values = [
      assessment.triceps,
      assessment.subscapular,
      assessment.pectoral,
      assessment.midaxillary,
      assessment.suprailiac,
      assessment.abdominal,
      assessment.thigh,
    ]
    if (values.some(v => v == null)) return null
    const numericValues = values.map(v => Number(v))
    const total = numericValues.reduce((acc, v) => acc + v, 0)
    return Math.round(total * 10) / 10
  }, [assessment])

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20">
          <Spinner className="text-4xl" />
        </div>
      </AppLayout>
    )
  }

  if (error || !assessment) {
    return (
      <AppLayout>
        <div className="p-6 max-w-3xl mx-auto">
          <Card>
            <p className="text-error text-body-sm">{error || 'Avaliação não encontrada.'}</p>
            <Button variant="secondary" className="mt-4" onClick={() => router.back()}>
              Voltar
            </Button>
          </Card>
        </div>
      </AppLayout>
    )
  }

  const circumferences: [string, number | null | undefined, string?][] = [
    ['Braço (dir)', assessment.armRightCm ?? assessment.armCm, ' cm'],
    ['Braço (esq)', assessment.armLeftCm, ' cm'],
    ['Tórax', assessment.chestCm, ' cm'],
    ['Cintura', assessment.waistCm, ' cm'],
    ['Abdômen', assessment.abdomenCm, ' cm'],
    ['Quadril', assessment.hipCm, ' cm'],
    ['Coxa (dir)', assessment.thighRightCm ?? assessment.thighCm, ' cm'],
    ['Coxa (esq)', assessment.thighLeftCm, ' cm'],
    ['Panturrilha (dir)', assessment.calfRightCm ?? assessment.calfCm, ' cm'],
    ['Panturrilha (esq)', assessment.calfLeftCm, ' cm'],
  ]

  const reportSections: { title: string; items: [string, number | string | null | undefined, string?][] }[] = [
    {
      title: 'Dados básicos',
      items: [
        ['Peso', assessment.weight, ' kg'],
        ['Altura', assessment.height, ' cm'],
        ['Idade', assessment.age, ' anos'],
        ['IMC', assessment.bmi],
      ],
    },
    {
      title: 'Composição corporal',
      items: [
        ['% Gordura corporal', assessment.bodyFatPercent, '%'],
        ['Massa magra', assessment.leanMassKg, ' kg'],
        ['Massa gorda', assessment.fatMassKg, ' kg'],
        ['Soma das 7 dobras', sumSkinfolds, ' mm'],
      ],
    },
    {
      title: '7 dobras cutâneas',
      items: [
        ['Tríceps', assessment.triceps, ' mm'],
        ['Subescapular', assessment.subscapular, ' mm'],
        ['Peitoral', assessment.pectoral, ' mm'],
        ['Axilar média', assessment.midaxillary, ' mm'],
        ['Supra-ilíaca', assessment.suprailiac, ' mm'],
        ['Abdominal', assessment.abdominal, ' mm'],
        ['Coxa', assessment.thigh, ' mm'],
      ],
    },
    {
      title: 'Circunferências',
      items: circumferences,
    },
  ]

  async function downloadPdf() {
    if (!assessment) return
    const currentAssessment = assessment
    setGeneratingPdf(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 16
      const contentWidth = pageWidth - margin * 2
      const studentName = student?.name || 'Aluno'
      let y = 18

      const ensureSpace = (height: number) => {
        if (y + height <= pageHeight - margin) return
        pdf.addPage()
        y = 18
      }

      const drawSection = (
        title: string,
        items: [string, number | string | null | undefined, string?][],
      ) => {
        ensureSpace(22)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(13)
        pdf.setTextColor(18, 24, 38)
        pdf.text(title, margin, y)
        y += 7

        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(10)
        pdf.setTextColor(68, 76, 91)

        items.forEach(([label, itemValue, suffix]) => {
          ensureSpace(7)
          pdf.text(`${label}:`, margin, y)
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(18, 24, 38)
          pdf.text(value(itemValue, suffix), margin + 48, y)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(68, 76, 91)
          y += 6
        })

        y += 5
      }

      pdf.setFillColor(10, 14, 20)
      pdf.rect(0, 0, pageWidth, 42, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(18)
      pdf.text('Relatório da Avaliação Física', margin, 18)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(11)
      pdf.text(studentName, margin, 27)
      pdf.text(`Avaliação realizada em ${formatDate(currentAssessment.assessedAt)}`, margin, 34)

      if (currentAssessment.classification) {
        pdf.setFillColor(230, 244, 255)
        pdf.roundedRect(pageWidth - margin - 46, 15, 46, 10, 2, 2, 'F')
        pdf.setTextColor(10, 95, 160)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(9)
        pdf.text(currentAssessment.classification, pageWidth - margin - 43, 21.5, { maxWidth: 40 })
      }

      y = 54
      reportSections.forEach(section => drawSection(section.title, section.items))

      ensureSpace(20)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(13)
      pdf.setTextColor(18, 24, 38)
      pdf.text('Observações', margin, y)
      y += 7
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)
      pdf.setTextColor(68, 76, 91)
      const notes = pdf.splitTextToSize(currentAssessment.notes || 'Sem observações registradas.', contentWidth)
      notes.forEach((line: string) => {
        ensureSpace(6)
        pdf.text(line, margin, y)
        y += 5
      })

      const filenameStudent = studentName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase()
      const filenameDate = new Date(currentAssessment.assessedAt).toISOString().split('T')[0]
      pdf.save(`avaliacao-fisica-${filenameStudent || 'aluno'}-${filenameDate}.pdf`)
    } catch {
      setError('Não foi possível gerar o PDF. Tente novamente.')
    } finally {
      setGeneratingPdf(false)
    }
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5 print:p-0 print:max-w-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-headline-lg-mobile md:text-headline-md text-text-primary">
              Relatório da Avaliação Física
            </h1>
            <p className="text-body-sm text-text-secondary mt-1">
              {student?.name || 'Aluno'} · {formatDate(assessment.assessedAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => router.back()}>
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Voltar
            </Button>
            <Button onClick={downloadPdf} loading={generatingPdf}>
              <span className="material-symbols-outlined text-base">picture_as_pdf</span>
              Importar PDF
            </Button>
          </div>
        </div>

        <Card className="border-primary/20 print:border-surface-border">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <p className="text-label-sm text-text-secondary uppercase tracking-wide">Relatório para o aluno</p>
              <h2 className="text-headline-md text-text-primary mt-1">{student?.name || 'Aluno'}</h2>
              <p className="text-body-sm text-text-secondary mt-1">
                Avaliação realizada em {formatDate(assessment.assessedAt)}
              </p>
            </div>
            {assessment.classification && (
              <span className={`self-start text-label-md px-3 py-1 rounded-full font-semibold ${CLASSIFICATION_COLORS[assessment.classification] ?? 'text-text-secondary bg-surface-high'}`}>
                {assessment.classification}
              </span>
            )}
          </div>
        </Card>

        {reportSections.map(section => (
          <ReportSection key={section.title} title={section.title} items={section.items} />
        ))}

        <Card className="break-inside-avoid">
          <h2 className="text-title-md text-text-primary mb-3">Observações</h2>
          <p className="text-body-sm text-text-secondary whitespace-pre-wrap">
            {assessment.notes || 'Sem observações registradas.'}
          </p>
        </Card>
      </div>
    </AppLayout>
  )
}
