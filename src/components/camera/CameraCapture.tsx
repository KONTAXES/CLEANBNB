'use client'
import { useRef, useState, useCallback } from 'react'
import Webcam from 'react-webcam'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { uploadBase64Photo, getPhotoPath, type StorageBucket } from '@/lib/storage'

interface CameraCaptureProps {
  bucket: StorageBucket
  sessionId: string
  photoType: string
  onCapture: (url: string) => void
  label?: string
}

function checkBlur(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext('2d')!
  const { width, height } = canvas
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  let sum = 0, sumSq = 0, count = 0
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]
    sum += gray; sumSq += gray * gray; count++
  }
  const mean = sum / count
  return sumSq / count - mean * mean
}

export function CameraCapture({ bucket, sessionId, photoType, onCapture, label = 'Tomar foto' }: CameraCaptureProps) {
  const webcamRef = useRef<Webcam>(null)
  const [captured, setCaptured] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [blurWarning, setBlurWarning] = useState(false)

  const capture = useCallback(async () => {
    const screenshot = webcamRef.current?.getScreenshot()
    if (!screenshot) return
    const img = new Image()
    img.src = screenshot
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width; canvas.height = img.height
      canvas.getContext('2d')!.drawImage(img, 0, 0)
      setBlurWarning(checkBlur(canvas) < 100)
    }
    setCaptured(screenshot)
  }, [])

  const confirm = async () => {
    if (!captured) return
    setUploading(true); setError(null)
    try {
      const url = await uploadBase64Photo(bucket, getPhotoPath(sessionId, photoType), captured)
      onCapture(url)
    } catch { setError('Error subiendo foto. Intente de nuevo.') } finally { setUploading(false) }
  }

  if (captured) return (
    <div className="flex flex-col gap-3">
      <img src={captured} alt="Captura" className="rounded-xl w-full" />
      {blurWarning && <Alert variant="warning">La foto puede estar borrosa. Verifique que sea legible.</Alert>}
      {error && <Alert variant="destructive">{error}</Alert>}
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setCaptured(null)} className="flex-1">Retomar</Button>
        <Button onClick={confirm} loading={uploading} className="flex-1">Confirmar</Button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      <Webcam ref={webcamRef} screenshotFormat="image/jpeg" screenshotQuality={0.9} videoConstraints={{ facingMode: { ideal: 'environment' }, aspectRatio: 4/3 }} className="rounded-xl w-full" onUserMediaError={() => setError('No se pudo acceder a la cámara. Verifique los permisos.')} />
      {error && <Alert variant="destructive">{error}</Alert>}
      <Button onClick={capture} size="lg" className="w-full">{label}</Button>
    </div>
  )
}
