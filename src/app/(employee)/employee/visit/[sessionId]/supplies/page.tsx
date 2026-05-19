'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { useVisitStore } from '@/store/visitStore'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'
import type { SupplyItem, ApartmentStock, Warehouse } from '@/types/database.types'

interface SupplyRow { item: SupplyItem; found: number; fromWarehouse: number; willLeave: number; expected: number; warehouseId: string; comment: string }

export default function SuppliesPage() {
  const params = useParams()
  const sessionId = params.sessionId as string
  const router = useRouter()
  const { profile } = useAuthStore()
  const { apartmentId } = useVisitStore()
  const [rows, setRows] = useState<SupplyRow[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!apartmentId) return
    const supabase = createClient()
    Promise.all([
      supabase.from('visit_sessions').select('apartment:apartments(expected_inventory)').eq('id', sessionId).single(),
      supabase.from('apartment_stock').select('*, item:supply_items(*)').eq('apartment_id', apartmentId),
      supabase.from('supply_items').select('*').eq('is_active', true),
      supabase.from('warehouses').select('*'),
    ]).then(([sessionRes, stockRes, itemsRes, whRes]) => {
      const expected = (sessionRes.data as any)?.apartment?.expected_inventory ?? []
      const stock = stockRes.data ?? []
      const allItems = itemsRes.data ?? []
      setWarehouses(whRes.data ?? [])
      const itemIds = new Set([...expected.map((e: any) => e.item_id), ...stock.map((s: any) => s.item_id)])
      setRows(Array.from(itemIds).map(itemId => {
        const item = allItems.find(i => i.id === itemId)
        if (!item) return null
        return { item, found: (stock.find((s: any) => s.item_id === itemId) as ApartmentStock)?.quantity ?? 0, fromWarehouse: 0, willLeave: expected.find((e: any) => e.item_id === itemId)?.quantity ?? 0, expected: expected.find((e: any) => e.item_id === itemId)?.quantity ?? 0, warehouseId: whRes.data?.[0]?.id ?? '', comment: '' }
      }).filter(Boolean) as SupplyRow[])
      setLoading(false)
    })
  }, [apartmentId, sessionId])

  const updateRow = (index: number, updates: Partial<SupplyRow>) => setRows(prev => prev.map((r, i) => i === index ? { ...r, ...updates } : r))
  const getDiff = (row: SupplyRow) => row.willLeave - row.expected

  const handleSubmit = async () => {
    setSaving(true); setError('')
    try {
      const supabase = createClient()
      const movements = rows.flatMap(row => {
        const entries: any[] = [{ session_id: sessionId, apartment_id: apartmentId!, item_id: row.item.id, type: 'found', quantity: row.found, expected_quantity: row.expected, comment: null, employee_id: profile!.id, transfer_to_apartment_id: null }]
        if (row.fromWarehouse > 0) entries.push({ session_id: sessionId, apartment_id: apartmentId!, item_id: row.item.id, type: 'added_from_warehouse', quantity: row.fromWarehouse, expected_quantity: null, comment: `Bodega: ${warehouses.find(w => w.id === row.warehouseId)?.name}`, employee_id: profile!.id, transfer_to_apartment_id: null })
        const diff = getDiff(row)
        if (diff !== 0) entries.push({ session_id: sessionId, apartment_id: apartmentId!, item_id: row.item.id, type: 'final_count', quantity: row.willLeave, expected_quantity: row.expected, comment: row.comment || null, employee_id: profile!.id, transfer_to_apartment_id: null })
        return entries
      })
      await supabase.from('inventory_movements').insert(movements)
      for (const row of rows) await supabase.from('apartment_stock').upsert({ apartment_id: apartmentId!, item_id: row.item.id, quantity: row.willLeave, last_session_id: sessionId, last_updated: new Date().toISOString() }, { onConflict: 'apartment_id,item_id' })
      await supabase.from('visit_sessions').update({ status: 'inspecting_final' }).eq('id', sessionId)
      router.push(`/employee/visit/${sessionId}/inspection/final`)
    } catch { setError('Error guardando insumos. Intente de nuevo.') } finally { setSaving(false) }
  }

  if (loading) return <div className="p-4 text-center text-gray-500">Cargando insumos...</div>

  return (
    <div className="p-4 pt-6 space-y-4">
      <div><h1 className="text-xl font-bold text-gray-900">Control de insumos</h1><p className="text-sm text-gray-500">Registre el estado de los insumos</p></div>
      <Alert variant="default">Ingrese cuántos encontró, cuántos trajo de bodega y cuántos dejarán al finalizar.</Alert>
      {error && <Alert variant="destructive">{error}</Alert>}
      <div className="space-y-3">
        {rows.map((row, i) => {
          const diff = getDiff(row)
          return (
            <Card key={row.item.id} className={diff !== 0 ? 'border-amber-300' : ''}>
              <div className="flex items-center justify-between mb-3">
                <div><h3 className="font-semibold text-sm text-gray-900">{row.item.name}</h3><p className="text-xs text-gray-500">{row.item.unit} · Esperado: {row.expected}</p></div>
                {diff !== 0 && <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${diff < 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{diff > 0 ? '+' : ''}{diff}</span>}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['found','fromWarehouse','willLeave'] as const).map((field, fi) => (
                  <div key={field}>
                    <label className="text-xs text-gray-500">{['Encontrado','De bodega','Dejarán'][fi]}</label>
                    <input type="number" min="0" value={row[field]} onChange={e => updateRow(i, { [field]: Number(e.target.value) })} className={`w-full border rounded-lg p-2 text-sm text-center ${field === 'willLeave' && diff !== 0 ? 'border-amber-400' : 'border-gray-200'}`} />
                  </div>
                ))}
              </div>
              {diff !== 0 && <input placeholder="Comentario sobre la diferencia" value={row.comment} onChange={e => updateRow(i, { comment: e.target.value })} className="w-full border border-amber-300 rounded-lg p-2 text-xs mt-2" />}
            </Card>
          )
        })}
      </div>
      <Button onClick={handleSubmit} loading={saving} size="lg" className="w-full">Guardar insumos y continuar</Button>
    </div>
  )
}
