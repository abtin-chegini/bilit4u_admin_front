"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { UserSearch } from "./user-search"
import { UserList } from "./user-list"
import { motion } from "framer-motion"
import { userService, ApiUser } from "@/services/userService"
import { useToast } from "@/hooks/use-toast"

export function UserMain() {
	const { session, loading: authLoading } = useAuth()
	const { toast } = useToast()
	const [searchTerm, setSearchTerm] = useState("")
	const [statusFilter, setStatusFilter] = useState("all")
	const [users, setUsers] = useState<ApiUser[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const handleClearFilters = () => {
		setSearchTerm("")
		setStatusFilter("all")
	}

	// Fetch users from API
	const fetchUsers = async () => {
		if (!session?.access_token) {
			setIsLoading(false)
			return
		}

		try {
			setIsLoading(true)
			setError(null)
			const apiUsers = await userService.getUsers(session.access_token)
			setUsers(apiUsers)
		} catch (err: any) {
			console.error('Error fetching users:', err)
			setError(err.message || 'خطا در بارگذاری کاربران')
			toast({
				title: "خطا",
				description: err.message || 'خطا در بارگذاری کاربران',
				variant: "destructive",
			})
		} finally {
			setIsLoading(false)
		}
	}

	// Fetch users on component mount and session change
	useEffect(() => {
		if (session) {
			fetchUsers()
		} else if (!session && !authLoading) {
			setIsLoading(false)
			setError('لطفاً ابتدا وارد حساب کاربری خود شوید')
		}
	}, [session, authLoading])

	const handleViewUser = (userId: number) => {
		// Navigation is handled in UserList component
	}

	return (
		<div className="min-h-screen bg-[#FAFAFA] p-6">
			<motion.div
				className="max-w-7xl mx-auto space-y-6"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.5 }}
			>
				{/* Search Component */}
				<UserSearch
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
								در حال بارگذاری کاربران...
							</p>
						</div>
					</div>
				) : error ? (
					<div className="flex justify-center items-center py-12">
						<div className="text-center">
							<p className="text-red-600 font-IranYekanRegular mb-4">{error}</p>
							{session && (
								<button
									onClick={fetchUsers}
									className="bg-[#0D5990] text-white px-4 py-2 rounded-lg font-IranYekanMedium hover:bg-[#0b4d7a] transition-colors"
								>
									تلاش مجدد
								</button>
							)}
						</div>
					</div>
				) : (
					<UserList
						users={users}
						searchTerm={searchTerm}
						statusFilter={statusFilter}
						onViewUser={handleViewUser}
					/>
				)}
			</motion.div>
		</div>
	)
}

