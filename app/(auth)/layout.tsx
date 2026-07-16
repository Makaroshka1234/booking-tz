import { ProtectedRoute } from "@/components/providers/ProtectedRoute"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute requireAuth={false}>
      <div className="h-screen flex items-center justify-center bg-white p-4">
        <div className="w-full max-w-md max-h-screen overflow-y-auto">{children}</div>
      </div>
    </ProtectedRoute>
  )
}
