"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { userService, ApiUser } from "@/services/userService"
import { UserDetail } from "@/components/dashboard_admin_buy/users/user-detail"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export default function UserDetailPage() {
	const params = useParams()
	const router = useRouter()
	const { session, loading: authLoading } = useAuth()
	const { toast } = useToast()
	const [user, setUser] = useState<ApiUser | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const userId = params?.userId ? parseInt(params.userId as string) : null

	useEffect(() => {
		const fetchUserDetail = async () => {
			if (!session?.access_token || !userId) {
				if (!authLoading) {
					setIsLoading(false)
					setError("لطفاً ابتدا وارد حساب کاربری خود شوید")
				}
				return
			}

			try {
				setIsLoading(true)
				setError(null)
				const userData = await userService.getUserDetail(session.access_token, userId)
				setUser(userData)
			} catch (err: any) {
				console.error("Error fetching user detail:", err)
				setError(err.message || "خطا در بارگذاری اطلاعات کاربر")
				toast({
					title: "خطا",
					description: err.message || "خطا در بارگذاری اطلاعات کاربر",
					variant: "destructive",
				})
			} finally {
				setIsLoading(false)
			}
		}

		fetchUserDetail()
	}, [session, userId, authLoading, toast])

	const handleRoleChange = async () => {
		// Refetch user data after role change
		if (session?.access_token && userId) {
			try {
				const userData = await userService.getUserDetail(session.access_token, userId)
				setUser(userData)
			} catch (err: any) {
				console.error("Error refetching user detail:", err)
			}
		}
	}

	if (authLoading || isLoading) {
		return (
			<div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center" dir="rtl">
				<div className="text-center">
					<Loader2 className="h-12 w-12 animate-spin text-[#0D5990] mx-auto mb-4" />
					<p className="text-gray-600 font-IranYekanRegular">در حال بارگذاری اطلاعات کاربر...</p>
				</div>
			</div>
		)
	}

	if (error || !user) {
		return (
			<div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center" dir="rtl">
				<div className="text-center">
					<p className="text-red-600 font-IranYekanRegular mb-4">{error || "کاربر یافت نشد"}</p>
					<button
						onClick={() => router.push("/dashboard/users")}
						className="bg-[#0D5990] text-white px-4 py-2 rounded-lg font-IranYekanMedium hover:bg-[#0b4d7a] transition-colors"
					>
						بازگشت به لیست کاربران
					</button>
				</div>
			</div>
		)
	}

	return <UserDetail user={user} onRoleChange={handleRoleChange} />
}

