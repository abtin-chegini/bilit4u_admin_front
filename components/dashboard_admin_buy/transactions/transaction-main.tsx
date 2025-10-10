"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { TransactionSearch } from "./transaction-search"
import { TransactionList } from "./transaction-list"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { useUserStore } from "@/store/UserStore"
import { transactionService } from "@/services/transactionService"

interface Transaction {
	id: number
	type: string
	amount: number
	date: string
	description: string
	status: string
	referenceCode?: string
}

export function TransactionMain() {
	const { session, loading: authLoading } = useAuth()
	const { user: userProfile } = useUserStore()
	const { toast } = useToast()
	const [searchTerm, setSearchTerm] = useState("")
	const [typeFilter, setTypeFilter] = useState("all")
	const [transactions, setTransactions] = useState<Transaction[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Extract userID from the profile data stored by AuthContext
	const userID = userProfile?.profileData?.userID || userProfile?.profileData?.userId || null

	// Check if profile is ready for transaction operations
	const isProfileReady = Boolean(userID && typeof userID === 'number' && userID > 0)

	// Debug log to track profile loading
	useEffect(() => {
		if (userProfile) {
			console.log('👤 [TransactionMain] User profile loaded:', userProfile)
			console.log('👤 [TransactionMain] Extracted userID:', userID, 'Type:', typeof userID)
			console.log('👤 [TransactionMain] IsProfileReady:', isProfileReady)
		}
	}, [userProfile, userID, isProfileReady])

	const handleClearFilters = () => {
		setSearchTerm("")
		setTypeFilter("all")
	}

	// Fetch transactions from API
	const fetchTransactions = async () => {
		if (!session?.access_token) {
			setIsLoading(false)
			return
		}

		try {
			setIsLoading(true)
			setError(null)

			const apiTransactions = await transactionService.getTransactions(session.access_token)

			// Transform API response to match local Transaction interface
			const transformedTransactions: Transaction[] = apiTransactions.map((transaction: any, index: number) => ({
				id: transaction.id || (index + 1),
				type: transaction.type || transaction.transactionType || 'نامشخص',
				amount: transaction.amount || 0,
				date: transaction.date || transaction.createdAt || new Date().toISOString(),
				description: transaction.description || transaction.desc || '',
				status: transaction.status || 'موفق',
				referenceCode: transaction.orderRefNum || transaction.referenceCode || transaction.refCode || ''
			}))

			setTransactions(transformedTransactions)
		} catch (err: any) {
			console.error('❌ [TransactionMain] Error fetching transactions:', err)
			setError(err.message || 'خطا در بارگذاری تراکنش‌ها')
			toast({
				title: "خطا",
				description: err.message || 'خطا در بارگذاری تراکنش‌ها',
				variant: "destructive",
			})
		} finally {
			setIsLoading(false)
		}
	}

	// Fetch transactions on component mount and session change
	useEffect(() => {
		if (session) {
			fetchTransactions()
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
				<TransactionSearch
					searchTerm={searchTerm}
					setSearchTerm={setSearchTerm}
					typeFilter={typeFilter}
					setTypeFilter={setTypeFilter}
					onClearFilters={handleClearFilters}
				/>

				{/* List Component */}
				{authLoading || isLoading ? (
					<div className="flex justify-center items-center py-12">
						<div className="text-center">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D5990] mx-auto mb-4"></div>
							<p className="text-gray-600 font-IranYekanRegular">
								در حال بارگذاری تراکنش‌ها...
							</p>
						</div>
					</div>
				) : !isProfileReady && session ? (
					<div className="flex justify-center items-center py-12">
						<div className="text-center">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D5990] mx-auto mb-4"></div>
							<p className="text-gray-600 font-IranYekanRegular">در حال آماده‌سازی...</p>
						</div>
					</div>
				) : error ? (
					<div className="flex justify-center items-center py-12">
						<div className="text-center">
							<p className="text-red-600 font-IranYekanRegular mb-4">{error}</p>
							{session && (
								<button
									onClick={fetchTransactions}
									className="bg-[#0D5990] text-white px-4 py-2 rounded-lg font-IranYekanMedium hover:bg-[#0b4d7a] transition-colors"
								>
									تلاش مجدد
								</button>
							)}
						</div>
					</div>
				) : (
					<TransactionList
						transactions={transactions}
						searchTerm={searchTerm}
						typeFilter={typeFilter}
						isProfileReady={isProfileReady}
					/>
				)}
			</motion.div>
		</div>
	)
}

