'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

export default function ReportsPage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [reports, setReports] = useState<any[]>([])
  const [movements, setMovements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ from: '', to: '' })

  const load = async () => {
    const supabase = createClient()
    let q = supabase.from('visit_sessions')
      .select('*, employee:profiles(display_name), apartment:apartments(name)')
      .order('created_at', { ascending: false }).limit(100)
    if (filter.from) q = q.gte('created_at', filter.from + 'T00:00:00')
    if (filter.to) q = q.lte('created_at', filter.to + 'T23:59:59')
    const { data } = await q
    setSessions(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const viewSession = async (session: any) => {
    setSelected(session)
    const supabase = createClient()
    const [rRes, mRes] = await Promise.all([
      supabase.from('inspection_reports').select('*').eq('session_id', session.id).order('submitted_at'),
      supabase.from('inventory_movements').select('*, item:supply_items(name,unit)').eq('session_id', session.id).order('recorded_at'),
    ])
    setReports(rRes.data ?? [])
    setMovements(mRes.data ?? [])
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-sm text-gray-500">Historial de visitas e inspecciones</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input type="date" value={filter.from} onChange={e => setFilter(f => ({ ...f, from: e.target.value }))} className="h-10 border border-gray-200 rounded-xl px-3 text-sm" />
        <input type="date" value={filter.to} onChange={e => setFilter(f => ({ ...f, to: e.target.value }))} className="h-10 border border-gray-200 rounded-xl px-3 text-sm" />
        <button onClick={load} className="h-10 px-4 bg-blue-600 text-white rounded-xl text-sm font-medium">Filtrar</button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          {loading && [1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}
          {sessions.map(s => (
            <Card key={s.id} className={`cursor-pointer hover:shadow-md transition-shadow ${selected?.id === s.id ? 'border-blue-400' : ''}`} onClick={() => viewSession(s)}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-gray-900">{s.apartment?.name}</p>
                  <p className="text-xs text-gray-500">{s.employee?.display_name}</p>
                  <p className="text-xs text-gray-400">{s.clock_in_at ? format(new Date(s.clock_in_at), 'dd/MM/yy HH:mm') : '—'}</p>
                </div>
                <Badge variant={s.status === 'clocked_out' ? 'success' : 'warning'}>
                  {s.status === 'clocked_out' ? 'Completada' : 'En progreso'}
                </Badge>
              </div>
            </Card>
          ))}
        </div>

        {selected && (
          <Card>
            <CardHeader>
              <CardTitle>{selected.apartment?.name}</CardTitle>
              <p className="text-xs text-gray-500">{selected.employee?.display_name}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-xs space-y-1">
                <p>📍 Entrada: {selected.clock_in_at ? format(new Date(selected.clock_in_at), 'HH:mm dd/MM') : '—'} {selected.face_verified_clock_in ? '✅ Facial' : '⚠️ Sin verificar'}</p>
                <p>📍 Salida: {selected.clock_out_at ? format(new Date(selected.clock_out_at), 'HH:mm dd/MM') : '—'}</p>
              </div>
              {reports.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-2">Inspecciones</p>
                  {reports.map(r => (
                    <div key={r.id} className="mb-3">
                      <p className="text-xs font-medium text-gray-700">{r.type === 'initial' ? '🔍 Inicial' : '✅ Final'} — {r.section_name}</p>
                      <div className="flex gap-1 flex-wrap mt-1">
                        {r.photos.map((url: string, i: number) => (
                          <a key={i} href={url} target="_blank" rel="noreferrer">
                            <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg" />
                          </a>
                        ))}
                      </div>
                      {r.alerts.length > 0 && r.alerts.map((a: any, i: number) => (
                        <p key={i} className="text-xs text-red-600 mt-1">⚠️ {a.type}: {a.description}</p>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              {movements.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-2">Movimientos de insumos</p>
                  <div className="space-y-1">
                    {movements.map(m => (
                      <div key={m.id} className="flex justify-between text-xs">
                        <span className="text-gray-600">{m.item?.name}</span>
                        <span className={m.difference !== 0 ? 'text-amber-600 font-medium' : 'text-gray-500'}>
                          {m.quantity} {m.item?.unit} {m.difference !== 0 ? `(dif: ${m.difference > 0 ? '+' : ''}${m.difference})` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
