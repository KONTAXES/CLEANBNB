'use client'
import { useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { useVisitStore } from '@/store/visitStore'
import { useGps } from '@/hooks/useGps'
import { gpsToString } from '@/lib/gps'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'
import { CameraCapture } from '@/components/camera/CameraCapture'
import { SelfieCapture } from '@/components/camera/SelfieCapture'

export default function ClockInPage() {
  const params = useParams()
  const sessionId = params.sessionId as string
  const router = useRouter()
  const { profile } = useAuthStore()
  const { setSessionId, setApartmentId } = useVisitStore()
  const { position, loading: gpsLoading, error: gpsError, capture: captureGps } = useGps()
  const [entrancePhotoUrl, setEntrancePhotoUrl] = useState<string | null>(null)
  const [step, setStep] = useState<'gps' | 'photo' | 'confirm'>('gps')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const selfieRef = useRef<any>(null)

  const handleConfirm = async () => {
    if (!position || !entrancePhotoUrl || !profile) return
    setSaving(true)
    setError('')
    try {
      const supabase = createClient()
      let faceVerified = false, faceScore = 0, selfieUrl: string | null = null
      if (selfieRef.current) {
        try { const r = await selfieRef.current.captureAndVerify(); faceVerified = r.verified; faceScore = r.score; selfieUrl = r.photoUrl } catch {}
      }
      await supabase.from('visit_sessions').update({
        clock_in_at: new Date().toISOString(), clock_in_gps: gpsToString(position),
        clock_in_gps_accuracy: position.accuracy, face_verified_clock_in: faceVerified,
        face_match_score_in: faceScore, status: 'inspecting_initial',
      }).eq('id', sessionId)
      await supabase.from('clock_photos').insert({ session_id: sessionId, type: 'rear_entrance', storage_url: entrancePhotoUrl, gps: gpsToString(position), gps_accuracy: position.accuracy, phase: 'clock_in' })
      if (selfieUrl) await supabase.from('clock_photos').insert({ session_id: sessionId, type: 'front_selfie', storage_url: selfieUrl, phase: 'clock_in' })
      const { data: session } = await supabase.from('visit_sessions').select('apartment_id').eq('id', sessionId).single()
      setSessionId(sessionId)
      if (session?.apartment_id) setApartmentId(session.apartment_id)
      router.push(`/employee/visit/${sessionId}/inspection/initial`)
    } catch { setError('Error guardando. Intente de nuevo.') } finally { setSaving(false) }
  }

  return (
    <div className="p-4 pt-6 space-y-4">
      <div><h1 className="text-xl font-bold text-gray-900">Entrada al apartamento</h1><p className="text-sm text-gray-500">Registre su llegada</p></div>
      <div className="flex gap-2">
        {['Ubicación', 'Foto entrada', 'Confirmar'].map((s, i) => {
          const steps = ['gps', 'photo', 'confirm']
          return <div key={s} className={`flex-1 h-1.5 rounded-full ${steps.indexOf(step) > i ? 'bg-green-500' : steps[i] === step ? 'bg-blue-600' : 'bg-gray-200'}`} />
        })}
      </div>
      {error && <Alert variant="destructive">{error}</Alert>}
      {step === 'gps' && (
        <Card className="text-center py-8 space-y-4">
          <div className="text-5xl">📍</div>
          <div><h2 className="font-semibold text-gray-900">Capturar ubicación GPS</h2><p className="text-sm text-gray-500">Asegúrese de estar en el apartamento</p></div>
          <Button onClick={async () => { await captureGps(); setStep('photo') }} loading={gpsLoading} size="lg" className="mx-auto">Capturar mi ubicación</Button>
          {gpsError && <Alert variant="warning">{gpsError}</Alert>}
        </Card>
      )}
      {step === 'photo' && (
        <div className="space-y-3">
          <Card className="p-3"><p className="text-sm font-medium text-green-700">✅ Ubicación capturada {position && <span className="text-xs text-gray-400">(±{Math.round(position.accuracy)}m)</span>}</p></Card>
          <CameraCapture bucket="clock-photos" sessionId={sessionId} photoType="rear_entrance_in" onCapture={url => { setEntrancePhotoUrl(url); setStep('confirm') }} label="Tomar foto de entrada" />
        </div>
      )}
      {step === 'confirm' && (
        <div className="space-y-3">
          {entrancePhotoUrl && <img src={entrancePhotoUrl} alt="Entrada" className="rounded-xl w-full h-40 object-cover" />}
          <Alert variant="default">La hora de entrada y su ubicación quedarán registradas al confirmar.</Alert>
          <Button onClick={handleConfirm} loading={saving} size="lg" className="w-full">Confirmar entrada y comenzar inspección</Button>
        </div>
      )}
      {profile && <SelfieCapture ref={selfieRef} sessionId={sessionId} userId={profile.id} />}
    </div>
  )
}
