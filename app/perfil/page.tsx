'use client'
import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Spinner from '@/components/ui/Spinner'
import { getInitials } from '@/lib/utils'

const SPECIALTIES_OPTIONS = ['Hipertrofia', 'Emagrecimento', 'Reabilitação', 'Condicionamento', 'Força', 'Mobilidade', 'Funcional', 'Nutrição Esportiva']

export default function PerfilPage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    name: '',
    bio: '',
    phone: '',
    instagram: '',
    youtube: '',
    specialties: [] as string[],
  })
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) { setLoading(false); return }
        setProfile(d)
        setForm({
          name: d.name || '',
          bio: d.bio || '',
          phone: d.phone || '',
          instagram: d.instagram || '',
          youtube: d.youtube || '',
          specialties: d.specialties || [],
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function toggleSpecialty(s: string) {
    setForm(f => ({
      ...f,
      specialties: f.specialties.includes(s)
        ? f.specialties.filter(x => x !== s)
        : [...f.specialties, s],
    }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError('')
    if (password && password !== confirmPassword) {
      setPasswordError('As senhas não coincidem')
      return
    }
    if (password && password.length < 6) {
      setPasswordError('Senha deve ter pelo menos 6 caracteres')
      return
    }

    setSaving(true)
    setSaved(false)
    const payload: any = { ...form }
    if (password) payload.password = password

    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (res.ok) {
      setProfile(data)
      setPassword('')
      setConfirmPassword('')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  if (loading) return <AppLayout><div className="flex justify-center py-20"><Spinner className="text-4xl" /></div></AppLayout>

  return (
    <AppLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-text-primary">Perfil</h1>
          <p className="text-sm text-text-secondary mt-1">Seu perfil profissional</p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Avatar */}
          <Card className="flex items-center gap-4 p-4">
            <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold shrink-0">
              {getInitials(form.name || 'PT')}
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">{form.name || 'Seu nome'}</p>
              <p className="text-xs text-text-secondary">{profile?.email}</p>
              <p className="text-xs text-text-secondary mt-1">Membro desde {new Date(profile?.createdAt || Date.now()).getFullYear()}</p>
            </div>
          </Card>

          {/* Basic info */}
          <Card>
            <h2 className="text-base font-semibold text-text-primary mb-4">Informações básicas</h2>
            <div className="space-y-4">
              <Input id="name" label="Nome completo" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <div>
                <label className="text-sm text-text-secondary block mb-1">E-mail (não editável)</label>
                <p className="text-sm text-text-primary bg-surface-container-low border border-border rounded-md px-3 py-2 opacity-60">{profile?.email}</p>
              </div>
              <Input id="phone" label="Telefone público" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(11) 99999-9999" />
              <Textarea id="bio" label="Biografia profissional" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={4} placeholder="Conte sobre sua experiência, formação e metodologia..." />
            </div>
          </Card>

          {/* Specialties */}
          <Card>
            <h2 className="text-base font-semibold text-text-primary mb-3">Especialidades</h2>
            <div className="flex flex-wrap gap-2">
              {SPECIALTIES_OPTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSpecialty(s)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    form.specialties.includes(s)
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-high text-text-secondary hover:text-text-primary border border-border'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </Card>

          {/* Social */}
          <Card>
            <h2 className="text-base font-semibold text-text-primary mb-4">Redes sociais</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-text-secondary">camera_alt</span>
                <Input id="instagram" value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} placeholder="@seuinstagram" className="flex-1" />
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-text-secondary">play_circle</span>
                <Input id="youtube" value={form.youtube} onChange={e => setForm(f => ({ ...f, youtube: e.target.value }))} placeholder="youtube.com/@seucanal" className="flex-1" />
              </div>
            </div>
          </Card>

          {/* Password */}
          <Card>
            <h2 className="text-base font-semibold text-text-primary mb-4">Alterar senha</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input id="password" label="Nova senha" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
              <Input id="confirmPassword" label="Confirmar senha" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
            {passwordError && <p className="text-error text-sm mt-2">{passwordError}</p>}
          </Card>

          <div className="flex items-center justify-end gap-3">
            {saved && (
              <span className="text-sm text-success flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Perfil salvo!
              </span>
            )}
            <Button type="submit" loading={saving}>
              <span className="material-symbols-outlined text-sm">save</span>
              Salvar perfil
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
