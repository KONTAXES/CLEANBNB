import { loadFaceModels } from './loadModels'

export async function getFaceDescriptor(videoOrCanvas: HTMLVideoElement | HTMLCanvasElement): Promise<Float32Array | null> {
  await loadFaceModels()
  const faceapi = await import('@vladmandic/face-api')
  const detection = await faceapi
    .detectSingleFace(videoOrCanvas as HTMLVideoElement, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks(true)
    .withFaceDescriptor()
  return detection?.descriptor ?? null
}

export function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0))
}

export function isFaceMatch(descriptor1: number[], descriptor2: number[], threshold = 0.6): boolean {
  return euclideanDistance(descriptor1, descriptor2) < threshold
}
