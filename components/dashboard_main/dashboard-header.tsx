"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useUserStore } from "@/store/UserStore"
import { useEffect, useState } from "react"
import {
	Bell,
	Settings,
	ChevronDown,
	LogOut,
	ArrowRight,
	Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
	DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { transactionService } from "@/services/transactionService"

interface DashboardHeaderProps {
	showSidebarTrigger?: boolean
	showBackButton?: boolean
	backButtonLabel?: string
	onBackClick?: () => void
}

interface WalletBalance {
	success: boolean
	balance: number
	totalDeposited: number
	totalSpent: number
	currency: string
	isActive: boolean
}

export function DashboardHeader({
	showSidebarTrigger = true,
	showBackButton = false,
	backButtonLabel = "بازگشت به صفحه اصلی",
	onBackClick
}: DashboardHeaderProps) {
	const { signOut, session } = useAuth()
	const { user: profileUser } = useUserStore()
	const router = useRouter()
	const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null)
	const [loadingBalance, setLoadingBalance] = useState(false)

	// Fetch wallet balance
	useEffect(() => {
		const fetchWalletBalance = async () => {
			if (!session?.access_token) return

			try {
				setLoadingBalance(true)
				const balance = await transactionService.getBalance(session.access_token)

				if (balance) {
					setWalletBalance(balance)
				}
			} catch (error) {
				console.error('Error fetching wallet balance:', error)
			} finally {
				setLoadingBalance(false)
			}
		}

		fetchWalletBalance()
	}, [session?.access_token])

	const handleLogout = async () => {
		await signOut()
		router.push('/login')
	}

	const handleBack = () => {
		if (onBackClick) {
			onBackClick()
		} else {
			router.push('/dashboard')
		}
	}

	// Format balance to Toman with thousand separators
	const formatBalance = (balance: number) => {
		const toman = Math.floor(balance / 10)
		return toman.toLocaleString('fa-IR')
	}

	return (
		<header className="sticky top-0 z-30 bg-white border-b border-gray-200" dir="rtl">
			<div className="flex h-16 items-center gap-4 px-6">
				{showSidebarTrigger && <SidebarTrigger className="-mr-1" />}

				{showBackButton && (
					<Button
						variant="outline"
						onClick={handleBack}
						className="flex items-center gap-2 border-[#0d5990] text-[#0d5990] hover:bg-[#0d5990] hover:text-white transition-colors"
					>
						<span className="font-IranYekanMedium">{backButtonLabel}</span>
						<ArrowRight className="h-4 w-4" />
					</Button>
				)}

				<div className="flex-1" />

				{/* User Profile Dropdown */}
				<DropdownMenu dir="rtl">
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="flex items-center gap-2 px-3 flex-row-reverse">
							<ChevronDown className="h-4 w-4 text-gray-500" />
							<div className="flex flex-col items-start text-right">
								<span className="text-sm font-IranYekanBold text-gray-700">
									{profileUser?.firstName || profileUser?.profileData?.name || "ادمین"}
								</span>
								<span className="text-xs text-gray-500">
									{profileUser?.email || "admin@bilit4u.com"}
								</span>
							</div>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" className="w-64">
						{/* Wallet Balance */}
						<div className="px-2 py-3 border-b border-gray-200">
							<div className="flex items-center justify-between gap-2 text-right">
								<div className="flex-1">
									<p className="text-xs text-gray-500 font-IranYekanRegular mb-1">موجودی کیف پول</p>
									{loadingBalance ? (
										<div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
									) : walletBalance ? (
										<p className="text-lg font-IranYekanBold text-[#0d5990]">
											{formatBalance(walletBalance.balance)} تومان
										</p>
									) : (
										<p className="text-sm font-IranYekanRegular text-gray-400">بارگذاری...</p>
									)}
								</div>
								<div className="w-10 h-10 rounded-full bg-[#0d5990]/10 flex items-center justify-center">
									<Wallet className="h-5 w-5 text-[#0d5990]" />
								</div>
							</div>
						</div>

						<DropdownMenuItem className="flex items-center gap-2 cursor-pointer flex-row-reverse">
							<span className="font-IranYekanRegular flex-1 text-right">تنظیمات</span>
							<Settings className="h-4 w-4" />
						</DropdownMenuItem>
						<DropdownMenuItem className="flex items-center gap-2 cursor-pointer flex-row-reverse">
							<span className="font-IranYekanRegular flex-1 text-right">اعلان ها</span>
							<Bell className="h-4 w-4" />
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={handleLogout}
							className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600 flex-row-reverse"
						>
							<span className="font-IranYekanRegular flex-1 text-right">خروج</span>
							<LogOut className="h-4 w-4" />
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</header>
	)
}

