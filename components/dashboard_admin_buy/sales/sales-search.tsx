"use client"

import { Dispatch, SetStateAction } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, XCircle } from "lucide-react"
import { motion } from "framer-motion"

interface SalesSearchProps {
	searchTerm: string
	setSearchTerm: Dispatch<SetStateAction<string>>
	onClearFilters: () => void
}

export function SalesSearch({ searchTerm, setSearchTerm, onClearFilters }: SalesSearchProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4 }}
		>
			<Card className="bg-white shadow-sm border border-[#e6f0fa]">
				<div className="p-6 space-y-6" dir="rtl">
					<div>
						<h2 className="text-lg font-IranYekanBold text-[#323232] mb-2">جستجوی خریدها</h2>
						<p className="text-sm text-[#767676] font-IranYekanRegular">
							برای یافتن سریع خریدها بر اساس نام مسافر، شماره تماس، شرکت، مبدا یا مقصد جستجو کنید.
						</p>
					</div>

					<div className="flex flex-col sm:flex-row gap-4">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] h-4 w-4" />
							<Input
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								placeholder="جستجوی نام مسافر، شماره تماس، شرکت، مبدا یا مقصد..."
								className="pr-4 pl-10 h-12 font-IranYekanMedium bg-[#f8fbff] border-[#d9e6f2] focus-visible:ring-[#0d5990] focus-visible:border-[#0d5990]"
								dir="rtl"
							/>
						</div>

						<Button
							variant="outline"
							onClick={() => {
								setSearchTerm("")
								onClearFilters()
							}}
							className="gap-2 h-12 px-6 bg-[#f8fbff] border-[#d9e6f2] text-[#0d5990] hover:bg-[#e9f2fc]"
						>
							<XCircle className="h-4 w-4" />
							حذف فیلترها
						</Button>
					</div>
				</div>
			</Card>
		</motion.div>
	)
}

