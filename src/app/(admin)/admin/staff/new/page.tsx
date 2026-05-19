'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'

export default function NewStaffPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'admin' | 'supervisor' | 'employee'>('employee')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) { setError('Nombre y celular son requeridos.'); return }
    if (phone.length < 8) { setError('Número de celular inválido.'); return }
    setSaving(true)
    setError('')
    try {
      const supabase = createClient()
      const email = `${phone.trim()}@cleanbnb.internal`
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email,
        password: phone.trim(),
        email_confirm: true,
      })
      if (authErr) throw authErr
      await supabase.from('profiles').insert({
        id: authData.user!.id,
        display_name: name.trim(),
        phone: phone.trim(),
        role,
      })
      setSuccess(true)
      setTimeout(() => router.push('/admin/staff'), 1500)
    } catch (e: any) {
      setError(e.message ?? 'Error creando usuario.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo miembro del personal</h1>
        <p className="text-sm text-gray-500">El número de celular será la contraseña de acceso</p>
      </div>
      {error && <Alert variant="destructive">{error}</Alert>}
      {success && <Alert variant="success">Usuario creado correctamente. Redirigiendo...</Alert>}
      <form onSubmit={handleSubmit}>
        <Card className="space-y-4">
          <Input label="Nombre completo" placeholder="Ej: María García López" value={name} onChange={e => setName(e.target.value)} required />
          <Input label="Número de celular (será la contraseña)" placeholder="Ej: 50212345678" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Rol</label>
            <select value={role} onChange={e => setRole(e.target.value as any)} className="h-12 border border-gray-200 rounded-xl px-4 text-sm">
              <option value="employee">Empleado</option>
              <option value="supervisor">Supervisor</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </Card>
        <div className="flex gap-3 mt-4">
          <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={saving} className="flex-1">Crear usuario</Button>
        </div>
      </form>
    </div>
  )
}
