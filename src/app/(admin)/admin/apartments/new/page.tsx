'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { v4 as uuid } from 'uuid'

const SECTION_TYPES = [
  { value: 'bedroom', label: '🛏️ Recámara' },
  { value: 'bathroom', label: '🚿 Baño' },
  { value: 'kitchen', label: '🍳 Cocina' },
  { value: 'living_room', label: '🛋️ Sala' },
  { value: 'other', label: '🏠 Otro' },
]

export default function NewApartmentPage() {
  const router = useRouter()
  const { profile } = useAuthStore()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [mapsUrl, setMapsUrl] = useState('')
  const [sections, setSections] = useState([{ id: uuid(), name: '', type: 'bedroom' }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const addSection = () => setSections([...sections, { id: uuid(), name: '', type: 'bedroom' }])
  const removeSection = (id: string) => setSections(sections.filter(s => s.id !== id))
  const updateSection = (id: string, updates: any) => setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !address.trim()) { setError('Nombre y dirección son requeridos.'); return }
    if (sections.some(s => !s.name.trim())) { setError('Todos los nombres de sección son requeridos.'); return }
    setSaving(true)
    setError('')
    try {
      const { error: dbErr } = await createClient().from('apartments').insert({
        name, address, google_maps_url: mapsUrl || null, sections, expected_inventory: [], created_by: profile?.id
      })
      if (dbErr) throw dbErr
      router.push('/admin/apartments')
    } catch {
      setError('Error guardando apartamento.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo apartamento</h1>
        <p className="text-sm text-gray-500">Configure el apartamento y sus secciones</p>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="space-y-3">
          <h2 className="font-semibold text-gray-900">Información general</h2>
          <Input label="Nombre del apartamento" placeholder="Ej: Apto 101 Torre A" value={name} onChange={e => setName(e.target.value)} required />
          <Input label="Dirección" placeholder="Dirección completa" value={address} onChange={e => setAddress(e.target.value)} required />
          <Input label="URL Google Maps (opcional)" placeholder="https://maps.google.com/..." value={mapsUrl} onChange={e => setMapsUrl(e.target.value)} />
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Secciones del apartamento</h2>
            <Button type="button" variant="outline" size="sm" onClick={addSection}>+ Agregar</Button>
          </div>
          {sections.map(s => (
            <div key={s.id} className="flex gap-2 items-start">
              <select value={s.type} onChange={e => updateSection(s.id, { type: e.target.value })} className="border border-gray-200 rounded-xl p-3 text-sm">
                {SECTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <input placeholder="Nombre (ej: Recámara 1)" value={s.name} onChange={e => updateSection(s.id, { name: e.target.value })} className="flex-1 border border-gray-200 rounded-xl p-3 text-sm" />
              {sections.length > 1 && (
                <button type="button" onClick={() => removeSection(s.id)} className="text-red-400 p-3">✕</button>
              )}
            </div>
          ))}
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={saving} className="flex-1">Guardar apartamento</Button>
        </div>
      </form>
    </div>
  )
}
