'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { MIN_PASSWORD_LENGTH, normalizeEmail, validatePassword } from '@/lib/auth-validation'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return

    setError('')

    const cleanName = name.trim().replace(/\s+/g, ' ')
    const cleanEmail = normalizeEmail(email)
    const passwordError = validatePassword(password)

    if (cleanName.length < 2) {
      setError('Nome deve ter ao menos 2 caracteres.')
      return
    }
    if (passwordError) {
      setError(passwordError)
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName, email: cleanEmail, password }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || 'Erro ao criar conta.')
        setLoading(false)
        return
      }

      router.replace('/login?registered=1')
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(132,204,22,0.14),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(34,197,94,0.10),_transparent_30%)]" />
      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(132,204,22,0.16)]">
            <span className="material-symbols-outlined text-primary text-4xl">fitness_center</span>
          </div>
          <div className="text-center">
            <p className="text-label-caps text-primary mb-2">Performance Premium</p>
            <h1 className="text-headline-md text-text-primary">Criar conta</h1>
            <p className="text-body-sm text-text-secondary mt-2">
              Cadastre seu acesso para gerenciar alunos, treinos e rotina de acompanhamento.
            </p>
          </div>
        </div>

        <div className="bg-surface-card/90 backdrop-blur-xl border border-surface-border rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="name"
              label="Nome completo"
              type="text"
              placeholder="Leonardo Martins"
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="name"
              maxLength={120}
              required
            />
            <Input
              id="email"
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              maxLength={254}
              required
            />
            <div className="relative">
              <Input
                id="password"
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres, com letras e números`}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                maxLength={128}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 bottom-2.5 text-text-secondary hover:text-text-primary"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                <span className="material-symbols-outlined text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            <Input
              id="confirm"
              label="Confirmar senha"
              type={showPassword ? 'text' : 'password'}
              placeholder="Repita a senha"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password"
              maxLength={128}
              required
            />

            <p className="text-xs text-text-secondary">
              Use uma senha com pelo menos {MIN_PASSWORD_LENGTH} caracteres, incluindo letras e números.
            </p>

            {error && (
              <div className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-error text-body-sm">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full mt-2" disabled={!name || !email || !password || !confirm}>
              Criar conta segura
            </Button>
          </form>
        </div>

        <p className="text-center text-label-sm text-text-secondary mt-4">
          Já tem uma conta?{' '}
          <Link href="/login" className="text-primary hover:underline font-semibold">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  )
}
