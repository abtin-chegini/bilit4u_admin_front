"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
	children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
	const { user, loading, needsOtp } = useAuth()
	const router = useRouter()

	useEffect(() => {
		if (!loading) {
			if (needsOtp) {
				// If OTP is required, redirect to OTP page
				router.push('/otp')
			} else if (!user) {
				// If no user and no OTP needed, redirect to login
				router.push('/login')
			}
		}
	}, [user, loading, needsOtp, router])

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d5990] mx-auto"></div>
					<p className="mt-4 text-[#2b2b2b] font-iran-yekan">در حال بارگذاری...</p>
				</div>
			</div>
		)
	}

	if (!user || needsOtp) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d5990] mx-auto"></div>
					<p className="mt-4 text-[#2b2b2b] font-iran-yekan">
						{needsOtp ? "در حال انتقال به صفحه OTP..." : "در حال انتقال به صفحه ورود..."}
					</p>
				</div>
			</div>
		)
	}

	return <>{children}</>
}
