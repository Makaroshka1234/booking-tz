import { ProtectedRoute } from "@/components/ProtectedRoute"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 to-slate-800 px-4">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </ProtectedRoute>
  )
}
