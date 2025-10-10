"use client"

import { Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"

interface TransactionSearchProps {
	searchTerm: string
	setSearchTerm: (term: string) => void
	typeFilter: string
	setTypeFilter: (type: string) => void
	onClearFilters: () => void
}

export function TransactionSearch({
	searchTerm,
	setSearchTerm,
	typeFilter,
	setTypeFilter,
	onClearFilters
}: TransactionSearchProps) {
	// Check if any filters are active
	const hasActiveFilters = searchTerm.trim() !== '' || typeFilter !== 'all'

	return (
		<motion.div
			dir="rtl"
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
		>
			<Card className="p-6 bg-white shadow-sm">
				<div className="space-y-6">
					<div className="text-right space-y-4">
						<motion.h1
							className="text-2xl font-IranYekanBold text-[#323232]"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.6, delay: 0.2 }}
						>
							تراکنش‌های مالی
						</motion.h1>
						<motion.p
							className="text-[#767676] text-sm font-IranYekanRegular"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.6, delay: 0.3 }}
						>
							مشاهده و جستجوی تراکنش‌های کیف پول
						</motion.p>
					</div>

					{/* Search and Filters */}
					<motion.div
						className="grid grid-cols-1 md:grid-cols-4 gap-4"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.4 }}
					>
						{/* Main Search */}
						<motion.div
							className="relative md:col-span-2"
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.5, delay: 0.5 }}
						>
							<Input
								type="text"
								placeholder="جستجو در شماره تراکنش، کد پیگیری..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10 pr-4 py-2 text-right border-[#ccd6e1] focus:border-[#0d5990] font-IranYekanRegular"
							/>
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#767676] h-4 w-4" />
						</motion.div>

						{/* Type Filter */}
						<motion.div
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.5, delay: 0.6 }}
						>
							<Select value={typeFilter} onValueChange={setTypeFilter}>
								<SelectTrigger className="text-right border-[#ccd6e1] focus:border-[#0d5990] [&>span]:text-right [&>span]:w-full font-IranYekanRegular">
									<SelectValue placeholder="نوع تراکنش" />
								</SelectTrigger>
								<SelectContent className="text-right font-IranYekanRegular" dir="rtl">
									<SelectItem value="all" className="text-right">همه</SelectItem>
									<SelectItem value="واریز" className="text-right">واریز</SelectItem>
									<SelectItem value="برداشت" className="text-right">برداشت</SelectItem>
									<SelectItem value="خرید" className="text-right">خرید</SelectItem>
								</SelectContent>
							</Select>
						</motion.div>

						{/* Clear Filters Button */}
						<motion.div
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.5, delay: 0.7 }}
						>
							<Button
								variant="outline"
								onClick={hasActiveFilters ? onClearFilters : undefined}
								disabled={!hasActiveFilters}
								className={`w-full border-[#ccd6e1] transition-all duration-200 font-IranYekanRegular ${hasActiveFilters
									? "hover:bg-[#f6f9ff] text-[#767676] hover:border-[#0d5990] cursor-pointer"
									: "text-[#ccd6e1] bg-gray-50 cursor-not-allowed opacity-60"
									}`}
							>
								<Filter className="h-4 w-4 ml-2" />
								حذف فیلتر
							</Button>
						</motion.div>
					</motion.div>
				</div>
			</Card>
		</motion.div>
	)
}

