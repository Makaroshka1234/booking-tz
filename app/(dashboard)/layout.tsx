import { ProtectedRoute } from "@/components/ProtectedRoute"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedRoute requireAuth>{children}</ProtectedRoute>
}
