'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface AlertEntry { type: 'missing' | 'damaged' | 'other'; description: string; quantity?: number }

export function AlertButton({ alerts, onChange }: { alerts: AlertEntry[]; onChange: (alerts: AlertEntry[]) => void }) {
  const [showForm, setShowForm] = useState(false)
  const [type, setType] = useState<AlertEntry['type']>('missing')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('')

  const addAlert = () => {
    if (!description.trim()) return
    onChange([...alerts, { type, description, quantity: quantity ? Number(quantity) : undefined }])
    setDescription(''); setQuantity(''); setShowForm(false)
  }

  return (
    <div className="space-y-2">
      {alerts.map((a, i) => (
        <div key={i} className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <div>
            <span className={`text-xs font-medium ${a.type === 'missing' ? 'text-orange-700' : a.type === 'damaged' ? 'text-red-700' : 'text-gray-700'}`}>
              {a.type === 'missing' ? '⚠️ Faltante' : a.type === 'damaged' ? '🔴 Dañado' : '❓ Otro'}
            </span>
            <p className="text-xs text-gray-700">{a.description}{a.quantity ? ` (${a.quantity})` : ''}</p>
          </div>
          <button onClick={() => onChange(alerts.filter((_, idx) => idx !== i))} className="text-red-400 text-sm ml-2">✕</button>
        </div>
      ))}
      {showForm ? (
        <div className="border border-red-200 rounded-xl p-3 space-y-2 bg-red-50">
          <select value={type} onChange={e => setType(e.target.value as AlertEntry['type'])} className="w-full text-sm border border-gray-200 rounded-lg p-2">
            <option value="missing">⚠️ Faltante</option>
            <option value="damaged">🔴 Dañado</option>
            <option value="other">❓ Otro</option>
          </select>
          <input placeholder="Descripción" value={description} onChange={e => setDescription(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg p-2" />
          <input placeholder="Cantidad (opcional)" type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg p-2" />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)} className="flex-1">Cancelar</Button>
            <Button size="sm" onClick={addAlert} className="flex-1">Agregar alerta</Button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} className="w-full border-2 border-dashed border-red-300 text-red-500 text-sm rounded-xl py-2 hover:bg-red-50 transition-colors">
          + Agregar alerta (faltante/dañado)
        </button>
      )}
    </div>
  )
}
