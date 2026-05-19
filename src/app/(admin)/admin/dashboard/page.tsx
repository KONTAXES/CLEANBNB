'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Stats {
  todayVisits: number
  completedToday: number
  inProgress: number
  pendingAssignments: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ todayVisits: 0, completedToday: 0, inProgress: 0, pendingAssignments: 0 })
  const [recentSessions, setRecentSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    Promise.all([
      supabase.from('visit_sessions').select('*, employee:profiles(display_name), apartment:apartments(name)').gte('created_at', today + 'T00:00:00').order('created_at', { ascending: false }).limit(10),
      supabase.from('assignments').select('id', { count: 'exact', head: true }).eq('scheduled_date', today).eq('status', 'scheduled'),
    ]).then(([sessRes, pendRes]) => {
      const sessions = sessRes.data ?? []
      setRecentSessions(sessions)
      setStats({
        todayVisits: sessions.length,
        completedToday: sessions.filter(s => s.status === 'clocked_out').length,
        inProgress: sessions.filter(s => s.status !== 'clocked_out').length,
        pendingAssignments: pendRes.count ?? 0,
      })
      setLoading(false)
    })

    const channel = supabase
      .channel('dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visit_sessions' }, () => {
        supabase.from('visit_sessions').select('*, employee:profiles(display_name), apartment:apartments(name)').gte('created_at', today + 'T00:00:00').order('created_at', { ascending: false }).limit(10).then(({ data }) => setRecentSessions(data ?? []))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const statusLabel: Record<string, { label: string; variant: any }> = {
    clocked_in: { label: 'Entrada registrada', variant: 'info' },
    inspecting_initial: { label: 'Inspección inicial', variant: 'warning' },
    managing_supplies: { label: 'Gestionando insumos', variant: 'warning' },
    inspecting_final: { label: 'Inspección final', variant: 'warning' },
    clocked_out: { label: 'Completada', variant: 'success' },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm">{format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es })}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Visitas hoy', value: stats.todayVisits, icon: '🏠', color: 'bg-blue-50 border-blue-100' },
          { label: 'En progreso', value: stats.inProgress, icon: '⏳', color: 'bg-amber-50 border-amber-100' },
          { label: 'Completadas', value: stats.completedToday, icon: '✅', color: 'bg-green-50 border-green-100' },
          { label: 'Pendientes', value: stats.pendingAssignments, icon: '📋', color: 'bg-purple-50 border-purple-100' },
        ].map(s => (
          <Card key={s.label} className={s.color}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <p className="text-2xl font-bold text-gray-900">{loading ? '—' : s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Visitas en tiempo real</CardTitle></CardHeader>
        <CardContent>
          {loading && <p className="text-sm text-gray-400 text-center py-4">Cargando...</p>}
          {!loading && recentSessions.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No hay visitas hoy</p>
          )}
          <div className="space-y-2">
            {recentSessions.map(s => {
              const st = statusLabel[s.status] ?? { label: s.status, variant: 'default' }
              return (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.apartment?.name}</p>
                    <p className="text-xs text-gray-500">{s.employee?.display_name}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={st.variant}>{st.label}</Badge>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {s.clock_in_at ? format(new Date(s.clock_in_at), 'HH:mm') : '—'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
