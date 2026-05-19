import { EmployeeBottomNav } from '@/components/layout/EmployeeBottomNav'

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-lg mx-auto">
        {children}
      </div>
      <EmployeeBottomNav />
    </div>
  )
}
