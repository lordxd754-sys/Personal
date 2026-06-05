'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('E-mail ou senha incorretos.')
      setLoading(false)
    } else {
      router.push('/dashboard')
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
              Plataforma de gestão para personal trainers
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-title-md text-text-primary mb-6">Entrar</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="email"
              label="E-mail"
              type="email"
              placeholder="admin@ptmanager.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              id="password"
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && (
              <p className="text-error text-body-sm">{error}</p>
            )}
            <Button type="submit" loading={loading} className="w-full mt-2">
              Entrar
            </Button>
          </form>
        </div>

        <p className="text-center text-label-sm text-text-secondary mt-4">
          Acesso: admin@ptmanager.com / admin123
        </p>
      </div>
    </div>
  )
}
