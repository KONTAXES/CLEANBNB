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

export default function ClockOutPage() {
  const params = useParams()
  const sessionId = params.sessionId as string
  const router = useRouter()
  const { profile } = useAuthStore()
  const { reset } = useVisitStore()
  const { position, loading: gpsLoading, capture: captureGps } = useGps()
  const [exitPhotoUrl, setExitPhotoUrl] = useState<string | null>(null)
  const [step, setStep] = useState<'gps' | 'photo' | 'confirm'>('gps')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const selfieRef = useRef<any>(null)

  const handleConfirm = async () => {
    if (!position || !exitPhotoUrl || !profile) return
    setSaving(true); setError('')
    try {
      const supabase = createClient()
      let faceVerified = false, faceScore = 0, selfieUrl: string | null = null
      if (selfieRef.current) {
        try { const r = await selfieRef.current.captureAndVerify(); faceVerified = r.verified; faceScore = r.score; selfieUrl = r.photoUrl } catch {}
      }
      await supabase.from('visit_sessions').update({
        clock_out_at: new Date().toISOString(), clock_out_gps: gpsToString(position),
        clock_out_gps_accuracy: position.accuracy, face_verified_clock_out: faceVerified,
        face_match_score_out: faceScore, status: 'clocked_out',
      }).eq('id', sessionId)
      await supabase.from('clock_photos').insert({ session_id: sessionId, type: 'rear_entrance', storage_url: exitPhotoUrl, gps: gpsToString(position), gps_accuracy: position.accuracy, phase: 'clock_out' })
      if (selfieUrl) await supabase.from('clock_photos').insert({ session_id: sessionId, type: 'front_selfie', storage_url: selfieUrl, phase: 'clock_out' })
      const { data: s } = await supabase.from('visit_sessions').select('assignment_id').eq('id', sessionId).single()
      if (s?.assignment_id) await supabase.from('assignments').update({ status: 'completed' }).eq('id', s.assignment_id)
      reset(); setDone(true)
    } catch { setError('Error guardando salida. Intente de nuevo.') } finally { setSaving(false) }
  }

  if (done) return (
    <div className="p-4 pt-6 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <div className="text-6xl">✅</div>
      <h1 className="text-2xl font-bold text-gray-900">¡Visita completada!</h1>
      <p className="text-gray-500">La visita ha sido registrada correctamente.</p>
      <Button onClick={() => router.push('/employee/home')} size="lg">Volver al inicio</Button>
    </div>
  )

  return (
    <div className="p-4 pt-6 space-y-4">
      <div><h1 className="text-xl font-bold text-gray-900">Salida del apartamento</h1><p className="text-sm text-gray-500">Registre su salida</p></div>
      <div className="flex gap-2">
        {['Ubicación', 'Foto salida', 'Confirmar'].map((s, i) => {
          const steps = ['gps', 'photo', 'confirm']
          return <div key={s} className={`flex-1 h-1.5 rounded-full ${steps.indexOf(step) > i ? 'bg-green-500' : steps[i] === step ? 'bg-blue-600' : 'bg-gray-200'}`} />
        })}
      </div>
      {error && <Alert variant="destructive">{error}</Alert>}
      {step === 'gps' && (
        <Card className="text-center py-8 space-y-4">
          <div className="text-5xl">📍</div>
          <h2 className="font-semibold text-gray-900">Capturar ubicación GPS</h2>
          <Button onClick={async () => { await captureGps(); setStep('photo') }} loading={gpsLoading} size="lg" className="mx-auto">Capturar ubicación</Button>
        </Card>
      )}
      {step === 'photo' && (
        <div className="space-y-3">
          <Card className="p-3"><p className="text-sm text-green-700">✅ Ubicación capturada (±{Math.round(position?.accuracy ?? 0)}m)</p></Card>
          <CameraCapture bucket="clock-photos" sessionId={sessionId} photoType="rear_entrance_out" onCapture={url => { setExitPhotoUrl(url); setStep('confirm') }} label="Tomar foto de salida" />
        </div>
      )}
      {step === 'confirm' && (
        <div className="space-y-3">
          {exitPhotoUrl && <img src={exitPhotoUrl} alt="Salida" className="rounded-xl w-full h-40 object-cover" />}
          <Alert variant="success">Todo listo. Al confirmar se cerrará la visita.</Alert>
          <Button onClick={handleConfirm} loading={saving} size="lg" className="w-full">Confirmar salida y cerrar visita</Button>
        </div>
      )}
      {profile && <SelfieCapture ref={selfieRef} sessionId={sessionId} userId={profile.id} />}
    </div>
  )
}
