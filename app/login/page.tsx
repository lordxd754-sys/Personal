'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { isSafeRedirectPath, normalizeEmail } from '@/lib/auth-validation'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered') === '1'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    setError('')

    const safeEmail = normalizeEmail(email)
    const result = await signIn('credentials', {
      email: safeEmail,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('E-mail ou senha incorretos.')
      setLoading(false)
      return
    }

    const callbackUrl = searchParams.get('callbackUrl')
    router.replace(isSafeRedirectPath(callbackUrl) ? callbackUrl! : '/dashboard')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(132,204,22,0.14),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.10),_transparent_30%)]" />
      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(132,204,22,0.16)]">
            <span className="material-symbols-outlined text-primary text-4xl">fitness_center</span>
          </div>
          <div className="text-center">
            <p className="text-label-caps text-primary mb-2">Performance Premium</p>
            <h1 className="text-headline-md text-text-primary">Entrar no PT Manager</h1>
            <p className="text-body-sm text-text-secondary mt-2">
              Acesse sua operação de alunos, treinos e acompanhamento.
            </p>
          </div>
        </div>

        <div className="bg-surface-card/90 backdrop-blur-xl border border-surface-border rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="email"
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              required
            />
            <div className="relative">
              <Input
                id="password"
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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

            {registered && !error && (
              <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-primary text-body-sm">
                Se os dados estiverem corretos, sua conta estará pronta. Entre com seu e-mail e senha.
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-error text-body-sm">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full mt-2" disabled={!email || !password}>
              Entrar com segurança
            </Button>
          </form>
        </div>

        <p className="text-center text-label-sm text-text-secondary mt-4">
          Ainda não tem uma conta?{' '}
          <Link href="/register" className="text-primary hover:underline font-semibold">
            Criar conta
          </Link>
        </p>
      </div>
    </main>
  )
}
