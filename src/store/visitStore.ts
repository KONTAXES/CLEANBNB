import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface SectionInspection {
  section_id: string
  section_name: string
  photos: string[]
  comment: string
  alerts: Array<{ type: string; description: string; quantity?: number }>
}

export interface SupplyEntry {
  item_id: string
  found_quantity: number
  added_from_warehouse: number
  will_leave: number
  expected_quantity: number
  difference: number
  comment: string
  warehouse_id?: string
}

interface VisitState {
  sessionId: string | null
  apartmentId: string | null
  initialInspections: SectionInspection[]
  finalInspections: SectionInspection[]
  supplyEntries: SupplyEntry[]
  setSessionId: (id: string) => void
  setApartmentId: (id: string) => void
  updateInitialSection: (section: SectionInspection) => void
  updateFinalSection: (section: SectionInspection) => void
  setSupplyEntries: (entries: SupplyEntry[]) => void
  reset: () => void
}

export const useVisitStore = create<VisitState>()(
  persist(
    (set) => ({
      sessionId: null, apartmentId: null,
      initialInspections: [], finalInspections: [], supplyEntries: [],
      setSessionId: (id) => set({ sessionId: id }),
      setApartmentId: (id) => set({ apartmentId: id }),
      updateInitialSection: (section) => set((state) => {
        const existing = state.initialInspections.findIndex(s => s.section_id === section.section_id)
        const updated = [...state.initialInspections]
        if (existing >= 0) updated[existing] = section; else updated.push(section)
        return { initialInspections: updated }
      }),
      updateFinalSection: (section) => set((state) => {
        const existing = state.finalInspections.findIndex(s => s.section_id === section.section_id)
        const updated = [...state.finalInspections]
        if (existing >= 0) updated[existing] = section; else updated.push(section)
        return { finalInspections: updated }
      }),
      setSupplyEntries: (entries) => set({ supplyEntries: entries }),
      reset: () => set({ sessionId: null, apartmentId: null, initialInspections: [], finalInspections: [], supplyEntries: [] }),
    }),
    { name: 'cleanbnb-visit', storage: createJSONStorage(() => (typeof window !== 'undefined' ? sessionStorage : localStorage)) }
  )
)
