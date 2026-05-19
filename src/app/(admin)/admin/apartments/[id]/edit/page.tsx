'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { v4 as uuid } from 'uuid'
import type { Apartment } from '@/types/database.types'

const SECTION_TYPES = [
  { value: 'bedroom', label: '🛏️ Recámara' },
  { value: 'bathroom', label: '🚿 Baño' },
  { value: 'kitchen', label: '🍳 Cocina' },
  { value: 'living_room', label: '🛋️ Sala' },
  { value: 'other', label: '🏠 Otro' },
]

export default function EditApartmentPage() {
  const { id } = useParams()
  const router = useRouter()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [mapsUrl, setMapsUrl] = useState('')
  const [sections, setSections] = useState<any[]>([])
  const [expectedInventory, setExpectedInventory] = useState<any[]>([])
  const [allItems, setAllItems] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('apartments').select('*').eq('id', id as string).single(),
      supabase.from('supply_items').select('*').eq('is_active', true).order('name'),
    ]).then(([aptRes, itemsRes]) => {
      const apt = aptRes.data as Apartment
      if (apt) {
        setName(apt.name)
        setAddress(apt.address)
        setMapsUrl(apt.google_maps_url ?? '')
        setSections(apt.sections ?? [])
        setExpectedInventory(apt.expected_inventory ?? [])
      }
      setAllItems(itemsRes.data ?? [])
      setLoading(false)
    })
  }, [id])

  const addSection = () => setSections([...sections, { id: uuid(), name: '', type: 'bedroom' }])
  const updateSection = (sid: string, updates: any) => setSections(sections.map(s => s.id === sid ? { ...s, ...updates } : s))
  const removeSection = (sid: string) => setSections(sections.filter(s => s.id !== sid))

  const updateExpected = (itemId: string, qty: number) => {
    const existing = expectedInventory.findIndex(e => e.item_id === itemId)
    if (qty === 0) {
      setExpectedInventory(expectedInventory.filter(e => e.item_id !== itemId))
    } else if (existing >= 0) {
      const updated = [...expectedInventory]
      updated[existing] = { item_id: itemId, quantity: qty }
      setExpectedInventory(updated)
    } else {
      setExpectedInventory([...expectedInventory, { item_id: itemId, quantity: qty }])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { error: err } = await createClient().from('apartments').update({
      name, address, google_maps_url: mapsUrl || null, sections, expected_inventory: expectedInventory
    }).eq('id', id as string)
    if (err) { setError('Error guardando.'); setSaving(false); return }
    router.push(`/admin/apartments/${id}`)
  }

  if (loading) return <div className="text-center py-8 text-gray-500">Cargando...</div>

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Editar apartamento</h1>
      {error && <Alert variant="destructive">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="space-y-3">
          <h2 className="font-semibold">Información general</h2>
          <Input label="Nombre" value={name} onChange={e => setName(e.target.value)} required />
          <Input label="Dirección" value={address} onChange={e => setAddress(e.target.value)} required />
          <Input label="URL Google Maps (opcional)" value={mapsUrl} onChange={e => setMapsUrl(e.target.value)} />
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Secciones</h2>
            <Button type="button" variant="outline" size="sm" onClick={addSection}>+ Agregar</Button>
          </div>
          {sections.map(s => (
            <div key={s.id} className="flex gap-2 items-center">
              <select value={s.type} onChange={e => updateSection(s.id, { type: e.target.value })} className="border border-gray-200 rounded-xl p-3 text-sm">
                {SECTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <input value={s.name} onChange={e => updateSection(s.id, { name: e.target.value })} placeholder="Nombre" className="flex-1 border border-gray-200 rounded-xl p-3 text-sm" />
              <button type="button" onClick={() => removeSection(s.id)} className="text-red-400 p-2">✕</button>
            </div>
          ))}
        </Card>

        <Card className="space-y-3">
          <h2 className="font-semibold">Inventario esperado por visita</h2>
          <p className="text-xs text-gray-500">Defina cuántas unidades de cada insumo deben quedar en el apartamento</p>
          <div className="space-y-2">
            {allItems.map(item => {
              const exp = expectedInventory.find(e => e.item_id === item.id)?.quantity ?? 0
              return (
                <div key={item.id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{item.name} <span className="text-gray-400">({item.unit})</span></span>
                  <input
                    type="number" min="0" value={exp}
                    onChange={e => updateExpected(item.id, Number(e.target.value))}
                    className="w-20 border border-gray-200 rounded-lg p-1.5 text-sm text-center"
                  />
                </div>
              )
            })}
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={saving} className="flex-1">Guardar cambios</Button>
        </div>
      </form>
    </div>
  )
}
