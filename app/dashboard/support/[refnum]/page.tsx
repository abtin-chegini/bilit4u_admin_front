"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { supportTicketService, SupportTicket, SupportUser, SupportResponse } from "@/services/supportTicketService"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
	ArrowLeft,
	Clock,
	User,
	MessageSquare,
	Send,
	AlertCircle,
	XCircle,
	Flag,
	RefreshCw,
	Phone,
	Mail,
	MapPin,
	Calendar,
	Hash,
	Loader2,
	CheckCheck
} from "lucide-react"
import {
	FaUser,
	FaHeadset,
	FaTicketAlt,
	FaRegClock,
	FaReply,
	FaExclamationTriangle,
	FaCheckCircle,
	FaTimesCircle,
	FaHourglassHalf
} from "react-icons/fa"
import { motion, AnimatePresence } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
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
		return toPersianDigits(date.format('HH:mm - jYYYY/jMM/jDD'));
	} catch (error) {
		return dateStr;
	}
};

const formatTime = (dateStr: string): string => {
	try {
		const date = moment(dateStr);
		if (!date.isValid()) {
			return dateStr;
		}
		return toPersianDigits(date.format('HH:mm'));
	} catch (error) {
		return dateStr;
	}
};

const getStatusInfo = (status: string) => {
	switch (status?.toUpperCase()) {
		case 'OPEN':
			return {
				label: 'باز',
				color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
				icon: <FaExclamationTriangle className="w-3 h-3" />,
				bgGradient: 'from-emerald-50 to-emerald-100'
			};
		case 'IN_PROGRESS':
			return {
				label: 'در حال بررسی',
				color: 'bg-amber-100 text-amber-700 border-amber-200',
				icon: <FaHourglassHalf className="w-3 h-3" />,
				bgGradient: 'from-amber-50 to-amber-100'
			};
		case 'CLOSED':
			return {
				label: 'بسته شده',
				color: 'bg-gray-100 text-gray-600 border-gray-200',
				icon: <FaTimesCircle className="w-3 h-3" />,
				bgGradient: 'from-gray-50 to-gray-100'
			};
		case 'PENDING':
			return {
				label: 'در انتظار',
				color: 'bg-blue-100 text-blue-700 border-blue-200',
				icon: <FaRegClock className="w-3 h-3" />,
				bgGradient: 'from-blue-50 to-blue-100'
			};
		case 'RESOLVED':
			return {
				label: 'حل شده',
				color: 'bg-green-100 text-green-700 border-green-200',
				icon: <FaCheckCircle className="w-3 h-3" />,
				bgGradient: 'from-green-50 to-green-100'
			};
		default:
			return {
				label: status || 'نامشخص',
				color: 'bg-gray-100 text-gray-600 border-gray-200',
				icon: <AlertCircle className="w-3 h-3" />,
				bgGradient: 'from-gray-50 to-gray-100'
			};
	}
};

const getPriorityInfo = (priority: string = 'MEDIUM') => {
	switch (priority?.toUpperCase()) {
		case 'HIGH':
			return {
				label: 'بالا',
				color: 'bg-red-100 text-red-700 border-red-200',
				icon: <Flag className="w-3 h-3" />
			};
		case 'MEDIUM':
			return {
				label: 'متوسط',
				color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
				icon: <Flag className="w-3 h-3" />
			};
		case 'LOW':
			return {
				label: 'پایین',
				color: 'bg-blue-100 text-blue-700 border-blue-200',
				icon: <Flag className="w-3 h-3" />
			};
		default:
			return {
				label: 'متوسط',
				color: 'bg-gray-100 text-gray-600 border-gray-200',
				icon: <Flag className="w-3 h-3" />
			};
	}
};

