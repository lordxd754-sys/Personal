'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao criar conta.')
        return
      }

      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Conta criada, mas não foi possível fazer login automático. Acesse a página de login.')
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-4xl">fitness_center</span>
          </div>
          <div className="text-center">
            <h1 className="text-headline-md text-text-primary">PT Manager</h1>
            <p className="text-body-sm text-text-secondary mt-1">
              Plataforma de gestão para personal trainers
            </p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-title-md text-text-primary mb-6">Criar conta</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="name"
              label="Nome completo"
              type="text"
              placeholder="Seu nome"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              required
            />
            <Input
              id="email"
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              required
            />
            <Input
              id="password"
              label="Senha"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              required
            />
            <Input
              id="confirm"
              label="Confirmar senha"
              type="password"
              placeholder="Repita a senha"
              value={form.confirm}
              onChange={(e) => update('confirm', e.target.value)}
              required
            />
            {error && <p className="text-error text-body-sm">{error}</p>}
            <Button type="submit" loading={loading} className="w-full mt-2">
              Criar conta
            </Button>
          </form>
        </div>

        <p className="text-center text-label-sm text-text-secondary mt-4">
          Já tem uma conta?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
