"use client"

import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Eye, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { motion, HTMLMotionProps } from "framer-motion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Icon } from "@iconify/react/dist/iconify.js"
import moment from 'jalali-moment'

function toPersianDigits(num: number | string): string {
	return String(num).replace(/\d/g, (digit) =>
		['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'][parseInt(digit, 10)]
	);
}

const formatDate = (dateStr: string): string => {
	try {
		const date = moment(dateStr);
		if (!date.isValid()) {
			return dateStr;
		}
		return toPersianDigits(date.format('jYYYY/jMM/jDD'));
	} catch (error) {
		return dateStr;
	}
};

const formatDateTime = (dateStr: string): string => {
	try {
		const date = moment(dateStr);
		if (!date.isValid()) {
			return dateStr;
		}
		return toPersianDigits(date.format('jYYYY/jMM/jDD HH:mm'));
	} catch (error) {
		return dateStr;
	}
};

const getStatusBadge = (status: string) => {
	switch (status?.toUpperCase()) {
		case 'OPEN':
			return {
				label: 'باز',
				className: 'bg-green-100 text-green-800 border border-green-300',
				icon: CheckCircle
			};
		case 'IN_PROGRESS':
			return {
				label: 'در حال بررسی',
				className: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
				icon: AlertCircle
			};
		case 'CLOSED':
			return {
				label: 'بسته شده',
				className: 'bg-white text-gray-500 border border-gray-300 opacity-60',
				icon: XCircle
			};
		// Legacy support for old status values
		case 'PENDING':
			return {
				label: 'در انتظار',
				className: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
				icon: Clock
			};
		case 'RESOLVED':
			return {
				label: 'حل شده',
				className: 'bg-green-100 text-green-800 border border-green-300',
				icon: CheckCircle
			};
		default:
			return {
				label: status,
				className: 'bg-gray-100 text-gray-800 border border-gray-300',
				icon: MessageSquare
			};
	}
};

interface SupportTicket {
	id: number;
	refnum?: string;
	userId: number;
	username?: string;
	userName?: string;
	userEmail?: string;
	userPhone?: string;
	subject: string;
	message: string;
	status: 'open' | 'IN_PROGRESS' | 'closed' | 'pending' | 'in_progress' | 'resolved';
	priority?: 'low' | 'medium' | 'high';
	createdAt: string;
	updatedAt?: string;
	assignedTo?: string;
	response?: string;
}

interface SupportListProps {
	tickets: SupportTicket[]
	searchTerm: string
	statusFilter: string
	onViewTicket: (ticket: SupportTicket) => void
}

export function SupportList({ tickets, searchTerm, statusFilter, onViewTicket }: SupportListProps) {
	const router = useRouter()

	// Filter tickets based on search term and status filter
	const filteredTickets = tickets.filter(ticket => {
		const matchesSearch = searchTerm === '' ||
			ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
			ticket.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
			ticket.id.toString().includes(searchTerm) ||
			(ticket.refnum && ticket.refnum.toLowerCase().includes(searchTerm.toLowerCase())) ||
			(ticket.username && ticket.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
			(ticket.userName && ticket.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
			(ticket.userEmail && ticket.userEmail.toLowerCase().includes(searchTerm.toLowerCase()))

		const matchesStatus = statusFilter === 'all' ||
			ticket.status?.toUpperCase() === statusFilter.toUpperCase()

		return matchesSearch && matchesStatus
	})

	const handleViewTicket = (ticket: SupportTicket) => {
		const refnum = ticket.refnum || ticket.id.toString()
		router.push(`/dashboard/support/${refnum}`)
		onViewTicket(ticket)
	}

	return (
		<>
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
								لیست درخواست‌های پشتیبانی
							</motion.h2>
						</div>

						{/* Table */}
						<motion.div
							className="overflow-x-auto"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.3 }}
						>
							<div className="min-w-full">
								{/* Table Header */}
								<motion.div
									className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 bg-[#e6f0fa] rounded-t-lg text-sm font-IranYekanBold text-[#323232]"
									initial={{ opacity: 0, y: -10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.5, delay: 0.4 }}
								>
									<div className="text-center">شماره درخواست</div>
									<div className="text-center">موضوع</div>
									<div className="text-center hidden md:block">کاربر</div>
									<div className="text-center hidden md:block">وضعیت</div>
									<div className="text-center hidden md:block">تاریخ ایجاد</div>
									<div className="text-center">عملیات</div>
								</motion.div>

								{/* Table Body */}
								<div className="space-y-1">
									{filteredTickets.length > 0 ? (
										filteredTickets.map((ticket, index) => {
											const statusBadge = getStatusBadge(ticket.status)
											const StatusIcon = statusBadge.icon
											return (
												<motion.div
													key={ticket.id}
													className={`grid grid-cols-1 md:grid-cols-6 gap-4 p-4 text-sm font-IranYekanRegular ${index % 2 === 0 ? "bg-white" : "bg-[#f6f9ff]"
														} hover:bg-[#e8f2fc] transition-colors`}
													initial={{ opacity: 0, x: -20 }}
													animate={{ opacity: 1, x: 0 }}
													transition={{ duration: 0.4, delay: 0.5 + (index * 0.1) }}
												>
													<div className="text-center text-[#323232] font-IranYekanMedium">
														{ticket.refnum ? ticket.refnum : toPersianDigits(ticket.id.toString())}
													</div>
													<div className="text-center text-[#323232]">
														<div className="truncate max-w-[200px] mx-auto" title={ticket.subject}>
															{ticket.subject}
														</div>
													</div>
													<div className="text-center text-[#767676] hidden md:block">
														{ticket.username || ticket.userName || ticket.userEmail || '-'}
													</div>
													<div className="text-center hidden md:block">
														<Badge
															variant="secondary"
															className={`text-xs flex items-center justify-center gap-1 w-fit mx-auto ${statusBadge.className}`}
														>
															<StatusIcon className="h-3 w-3" />
															{statusBadge.label}
														</Badge>
													</div>
													<div className="text-center text-[#767676] hidden md:block">
														{formatDate(ticket.createdAt)}
													</div>
													<div className="flex justify-center gap-1 md:gap-2">
														<Button
															size="sm"
															variant="ghost"
															onClick={() => handleViewTicket(ticket)}
															className="h-8 w-8 md:h-8 md:w-8 p-0 text-[#0d5990] hover:bg-[#0d5990] hover:text-white"
														>
															<Eye className="h-3 w-3 md:h-4 md:w-4" />
														</Button>
													</div>
												</motion.div>
											)
										})
									) : (
										<motion.div
											className="text-center py-8 text-[#767676]"
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ duration: 0.5, delay: 0.5 }}
										>
											<MessageSquare className="h-12 w-12 mx-auto mb-4 text-[#ccd6e1]" />
											<p className="text-lg font-IranYekanMedium mb-2">هیچ درخواست پشتیبانی یافت نشد</p>
											<p className="text-sm font-IranYekanRegular">فیلترها را تغییر دهید</p>
										</motion.div>
									)}
								</div>
							</div>
						</motion.div>
					</div>
				</Card>
			</motion.div>
		</>
	)
}

