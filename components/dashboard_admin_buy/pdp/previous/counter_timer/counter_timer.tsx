import React, { useEffect, useState, useRef } from "react";

interface CountdownTimerProps {
	initialSeconds: number;
	currentSeconds?: number; // New prop to control the timer from parent
	onExpire?: () => void;
	isPaused?: boolean; // New prop to pause the timer
}

// Helper function to convert Arabic numerals to Persian numerals
const toPersianNumber = (str: string): string => {
	const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
	return str.replace(/[0-9]/g, (digit) => persianDigits[parseInt(digit)]);
};

export function CountdownTimer({ initialSeconds, currentSeconds, onExpire, isPaused = false }: CountdownTimerProps) {
	const [seconds, setSeconds] = useState(currentSeconds !== undefined ? currentSeconds : initialSeconds);
	const isExpired = seconds <= 0;
	const hasRun = useRef(false);

	// Format time into MM:SS with Persian numbers
	const formatTime = (timeInSeconds: number) => {
		if (timeInSeconds <= 0) return toPersianNumber("00:00");

		const minutes = Math.floor(timeInSeconds / 60);
		const remainingSeconds = timeInSeconds % 60;

		const formattedTime = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
		// Convert to Persian numerals
		return toPersianNumber(formattedTime);
	};

	// Update timer display when currentSeconds changes from parent
	useEffect(() => {
		if (currentSeconds !== undefined) {
			setSeconds(currentSeconds);
		}
	}, [currentSeconds]);

	useEffect(() => {
		// If timer is paused or already expired, don't run interval
		if (isPaused || isExpired) return;

		// Set up interval to count down
		const intervalId = setInterval(() => {
			setSeconds(prevSeconds => {
				if (prevSeconds <= 1) {
					clearInterval(intervalId);
					if (onExpire && !hasRun.current) {
						hasRun.current = true;
						onExpire();
					}
					return 0;
				}
				return prevSeconds - 1;
			});
		}, 1000);

		// Clean up interval
		return () => clearInterval(intervalId);
	}, [isExpired, isPaused, onExpire]);

	// Get label color based on remaining time
	const getTimeColor = () => {
		if (seconds <= 60) return "text-red-500"; // Last minute in red
		if (seconds <= 300) return "text-yellow-600"; // Last 5 minutes in yellow
		return "text-[#3c82c9]"; // Default color
	};

	return (
		<div className="flex items-center gap-2">
			{/* <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
			</svg> */}
			<span className={`font-IranYekanBold text-[14px] ${getTimeColor()}`}>
				{formatTime(seconds)}
			</span>
		</div>
	);
}