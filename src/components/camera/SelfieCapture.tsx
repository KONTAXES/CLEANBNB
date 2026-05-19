'use client'
import { useRef, forwardRef, useImperativeHandle } from 'react'
import Webcam from 'react-webcam'
import { uploadBase64Photo, getPhotoPath } from '@/lib/storage'
import { getFaceDescriptor, isFaceMatch } from '@/lib/face-recognition/detectFace'
import { createClient } from '@/lib/supabase/client'

interface SelfieCaptureRef {
  captureAndVerify: () => Promise<{ verified: boolean; score: number; photoUrl: string | null }>
}

export const SelfieCapture = forwardRef<SelfieCaptureRef, { sessionId: string; userId: string }>(
  ({ sessionId, userId }, ref) => {
    const webcamRef = useRef<Webcam>(null)

    useImperativeHandle(ref, () => ({
      async captureAndVerify() {
        const screenshot = webcamRef.current?.getScreenshot()
        if (!screenshot) return { verified: false, score: 0, photoUrl: null }
        let photoUrl: string | null = null
        try { photoUrl = await uploadBase64Photo('clock-photos', getPhotoPath(sessionId, 'front_selfie'), screenshot) } catch {}
        try {
          const img = document.createElement('img')
          img.src = screenshot
          await new Promise(r => { img.onload = r })
          const canvas = document.createElement('canvas')
          canvas.width = img.width; canvas.height = img.height
          canvas.getContext('2d')!.drawImage(img, 0, 0)
          const descriptor = await getFaceDescriptor(canvas as any)
          if (!descriptor) return { verified: false, score: 0, photoUrl }
          const { data: profile } = await createClient().from('profiles').select('face_descriptor').eq('id', userId).single()
          if (!profile?.face_descriptor) return { verified: true, score: 1, photoUrl }
          const match = isFaceMatch(Array.from(descriptor), profile.face_descriptor)
          const dist = Math.sqrt(Array.from(descriptor).reduce((s, v, i) => s + Math.pow(v - profile.face_descriptor![i], 2), 0))
          return { verified: match, score: 1 - dist, photoUrl }
        } catch { return { verified: false, score: 0, photoUrl } }
      }
    }))

    return (
      <div className="hidden" aria-hidden="true">
        <Webcam ref={webcamRef} screenshotFormat="image/jpeg" screenshotQuality={0.8} videoConstraints={{ facingMode: 'user' }} />
      </div>
    )
  }
)
SelfieCapture.displayName = 'SelfieCapture'
