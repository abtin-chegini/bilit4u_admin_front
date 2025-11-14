"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, User, Mail, Phone, Building, CreditCard, Calendar, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { ApiUser, userService } from "@/services/userService"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import moment from "jalali-moment"
import numberConvertor from "@/lib/numberConvertor"

interface UserDetailProps {
	user: ApiUser
	onRoleChange?: () => void
}

// Available roles - these should ideally come from an API, but using common roles for now
const ROLES = [
	{ id: 1, name: "SuperAdmin" },
	{ id: 2, name: "Admin" },
	{ id: 3, name: "Manager" },
	{ id: 4, name: "User" },
	{ id: 5, name: "Regular User" },
]

const formatDate = (dateStr: string | null): string => {
	if (!dateStr) return "-"
	try {
		const date = moment(dateStr)
		if (!date.isValid()) {
			return dateStr
		}
		return numberConvertor(date.format("jYYYY/jMM/jDD HH:mm"))
	} catch (error) {
		return dateStr
	}
}

export function UserDetail({ user, onRoleChange }: UserDetailProps) {
	const router = useRouter()
	const { toast } = useToast()
	const { session } = useAuth()
	const [selectedRoleId, setSelectedRoleId] = useState<number>(user.roleId)
	const [isUpdating, setIsUpdating] = useState(false)

	const handleRoleChange = async (newRoleId: number) => {
		if (!session?.access_token) {
			toast({
				title: "خطا",
				description: "لطفاً ابتدا وارد حساب کاربری خود شوید",
				variant: "destructive",
			})
			return
		}

		if (newRoleId === user.roleId) {
			return // No change
		}

		try {
			setIsUpdating(true)
			await userService.setUserRole(session.access_token, user.id, newRoleId)
			setSelectedRoleId(newRoleId)
			toast({
				title: "موفق",
				description: "نقش کاربر با موفقیت تغییر کرد",
				variant: "default",
			})
			if (onRoleChange) {
				onRoleChange()
			}
		} catch (error: any) {
			console.error("Error updating user role:", error)
			toast({
				title: "خطا",
				description: error.message || "خطا در تغییر نقش کاربر",
				variant: "destructive",
			})
			setSelectedRoleId(user.roleId) // Revert on error
		} finally {
			setIsUpdating(false)
		}
	}

	return (
		<div className="min-h-screen bg-[#FAFAFA] p-6" dir="rtl">
			<motion.div
				className="max-w-4xl mx-auto space-y-6"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.5 }}
			>
				{/* Back Button */}
				<motion.div
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.5 }}
				>
					<Button
						variant="ghost"
						onClick={() => router.push("/dashboard/users")}
						className="mb-4 text-[#0d5990] hover:bg-[#e6f0fa]"
					>
						<ArrowLeft className="h-4 w-4 ml-2" />
						بازگشت به لیست کاربران
					</Button>
				</motion.div>

				{/* User Details Card */}
				<Card className="bg-white shadow-sm">
					<div className="p-6">
						<motion.div
							className="mb-6"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.1 }}
						>
							<h2 className="text-2xl font-IranYekanBold text-[#323232] mb-2">
								جزئیات کاربر
							</h2>
							<p className="text-sm text-[#767676] font-IranYekanRegular">
								مشاهده و مدیریت اطلاعات کاربر
							</p>
						</motion.div>

						<div className="space-y-6">
							{/* Basic Information */}
							<motion.div
								className="grid grid-cols-1 md:grid-cols-2 gap-6"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: 0.2 }}
							>
								<div className="space-y-2">
									<label className="text-sm font-IranYekanMedium text-[#767676] flex items-center gap-2">
										<User className="h-4 w-4" />
										نام
									</label>
									<div className="p-3 bg-[#f6f9ff] rounded-lg text-[#323232] font-IranYekanRegular">
										{user.name || "-"}
									</div>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-IranYekanMedium text-[#767676] flex items-center gap-2">
										<Mail className="h-4 w-4" />
										ایمیل
									</label>
									<div className="p-3 bg-[#f6f9ff] rounded-lg text-[#323232] font-IranYekanRegular">
										{user.email || "-"}
									</div>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-IranYekanMedium text-[#767676] flex items-center gap-2">
										<Phone className="h-4 w-4" />
										شماره تماس
									</label>
									<div className="p-3 bg-[#f6f9ff] rounded-lg text-[#323232] font-IranYekanRegular">
										{numberConvertor(user.phoneNumber || "-")}
									</div>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-IranYekanMedium text-[#767676] flex items-center gap-2">
										<Building className="h-4 w-4" />
										کد پرسنلی
									</label>
									<div className="p-3 bg-[#f6f9ff] rounded-lg text-[#323232] font-IranYekanRegular">
										{user.employeeId || "-"}
									</div>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-IranYekanMedium text-[#767676] flex items-center gap-2">
										<Building className="h-4 w-4" />
										دپارتمان
									</label>
									<div className="p-3 bg-[#f6f9ff] rounded-lg text-[#323232] font-IranYekanRegular">
										{user.department || "-"}
									</div>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-IranYekanMedium text-[#767676] flex items-center gap-2">
										{user.isActive ? (
											<CheckCircle className="h-4 w-4 text-green-600" />
										) : (
											<XCircle className="h-4 w-4 text-red-600" />
										)}
										وضعیت
									</label>
									<div className="p-3">
										<Badge
											variant="secondary"
											className={`text-xs ${user.isActive
												? 'bg-[#e1f0ff] text-[#0d5990] border border-[#b8d4f0]'
												: 'bg-[#f0f7ff] text-[#767676] border border-[#ccd6e1]'
												}`}
										>
											{user.isActive ? "فعال" : "غیرفعال"}
										</Badge>
									</div>
								</div>
							</motion.div>

							{/* Role Selection */}
							<motion.div
								className="space-y-2"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: 0.3 }}
							>
								<label className="text-sm font-IranYekanMedium text-[#767676] flex items-center gap-2">
									<User className="h-4 w-4" />
									نقش کاربر
								</label>
								<Select
									value={selectedRoleId.toString()}
									onValueChange={(value) => handleRoleChange(parseInt(value))}
									disabled={isUpdating}
								>
									<SelectTrigger className="text-right border-[#ccd6e1] focus:border-[#0d5990] font-IranYekanRegular">
										<SelectValue placeholder="انتخاب نقش" />
									</SelectTrigger>
									<SelectContent className="text-right font-IranYekanRegular" dir="rtl">
										{ROLES.map((role) => (
											<SelectItem
												key={role.id}
												value={role.id.toString()}
												className="text-right"
											>
												{role.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{isUpdating && (
									<div className="flex items-center gap-2 text-sm text-[#767676]">
										<Loader2 className="h-4 w-4 animate-spin" />
										<span className="font-IranYekanRegular">در حال به‌روزرسانی...</span>
									</div>
								)}
							</motion.div>

							{/* Financial Information */}
							<motion.div
								className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#e6f0fa]"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: 0.4 }}
							>
								<div className="space-y-2">
									<label className="text-sm font-IranYekanMedium text-[#767676] flex items-center gap-2">
										<CreditCard className="h-4 w-4" />
										سقف اعتبار
									</label>
									<div className="p-3 bg-[#f6f9ff] rounded-lg text-[#323232] font-IranYekanRegular">
										{numberConvertor(user.creditLimit.toLocaleString())} تومان
									</div>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-IranYekanMedium text-[#767676] flex items-center gap-2">
										<CreditCard className="h-4 w-4" />
										موجودی فعلی
									</label>
									<div className="p-3 bg-[#f6f9ff] rounded-lg text-[#323232] font-IranYekanRegular">
										{numberConvertor(user.currentBalance.toLocaleString())} تومان
									</div>
								</div>
							</motion.div>

							{/* Date Information */}
							<motion.div
								className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[#e6f0fa]"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: 0.5 }}
							>
								<div className="space-y-2">
									<label className="text-sm font-IranYekanMedium text-[#767676] flex items-center gap-2">
										<Calendar className="h-4 w-4" />
										تاریخ ایجاد
									</label>
									<div className="p-3 bg-[#f6f9ff] rounded-lg text-[#323232] font-IranYekanRegular">
										{formatDate(user.createdAt)}
									</div>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-IranYekanMedium text-[#767676] flex items-center gap-2">
										<Calendar className="h-4 w-4" />
										آخرین به‌روزرسانی
									</label>
									<div className="p-3 bg-[#f6f9ff] rounded-lg text-[#323232] font-IranYekanRegular">
										{formatDate(user.updatedAt)}
									</div>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-IranYekanMedium text-[#767676] flex items-center gap-2">
										<Calendar className="h-4 w-4" />
										آخرین ورود
									</label>
									<div className="p-3 bg-[#f6f9ff] rounded-lg text-[#323232] font-IranYekanRegular">
										{formatDate(user.lastLoginAt)}
									</div>
								</div>
							</motion.div>
						</div>
					</div>
				</Card>
			</motion.div>
		</div>
	)
}

