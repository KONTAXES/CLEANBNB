'use client'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { CameraCapture } from '@/components/camera/CameraCapture'
import { AlertButton } from './AlertButton'
import type { SectionInspection } from '@/store/visitStore'

const sectionIcons: Record<string, string> = { bedroom: '🛏️', bathroom: '🚿', kitchen: '🍳', living_room: '🛋️', other: '🏠' }

export function SectionCard({ section, sessionId, data, onChange }: {
  section: { id: string; name: string; type: string }
  sessionId: string
  data: SectionInspection
  onChange: (data: SectionInspection) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card className="overflow-hidden">
      <button className="w-full flex items-center justify-between p-4 text-left" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{sectionIcons[section.type] ?? '🏠'}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{section.name}</h3>
            <p className="text-xs text-gray-500">{data.photos.length} foto(s) · {data.alerts.length} alerta(s)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data.photos.length > 0 && <span className="text-green-500 text-sm">✓</span>}
          <span className="text-gray-400 text-sm">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Fotos <span className="text-red-500">*</span></p>
            {data.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {data.photos.map((url, i) => <img key={i} src={url} alt={`Foto ${i+1}`} className="w-full h-20 object-cover rounded-lg" />)}
              </div>
            )}
            <CameraCapture bucket="inspection-photos" sessionId={sessionId} photoType={`${section.id}_${data.photos.length}`} onCapture={url => onChange({ ...data, photos: [...data.photos, url] })} label={data.photos.length > 0 ? 'Agregar otra foto' : 'Tomar foto'} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Comentarios</p>
            <textarea value={data.comment} onChange={e => onChange({ ...data, comment: e.target.value })} placeholder="Observaciones de esta sección..." className="w-full text-sm border border-gray-200 rounded-xl p-3 resize-none h-20" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Alertas</p>
            <AlertButton alerts={data.alerts as any} onChange={alerts => onChange({ ...data, alerts })} />
          </div>
        </div>
      )}
    </Card>
  )
}
