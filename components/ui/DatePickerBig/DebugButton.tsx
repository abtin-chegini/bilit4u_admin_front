"use client";
import { useTravelDateStore } from "@/store/TravelDateStore";
import { useEffect, useState } from "react";

export function DebugTravelDateStore() {
	const {
		travelDate,
		wasManuallyCleared,
		clearTravelDate,
		setToToday,
		setTravelDate,
		getTodayFormatted,
		getTimeRemaining
	} = useTravelDateStore();

	const [time, setTime] = useState(getTimeRemaining());

	// Update time remaining every second
	useEffect(() => {
		const timer = setInterval(() => {
			setTime(getTimeRemaining());
		}, 1000);

		return () => clearInterval(timer);
	}, [getTimeRemaining]);

	return (
		<div className="fixed bottom-2 right-2 bg-white p-2 border rounded shadow-md z-50 text-xs">
			<div className="font-bold mb-1">Date Debug</div>
			<div>
				<strong>Current:</strong> {travelDate || "none"}
			</div>
			<div>
				<strong>Cleared:</strong> {wasManuallyCleared ? "Yes" : "No"}
			</div>
			<div>
				<strong>Today:</strong> {getTodayFormatted()}
			</div>
			{travelDate && !wasManuallyCleared && (
				<div>
					<strong>Expires in:</strong> {time.minutes}:{time.seconds < 10 ? `0${time.seconds}` : time.seconds}
				</div>
			)}
			<div className="flex gap-1 mt-1">
				<button
					className="bg-red-500 text-white px-2 py-1 rounded"
					onClick={clearTravelDate}
				>
					Clear
				</button>
				<button
					className="bg-blue-500 text-white px-2 py-1 rounded"
					onClick={setToToday}
				>
					Today
				</button>
				<button
					className="bg-green-500 text-white px-2 py-1 rounded"
					onClick={() => setTravelDate("14030101")}
				>
					Fixed
				</button>
			</div>
		</div>
	);
}