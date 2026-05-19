import { createClient } from './supabase/client'

export type StorageBucket = 'clock-photos' | 'inspection-photos' | 'face-enrollment'

export async function uploadBase64Photo(bucket: StorageBucket, path: string, base64: string): Promise<string> {
  const supabase = createClient()
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
  const { error } = await supabase.storage.from(bucket).upload(path, buffer, { contentType: 'image/jpeg', upsert: false })
  if (error) throw error
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

export function getPhotoPath(sessionId: string, type: string, timestamp?: number): string {
  return `${sessionId}/${type}_${timestamp ?? Date.now()}.jpg`
}
