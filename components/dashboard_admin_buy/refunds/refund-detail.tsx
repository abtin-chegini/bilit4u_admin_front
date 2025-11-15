"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileText, Phone, Calendar, MapPin, Building, CreditCard, User, CheckCircle, XCircle, ExternalLink } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { RefundedRecord } from "@/services/refundService"
import moment from "jalali-moment"
import numberConvertor from "@/lib/numberConvertor"

interface RefundDetailProps {
	refund: RefundedRecord
}

// Convert ISO date to Persian date
const formatDate = (dateStr: string | null | undefined): string => {
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

// Convert Persian date string to display format
const toPersianDigits = (input: string | number | undefined | null): string => {
	if (input === undefined || input === null) return "-"
	return String(input).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(digit, 10)] || digit)
}

// Format price
const formatPrice = (price: number | undefined): string => {
	if (price === undefined || price === null) return "-"
	return numberConvertor(price.toLocaleString()) + " تومان"
}

export function RefundDetail({ refund }: RefundDetailProps) {
	const router = useRouter()

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
						onClick={() => router.push("/dashboard/refunds")}
						className="mb-4 text-[#0d5990] hover:bg-[#e6f0fa]"
					>
						<ArrowLeft className="h-4 w-4 ml-2" />
						بازگشت به لیست استردادها
					</Button>
				</motion.div>

				{/* Refund Details Card */}
				<Card className="bg-white shadow-sm">
					<div className="p-6">
						<motion.div
							className="mb-6"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.1 }}
						>
							<h2 className="text-2xl font-IranYekanBold text-[#323232] mb-2">
								جزئیات استرداد
							</h2>
							<p className="text-sm text-[#767676] font-IranYekanRegular">
								مشاهده اطلاعات کامل استرداد
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
										<FileText className="h-4 w-4" />
										توضیحات
									</label>
									<div className="p-3 bg-[#f6f9ff] rounded-lg text-[#323232] font-IranYekanRegular">
										{refund.Description || "-"}
									</div>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-IranYekanMedium text-[#767676] flex items-center gap-2">
										{refund.IsVerify ? (
											<CheckCircle className="h-4 w-4 text-green-600" />
										) : (
											<XCircle className="h-4 w-4 text-red-600" />
										)}
										وضعیت تایید
									</label>
									<div className="p-3">
										<Badge
											variant="secondary"
											className={`text-xs ${refund.IsVerify
												? 'bg-[#e1f0ff] text-[#0d5990] border border-[#b8d4f0]'
												: 'bg-[#f0f7ff] text-[#767676] border border-[#ccd6e1]'
												}`}
										>
											{refund.IsVerify ? "تایید شده" : "در انتظار تایید"}
										</Badge>
									</div>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-IranYekanMedium text-[#767676] flex items-center gap-2">
										<User className="h-4 w-4" />
										نام مسافر
									</label>
									<div className="p-3 bg-[#f6f9ff] rounded-lg text-[#323232] font-IranYekanRegular">
										{refund.Name || "-"}
									</div>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-IranYekanMedium text-[#767676] flex items-center gap-2">
										<Phone className="h-4 w-4" />
										شماره تماس
									</label>
									<div className="p-3 bg-[#f6f9ff] rounded-lg text-[#323232] font-IranYekanRegular">
										{toPersianDigits(refund.phoneNumber || refund.AddedPhone || "-")}
									</div>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-IranYekanMedium text-[#767676] flex items-center gap-2">
										<Building className="h-4 w-4" />
										نام شرکت
									</label>
									<div className="p-3 bg-[#f6f9ff] rounded-lg text-[#323232] font-IranYekanRegular">
										{refund.CompanyName || "-"}
									</div>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-IranYekanMedium text-[#767676] flex items-center gap-2">
										<FileText className="h-4 w-4" />
										وضعیت نهایی
									</label>
									<div className="p-3">
										<Badge
											variant="secondary"
											className="text-xs bg-[#e1f0ff] text-[#0d5990] border border-[#b8d4f0]"
										>
											{refund.LastStatus || "-"}
										</Badge>
									</div>
								</div>
							</motion.div>

							{/* Date Information */}
							<motion.div
								className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[#e6f0fa]"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: 0.3 }}
							>
								<div className="space-y-2">
									<label className="text-sm font-IranYekanMedium text-[#767676] flex items-center gap-2">
										<Calendar className="h-4 w-4" />
										تاریخ ایجاد
									</label>
									<div className="p-3 bg-[#f6f9ff] rounded-lg text-[#323232] font-IranYekanRegular">
										{formatDate(refund.CreationDate)}
									</div>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-IranYekanMedium text-[#767676] flex items-center gap-2">
										<Calendar className="h-4 w-4" />
										تاریخ حرکت
									</label>
									<div className="p-3 bg-[#f6f9ff] rounded-lg text-[#323232] font-IranYekanRegular">
										{toPersianDigits(refund.DepartureDate || "-")}
									</div>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-IranYekanMedium text-[#767676] flex items-center gap-2">
										<Calendar className="h-4 w-4" />
										تاریخ رسیدن
									</label>
									<div className="p-3 bg-[#f6f9ff] rounded-lg text-[#323232] font-IranYekanRegular">
										{toPersianDigits(refund.ArrivalDate || "-")}
									</div>
								</div>
							</motion.div>

							{/* Location Information */}
							<motion.div
								className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#e6f0fa]"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: 0.4 }}
							>
								<div className="space-y-2">
									<label className="text-sm font-IranYekanMedium text-[#767676] flex items-center gap-2">
										<MapPin className="h-4 w-4" />
										شهر مبدا
									</label>
									<div className="p-3 bg-[#f6f9ff] rounded-lg text-[#323232] font-IranYekanRegular">
										{refund.SourceCityName || "-"}
									</div>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-IranYekanMedium text-[#767676] flex items-center gap-2">
										<MapPin className="h-4 w-4" />
										شهر مقصد
									</label>
									<div className="p-3 bg-[#f6f9ff] rounded-lg text-[#323232] font-IranYekanRegular">
										{refund.DestinationCityName || "-"}
									</div>
								</div>
							</motion.div>

							{/* Financial Information */}
							<motion.div
								className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 border-t border-[#e6f0fa]"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: 0.5 }}
							>
								<div className="space-y-2">
									<label className="text-sm font-IranYekanMedium text-[#767676] flex items-center gap-2">
										<CreditCard className="h-4 w-4" />
										قیمت کل
									</label>
									<div className="p-3 bg-[#f6f9ff] rounded-lg text-[#323232] font-IranYekanRegular">
										{formatPrice(refund.Price)}
									</div>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-IranYekanMedium text-[#767676] flex items-center gap-2">
										<CreditCard className="h-4 w-4" />
										سهم شرکت
									</label>
									<div className="p-3 bg-[#f6f9ff] rounded-lg text-[#323232] font-IranYekanRegular">
										{formatPrice(refund.CompanyShare)}
									</div>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-IranYekanMedium text-[#767676] flex items-center gap-2">
										<CreditCard className="h-4 w-4" />
										سهم بلیط فور یو
									</label>
									<div className="p-3 bg-[#f6f9ff] rounded-lg text-[#323232] font-IranYekanRegular">
										{formatPrice(refund.Bilit4uShare)}
									</div>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-IranYekanMedium text-[#767676] flex items-center gap-2">
										<CreditCard className="h-4 w-4" />
										سهم سپند
									</label>
									<div className="p-3 bg-[#f6f9ff] rounded-lg text-[#323232] font-IranYekanRegular">
										{formatPrice(refund.SepandShare)}
									</div>
								</div>
							</motion.div>

							{/* Additional Information */}
							<motion.div
								className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#e6f0fa]"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: 0.6 }}
							>
								<div className="space-y-2">
									<label className="text-sm font-IranYekanMedium text-[#767676] flex items-center gap-2">
										<User className="h-4 w-4" />
										تعداد مسافران
									</label>
									<div className="p-3 bg-[#f6f9ff] rounded-lg text-[#323232] font-IranYekanRegular">
										{toPersianDigits(refund.passenger_count || 0)}
									</div>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-IranYekanMedium text-[#767676] flex items-center gap-2">
										<FileText className="h-4 w-4" />
										لینک فاکتور
									</label>
									<div className="p-3">
										{refund.FactorUrl ? (
											<a
												href={refund.FactorUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-center gap-2 text-[#0d5990] hover:text-[#0b4d7a] font-IranYekanRegular"
											>
												<ExternalLink className="h-4 w-4" />
												<span>مشاهده فاکتور</span>
											</a>
										) : (
											<span className="text-[#767676] font-IranYekanRegular">-</span>
										)}
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

