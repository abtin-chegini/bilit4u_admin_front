"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { salesService, SaleRecord } from "@/services/salesService"
import { SalesSearch } from "./sales-search"
import { SalesList } from "./sales-list"

export function SalesMain() {
	const { session, loading: authLoading } = useAuth()
	const { toast } = useToast()
	const [searchTerm, setSearchTerm] = useState("")
	const [sales, setSales] = useState<SaleRecord[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [currentPage, setCurrentPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState(10)
	const [totalCount, setTotalCount] = useState(0)

	const token = session?.access_token

	const fetchSales = useCallback(
		async (page: number, pageSize: number) => {
			if (!token) {
				setIsLoading(false)
				return
			}

			try {
				setIsLoading(true)
				setError(null)
				const result = await salesService.getSales(token, page, pageSize)
				setSales(result.data)
				setTotalCount(result.totalCount)
				if (typeof result.pageIndex === "number" && result.pageIndex !== page) {
					setCurrentPage(result.pageIndex)
				}
				if (typeof result.pageSize === "number" && result.pageSize !== pageSize) {
					setItemsPerPage(result.pageSize)
				}
			} catch (err: any) {
				console.error("Error fetching sales:", err)
				setError(err.message || "خطا در بارگذاری خریدها")
				toast({
					title: "خطا",
					description: err.message || "خطا در بارگذاری خریدها",
					variant: "destructive",
				})
			} finally {
				setIsLoading(false)
			}
		},
		[token, toast]
	)

	useEffect(() => {
		if (!token) {
			if (!authLoading) {
				setIsLoading(false)
				setError("لطفاً ابتدا وارد حساب کاربری خود شوید")
			}
			return
		}

		fetchSales(currentPage, itemsPerPage)
	}, [token, authLoading, currentPage, itemsPerPage, fetchSales])

	const handleClearFilters = () => {
		setSearchTerm("")
	}

	const handlePageChange = (page: number) => {
		setCurrentPage(page)
	}

	const handleItemsPerPageChange = (pageSize: number) => {
		setCurrentPage(1)
		setItemsPerPage(pageSize)
	}

	return (
		<div className="min-h-screen bg-[#FAFAFA] p-6">
			<motion.div
				className="max-w-7xl mx-auto space-y-6"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.5 }}
			>
				<SalesSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} onClearFilters={handleClearFilters} />

				{authLoading || isLoading ? (
					<div className="flex justify-center items-center py-12">
						<div className="text-center">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D5990] mx-auto mb-4"></div>
							<p className="text-gray-600 font-IranYekanRegular">در حال بارگذاری خریدها...</p>
						</div>
					</div>
				) : error ? (
					<div className="flex justify-center items-center py-12">
						<div className="text-center space-y-4">
							<p className="text-red-600 font-IranYekanRegular">{error}</p>
							{session && (
								<button
									onClick={fetchSales}
									className="bg-[#0D5990] text-white px-4 py-2 rounded-lg font-IranYekanMedium hover:bg-[#0b4d7a] transition-colors"
								>
									تلاش مجدد
								</button>
							)}
						</div>
					</div>
				) : (
					<SalesList
						sales={sales}
						searchTerm={searchTerm}
						currentPage={currentPage}
						itemsPerPage={itemsPerPage}
						totalCount={totalCount}
						onPageChange={handlePageChange}
						onItemsPerPageChange={handleItemsPerPageChange}
					/>
				)}
			</motion.div>
		</div>
	)
}

