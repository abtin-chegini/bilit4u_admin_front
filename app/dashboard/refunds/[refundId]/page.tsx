"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { refundService, RefundedRecord } from "@/services/refundService"
import { RefundDetail } from "@/components/dashboard_admin_buy/refunds/refund-detail"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export default function RefundDetailPage() {
	const params = useParams()
	const router = useRouter()
	const { session, loading: authLoading } = useAuth()
	const { toast } = useToast()
	const [refund, setRefund] = useState<RefundedRecord | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const refundId = params?.refundId ? parseInt(params.refundId as string) : null

	useEffect(() => {
		const fetchRefundDetail = async () => {
			if (!session?.access_token || !refundId) {
				if (!authLoading) {
					setIsLoading(false)
					setError("لطفاً ابتدا وارد حساب کاربری خود شوید")
				}
				return
			}

			try {
				setIsLoading(true)
				setError(null)
				// Fetch all refunds and find the one matching the ID
				const refunds = await refundService.getRefunded(session.access_token)
				const foundRefund = refunds.find((r) => r.Id === refundId)
				
				if (foundRefund) {
					setRefund(foundRefund)
				} else {
					setError("استرداد یافت نشد")
					toast({
						title: "خطا",
						description: "استرداد یافت نشد",
						variant: "destructive",
					})
				}
			} catch (err: any) {
				console.error("Error fetching refund detail:", err)
				setError(err.message || "خطا در بارگذاری اطلاعات استرداد")
				toast({
					title: "خطا",
					description: err.message || "خطا در بارگذاری اطلاعات استرداد",
					variant: "destructive",
				})
			} finally {
				setIsLoading(false)
			}
		}

		fetchRefundDetail()
	}, [session, refundId, authLoading, toast])

	if (authLoading || isLoading) {
		return (
			<div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center" dir="rtl">
				<div className="text-center">
					<Loader2 className="h-12 w-12 animate-spin text-[#0D5990] mx-auto mb-4" />
					<p className="text-gray-600 font-IranYekanRegular">در حال بارگذاری اطلاعات استرداد...</p>
				</div>
			</div>
		)
	}

	if (error || !refund) {
		return (
			<div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center" dir="rtl">
				<div className="text-center">
					<p className="text-red-600 font-IranYekanRegular mb-4">{error || "استرداد یافت نشد"}</p>
					<button
						onClick={() => router.push("/dashboard/refunds")}
						className="bg-[#0D5990] text-white px-4 py-2 rounded-lg font-IranYekanMedium hover:bg-[#0b4d7a] transition-colors"
					>
						بازگشت به لیست استردادها
					</button>
				</div>
			</div>
		)
	}

	return <RefundDetail refund={refund} />
}

