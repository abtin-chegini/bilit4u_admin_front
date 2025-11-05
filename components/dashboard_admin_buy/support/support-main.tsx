"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { SupportSearch } from "./support-search"
import { SupportList } from "./support-list"
import { motion } from "framer-motion"
import { supportTicketService, SupportTicket } from "@/services/supportTicketService"
import { useToast } from "@/hooks/use-toast"

export function SupportMain() {
	const { session, loading: authLoading } = useAuth()
	const { toast } = useToast()
	const [searchTerm, setSearchTerm] = useState("")
	const [statusFilter, setStatusFilter] = useState("all")
	const [tickets, setTickets] = useState<SupportTicket[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const handleClearFilters = () => {
		setSearchTerm("")
		setStatusFilter("all")
	}

	const handleViewTicket = (ticket: SupportTicket) => {
		// This is handled by the SupportList component's dialog
		console.log('Viewing ticket:', ticket)
	}

	// Fetch support tickets from API
	const fetchSupportTickets = async () => {
		if (!session?.access_token) {
			setIsLoading(false)
			return
		}

		try {
			setIsLoading(true)
			setError(null)
			const apiTickets = await supportTicketService.getSupportTickets(
				session.access_token
			)

			setTickets(apiTickets)
		} catch (err: any) {
			console.error('Error fetching support tickets:', err)
			setError(err.message || 'خطا در بارگذاری درخواست‌های پشتیبانی')
			toast({
				title: "خطا",
				description: err.message || 'خطا در بارگذاری درخواست‌های پشتیبانی',
				variant: "destructive",
			})
		} finally {
			setIsLoading(false)
		}
	}

	// Fetch tickets on component mount and session change
	useEffect(() => {
		if (session) {
			fetchSupportTickets()
		} else if (!session && !authLoading) {
			setIsLoading(false)
			setError('لطفاً ابتدا وارد حساب کاربری خود شوید')
		}
	}, [session, authLoading])

	return (
		<div className="min-h-screen bg-[#FAFAFA] p-6">
			<motion.div
				className="max-w-7xl mx-auto space-y-6"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.5 }}
			>
				{/* Search Component */}
				<SupportSearch
					searchTerm={searchTerm}
					setSearchTerm={setSearchTerm}
					statusFilter={statusFilter}
					setStatusFilter={setStatusFilter}
					onClearFilters={handleClearFilters}
				/>

				{/* List Component */}
				{authLoading || isLoading ? (
					<div className="flex justify-center items-center py-12">
						<div className="text-center">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D5990] mx-auto mb-4"></div>
							<p className="text-gray-600 font-IranYekanRegular">
								در حال بارگذاری درخواست‌های پشتیبانی...
							</p>
						</div>
					</div>
				) : error ? (
					<div className="flex justify-center items-center py-12">
						<div className="text-center">
							<p className="text-red-600 font-IranYekanRegular mb-4">{error}</p>
							{session && (
								<button
									onClick={fetchSupportTickets}
									className="bg-[#0D5990] text-white px-4 py-2 rounded-lg font-IranYekanMedium hover:bg-[#0b4d7a] transition-colors"
								>
									تلاش مجدد
								</button>
							)}
						</div>
					</div>
				) : (
					<SupportList
						tickets={tickets}
						searchTerm={searchTerm}
						statusFilter={statusFilter}
						onViewTicket={handleViewTicket}
					/>
				)}
			</motion.div>
		</div>
	)
}

