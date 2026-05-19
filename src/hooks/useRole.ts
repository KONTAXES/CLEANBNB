'use client'
import { useAuthStore } from '@/store/authStore'

export function useRole() {
  const profile = useAuthStore(s => s.profile)
  const role = profile?.role ?? 'employee'
  return {
    role,
    isAdmin: role === 'admin',
    isSupervisor: role === 'supervisor',
    isEmployee: role === 'employee',
    canEdit: role === 'admin',
    canDelete: role === 'admin',
  }
}
