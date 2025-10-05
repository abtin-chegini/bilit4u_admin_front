"use client"

import React, { useState, useEffect } from "react"
import { Clock } from "lucide-react"

interface CountdownTimerProps {
	initialTime?: number // in seconds
	onTimeUp?: () => void
	className?: string
}

export function CountdownTimer({
	initialTime = 900, // 15 minutes default
	onTimeUp,
	className = ""
}: CountdownTimerProps) {
	const [timer, setTimer] = useState(initialTime)
	const [canResend, setCanResend] = useState(false)

	// Timer countdown effect
	useEffect(() => {
		let interval: NodeJS.Timeout

		if (timer > 0) {
			interval = setInterval(() => {
				setTimer((prevTimer) => {
					if (prevTimer <= 1) {
						setCanResend(true)
						if (onTimeUp) {
							onTimeUp()
						}
						return 0
					}
					return prevTimer - 1
				})
			}, 1000)
		}

		return () => {
			if (interval) {
				clearInterval(interval)
			}
		}
	}, [timer, onTimeUp])

	// Format time as MM:SS
	const formatTime = (seconds: number): string => {
		const minutes = Math.floor(seconds / 60)
		const remainingSeconds = seconds % 60
		return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
	}

	// Convert to Persian digits
	const toPersianDigits = (str: string): string => {
		const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
		return str.replace(/\d/g, (digit) => persianDigits[parseInt(digit)])
	}

	return (
		<div className={`flex items-center gap-2 ${className}`}>
			<Clock className="w-4 h-4 text-gray-500" />
			<span className="text-gray-500 text-sm font-IranYekanRegular">زمان باقیمانده:</span>
			<span className={`text-sm font-IranYekanBold ${timer > 0 ? 'text-[#0D5990]' : 'text-red-500'}`}>
				{toPersianDigits(formatTime(timer))}
			</span>
		</div>
	)
}
