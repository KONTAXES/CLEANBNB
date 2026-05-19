'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/apartments', label: 'Apartamentos', icon: '🏠' },
  { href: '/admin/staff', label: 'Personal', icon: '👥' },
  { href: '/admin/inventory', label: 'Inventario', icon: '📦' },
  { href: '/admin/assignments', label: 'Asignaciones', icon: '📅' },
  { href: '/admin/reports', label: 'Reportes', icon: '📋' },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { clearProfile } = useAuthStore()
  const router = useRouter()

  const handleLogout = async () => {
    await createClient().auth.signOut()
    clearProfile()
    router.push('/login')
  }

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">C</div>
            <div><p className="font-bold text-gray-900 text-sm">CleanBnb</p><p className="text-xs text-gray-500">Administrador</p></div>
          </div>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-1">
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors', pathname.startsWith(item.href) ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50')}>
              <span>{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors">Cerrar sesión</button>
        </div>
      </aside>
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">C</div>
            <span className="font-bold text-gray-900 text-sm">CleanBnb Admin</span>
          </div>
        </div>
        <nav className="flex items-center gap-1 px-2 pb-2 overflow-x-auto">
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors', pathname.startsWith(item.href) ? 'bg-blue-50 text-blue-700' : 'text-gray-600')}>
              <span>{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  )
}