function SupportTicketDetailContent() {
	const params = useParams()
	const router = useRouter()
	const { session } = useAuth()
	const { toast } = useToast()
	const refnum = params.refnum as string
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	const [ticket, setTicket] = useState<SupportTicket | null>(null)
	const [user, setUser] = useState<SupportUser | null>(null)
	const [responses, setResponses] = useState<SupportResponse[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [message, setMessage] = useState("")
	const [isSending, setIsSending] = useState(false)
	const [selectedStatus, setSelectedStatus] = useState<string>("")

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
	}

	useEffect(() => {
		scrollToBottom()
	}, [responses])

	useEffect(() => {
		const fetchTicketData = async () => {
			if (!session?.access_token || !refnum) {
				setIsLoading(false)
				return
			}

			try {
				setIsLoading(true)
				setError(null)

				// Get ticket data which includes responses
				const ticketResponse = await supportTicketService.getTicketByRefnum(session.access_token, refnum)

				if (ticketResponse.success && ticketResponse.ticket) {
					const ticketInfo = ticketResponse.ticket
					setTicket(ticketInfo)

					// Extract userId from ticket and fetch user info
					if (ticketInfo.userId) {
						const userData = await supportTicketService.getUserById(session.access_token, ticketInfo.userId)
						setUser(userData)
					}

					// Extract responses from ticket (they're already included in the response)
					if (ticketInfo.responses && Array.isArray(ticketInfo.responses)) {
						// Map responses to match our interface
						const mappedResponses = ticketInfo.responses.map((r: any) => ({
							id: r.id,
							ticketId: r.ticketId,
							message: r.message,
							createdAt: r.createdAt,
							respondedBy: r.respondedBy,
							adminUserId: r.adminUserId,
							userId: r.userId,
							isInternal: r.isInternal,
							isAdmin: r.respondedBy === 'SUPPORT'
						}))
						setResponses(mappedResponses)
					} else {
						setResponses([])
					}
				} else {
					throw new Error('Invalid ticket response format')
				}
			} catch (err: any) {
				console.error('Error fetching ticket data:', err)
				setError(err.message || 'خطا در بارگذاری اطلاعات درخواست پشتیبانی')
				toast({
					title: "خطا",
					description: err.message || 'خطا در بارگذاری اطلاعات درخواست پشتیبانی',
					variant: "destructive",
				})
			} finally {
				setIsLoading(false)
			}
		}

		fetchTicketData()
	}, [session, refnum, toast])

	const handleSendMessage = async () => {
		if (!message.trim() || !session?.access_token || !ticket?.id) return

		try {
			setIsSending(true)

			// Call API to send response
			await supportTicketService.sendResponse(
				session.access_token,
				ticket.id,
				message.trim(),
				selectedStatus || undefined
			)

			// Refresh ticket data to get updated responses
			const ticketResponse = await supportTicketService.getTicketByRefnum(session.access_token, refnum)

			if (ticketResponse.success && ticketResponse.ticket) {
				const ticketInfo = ticketResponse.ticket
				setTicket(ticketInfo)

				// Update responses
				if (ticketInfo.responses && Array.isArray(ticketInfo.responses)) {
					const mappedResponses = ticketInfo.responses.map((r: any) => ({
						id: r.id,
						ticketId: r.ticketId,
						message: r.message,
						createdAt: r.createdAt,
						respondedBy: r.respondedBy,
						adminUserId: r.adminUserId,
						userId: r.userId,
						isInternal: r.isInternal,
						isAdmin: r.respondedBy === 'SUPPORT'
					}))
					setResponses(mappedResponses)
				}
			}

			setMessage("")
			setSelectedStatus("")

			toast({
				title: "موفق",
				description: "پیام با موفقیت ارسال شد",
			})
		} catch (err: any) {
			console.error('Error sending message:', err)
			toast({
				title: "خطا",
				description: err.message || 'خطا در ارسال پیام',
				variant: "destructive",
			})
		} finally {
			setIsSending(false)
		}
	}

	const handleBack = () => {
		router.push('/dashboard/support')
	}

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6">
				<div className="max-w-7xl mx-auto space-y-6">
					<Skeleton className="h-20 w-full rounded-xl" />
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						<div className="lg:col-span-2">
							<Skeleton className="h-[600px] w-full rounded-xl" />
						</div>
						<div>
							<Skeleton className="h-[400px] w-full rounded-xl" />
						</div>
					</div>
				</div>
			</div>
		)
	}

	if (error || !ticket) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6">
				<div className="max-w-4xl mx-auto">
					<Card className="p-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
						<div className="text-center space-y-4">
							<div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
								<XCircle className="w-10 h-10 text-red-500" />
							</div>
							<p className="text-red-600 font-IranYekanMedium text-lg">
								{error || 'درخواست پشتیبانی یافت نشد'}
							</p>
							<Button
								onClick={handleBack}
								className="font-IranYekanRegular text-white shadow-lg"
								style={{ backgroundColor: '#0d578e' }}
								onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0a456e'}
								onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0d578e'}
							>
								<ArrowLeft className="w-4 h-4 ml-2" />
								بازگشت
							</Button>
						</div>
					</Card>
				</div>
			</div>
		)
	}

	const statusInfo = getStatusInfo(ticket.status)
	const priorityInfo = getPriorityInfo(ticket.priority)

	const ticketMessage = {
		message: ticket.message,
		createdAt: ticket.createdAt,
		isAdmin: false,
		userId: ticket.userId
	}

	const allMessages = [
		ticketMessage,
		...responses.map(r => ({
			message: r.message,
			createdAt: r.createdAt,
			isAdmin: r.respondedBy === 'SUPPORT' || r.isAdmin === true,
			userId: r.userId || ticket.userId
		}))
	].sort((a, b) => {
		return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
	})

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30" dir="rtl">
			<div className="max-w-7xl mx-auto p-4 lg:p-6">
				{/* Modern Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="mb-6"
				>
					<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-gray-100">
						<div className="flex items-center gap-4">
							<Button
								onClick={handleBack}
								className="font-IranYekanRegular rounded-xl transition-all duration-200 text-white shadow-md hover:shadow-lg"
								style={{ backgroundColor: '#0d578e' }}
								onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0a456e'}
								onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0d578e'}
							>
								<ArrowLeft className="h-4 w-4 ml-2" />
								بازگشت
							</Button>
							<Separator orientation="vertical" className="h-8 hidden lg:block" />
							<div className="flex items-center gap-3">
								<div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#0d578e' }}>
									<FaTicketAlt className="w-6 h-6 text-white" />
								</div>
								<div>
									<h1 className="text-xl lg:text-2xl font-IranYekanBold text-gray-900">
										تیکت #{refnum}
									</h1>
									<p className="text-sm text-gray-500 font-IranYekanRegular mt-1">
										{ticket.subject}
									</p>
								</div>
							</div>
						</div>

						<div className="flex items-center gap-3 justify-end">
							<div className="flex items-center gap-2 text-center">
								<Select value={selectedStatus || undefined} onValueChange={(value) => setSelectedStatus(value === "NONE" ? "" : value)}>
									<SelectTrigger className="w-[180px] font-IranYekanRegular border-gray-200 rounded-xl h-9 text-center">
										<SelectValue placeholder="تغییر وضعیت" />
									</SelectTrigger>
									<SelectContent className="text-center font-IranYekanRegular" dir="rtl">
										<SelectItem value="NONE">بدون تغییر</SelectItem>
										<SelectItem value="OPEN">باز</SelectItem>
										<SelectItem value="IN_PROGRESS">در حال بررسی</SelectItem>
										<SelectItem value="CLOSED">بسته شده</SelectItem>
										<SelectItem value="RESOLVED">حل شده</SelectItem>
									</SelectContent>
								</Select>
								<Badge className={`${statusInfo.color} border font-IranYekanRegular px-3 py-1.5 flex items-center gap-1.5`}>
									{statusInfo.icon}
									{statusInfo.label}
								</Badge>
							</div>
							<Badge className={`${priorityInfo.color} border font-IranYekanRegular px-3 py-1.5 flex items-center gap-1.5`}>
								{priorityInfo.icon}
								{priorityInfo.label}
							</Badge>
						</div>
					</div>
				</motion.div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Main Chat Area */}
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						className="lg:col-span-2"
					>
						<Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
							{/* Chat Header */}
							<div className="p-4" style={{ backgroundColor: '#0d578e' }}>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div className="relative">
											<Avatar className="h-10 w-10 border-2 border-white/30">
												<AvatarFallback className="bg-white/20 text-white font-IranYekanMedium">
													{user?.name?.[0] || 'U'}
												</AvatarFallback>
											</Avatar>
											<div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
										</div>
										<div>
											<p className="text-white font-IranYekanMedium">
												{user?.name || 'کاربر'}
											</p>
											<p className="text-sm font-IranYekanRegular" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
												آنلاین
											</p>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger asChild>
													<Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-xl">
														<Phone className="h-5 w-5" />
													</Button>
												</TooltipTrigger>
												<TooltipContent>
													<p className="font-IranYekanRegular">تماس تلفنی</p>
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger asChild>
													<Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-xl">
														<Mail className="h-5 w-5" />
													</Button>
												</TooltipTrigger>
												<TooltipContent>
													<p className="font-IranYekanRegular">ارسال ایمیل</p>
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									</div>
								</div>
							</div>

							{/* Messages Container */}
							<div className="h-[500px] overflow-y-auto bg-gradient-to-b from-gray-50 to-white p-6">
								<AnimatePresence mode="popLayout">
									{allMessages.map((msg, index) => {
										const isUserMessage = !msg.isAdmin
										const showDate = index === 0 ||
											formatDate(msg.createdAt) !== formatDate(allMessages[index - 1].createdAt)

										return (
											<div key={index}>
												{showDate && (
													<div className="flex justify-center my-4">
														<div className="bg-gray-100 px-3 py-1 rounded-full">
															<p className="text-xs text-gray-500 font-IranYekanRegular">
																{formatDate(msg.createdAt)}
															</p>
														</div>
													</div>
												)}
												<motion.div
													initial={{ opacity: 0, y: 20, scale: 0.9 }}
													animate={{ opacity: 1, y: 0, scale: 1 }}
													exit={{ opacity: 0, scale: 0.9 }}
													transition={{ duration: 0.3, ease: "easeOut" }}
													className={`flex gap-3 mb-4 ${isUserMessage ? 'flex-row' : 'flex-row-reverse'}`}
												>
													{isUserMessage && (
														<Avatar className="h-9 w-9 order-first">
															<AvatarFallback
																className="text-white font-IranYekanMedium text-sm"
																style={{ backgroundColor: '#0d578e' }}
															>
																{user?.name?.[0] || 'U'}
															</AvatarFallback>
														</Avatar>
													)}

													<div className={`flex-1 max-w-[70%] ${isUserMessage ? '' : 'flex justify-end'}`}>
														<div
															className={`inline-block rounded-2xl px-4 py-3 shadow-sm ${isUserMessage
																? 'text-white rounded-tr-sm'
																: 'bg-gradient-to-br from-green-500 to-green-600 text-white rounded-tl-sm'
																}`}
															style={isUserMessage ? { backgroundColor: '#0d578e' } : {}}
														>
															<p className="text-sm font-IranYekanRegular leading-relaxed whitespace-pre-wrap">
																{msg.message}
															</p>
															<div className={`flex items-center gap-2 mt-2 ${isUserMessage ? 'justify-start' : 'justify-end'}`}>
																<p className={`text-xs font-IranYekanRegular ${isUserMessage ? 'text-white opacity-70' : 'text-green-100'}`}>
																	{formatTime(msg.createdAt)}
																</p>
																{!isUserMessage && (
																	<CheckCheck className="w-4 h-4 text-green-200" />
																)}
															</div>
														</div>
													</div>
												</motion.div>
											</div>
										)
									})}
								</AnimatePresence>

								<div ref={messagesEndRef} />
							</div>

							{/* Message Input */}
							<div className="border-t border-gray-100 p-4 bg-white">
								<div className="flex gap-3 items-end">
									<div className="flex-1 relative">
										<Textarea
											ref={textareaRef}
											value={message}
											onChange={(e) => {
												setMessage(e.target.value)
											}}
											onKeyDown={(e) => {
												if (e.key === 'Enter' && !e.shiftKey) {
													e.preventDefault()
													handleSendMessage()
												}
											}}
											placeholder="پیام خود را تایپ کنید..."
											className="min-h-[50px] max-h-[150px] resize-none font-IranYekanRegular text-sm border-gray-200 rounded-xl transition-all duration-200"
											style={{
												'--focus-border': '#0d578e',
												'--focus-ring': 'rgba(13, 87, 142, 0.2)'
											} as React.CSSProperties}
											onFocus={(e) => {
												e.currentTarget.style.borderColor = '#0d578e';
												e.currentTarget.style.boxShadow = '0 0 0 2px rgba(13, 87, 142, 0.2)';
											}}
											onBlur={(e) => {
												e.currentTarget.style.borderColor = '';
												e.currentTarget.style.boxShadow = '';
											}}
											disabled={isSending}
										/>
									</div>

									<motion.div
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
									>
										<Button
											onClick={handleSendMessage}
											disabled={!message.trim() || isSending}
											className="text-white font-IranYekanRegular rounded-xl px-6 h-[50px] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
											style={{ backgroundColor: '#0d578e' }}
											onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#0a456e')}
											onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#0d578e')}
										>
											{isSending ? (
												<Loader2 className="h-5 w-5 animate-spin" />
											) : (
												<>
													<Send className="h-5 w-5 ml-2" />
													ارسال
												</>
											)}
										</Button>
									</motion.div>
								</div>

								<div className="flex items-center justify-between mt-3">
									<p className="text-xs text-gray-400 font-IranYekanRegular">
										برای ارسال پیام Enter را فشار دهید
									</p>
								</div>
							</div>
						</Card>
					</motion.div>

					{/* Sidebar */}
					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						className="space-y-6"
					>
						{/* User Info Card */}
						<Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
							<div className="p-6" style={{ backgroundColor: '#0d578e' }}>
								<div className="text-center">
									<Avatar className="h-20 w-20 mx-auto border-4 border-white/30 shadow-xl">
										<AvatarFallback className="bg-white/20 text-white text-2xl font-IranYekanBold">
											{user?.name?.[0] || 'U'}
										</AvatarFallback>
									</Avatar>
									<h3 className="text-white font-IranYekanBold text-lg mt-4">
										{user?.name || 'کاربر'}
									</h3>
									<p className="text-sm font-IranYekanRegular mt-1" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
										{user?.email || 'user@example.com'}
									</p>
								</div>
							</div>

							<div className="p-6 space-y-4">
								<div className="flex items-center gap-3 text-gray-700">
									<div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(13, 87, 142, 0.1)' }}>
										<Phone className="w-5 h-5" style={{ color: '#0d578e' }} />
									</div>
									<div className="flex-1">
										<p className="text-xs text-gray-500 font-IranYekanRegular">تلفن</p>
										<p className="font-IranYekanMedium text-sm">
											{user?.phoneNumber ? toPersianDigits(user.phoneNumber) : '-'}
										</p>
									</div>
								</div>

								<div className="flex items-center gap-3 text-gray-700">
									<div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
										<Mail className="w-5 h-5 text-green-600" />
									</div>
									<div className="flex-1">
										<p className="text-xs text-gray-500 font-IranYekanRegular">ایمیل</p>
										<p className="font-IranYekanMedium text-sm truncate">
											{user?.email || 'user@example.com'}
										</p>
									</div>
								</div>

								<div className="flex items-center gap-3 text-gray-700">
									<div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
										<MapPin className="w-5 h-5 text-purple-600" />
									</div>
									<div className="flex-1">
										<p className="text-xs text-gray-500 font-IranYekanRegular">موقعیت</p>
										<p className="font-IranYekanMedium text-sm">
											تهران، ایران
										</p>
									</div>
								</div>
							</div>
						</Card>

						{/* Ticket Details Card */}
						<Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl p-6">
							<h3 className="font-IranYekanBold text-gray-900 mb-4 flex items-center gap-2">
								<FaTicketAlt className="w-5 h-5" style={{ color: '#0d578e' }} />
								جزئیات تیکت
							</h3>

							<div className="space-y-4">
								<div>
									<p className="text-xs text-gray-500 font-IranYekanRegular mb-1">شماره تیکت</p>
									<div className="flex items-center gap-2">
										<Hash className="w-4 h-4 text-gray-400" />
										<p className="font-IranYekanMedium text-gray-800">
											{refnum}
										</p>
									</div>
								</div>

								<div>
									<p className="text-xs text-gray-500 font-IranYekanRegular mb-1">تاریخ ایجاد</p>
									<div className="flex items-center gap-2">
										<Calendar className="w-4 h-4 text-gray-400" />
										<p className="font-IranYekanMedium text-gray-800">
											{formatDate(ticket.createdAt)}
										</p>
									</div>
								</div>

								<div>
									<p className="text-xs text-gray-500 font-IranYekanRegular mb-1">آخرین بروزرسانی</p>
									<div className="flex items-center gap-2">
										<RefreshCw className="w-4 h-4 text-gray-400" />
										<p className="font-IranYekanMedium text-gray-800">
											{formatDateTime(ticket.updatedAt || ticket.createdAt)}
										</p>
									</div>
								</div>

							</div>
						</Card>

					</motion.div>
				</div >
			</div >
		</div >
	)
}

export default function SupportTicketDetailPage() {
	return <SupportTicketDetailContent />
}