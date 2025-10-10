"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Receipt, ArrowUpCircle, ArrowDownCircle } from "lucide-react"
import { motion } from "framer-motion"
import numberConvertor from "@/lib/numberConvertor"
import moment from "jalali-moment"

// Format date to Persian
const formatDate = (dateStr: string): string => {
	try {
		const date = moment(dateStr)
		return date.format('jYYYY/jMM/jDD - HH:mm')
	} catch (error) {
		return dateStr
	}
}

// Format amount with thousand separators
const formatAmount = (amount: number): string => {
	const toman = Math.floor(amount / 10)
	return numberConvertor(toman.toLocaleString('en-US'))
}

// Map transaction type to Persian
const mapTransactionType = (type: string): string => {
	const typeMap: Record<string, string> = {
		'TICKET_PURCHASE': 'خرید بلیط اتوبوس',
		'DEPOSIT': 'واریز',
		'WITHDRAWAL': 'برداشت',
		'واریز': 'واریز',
		'برداشت': 'برداشت',
		'خرید': 'خرید'
	}
	return typeMap[type] || type
}

// Map status to Persian
const mapStatus = (status: string): string => {
	const statusMap: Record<string, string> = {
		'COMPLETED': 'پرداخت موفق',
		'SUCCESS': 'پرداخت موفق',
		'PENDING': 'در انتظار',
		'FAILED': 'ناموفق',
		'موفق': 'پرداخت موفق',
		'در انتظار': 'در انتظار',
		'ناموفق': 'ناموفق'
	}
	return statusMap[status] || status
}

interface Transaction {
	id: number
	type: string
	amount: number
	date: string
	description: string
	status: string
	referenceCode?: string
}

interface TransactionListProps {
	transactions: Transaction[]
	searchTerm: string
	typeFilter: string
	isProfileReady: boolean
}

export function TransactionList({ transactions, searchTerm, typeFilter, isProfileReady }: TransactionListProps) {
	// Filter transactions based on search term and type filter
	const filteredTransactions = transactions.filter(transaction => {
		const matchesSearch = searchTerm === '' ||
			transaction.referenceCode?.includes(searchTerm) ||
			transaction.id.toString().includes(searchTerm)

		const matchesType = typeFilter === 'all' || transaction.type === typeFilter

		return matchesSearch && matchesType
	})

	const getTransactionIcon = (type: string) => {
		const mappedType = mapTransactionType(type)
		if (type === 'واریز' || type === 'DEPOSIT') {
			return <ArrowDownCircle className="h-5 w-5 text-green-600" />
		} else if (type === 'برداشت' || type === 'خرید' || type === 'TICKET_PURCHASE' || type === 'WITHDRAWAL') {
			return <ArrowUpCircle className="h-5 w-5 text-red-600" />
		}
		return <Receipt className="h-5 w-5 text-gray-600" />
	}

	const getTransactionColor = (type: string) => {
		if (type === 'واریز' || type === 'DEPOSIT') {
			return 'text-green-600'
		} else if (type === 'برداشت' || type === 'خرید' || type === 'TICKET_PURCHASE' || type === 'WITHDRAWAL') {
			return 'text-red-600'
		}
		return 'text-gray-600'
	}

	const getStatusBadgeColor = (status: string) => {
		if (status === 'COMPLETED' || status === 'SUCCESS' || status === 'موفق') {
			return 'bg-[#e1f5e7] text-green-700 border border-green-300'
		} else if (status === 'PENDING' || status === 'در انتظار') {
			return 'bg-[#fff8e1] text-yellow-700 border border-yellow-300'
		} else {
			return 'bg-[#ffe1e1] text-red-700 border border-red-300'
		}
	}

	return (
		<motion.div
			dir="rtl"
			initial={{ opacity: 0, y: 30 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.6 }}
		>
			<Card className="bg-white shadow-sm">
				<div className="p-6">
					<div className="mb-6">
						<motion.h2
							className="text-xl font-IranYekanBold text-[#323232] mb-4"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.6, delay: 0.1 }}
						>
							لیست تراکنش‌ها
						</motion.h2>
					</div>

					{/* Transactions Table */}
					<motion.div
						className="overflow-x-auto"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.3 }}
					>
						<div className="min-w-full">
							{/* Table Header */}
							<motion.div
								className="grid grid-cols-3 md:grid-cols-5 gap-4 p-4 bg-[#e6f0fa] rounded-t-lg text-sm font-IranYekanMedium text-[#323232]"
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: 0.4 }}
							>
								<div className="text-center">نوع</div>
								<div className="text-center">مبلغ</div>
								<div className="text-center hidden md:block">تاریخ</div>
								<div className="text-center hidden md:block">کد پیگیری</div>
								<div className="text-center">وضعیت</div>
							</motion.div>

							{/* Table Body */}
							<div className="space-y-1">
								{filteredTransactions.length > 0 ? (
									filteredTransactions.map((transaction, index) => (
										<motion.div
											key={transaction.id}
											className={`grid grid-cols-3 md:grid-cols-5 gap-4 p-4 text-sm font-IranYekanRegular ${index % 2 === 0 ? "bg-white" : "bg-[#f6f9ff]"
												} hover:bg-[#e8f2fc] transition-colors`}
											initial={{ opacity: 0, x: -20 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ duration: 0.4, delay: 0.5 + (index * 0.1) }}
										>
											<div className="flex items-center justify-center gap-2">
												{getTransactionIcon(transaction.type)}
												<span className={getTransactionColor(transaction.type)}>
													{mapTransactionType(transaction.type)}
												</span>
											</div>
											<div className={`text-center font-IranYekanBold ${getTransactionColor(transaction.type)}`}>
												{formatAmount(transaction.amount)} تومان
											</div>
											<div className="text-center text-[#767676] hidden md:block text-xs">
												{formatDate(transaction.date)}
											</div>
											<div className="text-center text-[#767676] hidden md:block font-mono text-xs">
												{transaction.referenceCode || '-'}
											</div>
											<div className="text-center">
												<Badge
													variant="secondary"
													className={`text-xs ${getStatusBadgeColor(transaction.status)}`}
												>
													{mapStatus(transaction.status)}
												</Badge>
											</div>
										</motion.div>
									))
								) : (
									<motion.div
										className="text-center py-8 text-[#767676]"
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.5, delay: 0.5 }}
									>
										<Receipt className="h-12 w-12 mx-auto mb-4 text-[#ccd6e1]" />
										<p className="text-lg font-IranYekanMedium mb-2">هیچ تراکنشی یافت نشد</p>
										<p className="text-sm font-IranYekanRegular">فیلترها را تغییر دهید</p>
									</motion.div>
								)}
							</div>
						</div>
					</motion.div>
				</div>
			</Card>
		</motion.div>
	)
}

