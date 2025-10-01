"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import jMoment from "jalali-moment";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toPersianNumbers } from "@/lib/numberUtils";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useTravelDateStore } from "@/store/TravelDateStore";

// Custom DatePicker Component for centered alignment
const CustomDatePicker: React.FC = () => {
	const { travelDate, setTravelDate, isDateValid, getTravelDateAsMoment, setToToday } = useTravelDateStore();
	const [selectedDate, setSelectedDate] = useState<jMoment.Moment | null>(null);
	const [isOpen, setIsOpen] = useState(false);
	const [currentMonth, setCurrentMonth] = useState(jMoment().locale('fa').startOf('jMonth'));
	const [hasInitialized, setHasInitialized] = useState(false);

	// Persian month names
	const PERSIAN_MONTHS = [
		"فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
		"مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
	];

	// Persian day abbreviations
	const PERSIAN_WEEKDAYS_SHORT = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

	// Function to convert Western numbers to Persian
	const toPersianNum = (num: number): string => {
		return num.toString().replace(/[0-9]/g, (d) => {
			return ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'][parseInt(d)];
		});
	};

	const handleSelectDate = (date: jMoment.Moment) => {
		setSelectedDate(date);
		const formattedDate = date.format("jYYYYjMMjDD");
		setTravelDate(formattedDate);
		setIsOpen(false);
	};

	const handleSelectToday = () => {
		const todayDate = jMoment().locale('fa');
		setSelectedDate(todayDate.clone());
		setToToday();
		setIsOpen(false);
	};

	// Initialize date picker
	useEffect(() => {
		if (hasInitialized) return;

		if (travelDate && isDateValid()) {
			const momentDate = getTravelDateAsMoment();
			if (momentDate) {
				setSelectedDate(momentDate);
				setCurrentMonth(momentDate.clone().startOf('jMonth'));
			}
		}

		setHasInitialized(true);
	}, []);

	// Keep local state in sync with store changes
	useEffect(() => {
		if (!hasInitialized) return;

		if (travelDate && isDateValid()) {
			const momentDate = getTravelDateAsMoment();
			if (momentDate) {
				setSelectedDate(momentDate);
			}
		} else {
			setSelectedDate(null);
		}
	}, [travelDate, isDateValid, hasInitialized]);

	const previousMonth = () => {
		setCurrentMonth(currentMonth.clone().add(1, 'jMonth'));
	};

	const nextMonth = () => {
		setCurrentMonth(currentMonth.clone().subtract(1, 'jMonth'));
	};

	// Generate calendar days
	const generateCalendar = (month: jMoment.Moment) => {
		const startOfMonth = month.clone().startOf('jMonth');
		const endOfMonth = month.clone().endOf('jMonth');
		let dayOfWeek = startOfMonth.day();
		dayOfWeek = (dayOfWeek + 1) % 7;
		const daysInMonth = endOfMonth.jDate();
		const allDays = [];

		// Add empty cells for days before the start of month
		for (let i = 0; i < dayOfWeek; i++) {
			allDays.push(<div key={`blank-${i}`} className="w-8 h-8"></div>);
		}

		// Add days of the month
		for (let i = 1; i <= daysInMonth; i++) {
			const date = month.clone().jDate(i);
			const isToday = date.isSame(jMoment().locale('fa'), 'day');
			const isSelected = selectedDate ? date.isSame(selectedDate, 'day') : false;
			const isPastDate = date.isBefore(jMoment().locale('fa'), 'day');
			const isFriday = date.day() === 5;

			allDays.push(
				<div
					key={`day-${i}`}
					className={cn(
						"w-8 h-8 rounded-md flex items-center justify-center text-sm cursor-pointer",
						isSelected ? "bg-[#0D5990] text-white" : "hover:bg-gray-100",
						isToday ? "border border-accent" : "",
						isPastDate ? "text-gray-300 cursor-not-allowed hover:bg-transparent" : "",
						isFriday && !isSelected && !isPastDate ? "text-red-500" : ""
					)}
					onClick={() => !isPastDate && handleSelectDate(date)}
				>
					{toPersianNum(i)}
				</div>
			);
		}

		// Split into weeks
		const weeks = [];
		let week = [];
		for (let i = 0; i < allDays.length; i++) {
			if (i > 0 && i % 7 === 0) {
				weeks.push([...week]);
				week = [];
			}
			week.push(allDays[i]);
		}
		if (week.length > 0) {
			weeks.push([...week]);
		}
		return weeks;
	};

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className="w-full h-[48px] bg-white justify-end text-center hover:bg-gray-100 font-IranYekanRegular"
				>
					<div className="flex items-center gap-2 text-black">
						{selectedDate && travelDate && isDateValid()
							? <span>{toPersianNumbers(selectedDate.format("jYYYY/jMM/jDD"))}</span>
							: <span>زمان سفر</span>}
					</div>
					<Icon icon="solar:calendar-linear" className="w-5 h-5" />
				</Button>
			</PopoverTrigger>

			<PopoverContent
				className="w-auto p-4 max-w-[320px]"
				align="center"
				dir="rtl"
				side="bottom"
				sideOffset={5}
			>
				<div className="rounded-md border-0">
					{/* Navigation */}
					<div className="flex justify-between items-center mb-4">
						<Button
							variant="outline"
							size="icon"
							className="w-8 h-8 rounded-full"
							onClick={nextMonth}
						>
							<ChevronRight className="h-4 w-4" />
						</Button>

						<div className="text-center font-IranYekanBold">
							{`${PERSIAN_MONTHS[currentMonth.jMonth()]} ${toPersianNum(currentMonth.jYear())}`}
						</div>

						<Button
							variant="outline"
							size="icon"
							className="w-8 h-8 rounded-full"
							onClick={previousMonth}
						>
							<ChevronLeft className="h-4 w-4" />
						</Button>
					</div>

					{/* Calendar */}
					<div className="mb-4">
						{/* Weekday headers */}
						<div className="grid grid-cols-7 mb-2">
							{PERSIAN_WEEKDAYS_SHORT.map((day, index) => (
								<div
									key={index}
									className={cn(
										"text-center text-xs font-medium",
										index === 6 ? "text-red-500" : "text-muted-foreground"
									)}
								>
									{day}
								</div>
							))}
						</div>

						{/* Calendar grid */}
						<div className="grid grid-cols-7 gap-0.5 justify-items-center">
							{generateCalendar(currentMonth).map((week, weekIndex) => (
								<React.Fragment key={weekIndex}>
									{week.map((day, dayIndex) => (
										<React.Fragment key={dayIndex}>{day}</React.Fragment>
									))}
								</React.Fragment>
							))}
						</div>
					</div>

					{/* Today button */}
					<div className="flex justify-center">
						<Button
							variant="default"
							className="bg-[#0D5990] hover:bg-[#094675] text-white font-IranYekanRegular text-sm"
							onClick={handleSelectToday}
						>
							انتخاب امروز
						</Button>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
};

export default CustomDatePicker;