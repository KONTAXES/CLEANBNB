'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import type { Assignment } from '@/types/database.types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function EmployeeHomePage() {
  const { profile } = useAuthStore()
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    const supabase = createClient()
    supabase
      .from('assignments')
      .select('*, apartment:apartments(*)')
      .eq('employee_id', profile.id)
      .gte('scheduled_date', new Date().toISOString().split('T')[0])
      .in('status', ['scheduled', 'in_progress'])
      .order('scheduled_date', { ascending: true })
      .then(({ data }) => {
        setAssignments((data as any[]) ?? [])
        setLoading(false)
      })
  }, [profile])

  const startVisit = async (assignment: Assignment) => {
    const supabase = createClient()
    const { data: session, error } = await supabase
      .from('visit_sessions')
      .insert({
        assignment_id: assignment.id,
        employee_id: profile!.id,
        apartment_id: assignment.apartment_id,
        status: 'clocked_in',
      })
      .select()
      .single()
    if (error || !session) return
    await supabase.from('assignments').update({ status: 'in_progress' }).eq('id', assignment.id)
    router.push(`/employee/visit/${session.id}/clock-in`)
  }

  const statusBadge = (status: string) => {
    const map: Record<string, any> = {
      scheduled: { label: 'Programada', variant: 'info' },
      in_progress: { label: 'En progreso', variant: 'warning' },
    }
    const s = map[status] ?? { label: status, variant: 'default' }
    return <Badge variant={s.variant}>{s.label}</Badge>
  }

  return (
    <div className="p-4 pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hola, {profile?.display_name?.split(' ')[0]} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">{format(new Date(), "EEEE d 'de' MMMM", { locale: es })}</p>
      </div>

      <h2 className="font-semibold text-gray-700 mb-3">Mis asignaciones</h2>

      {loading && <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}</div>}

      {!loading && assignments.length === 0 && (
        <Card><CardContent className="text-center py-8"><p className="text-4xl mb-2">✅</p><p className="text-gray-500">No tienes asignaciones pendientes</p></CardContent></Card>
      )}

      <div className="space-y-3">
        {assignments.map(a => (
          <Card key={a.id} className="overflow-hidden">
            <div className="bg-blue-600 h-1.5" />
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{(a as any).apartment?.name}</h3>
                  <p className="text-xs text-gray-500">{(a as any).apartment?.address}</p>
                </div>
                {statusBadge(a.status)}
              </div>
              <p className="text-xs text-gray-400 mb-3">📅 {format(new Date(a.scheduled_date + 'T00:00'), "d MMM yyyy", { locale: es })}</p>
              {a.notes && <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2 mb-3">{a.notes}</p>}
              <Button onClick={() => startVisit(a)} className="w-full" variant={a.status === 'in_progress' ? 'secondary' : 'default'}>
                {a.status === 'in_progress' ? 'Continuar visita' : 'Iniciar visita'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
