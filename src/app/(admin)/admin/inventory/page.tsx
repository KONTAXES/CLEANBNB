'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import type { SupplyItem, Warehouse, WarehouseStock } from '@/types/database.types'

export default function InventoryPage() {
  const [items, setItems] = useState<SupplyItem[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [stock, setStock] = useState<WarehouseStock[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewItem, setShowNewItem] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [newItemUnit, setNewItemUnit] = useState('unidades')
  const [newItemCat, setNewItemCat] = useState('aseo')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    const supabase = createClient()
    Promise.all([
      supabase.from('supply_items').select('*').eq('is_active', true).order('name'),
      supabase.from('warehouses').select('*'),
      supabase.from('warehouse_stock').select('*, item:supply_items(name,unit), warehouse:warehouses(name)'),
    ]).then(([itemsRes, whRes, stockRes]) => {
      setItems(itemsRes.data ?? [])
      setWarehouses(whRes.data ?? [])
      setStock(stockRes.data ?? [])
      setLoading(false)
    })
  }

  useEffect(load, [])

  const addItem = async () => {
    if (!newItemName.trim()) return
    setSaving(true)
    const { error: err } = await createClient().from('supply_items').insert({ name: newItemName, unit: newItemUnit, category: newItemCat })
    if (err) { setError('Error guardando.'); setSaving(false); return }
    setNewItemName(''); setNewItemUnit('unidades'); setNewItemCat('aseo')
    setShowNewItem(false); setSaving(false); load()
  }

  const updateStock = async (warehouseId: string, itemId: string, qty: number) => {
    await createClient().from('warehouse_stock').upsert(
      { warehouse_id: warehouseId, item_id: itemId, quantity: qty, last_updated: new Date().toISOString() },
      { onConflict: 'warehouse_id,item_id' }
    )
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          <p className="text-sm text-gray-500">Gestión de insumos y bodegas</p>
        </div>
        <Button onClick={() => setShowNewItem(true)}>+ Nuevo insumo</Button>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      {showNewItem && (
        <Card className="space-y-3 border-blue-200 bg-blue-50">
          <h2 className="font-semibold text-gray-900">Nuevo insumo</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="Nombre del insumo" value={newItemName} onChange={e => setNewItemName(e.target.value)} />
            <select value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)} className="h-12 border border-gray-200 rounded-xl px-3 text-sm">
              {['unidades', 'rollos', 'ml', 'g', 'pares', 'juegos'].map(u => <option key={u}>{u}</option>)}
            </select>
            <select value={newItemCat} onChange={e => setNewItemCat(e.target.value)} className="h-12 border border-gray-200 rounded-xl px-3 text-sm">
              {['aseo', 'lencería', 'limpieza', 'cocina', 'general'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowNewItem(false)}>Cancelar</Button>
            <Button size="sm" loading={saving} onClick={addItem}>Guardar</Button>
          </div>
        </Card>
      )}

      {warehouses.map(wh => (
        <Card key={wh.id}>
          <CardHeader><CardTitle>📦 {wh.name}</CardTitle></CardHeader>
          <CardContent>
            {loading ? <p className="text-sm text-gray-400">Cargando...</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 text-gray-500 font-medium">Insumo</th>
                      <th className="text-left py-2 text-gray-500 font-medium">Unidad</th>
                      <th className="text-right py-2 text-gray-500 font-medium">Existencia</th>
                      <th className="w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => {
                      const s = stock.find(st => st.warehouse_id === wh.id && st.item_id === item.id)
                      return (
                        <tr key={item.id} className="border-b border-gray-50 last:border-0">
                          <td className="py-2">{item.name}</td>
                          <td className="py-2 text-gray-500">{item.unit}</td>
                          <td className="py-2 text-right">
                            <input
                              type="number" min="0" defaultValue={s?.quantity ?? 0}
                              onBlur={e => updateStock(wh.id, item.id, Number(e.target.value))}
                              className="w-20 border border-gray-200 rounded-lg p-1 text-center text-sm"
                            />
                          </td>
                          <td className="py-2 text-right">
                            {(s?.quantity ?? 0) < 5 && <span className="text-xs text-red-500">⚠️ Bajo</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
