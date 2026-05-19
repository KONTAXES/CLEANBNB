'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { Profile } from '@/types/database.types'

const roleLabels: Record<string, { label: string; variant: any }> = {
  admin: { label: 'Admin', variant: 'danger' },
  supervisor: { label: 'Supervisor', variant: 'warning' },
  employee: { label: 'Empleado', variant: 'info' },
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    createClient().from('profiles').select('*').eq('is_active', true).order('display_name').then(({ data }) => {
      setStaff(data ?? [])
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personal</h1>
          <p className="text-sm text-gray-500">{staff.length} miembros activos</p>
        </div>
        <Link href="/admin/staff/new">
          <Button>+ Nuevo miembro</Button>
        </Link>
      </div>

      {loading && <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}</div>}

      <div className="space-y-2">
        {staff.map(p => {
          const rl = roleLabels[p.role] ?? { label: p.role, variant: 'default' }
          return (
            <Card key={p.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                  {p.display_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{p.display_name}</p>
                  <p className="text-xs text-gray-500">{p.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={rl.variant}>{rl.label}</Badge>
                {p.face_descriptor && <span className="text-xs text-green-600">✓ Facial</span>}
                <Link href={`/admin/staff/${p.id}`}>
                  <Button variant="ghost" size="sm">Ver</Button>
                </Link>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
