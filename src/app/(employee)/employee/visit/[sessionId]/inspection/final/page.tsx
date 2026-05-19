'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { useVisitStore, type SectionInspection } from '@/store/visitStore'
import { SectionCard } from '@/components/inspection/SectionCard'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import type { ApartmentSection } from '@/types/database.types'

export default function FinalInspectionPage() {
  const params = useParams()
  const sessionId = params.sessionId as string
  const router = useRouter()
  const { profile } = useAuthStore()
  const { finalInspections, updateFinalSection } = useVisitStore()
  const [sections, setSections] = useState<ApartmentSection[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    createClient().from('visit_sessions').select('apartment:apartments(sections)').eq('id', sessionId).single().then(({ data }) => {
      setSections((data as any)?.apartment?.sections ?? [])
    })
  }, [sessionId])

  const getSectionData = (sectionId: string): SectionInspection =>
    finalInspections.find(s => s.section_id === sectionId) ?? { section_id: sectionId, section_name: sections.find(s => s.id === sectionId)?.name ?? '', photos: [], comment: '', alerts: [] }

  const allSectionsHavePhotos = sections.every(s => getSectionData(s.id).photos.length > 0)

  const handleSubmit = async () => {
    if (!allSectionsHavePhotos) { setError('Cada sección debe tener al menos una foto.'); return }
    setSaving(true); setError('')
    try {
      const supabase = createClient()
      await supabase.from('inspection_reports').insert(sections.map(s => {
        const d = getSectionData(s.id)
        return { session_id: sessionId, type: 'final' as const, section_id: s.id, section_name: s.name, photos: d.photos, comment: d.comment || null, alerts: d.alerts, employee_id: profile!.id }
      }))
      await supabase.from('visit_sessions').update({ status: 'inspecting_final' }).eq('id', sessionId)
      router.push(`/employee/visit/${sessionId}/clock-out`)
    } catch { setError('Error guardando inspección final. Intente de nuevo.') } finally { setSaving(false) }
  }

  return (
    <div className="p-4 pt-6 space-y-4">
      <div><h1 className="text-xl font-bold text-gray-900">Inspección final</h1><p className="text-sm text-gray-500">¿Cómo dejó el apartamento?</p></div>
      <Alert variant="success">Documente el estado final de cada sección del apartamento.</Alert>
      {error && <Alert variant="destructive">{error}</Alert>}
      <div className="space-y-3">
        {sections.map(section => (
          <SectionCard key={section.id} section={section} sessionId={sessionId} data={getSectionData(section.id)} onChange={d => updateFinalSection(d)} />
        ))}
      </div>
      {sections.length > 0 && (
        <Button onClick={handleSubmit} loading={saving} disabled={!allSectionsHavePhotos} size="lg" className="w-full">Guardar inspección final y proceder a salida</Button>
      )}
    </div>
  )
}
