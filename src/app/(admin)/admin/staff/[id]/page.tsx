'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import Webcam from 'react-webcam'
import { getFaceDescriptor } from '@/lib/face-recognition/detectFace'
import { uploadBase64Photo } from '@/lib/storage'
import type { Profile } from '@/types/database.types'

const roleLabels: Record<string, { label: string; variant: any }> = {
  admin: { label: 'Administrador', variant: 'danger' },
  supervisor: { label: 'Supervisor', variant: 'warning' },
  employee: { label: 'Empleado', variant: 'info' },
}

export default function StaffDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrollStep, setEnrollStep] = useState<'idle' | 'camera' | 'processing' | 'done'>('idle')
  const [enrollError, setEnrollError] = useState('')
  const webcamRef = useRef<Webcam>(null)

  useEffect(() => {
    createClient().from('profiles').select('*').eq('id', id as string).single().then(({ data }) => {
      setProfile(data)
      setLoading(false)
    })
  }, [id])

  const handleEnrollFace = async () => {
    setEnrollStep('processing')
    setEnrollError('')
    try {
      const screenshot = webcamRef.current?.getScreenshot()
      if (!screenshot) throw new Error('No se pudo capturar imagen')

      const img = document.createElement('img')
      img.src = screenshot
      await new Promise(r => { img.onload = r })
      const canvas = document.createElement('canvas')
      canvas.width = img.width; canvas.height = img.height
      canvas.getContext('2d')!.drawImage(img, 0, 0)

      const descriptor = await getFaceDescriptor(canvas as any)
      if (!descriptor) throw new Error('No se detectó rostro. Asegúrese de estar frente a la cámara con buena iluminación.')

      const photoUrl = await uploadBase64Photo('face-enrollment', `${id}/reference_${Date.now()}.jpg`, screenshot)

      await createClient().from('profiles').update({
        face_descriptor: Array.from(descriptor),
        face_photo_url: photoUrl,
      }).eq('id', id as string)

      setProfile(prev => prev ? { ...prev, face_descriptor: Array.from(descriptor), face_photo_url: photoUrl } : prev)
      setEnrollStep('done')
    } catch (e: any) {
      setEnrollError(e.message ?? 'Error en el enrolamiento')
      setEnrollStep('camera')
    }
  }

  const handleDeactivate = async () => {
    if (!confirm('¿Desactivar este usuario?')) return
    await createClient().from('profiles').update({ is_active: false }).eq('id', id as string)
    router.push('/admin/staff')
  }

  if (loading) return <div className="py-8 text-center text-gray-500">Cargando...</div>
  if (!profile) return <Alert variant="destructive">Usuario no encontrado</Alert>

  const rl = roleLabels[profile.role] ?? { label: profile.role, variant: 'default' }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-bold text-2xl">
            {profile.display_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{profile.display_name}</h1>
            <p className="text-gray-500 text-sm">📱 {profile.phone}</p>
            <Badge variant={rl.variant} className="mt-1">{rl.label}</Badge>
          </div>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDeactivate}>Desactivar</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Reconocimiento facial</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {profile.face_descriptor ? (
            <div className="flex items-center gap-3">
              {profile.face_photo_url && <img src={profile.face_photo_url} alt="Foto referencia" className="w-16 h-16 rounded-xl object-cover" />}
              <div>
                <p className="text-sm font-medium text-green-700">✅ Rostro registrado</p>
                <p className="text-xs text-gray-500">El empleado puede iniciar sesión con reconocimiento facial</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setEnrollStep('camera')}>Re-enrolar</Button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-amber-700 mb-3">⚠️ Rostro no registrado.</p>
              <Button onClick={() => setEnrollStep('camera')} variant="outline">Enrolar rostro ahora</Button>
            </div>
          )}

          {enrollStep === 'camera' && (
            <div className="space-y-3 mt-3">
              <Webcam ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={{ facingMode: 'user', aspectRatio: 1 }} className="rounded-xl w-full max-w-xs mx-auto" />
              {enrollError && <Alert variant="destructive">{enrollError}</Alert>}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setEnrollStep('idle'); setEnrollError('') }}>Cancelar</Button>
                <Button size="sm" onClick={handleEnrollFace}>Capturar y registrar</Button>
              </div>
            </div>
          )}
          {enrollStep === 'processing' && <div className="text-center py-4"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" /><p className="text-sm text-gray-600">Procesando...</p></div>}
          {enrollStep === 'done' && <Alert variant="success">✅ Rostro registrado correctamente.</Alert>}
        </CardContent>
      </Card>
    </div>
  )
}
