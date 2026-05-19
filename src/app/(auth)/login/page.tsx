'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import type { Profile } from '@/types/database.types'

export default function LoginPage() {
  const router = useRouter()
  const { setProfile } = useAuthStore()
  const [step, setStep] = useState<'name' | 'password'>('name')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [foundProfile, setFoundProfile] = useState<Profile | null>(null)

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('display_name', name.trim())
        .eq('is_active', true)
        .single()
      if (dbError || !data) {
        setError('Nombre no encontrado. Verifique con su supervisor.')
        return
      }
      setFoundProfile(data as Profile)
      setStep('password')
    } catch {
      setError('Error de conexión. Intente de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim() || !foundProfile) return
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const email = `${foundProfile.phone}@cleanbnb.internal`
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        setError('Contraseña incorrecta. Use su número de celular.')
        return
      }
      setProfile(foundProfile)
      const redirects: Record<string, string> = {
        admin: '/admin/dashboard',
        supervisor: '/supervisor/dashboard',
        employee: '/employee/home',
      }
      router.push(redirects[foundProfile.role] ?? '/employee/home')
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
          {step === 'name' ? (
            <form onSubmit={handleNameSubmit} className="flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Bienvenido</h2>
                <p className="text-sm text-gray-500">Ingrese su nombre para continuar</p>
              </div>
              {error && <Alert variant="destructive">{error}</Alert>}
              <Input
                label="Su nombre completo"
                placeholder="Ej: María García"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
                autoComplete="name"
              />
              <Button type="submit" loading={loading} size="lg" className="w-full">
                Continuar
              </Button>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
              <div>
                <button type="button" onClick={() => { setStep('name'); setError('') }} className="text-blue-600 text-sm flex items-center gap-1 mb-1">
                  ← Cambiar usuario
                </button>
                <h2 className="text-lg font-semibold text-gray-900">Hola, {foundProfile?.display_name?.split(' ')[0]}</h2>
                <p className="text-sm text-gray-500">Ingrese su número de celular</p>
              </div>
              {error && <Alert variant="destructive">{error}</Alert>}
              <Input
                label="Número de celular (contraseña)"
                placeholder="Ej: 50212345678"
                type="tel"
                inputMode="numeric"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
              />
              <Button type="submit" loading={loading} size="lg" className="w-full">
                Ingresar
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          CleanBnb © 2024 · Stayte Management
        </p>
      </div>
    </div>
  )
}
