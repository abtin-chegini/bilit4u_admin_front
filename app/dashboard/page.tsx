"use client"

import SearchComponent from "@/components/dashboard_admin_buy/plp/new/PLP/Search"

export default function DashboardPage() {
	return (
		<div className="p-6">
			<SearchComponent
				SourceCity="11320000"
				DestinationCity="21310000"
				TravelDate="14040710"
			/>
		</div>
	)
}
