'use client'
import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Spinner from '@/components/ui/Spinner'
import type { Settings } from '@/types'

type Tab = 'email' | 'templates' | 'treino' | 'automacao'

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('email')
  const [settings, setSettings] = useState<Partial<Settings>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => { if (d) setSettings(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function update(field: string, value: unknown) {
    setSettings(s => ({ ...s, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    setSaving(false)
  }

  async function testSMTP() {
    setTesting(true)
    setTestResult(null)
    const res = await fetch('/api/settings/test/smtp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        smtpHost: settings.smtpHost,
        smtpPort: settings.smtpPort,
        smtpUser: settings.smtpUser,
        smtpPass: settings.smtpPass,
        smtpFrom: settings.smtpFrom,
      }),
    })
    const data = await res.json()
    setTestResult({ ok: res.ok, message: data.message || data.error || '' })
    setTesting(false)
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'email', label: 'E-mail (SMTP)', icon: 'mail' },
    { id: 'templates', label: 'Templates', icon: 'description' },
    { id: 'treino', label: 'Preferências IA', icon: 'auto_awesome' },
    { id: 'automacao', label: 'Automação', icon: 'schedule' },
  ]

  const TEMPLATE_VARS = ['{nome}', '{objetivo}', '{treino_atual}', '{dias}']

  const previewTemplate = (settings.followUpTemplate || '')
    .replace('{nome}', 'Carlos')
    .replace('{objetivo}', 'Hipertrofia')
    .replace('{treino_atual}', 'Treino A - Push')
    .replace('{dias}', '45')

  if (loading) return <AppLayout><div className="flex justify-center py-20"><Spinner className="text-4xl" /></div></AppLayout>

  return (
    <AppLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-text-primary">Configurações</h1>
        </div>

        <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto pb-px">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                activeTab === t.id ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-base">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'email' && (
          <div className="space-y-4">
            <Card>
              <h2 className="text-base font-semibold text-text-primary mb-4">Configuração SMTP</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input id="smtpHost" label="Host SMTP" value={settings.smtpHost || ''} onChange={e => update('smtpHost', e.target.value)} placeholder="smtp.gmail.com" />
                <Input id="smtpPort" label="Porta" type="number" value={String(settings.smtpPort || 587)} onChange={e => update('smtpPort', Number(e.target.value))} />
                <Input id="smtpUser" label="Usuário" value={settings.smtpUser || ''} onChange={e => update('smtpUser', e.target.value)} placeholder="seu@email.com" />
                <Input id="smtpPass" label="Senha" type="password" value={settings.smtpPass || ''} onChange={e => update('smtpPass', e.target.value)} />
                <div className="sm:col-span-2">
                  <Input id="smtpFrom" label="Remetente" value={settings.smtpFrom || ''} onChange={e => update('smtpFrom', e.target.value)} placeholder="PT Manager <noreply@seu.com>" />
                </div>
              </div>
              {testResult && (
                <div className={`mt-4 p-3 rounded-lg text-sm ${testResult.ok ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                  {testResult.ok ? '✅ ' : '❌ '}{testResult.message}
                </div>
              )}
              <div className="flex gap-3 mt-4">
                <Button variant="secondary" onClick={testSMTP} loading={testing}>
                  <span className="material-symbols-outlined text-sm">wifi_tethering</span>
                  Testar conexão
                </Button>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-4">
            <Card>
              <h2 className="text-base font-semibold text-text-primary mb-2">Template de acompanhamento</h2>
              <p className="text-sm text-text-secondary mb-3">
                Variáveis disponíveis:{' '}
                {TEMPLATE_VARS.map(v => (
                  <code key={v} className="text-primary text-xs bg-surface-high px-1 py-0.5 rounded mr-1">{v}</code>
                ))}
              </p>
              <Textarea
                value={settings.followUpTemplate || ''}
                onChange={e => update('followUpTemplate', e.target.value)}
                rows={5}
                placeholder="Olá {nome}! Como estão seus treinos de {objetivo}?..."
              />
            </Card>
            {previewTemplate && (
              <Card className="border-primary/20 bg-primary/5">
                <h3 className="text-sm font-medium text-primary mb-2">Preview</h3>
                <p className="text-sm text-text-primary whitespace-pre-wrap">{previewTemplate}</p>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'treino' && (
          <Card>
            <h2 className="text-base font-semibold text-text-primary mb-2">Protocolo de treino para IA</h2>
            <p className="text-sm text-text-secondary mb-4">
              Este texto é enviado à IA ao gerar treinos. Descreva seu método, preferências e protocolos.
            </p>
            <Textarea
              value={settings.workoutPreferences || ''}
              onChange={e => update('workoutPreferences', e.target.value)}
              rows={8}
              placeholder="Ex: Sempre usar periodização ondulatória diária. Priorizar exercícios multiarticulares. Para hipertrofia usar rep range 8-12 com 60-90s de descanso..."
            />
          </Card>
        )}

        {activeTab === 'automacao' && (
          <Card>
            <h2 className="text-base font-semibold text-text-primary mb-4">Envio automático de follow-up</h2>
            <div className="flex items-center justify-between p-4 bg-surface-high rounded-lg mb-4">
              <div>
                <p className="text-sm font-medium text-text-primary">Ativar envio automático</p>
                <p className="text-xs text-text-secondary mt-0.5">Envia e-mail automático para alunos com +15 dias sem contato</p>
              </div>
              <button
                onClick={() => update('autoFollowUp', !settings.autoFollowUp)}
                className={`relative w-11 h-6 rounded-full transition-colors ${settings.autoFollowUp ? 'bg-primary' : 'bg-surface border border-border'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.autoFollowUp ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            {settings.autoFollowUp && (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Hora de envio"
                  type="number"
                  min={0}
                  max={23}
                  value={String(settings.followUpHour ?? 8)}
                  onChange={e => update('followUpHour', Number(e.target.value))}
                />
                <div className="flex items-end">
                  <p className="text-xs text-text-secondary pb-2">
                    Horário de Brasília. O cron roda às 08h00 BRT (11h UTC).
                  </p>
                </div>
              </div>
            )}
          </Card>
        )}

        <div className="flex items-center justify-end gap-3 mt-6">
          {saved && <span className="text-sm text-success flex items-center gap-1"><span className="material-symbols-outlined text-sm">check_circle</span>Salvo!</span>}
          <Button onClick={handleSave} loading={saving}>
            <span className="material-symbols-outlined text-sm">save</span>
            Salvar configurações
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}
