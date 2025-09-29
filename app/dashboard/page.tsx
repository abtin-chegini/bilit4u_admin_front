import DashboardLayout from "@/components/dashboard_main/dashboard-layout"
import ProtectedRoute from "@/components/ProtectedRoute"

export default function DashboardPage() {
	return (
		<ProtectedRoute>
			<DashboardLayout />
		</ProtectedRoute>
	)
}
