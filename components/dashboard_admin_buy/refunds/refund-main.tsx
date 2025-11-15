"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { RefundSearch } from "./refund-search"
import { RefundList } from "./refund-list"
import { motion } from "framer-motion"
import { refundService, RefundedRecord } from "@/services/refundService"
import { useToast } from "@/hooks/use-toast"

export function RefundMain() {
	const { session, loading: authLoading } = useAuth()
	const { toast } = useToast()
	const [searchTerm, setSearchTerm] = useState("")
	const [refunds, setRefunds] = useState<RefundedRecord[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const handleClearFilters = () => {
		setSearchTerm("")
	}

	// Fetch refunds from API
	const fetchRefunds = async () => {
		if (!session?.access_token) {
			setIsLoading(false)
			return
		}

		try {
			setIsLoading(true)
			setError(null)
			const apiRefunds = await refundService.getRefunded(session.access_token)
			setRefunds(apiRefunds)
		} catch (err: any) {
			console.error('Error fetching refunds:', err)
			setError(err.message || 'خطا در بارگذاری استردادها')
			toast({
				title: "خطا",
				description: err.message || 'خطا در بارگذاری استردادها',
				variant: "destructive",
			})
		} finally {
			setIsLoading(false)
		}
	}

	// Fetch refunds on component mount and session change
	useEffect(() => {
		if (session) {
			fetchRefunds()
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
				<RefundSearch
					searchTerm={searchTerm}
					setSearchTerm={setSearchTerm}
					onClearFilters={handleClearFilters}
				/>

				{/* List Component */}
				{authLoading || isLoading ? (
					<div className="flex justify-center items-center py-12">
						<div className="text-center">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D5990] mx-auto mb-4"></div>
							<p className="text-gray-600 font-IranYekanRegular">
								در حال بارگذاری استردادها...
							</p>
						</div>
					</div>
				) : error ? (
					<div className="flex justify-center items-center py-12">
						<div className="text-center">
							<p className="text-red-600 font-IranYekanRegular mb-4">{error}</p>
							{session && (
								<button
									onClick={fetchRefunds}
									className="bg-[#0D5990] text-white px-4 py-2 rounded-lg font-IranYekanMedium hover:bg-[#0b4d7a] transition-colors"
								>
									تلاش مجدد
								</button>
							)}
						</div>
					</div>
				) : (
					<RefundList
						refunds={refunds}
						searchTerm={searchTerm}
					/>
				)}
			</motion.div>
		</div>
	)
}

