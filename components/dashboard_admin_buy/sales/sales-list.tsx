"use client"

import { useMemo, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"
import ChevronLeft from "@/components/ui/icons_custom/ChevronLeft"
import ChevronRight from "@/components/ui/icons_custom/ChevronRight"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import numberConvertor from "@/lib/numberConvertor"
import { SaleRecord } from "@/services/salesService"
import { Calendar, MapPin, PhoneCall, User2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SalesListProps {
	sales: SaleRecord[]
	searchTerm: string
	currentPage: number
	itemsPerPage: number
	totalCount: number
	onPageChange: (page: number) => void
	onItemsPerPageChange: (itemsPerPage: number) => void
}

const toPersianDigits = (input: string | number | undefined | null): string => {
	if (input === undefined || input === null) return "-"
	return String(input).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(digit, 10)] || digit)
}

const normalizePersianDateString = (dateStr?: string): string => {
	if (!dateStr) return "-"
	return toPersianDigits(dateStr)
}

export function SalesList({
	sales,
	searchTerm,
	currentPage,
	itemsPerPage,
	totalCount,
	onPageChange,
	onItemsPerPageChange,
}: SalesListProps) {
	const filteredSales = useMemo(() => {
		if (!searchTerm) return sales
		const term = searchTerm.toLowerCase()
		return sales.filter((sale) => {
			return (
				sale.Name?.toLowerCase().includes(term) ||
				sale.phoneNumber?.toLowerCase().includes(term) ||
				sale.CompanyName?.toLowerCase().includes(term) ||
				sale.SourceCityName?.toLowerCase().includes(term) ||
				sale.DestinationCityName?.toLowerCase().includes(term) ||
				sale.Description?.toLowerCase().includes(term)
			)
		})
	}, [sales, searchTerm])

	const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage))

	useEffect(() => {
		if (currentPage > totalPages) {
			onPageChange(totalPages)
		}
	}, [currentPage, totalPages, onPageChange])

	const handlePageChange = (page: number) => {
		if (page >= 1 && page <= totalPages) {
			onPageChange(page)
			window.scrollTo({ top: 0, behavior: "smooth" })
		}
	}

	return (
		<motion.div dir="rtl" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
			<Card className="bg-white shadow-sm">
				<div className="p-6">
					<div className="mb-6">
						<motion.h2
							className="text-xl font-IranYekanBold text-[#323232] mb-2"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.6, delay: 0.1 }}
						>
							لیست خریدها
						</motion.h2>
						<p className="text-sm text-[#767676] font-IranYekanRegular">
							مشاهده جزئیات خرید مسافران به همراه تاریخ، مبدا، مقصد و وضعیت سفارش
						</p>
					</div>

					<motion.div
						className="overflow-x-auto"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.3 }}
					>
						<div className="inline-block min-w-full align-middle">
							<div className="overflow-hidden border border-[#d9e6f2] rounded-lg">
								<table className="min-w-full table-fixed text-sm font-IranYekanRegular text-[#323232]">
									<thead>
										<tr className="bg-[#e6f0fa] text-right font-IranYekanBold text-[#1e3856]">
											<th className="px-4 py-3 w-[18%]">
												<div className="flex items-center justify-end gap-2">
													<User2 className="h-4 w-4 text-[#0d4875]" />
													<span>مسافر</span>
												</div>
											</th>
											<th className="px-4 py-3 w-[18%]">
												<div className="flex items-center justify-end gap-2">
													<PhoneCall className="h-4 w-4 text-[#0d4875]" />
													<span>شماره تماس</span>
												</div>
											</th>
											<th className="px-4 py-3 w-[17%]">
												<div className="flex items-center justify-end gap-2">
													<Calendar className="h-4 w-4 text-[#0d4875]" />
													<span>تاریخ حرکت</span>
												</div>
											</th>
											<th className="px-4 py-3 w-[17%]">
												<div className="flex items-center justify-end gap-2">
													<Calendar className="h-4 w-4 text-[#0d4875]" />
													<span>تاریخ رسیدن</span>
												</div>
											</th>
											<th className="px-4 py-3 w-[15%]">
												<div className="flex items-center justify-end gap-2">
													<MapPin className="h-4 w-4 text-[#0d4875]" />
													<span>مبدا</span>
												</div>
											</th>
											<th className="px-4 py-3 w-[15%]">
												<div className="flex items-center justify-end gap-2">
													<MapPin className="h-4 w-4 text-[#0d4875]" />
													<span>مقصد</span>
												</div>
											</th>
										</tr>
									</thead>
									<tbody>
										{filteredSales.length > 0 ? (
											filteredSales.map((sale, index) => (
												<tr
													key={`${sale.Id}-${index}`}
													className={`${index % 2 === 0 ? "bg-white" : "bg-[#f6f9ff]"} hover:bg-[#e8f2fc] transition-colors`}
												>
													<td className="px-4 py-3 text-right font-IranYekanMedium text-[#0d4875]">
														{sale.Name || "-"}
													</td>
													<td className="px-4 py-3 text-right font-IranYekanMedium">
														{toPersianDigits(sale.phoneNumber || sale.AddedPhone || "-")}
													</td>
													<td className="px-4 py-3 text-right text-[#0f766e] font-IranYekanMedium">
														{normalizePersianDateString(sale.DepartureDate)}
													</td>
													<td className="px-4 py-3 text-right text-[#7f1d1d] font-IranYekanMedium">
														{normalizePersianDateString(sale.ArrivalDate)}
													</td>
													<td className="px-4 py-3 text-right">
														{sale.SourceCityName || "-"}
													</td>
													<td className="px-4 py-3 text-right">
														{sale.DestinationCityName || "-"}
													</td>
												</tr>
											))
										) : (
											<tr>
												<td colSpan={6} className="py-10 text-center text-[#767676]">
													<motion.div
														initial={{ opacity: 0, y: 20 }}
														animate={{ opacity: 1, y: 0 }}
														transition={{ duration: 0.5, delay: 0.5 }}
													>
														<p className="text-lg font-IranYekanMedium mb-2">خریدی یافت نشد</p>
														<p className="text-sm font-IranYekanRegular">عبارت جستجو یا فیلترها را تغییر دهید</p>
													</motion.div>
												</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
						</div>
					</motion.div>

					<div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
						<div className="flex items-center gap-2">
							<span className="text-sm font-IranYekanRegular text-[#767676]">نمایش در هر صفحه:</span>
							<Select
								value={itemsPerPage.toString()}
								onValueChange={(value) => {
									onItemsPerPageChange(parseInt(value))
									onPageChange(1)
								}}
							>
								<SelectTrigger className="w-[90px] h-9">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="5">۵</SelectItem>
									<SelectItem value="10">۱۰</SelectItem>
									<SelectItem value="20">۲۰</SelectItem>
									<SelectItem value="50">۵۰</SelectItem>
								</SelectContent>
							</Select>
							<span className="text-sm font-IranYekanRegular text-[#767676]">
								از {numberConvertor(totalCount.toString())} خرید
							</span>
						</div>

						{totalPages > 1 && (
							<div className="flex items-center justify-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => handlePageChange(currentPage - 1)}
									disabled={currentPage === 1}
									className="h-9 w-9 p-0 font-IranYekanRegular disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<ChevronRight className="h-4 w-4" />
								</Button>

								<div className="flex items-center gap-1">
									{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
										let pageNum: number

										if (totalPages <= 5) {
											pageNum = i + 1
										} else if (currentPage <= 3) {
											pageNum = i + 1
										} else if (currentPage >= totalPages - 2) {
											pageNum = totalPages - 4 + i
										} else {
											pageNum = currentPage - 2 + i
										}

										return (
											<Button
												key={pageNum}
												variant={currentPage === pageNum ? "default" : "outline"}
												size="sm"
												onClick={() => handlePageChange(pageNum)}
												className={`h-9 w-9 p-0 font-IranYekanRegular ${currentPage === pageNum ? "bg-[#0D5990] text-white hover:bg-[#0b4d7a]" : ""
													}`}
											>
												{numberConvertor(pageNum.toString())}
											</Button>
										)
									})}
								</div>

								<Button
									variant="outline"
									size="sm"
									onClick={() => handlePageChange(currentPage + 1)}
									disabled={currentPage === totalPages}
									className="h-9 w-9 p-0 font-IranYekanRegular disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<ChevronLeft className="h-4 w-4" />
								</Button>
							</div>
						)}
					</div>
				</div>
			</Card>
		</motion.div>
	)
}

