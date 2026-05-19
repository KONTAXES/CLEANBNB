export default function SupervisorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold">CleanBnb</span>
          <span className="bg-blue-500 text-xs px-2 py-0.5 rounded-full">Supervisor</span>
        </div>
      </div>
      <main className="max-w-7xl mx-auto p-4">{children}</main>
    </div>
  )
}
