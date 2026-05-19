'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { Apartment } from '@/types/database.types'

export default function ApartmentsPage() {
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    createClient().from('apartments').select('*').eq('is_active', true).order('name').then(({ data }) => {
      setApartments(data ?? [])
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Apartamentos</h1>
          <p className="text-sm text-gray-500">{apartments.length} apartamentos activos</p>
        </div>
        <Link href="/admin/apartments/new">
          <Button>+ Nuevo apartamento</Button>
        </Link>
      </div>

      {loading && <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}</div>}

      <div className="grid md:grid-cols-2 gap-4">
        {apartments.map(apt => (
          <Card key={apt.id} className="hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-gray-900">{apt.name}</h3>
                <p className="text-xs text-gray-500">{apt.address}</p>
              </div>
              <Badge variant="success">Activo</Badge>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              {apt.sections?.length ?? 0} secciones · {apt.expected_inventory?.length ?? 0} insumos configurados
            </p>
            <div className="flex gap-2">
              <Link href={`/admin/apartments/${apt.id}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">Ver detalle</Button>
              </Link>
              <Link href={`/admin/apartments/${apt.id}/edit`} className="flex-1">
                <Button variant="secondary" size="sm" className="w-full">Editar</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
