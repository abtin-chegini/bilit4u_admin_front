"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { supportTicketService, SupportTicket, SupportUser, SupportResponse } from "@/services/supportTicketService"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Clock, User, MessageSquare, Send } from "lucide-react"
import { motion } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
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

const getStatusInfo = (status: string) => {
	switch (status?.toUpperCase()) {
		case 'OPEN':
			return { label: 'باز', color: 'text-green-600' };
		case 'IN_PROGRESS':
			return { label: 'در حال بررسی', color: 'text-yellow-600' };
		case 'CLOSED':
			return { label: 'بسته شده', color: 'text-gray-500' };
		case 'PENDING':
			return { label: 'در انتظار', color: 'text-yellow-600' };
		case 'RESOLVED':
			return { label: 'حل شده', color: 'text-green-600' };
		default:
			return { label: status || 'نامشخص', color: 'text-gray-600' };
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

				// Fetch ticket by refnum
				const ticketData = await supportTicketService.getTicketByRefnum(session.access_token, refnum)
				setTicket(ticketData)

				// Fetch user data
				if (ticketData.userId) {
					const userData = await supportTicketService.getUserById(session.access_token, ticketData.userId)
					setUser(userData)
				}

				// Fetch ticket responses
				const responsesData = await supportTicketService.getTicketResponses(session.access_token, refnum)
				setResponses(responsesData)
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
		if (!message.trim() || !session?.access_token || !refnum) return

		try {
			setIsSending(true)
			// TODO: Implement send message API call
			// await supportTicketService.sendResponse(session.access_token, refnum, message)
			
			// For now, just add to local state (remove this when API is ready)
			const newResponse: SupportResponse = {
				id: Date.now(),
				refnum,
				message: message.trim(),
				createdAt: new Date().toISOString(),
				isAdmin: true,
			}
			setResponses([...responses, newResponse])
			setMessage("")
			
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
			<div className="min-h-screen bg-gray-50 p-6">
				<div className="max-w-4xl mx-auto space-y-6">
					<Skeleton className="h-32 w-full rounded-lg" />
					<Skeleton className="h-96 w-full rounded-lg" />
				</div>
			</div>
		)
	}

	if (error || !ticket) {
		return (
			<div className="min-h-screen bg-gray-50 p-6">
				<div className="max-w-4xl mx-auto">
					<Card className="p-6">
						<div className="text-center">
							<p className="text-red-600 font-IranYekanRegular mb-4">{error || 'درخواست پشتیبانی یافت نشد'}</p>
							<Button onClick={handleBack} className="font-IranYekanRegular">
								بازگشت
							</Button>
						</div>
					</Card>
				</div>
			</div>
		)
	}

	const statusInfo = getStatusInfo(ticket.status)

	// Combine ticket message and responses, sort by date
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
			isAdmin: r.isAdmin !== false,
			userId: r.userId
		}))
	].sort((a, b) => {
		return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
	})

	return (
		<div className="min-h-screen bg-gray-50" dir="rtl">
			<div className="max-w-5xl mx-auto p-6">
				{/* Header Section */}
				<div className="mb-6 flex items-center justify-between">
					{/* Back Button */}
					<Button
						onClick={handleBack}
						variant="outline"
						className="border-blue-500 text-blue-600 hover:bg-blue-50 font-IranYekanRegular rounded-lg px-4 py-2"
					>
						<ArrowLeft className="h-4 w-4 ml-2" />
						بازگشت به درخواست‌ها
					</Button>

					{/* Title */}
					<h1 className="text-2xl font-IranYekanBold text-gray-800">
						گفتگوی پشتیبانی
					</h1>
				</div>

				{/* Ticket Info Card */}
				<Card className="mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
					<div className="p-6">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							{/* Title */}
							<div>
								<p className="text-sm text-gray-500 mb-2 font-IranYekanRegular">عنوان</p>
								<div className="flex items-center gap-2">
									<MessageSquare className="h-4 w-4 text-gray-400" />
									<p className="text-base text-gray-800 font-IranYekanRegular">{ticket.subject}</p>
								</div>
							</div>

							{/* Creation Date */}
							<div>
								<p className="text-sm text-gray-500 mb-2 font-IranYekanRegular">تاریخ ایجاد</p>
								<div className="flex items-center gap-2">
									<Clock className="h-4 w-4 text-gray-400" />
									<p className="text-base text-gray-800 font-IranYekanRegular">
										{formatDate(ticket.createdAt)}
									</p>
								</div>
							</div>

							{/* Status */}
							<div>
								<p className="text-sm text-gray-500 mb-2 font-IranYekanRegular">وضعیت</p>
								<div className="flex items-center gap-2">
									<User className="h-4 w-4 text-gray-400" />
									<p className={`text-base font-IranYekanRegular ${statusInfo.color}`}>
										{statusInfo.label}
									</p>
								</div>
							</div>
						</div>
					</div>
				</Card>

				{/* Chat Area */}
				<Card className="mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
					<div className="p-6 h-[600px] flex flex-col">
						{/* Messages Container */}
						<div className="flex-1 overflow-y-auto space-y-4 pr-2">
							{allMessages.map((msg, index) => {
								const isUserMessage = !msg.isAdmin
								return (
									<motion.div
										key={index}
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.3 }}
										className={`flex ${isUserMessage ? 'justify-start' : 'justify-end'}`}
									>
										<div
											className={`max-w-[75%] rounded-2xl px-4 py-3 ${
												isUserMessage
													? 'bg-blue-600 text-white rounded-tl-none'
													: 'bg-gray-100 text-gray-800 rounded-tr-none'
											}`}
											style={{
												position: 'relative',
											}}
										>
											<p className="text-sm font-IranYekanRegular mb-1 whitespace-pre-wrap">
												{msg.message}
											</p>
											<p className={`text-xs mt-2 font-IranYekanRegular ${
												isUserMessage ? 'text-blue-100' : 'text-gray-500'
											}`}>
												{formatDateTime(msg.createdAt)}
											</p>
										</div>
									</motion.div>
								)
							})}
							<div ref={messagesEndRef} />
						</div>
					</div>
				</Card>

				{/* Message Input */}
				<Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
					<div className="p-4">
						<div className="flex gap-3 items-end">
							{/* Text Input */}
							<div className="flex-1">
								<Textarea
									ref={textareaRef}
									value={message}
									onChange={(e) => setMessage(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter' && !e.shiftKey) {
											e.preventDefault()
											handleSendMessage()
										}
									}}
									placeholder="پیام خود را بنویسید..."
									className="min-h-[60px] max-h-[120px] resize-none font-IranYekanRegular text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
									disabled={isSending}
								/>
							</div>

							{/* Send Button */}
							<Button
								onClick={handleSendMessage}
								disabled={!message.trim() || isSending}
								className="bg-gray-600 hover:bg-gray-700 text-white font-IranYekanRegular rounded-lg px-6 py-3 h-[60px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
							>
								<Send className="h-5 w-5" />
								ارسال
							</Button>
						</div>
					</div>
				</Card>
			</div>
		</div>
	)
}

export default function SupportTicketDetailPage() {
	return <SupportTicketDetailContent />
}
