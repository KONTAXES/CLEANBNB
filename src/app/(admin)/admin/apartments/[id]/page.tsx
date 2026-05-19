'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import Link from 'next/link'
import type { Apartment, SupplyItem, ApartmentStock } from '@/types/database.types'

export default function ApartmentDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [apartment, setApartment] = useState<Apartment | null>(null)
  const [stock, setStock] = useState<ApartmentStock[]>([])
  const [allItems, setAllItems] = useState<SupplyItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('apartments').select('*').eq('id', id as string).single(),
      supabase.from('apartment_stock').select('*, item:supply_items(*)').eq('apartment_id', id as string),
      supabase.from('supply_items').select('*').eq('is_active', true),
    ]).then(([aptRes, stockRes, itemsRes]) => {
      setApartment(aptRes.data)
      setStock(stockRes.data ?? [])
      setAllItems(itemsRes.data ?? [])
      setLoading(false)
    })
  }, [id])

  const handleDelete = async () => {
    if (!confirm('¿Seguro que desea desactivar este apartamento?')) return
    await createClient().from('apartments').update({ is_active: false }).eq('id', id as string)
    router.push('/admin/apartments')
  }

  if (loading) return <div className="text-center py-8 text-gray-500">Cargando...</div>
  if (!apartment) return <Alert variant="destructive">Apartamento no encontrado</Alert>

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{apartment.name}</h1>
          <p className="text-gray-500 text-sm">{apartment.address}</p>
          {apartment.google_maps_url && (
            <a href={apartment.google_maps_url} target="_blank" rel="noreferrer" className="text-blue-600 text-xs">Ver en Google Maps →</a>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/apartments/${id}/edit`}>
            <Button variant="outline" size="sm">Editar</Button>
          </Link>
          <Button variant="destructive" size="sm" onClick={handleDelete}>Desactivar</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Secciones ({apartment.sections?.length ?? 0})</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {apartment.sections?.map(s => (
              <div key={s.id} className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-xs text-gray-500">{s.type}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Inventario actual en apartamento</CardTitle></CardHeader>
        <CardContent>
          {stock.length === 0 ? (
            <p className="text-sm text-gray-400">Sin historial de inventario aún.</p>
          ) : (
            <div className="space-y-2">
              {stock.map(s => (
                <div key={s.id} className="flex justify-between items-center text-sm py-1 border-b border-gray-50 last:border-0">
                  <span className="text-gray-700">{(s as any).item?.name}</span>
                  <span className="font-medium">{s.quantity} {(s as any).item?.unit}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
