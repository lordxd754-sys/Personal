'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }
    if (password.length < 8) {
      setError('Senha deve ter ao menos 8 caracteres.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao criar conta.')
        setLoading(false)
        return
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        router.push('/login')
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-4xl">fitness_center</span>
          </div>
          <div className="text-center">
            <h1 className="text-headline-md text-text-primary">PT Manager</h1>
            <p className="text-body-sm text-text-secondary mt-1">
              Crie sua conta de personal trainer
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-title-md text-text-primary mb-6">Criar conta</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="name"
              label="Nome completo"
              type="text"
              placeholder="João Silva"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <Input
              id="email"
              label="E-mail"
              type="email"
              placeholder="joao@exemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Input
              id="password"
              label="Senha"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <Input
              id="confirm"
              label="Confirmar senha"
              type="password"
              placeholder="Repita a senha"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />
            {error && (
              <p className="text-error text-body-sm">{error}</p>
            )}
            <Button type="submit" loading={loading} className="w-full mt-2">
              Criar conta
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
    </div>
  )
}
