'use client'
import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Textarea from '@/components/ui/Textarea'
import Spinner from '@/components/ui/Spinner'
import { getInitials, daysSince, formatDateTime } from '@/lib/utils'
import type { Student, FollowUp } from '@/types'

interface StudentWithUrgency extends Student {
  days: number
}

export default function AcompanhamentoPage() {
  const [students, setStudents] = useState<StudentWithUrgency[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<StudentWithUrgency | null>(null)
  const [message, setMessage] = useState('')
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [recentFollowUps, setRecentFollowUps] = useState<FollowUp[]>([])

  function fetchStudents() {
    setLoading(true)
    fetch('/api/students?status=ativo')
      .then(r => r.json())
      .then((data: Student[]) => {
        const withDays = (Array.isArray(data) ? data : [])
          .map(s => ({ ...s, days: daysSince(s.lastContactAt) }))
          .sort((a, b) => b.days - a.days)
        setStudents(withDays)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchStudents() }, [])

  async function openModal(student: StudentWithUrgency) {
    setSelectedStudent(student)
    setMessage('')
    // Fetch last 3 follow-ups
    const res = await fetch(`/api/students/${student.id}/followups`)
    const data = await res.json()
    setRecentFollowUps(Array.isArray(data) ? data.slice(0, 3) : [])
  }

  async function generateMessage() {
    if (!selectedStudent) return
    setGenerating(true)
    const res = await fetch('/api/followups/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: selectedStudent.id }),
    })
    const data = await res.json()
    if (data.message) setMessage(data.message)
    else alert(data.error || 'GEMINI_API_KEY não configurado')
    setGenerating(false)
  }

  async function sendEmail() {
    if (!selectedStudent || !message.trim()) return
    setSending(true)
    const res = await fetch('/api/followups/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: selectedStudent.id, message }),
    })
    const data = await res.json()
    if (data.success) { setSelectedStudent(null); setMessage(''); fetchStudents() }
    else alert(data.error || 'Erro ao enviar')
    setSending(false)
  }

  async function registerManual() {
    if (!selectedStudent || !message.trim()) return
    setSending(true)
    const res = await fetch('/api/followups/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: selectedStudent.id, message }),
    })
    const data = await res.json()
    if (data.success) { setSelectedStudent(null); setMessage(''); fetchStudents() }
    else alert(data.error)
    setSending(false)
  }

  function urgencyColor(days: number) {
    if (days > 15) return { dot: 'bg-error', badge: 'error' as const, label: `🔴 ${days}d` }
    if (days >= 13) return { dot: 'bg-warning', badge: 'warning' as const, label: `🟡 ${days}d` }
    return { dot: 'bg-success', badge: 'success' as const, label: `🟢 ${days}d` }
  }

  const overdue = students.filter(s => s.days > 15).length

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-text-primary">Acompanhamento</h1>
          <p className="text-sm text-text-secondary mt-1">
            {overdue > 0
              ? `${overdue} aluno${overdue > 1 ? 's' : ''} com follow-up vencido`
              : 'Todos os alunos em dia'}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner className="text-4xl" /></div>
        ) : students.length === 0 ? (
          <Card className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-text-secondary block mb-2">groups</span>
            <p className="text-text-secondary">Nenhum aluno ativo cadastrado</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {students.map(student => {
              const urg = urgencyColor(student.days)
              return (
                <Card key={student.id} className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                        {getInitials(student.name)}
                      </div>
                      <span className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface ${urg.dot}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">{student.name}</p>
                      <p className="text-xs text-text-secondary truncate">{student.goal || 'Sem objetivo definido'}</p>
                    </div>
                    <div className="hidden sm:block shrink-0">
                      <Badge variant={urg.badge}>{urg.label} sem contato</Badge>
                    </div>
                    <Button size="sm" onClick={() => openModal(student)}>
                      <span className="material-symbols-outlined text-sm">send</span>
                      Mensagem
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Message modal */}
      <Modal
        isOpen={!!selectedStudent}
        onClose={() => { setSelectedStudent(null); setMessage('') }}
        title={`Mensagem para ${selectedStudent?.name}`}
        size="lg"
      >
        <div className="space-y-4">
          <Textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={5}
            placeholder="Digite a mensagem..."
          />
          <Button variant="secondary" size="sm" onClick={generateMessage} loading={generating}>
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            Gerar com IA
          </Button>

          {recentFollowUps.length > 0 && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs font-medium text-text-secondary uppercase mb-2">Últimas mensagens</p>
              <div className="space-y-2">
                {recentFollowUps.map(f => (
                  <div key={f.id} className="bg-surface-high rounded p-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-text-secondary capitalize">{f.channel}</span>
                      <span className="text-xs text-text-secondary">{formatDateTime(f.sentAt)}</span>
                    </div>
                    <p className="text-xs text-text-primary line-clamp-2">{f.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-3 border-t border-border">
            <Button variant="secondary" onClick={() => { setSelectedStudent(null); setMessage('') }}>Cancelar</Button>
            <Button variant="secondary" onClick={registerManual} loading={sending} disabled={!message.trim()}>
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Marcar enviado
            </Button>
            <Button onClick={sendEmail} loading={sending} disabled={!message.trim()}>
              <span className="material-symbols-outlined text-sm">mail</span>
              Enviar e-mail
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  )
}
