'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function SupervisorDashboard() {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    const load = () => supabase
      .from('visit_sessions')
      .select('*, employee:profiles(display_name), apartment:apartments(name)')
      .gte('created_at', today + 'T00:00:00')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setSessions(data ?? []); setLoading(false) })

    load()
    const channel = supabase.channel('supervisor')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visit_sessions' }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Supervisión en tiempo real</h1>
        <p className="text-gray-500 text-sm">{format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es })}</p>
      </div>

      <Alert variant="warning">Modo supervisor: solo lectura. No puede modificar ningún registro.</Alert>

      <Card>
        <CardHeader><CardTitle>Visitas del día</CardTitle></CardHeader>
        <CardContent>
          {loading && <p className="text-sm text-gray-400">Cargando...</p>}
          <div className="space-y-3">
            {sessions.map(s => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.apartment?.name}</p>
                  <p className="text-xs text-gray-500">{s.employee?.display_name}</p>
                  <p className="text-xs text-gray-400">{s.clock_in_at ? format(new Date(s.clock_in_at), 'HH:mm') : '—'}</p>
                </div>
                <div className="text-right space-y-1">
                  <Badge variant={s.status === 'clocked_out' ? 'success' : 'warning'}>
                    {s.status === 'clocked_out' ? 'Completada' : 'En progreso'}
                  </Badge>
                  {s.face_verified_clock_in && <p className="text-xs text-green-600">✓ Facial verificado</p>}
                </div>
              </div>
            ))}
            {!loading && sessions.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No hay visitas hoy</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
