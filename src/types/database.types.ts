export type UserRole = 'admin' | 'supervisor' | 'employee'
export type AssignmentStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type SessionStatus = 'clocked_in' | 'inspecting_initial' | 'managing_supplies' | 'inspecting_final' | 'clocked_out'
export type InspectionType = 'initial' | 'final'
export type AlertType = 'missing' | 'damaged' | 'other'
export type MovementType = 'found' | 'added_from_warehouse' | 'removed_consumed' | 'transferred_out' | 'transferred_in' | 'final_count'
export type PhotoType = 'rear_entrance' | 'front_selfie'

export interface ApartmentSection { id: string; name: string; type: 'bedroom' | 'bathroom' | 'kitchen' | 'living_room' | 'other' }
export interface ExpectedInventoryItem { item_id: string; quantity: number }
export interface InspectionAlert { type: AlertType; description: string; quantity?: number }

export interface Profile {
  id: string; display_name: string; phone: string; role: UserRole
  face_descriptor: number[] | null; face_photo_url: string | null
  is_active: boolean; created_at: string; updated_at: string
}

export interface Apartment {
  id: string; name: string; address: string; google_maps_url: string | null
  sections: ApartmentSection[]; expected_inventory: ExpectedInventoryItem[]
  is_active: boolean; created_by: string | null; created_at: string; updated_at: string
}

export interface Warehouse { id: string; name: string; address: string | null; is_default: boolean }

export interface SupplyItem {
  id: string; name: string; unit: string; category: string
  description: string | null; is_active: boolean; created_at: string
}

export interface Assignment {
  id: string; apartment_id: string; employee_id: string; supervisor_id: string | null
  scheduled_date: string; notes: string | null; status: AssignmentStatus
  created_by: string | null; created_at: string; updated_at: string
  apartment?: Apartment; employee?: Profile
}

export interface VisitSession {
  id: string; assignment_id: string; employee_id: string; apartment_id: string
  status: SessionStatus; clock_in_at: string | null; clock_in_gps: string | null
  clock_in_gps_accuracy: number | null; clock_out_at: string | null
  clock_out_gps: string | null; clock_out_gps_accuracy: number | null
  face_verified_clock_in: boolean; face_verified_clock_out: boolean
  face_match_score_in: number | null; face_match_score_out: number | null
  created_at: string; updated_at: string
  apartment?: Apartment; employee?: Profile; assignment?: Assignment
}

export interface InspectionReport {
  id: string; session_id: string; type: InspectionType
  section_id: string; section_name: string; photos: string[]
  comment: string | null; alerts: InspectionAlert[]
  submitted_at: string; employee_id: string
}

export interface InventoryMovement {
  id: string; session_id: string; apartment_id: string; item_id: string
  type: MovementType; quantity: number; expected_quantity: number | null
  difference: number; comment: string | null; transfer_to_apartment_id: string | null
  recorded_at: string; employee_id: string; item?: SupplyItem
}

export interface ApartmentStock {
  id: string; apartment_id: string; item_id: string; quantity: number
  last_session_id: string | null; last_updated: string; item?: SupplyItem
}

export interface WarehouseStock {
  id: string; warehouse_id: string; item_id: string; quantity: number
  last_updated: string; item?: SupplyItem; warehouse?: Warehouse
}

export interface ClockPhoto {
  id: string; session_id: string; type: PhotoType; storage_url: string
  gps: string | null; gps_accuracy: number | null; taken_at: string; phase: string
}
