'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const statusBadge: Record<string, { label: string; variant: any }> = {
  scheduled: { label: 'Programada', variant: 'info' },
  in_progress: { label: 'En progreso', variant: 'warning' },
  completed: { label: 'Completada', variant: 'success' },
  cancelled: { label: 'Cancelada', variant: 'danger' },
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([])
  const [apartments, setApartments] = useState<{ id: string; name: string }[]>([])
  const [staff, setStaff] = useState<{ id: string; display_name: string; role: string }[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ apartment_id: '', employee_id: '', scheduled_date: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    const supabase = createClient()
    Promise.all([
      supabase.from('assignments').select('*, apartment:apartments(name), employee:profiles(display_name)').order('scheduled_date', { ascending: false }).limit(50),
      supabase.from('apartments').select('id,name').eq('is_active', true).order('name'),
      supabase.from('profiles').select('id,display_name,role').eq('is_active', true).eq('role', 'employee').order('display_name'),
    ]).then(([aRes, aptRes, staffRes]) => {
      setAssignments(aRes.data ?? [])
      setApartments(aptRes.data ?? [])
      setStaff(staffRes.data ?? [])
      setLoading(false)
    })
  }
  useEffect(load, [])

  const save = async () => {
    if (!form.apartment_id || !form.employee_id || !form.scheduled_date) { setError('Complete todos los campos.'); return }
    setSaving(true)
    setError('')
    const { error: err } = await createClient().from('assignments').insert(form)
    if (err) { setError('Error guardando.'); setSaving(false); return }
    setShowForm(false); setForm({ apartment_id: '', employee_id: '', scheduled_date: '', notes: '' }); setSaving(false); load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asignaciones</h1>
          <p className="text-sm text-gray-500">{assignments.length} asignaciones</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Nueva asignación</Button>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      {showForm && (
        <Card className="space-y-3 border-blue-200 bg-blue-50">
          <h2 className="font-semibold">Nueva asignación</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Apartamento</label>
              <select value={form.apartment_id} onChange={e => setForm(f => ({ ...f, apartment_id: e.target.value }))} className="w-full h-12 border border-gray-200 rounded-xl px-3 text-sm mt-1">
                <option value="">Seleccionar...</option>
                {apartments.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Empleado</label>
              <select value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))} className="w-full h-12 border border-gray-200 rounded-xl px-3 text-sm mt-1">
                <option value="">Seleccionar...</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.display_name}</option>)}
              </select>
            </div>
            <Input type="date" label="Fecha" value={form.scheduled_date} onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))} />
            <Input label="Notas (opcional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Instrucciones especiales..." />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button size="sm" loading={saving} onClick={save}>Guardar asignación</Button>
          </div>
        </Card>
      )}

      {loading && <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}</div>}

      <div className="space-y-2">
        {assignments.map(a => {
          const sb = statusBadge[a.status] ?? { label: a.status, variant: 'default' }
          return (
            <Card key={a.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm text-gray-900">{a.apartment?.name}</p>
                <p className="text-xs text-gray-500">{a.employee?.display_name} · {format(new Date(a.scheduled_date + 'T00:00'), "d MMM yyyy", { locale: es })}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={sb.variant}>{sb.label}</Badge>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
