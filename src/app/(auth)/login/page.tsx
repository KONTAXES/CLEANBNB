'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        setError('Correo o contraseña incorrectos.')
        return
      }
      window.location.href = '/'
    } catch {
      setError('Error de conexión. Intente de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-sky-50 px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-lg mb-4 border border-blue-100">
            <span className="text-4xl">🧹</span>
          </div>
          <h1 className="text-3xl font-bold text-blue-600">Clean<span className="text-rose-400">bnb</span></h1>
          <p className="text-gray-500 text-sm mt-1">Servicio de limpieza</p>
          <p className="text-xs text-gray-400 mt-0.5">Stayte Management</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Iniciar sesión</h2>
            <p className="text-sm text-gray-500">Ingrese sus credenciales</p>
          </div>

          {error && <Alert variant="destructive" className="mb-4">{error}</Alert>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
              autoComplete="email"
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <Button type="submit" loading={loading} size="lg" className="w-full">
              Ingresar
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          CleanBnb © 2024 · Stayte Management
        </p>
      </div>
    </div>
  )
}
