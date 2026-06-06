'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{ padding: 32, fontFamily: 'monospace', color: '#fff', background: '#0a0a0a', minHeight: '100vh' }}>
      <h2 style={{ color: '#ef4444', marginBottom: 16 }}>Erro na aplicação</h2>
      <pre style={{ background: '#1a1a1a', padding: 16, borderRadius: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: 13 }}>
        {error?.message || 'Erro desconhecido'}
        {'\n\n'}
        {error?.stack}
      </pre>
      <button
        onClick={reset}
        style={{ marginTop: 16, padding: '8px 16px', background: '#10b981', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer' }}
      >
        Tentar novamente
      </button>
    </div>
  )
}
