"use client";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import jMoment from "jalali-moment";
import React from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toPersianNumbers } from "@/lib/numberUtils";
import { useTravelDateStore } from "@/store/TravelDateStore";

// Persian day names - in proper RTL order (Saturday to Friday)
const PERSIAN_WEEKDAYS_LONG = [
	"شنبه",
	"یکشنبه",
	"دوشنبه",
	"سه‌شنبه",
	"چهارشنبه",
	"پنج‌شنبه",
	"جمعه",
];

// Persian day abbreviations - in proper RTL order
const PERSIAN_WEEKDAYS_SHORT = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

// Persian month names
const PERSIAN_MONTHS = [
	"فروردین",
	"اردیبهشت",
	"خرداد",
	"تیر",
	"مرداد",
	"شهریور",
	"مهر",
	"آبان",
	"آذر",
	"دی",
	"بهمن",
	"اسفند",
];

// Define Persian holidays (month is 0-based index, day is 1-based)
const PERSIAN_HOLIDAYS = [
	// Norooz holidays
	{ month: 0, day: 1 },  // 1 Farvardin - Norooz
	{ month: 0, day: 2 },  // 2 Farvardin
	{ month: 0, day: 3 },  // 3 Farvardin
	{ month: 0, day: 4 },  // 4 Farvardin
	{ month: 0, day: 11 },
	{ month: 0, day: 12 },
	{ month: 0, day: 13 }, // 13 Farvardin - Sizdah Bedar
	{ month: 1, day: 4 },
	{ month: 2, day: 14 },
	{ month: 2, day: 15 },
	{ month: 2, day: 24 },
	{ month: 3, day: 14 },
	{ month: 3, day: 15 },
	{ month: 4, day: 23 },
	{ month: 5, day: 2 },
	{ month: 5, day: 10 },
	{ month: 5, day: 19 },
	{ month: 8, day: 3 },
	{ month: 9, day: 13 },
	{ month: 9, day: 27 },
	{ month: 10, day: 15 },
	{ month: 10, day: 22 },
	{ month: 11, day: 20 },
];

// Function to check if a date is Friday (weekend in Iran)
const isFriday = (date: jMoment.Moment): boolean => {
	return date.day() === 5; // 5 is Friday in jMoment
};

// Function to check if a date is a holiday
const isHoliday = (date: jMoment.Moment): boolean => {
	const month = date.jMonth();
	const day = date.jDate();

	return PERSIAN_HOLIDAYS.some(holiday =>
		holiday.month === month && holiday.day === day
	);
};

function DatePickerBig() {
	const {
		travelDate,
		setTravelDate,
		setToToday,
		isDateValid,
		getTravelDateAsMoment,
		wasManuallyCleared,
		getTodayFormatted // New function to get today's date without side effects
	} = useTravelDateStore();
	const [hasInitialized, setHasInitialized] = useState(false);
	// Use jalali-moment for date handling
	const today = jMoment().locale('fa');
	const [currentMonth, setCurrentMonth] = useState(today.clone().startOf('jMonth'));
	const [selectedDate, setSelectedDate] = useState<jMoment.Moment | null>(null); // Initialize as null instead of today
	const [isOpen, setIsOpen] = useState(false);



	// Function to convert Western numbers to Persian
	const toPersianNum = (num: number): string => {
		return num.toString().replace(/[0-9]/g, (d) => {
			return ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'][parseInt(d)];
		});
	};

	const formatDateForDisplay = (date: jMoment.Moment | null): string => {
		if (!date) return "انتخاب تاریخ";
		return date.format('jD jMMMM jYYYY');
	};

	const handleSelectDate = (date: jMoment.Moment) => {
		setSelectedDate(date);  // Update local state
		const formattedDate = date.format("jYYYYjMMjDD");
		setTravelDate(formattedDate);  // Update store with selected date
		setIsOpen(false);
	};

	const previousMonth = () => {
		setCurrentMonth(currentMonth.clone().add(1, 'jMonth'));
	};

	const nextMonth = () => {
		setCurrentMonth(currentMonth.clone().subtract(1, 'jMonth'));
	};

	// Function to go to today's date
	const goToToday = () => {
		const todayDate = jMoment().locale('fa');
		setSelectedDate(todayDate.clone());
		setCurrentMonth(todayDate.clone().startOf('jMonth'));
	};
	const handleSelectToday = () => {
		const todayDate = jMoment().locale('fa');
		setSelectedDate(todayDate.clone());
		setToToday(); // Use the store's dedicated function
		setIsOpen(false);
	};

	// Generate calendar days for current month
	const generateCalendar = (month: jMoment.Moment) => {
		const startOfMonth = month.clone().startOf('jMonth');
		const endOfMonth = month.clone().endOf('jMonth');

		// Find the first day of the month and adjust for Persian calendar (Saturday is first day)
		let dayOfWeek = startOfMonth.day();
		// Convert to Persian calendar day index (Saturday=0, Sunday=1, ..., Friday=6)
		dayOfWeek = (dayOfWeek + 1) % 7;

		const daysInMonth = endOfMonth.jDate();

		// Create an array for all days in the grid
		const allDays = [];

		// Add empty cells for days before the start of month
		for (let i = 0; i < dayOfWeek; i++) {
			allDays.push(
				<div key={`blank-${i}`} className="xs:w-8 xs:h-8 sm:w-11 sm:h-11 md:w-10 md:h-10 lg:w-9 lg:h-9 xl:w-10 xl:h-10"></div>
			);
		}

		// Add days of the month
		for (let i = 1; i <= daysInMonth; i++) {
			const date = month.clone().jDate(i);
			const isToday = date.isSame(jMoment().locale('fa'), 'day');
			const isSelected = selectedDate ? date.isSame(selectedDate, 'day') : false;
			const isPastDate = date.isBefore(jMoment().locale('fa'), 'day');
			const isWeekend = isFriday(date);
			const isDateHoliday = isHoliday(date);

			allDays.push(
				<div
					key={`day-${i}`}
					className={cn(
						"xs:w-8 xs:h-8 sm:w-11 sm:h-11 md:w-10 md:h-10 lg:w-9 lg:h-9 xl:w-10 xl:h-10 rounded-md flex items-center justify-center xs:text-xs sm:text-sm md:text-sm lg:text-xs xl:text-sm cursor-pointer",
						isSelected ? "bg-[#0D5990] text-white" : "hover:bg-gray-100",
						isToday ? "border border-accent" : "",
						isPastDate ? "text-gray-300 cursor-not-allowed hover:bg-transparent" : "",
						(isWeekend || isDateHoliday) && !isSelected && !isPastDate ? "text-red-500" : "",
						isDateHoliday && !isSelected && !isPastDate ? "font-semibold" : ""
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

		// Process days to create weeks in the correct order for RTL display
		for (let i = 0; i < allDays.length; i++) {
			if (i > 0 && i % 7 === 0) {
				weeks.push([...week]);
				week = [];
			}
			week.push(allDays[i]);
		}

		// Add the last week if it's not complete
		if (week.length > 0) {
			weeks.push([...week]);
		}

		return weeks;
	};

	const generateNextMonthCalendar = () => {
		return generateCalendar(currentMonth.clone().add(1, 'jMonth'));
	}

	// useEffect(() => {
	// 	const savedDate = localStorage.getItem("TravelDate");
	// 	if (savedDate) {
	// 		// Parse the saved date and set it as the selected date
	// 		const parsedDate = jMoment(savedDate, "jYYYYjMMjDD");

	// 		const parsedDateString = parsedDate.format("jYYYYjMMjDD");

	// 		if (parsedDate.isValid()) {
	// 			setSelectedDate(parsedDate);
	// 		}
	// 	}
	// }, []);
	// useEffect(() => {
	// 	// Don't auto-initialize travel date
	// 	// Just check for localStorage if needed for backward compatibility
	// 	const localStorageDate = localStorage.getItem("TravelDate");
	// 	if (localStorageDate && !travelDate && !wasManuallyCleared) {
	// 		// Only set from localStorage if no date in store and not manually cleared
	// 		setTravelDate(localStorageDate);
	// 		console.log("Restored date from localStorage:", localStorageDate);
	// 	}
	// 	// Mark as initialized to prevent further auto-initialization
	// 	markAsInitialized();
	// }, []);

	// // Let's also add a debug effect to help troubleshoot
	// useEffect(() => {
	// 	console.log("TravelDateStore state:", {
	// 		travelDate,
	// 		wasManuallyCleared,
	// 		isDateValid: isDateValid(),
	// 		isInitialized
	// 	});
	// }, [travelDate, wasManuallyCleared, isDateValid]);

	// Keep local state in sync with store changes


	// Debug logging
	useEffect(() => {
		if (hasInitialized) return;

		// console.log("DatePickerBig initializing...");
		// console.log("Initial state:", { travelDate, wasManuallyCleared });

		// Check if we have valid date in store
		if (travelDate && isDateValid()) {
			// console.log("Using valid date from store:", travelDate);
			const momentDate = getTravelDateAsMoment();
			if (momentDate) {
				setSelectedDate(momentDate);
				setCurrentMonth(momentDate.clone().startOf('jMonth'));
			}
		}
		// Only try localStorage if not manually cleared
		else if (!wasManuallyCleared) {
			// Try localStorage for backward compatibility
			const localStorageDate = localStorage.getItem("TravelDate");
			// console.log("Checking localStorage:", localStorageDate);

			if (localStorageDate) {
				try {
					const parsedDate = jMoment(localStorageDate, "jYYYYjMMjDD").locale('fa');
					if (parsedDate.isValid()) {
						// console.log("Using date from localStorage:", localStorageDate);
						setTravelDate(localStorageDate);
						setSelectedDate(parsedDate);
						setCurrentMonth(parsedDate.clone().startOf('jMonth'));
					}
				} catch (error) {
					console.error("Failed to parse localStorage date:", error);
				}
			}

			// IMPORTANT: Do NOT set to today if no date found
			// This is a key change - we want "زمان سفر" to show if no date
		}

		setHasInitialized(true);
	}, []);
	useEffect(() => {
		// Only sync if already initialized
		if (!hasInitialized) return;

		if (travelDate && isDateValid()) {
			const momentDate = getTravelDateAsMoment();
			if (momentDate) {
				setSelectedDate(momentDate);
			}
		} else {
			// If store has no valid date, clear local state too
			setSelectedDate(null);
		}
	}, [travelDate, isDateValid, hasInitialized]);

	return (
		<div className="w-full max-w-md">
			<Popover open={isOpen} onOpenChange={setIsOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						className="xs:w-[250px] sm:w-[400px] md:w-[124px] lg:w-[175px] xl:w-[220px] xs:h-[48px] sm:h-[48px] md:h-[31px] lg:h-[37px] xl:h-[48px] bg-white justify-end text-center hover:bg-gray-100"
					>
						<div className="text-black">
							{selectedDate && travelDate && isDateValid()
								? <p className="font-IranYekanRegular xs:text-xs sm:text-sm md:text-xs lg:text-sm xl:text-base">{toPersianNumbers(selectedDate.format("jYYYY/jMM/jDD"))}</p>
								: <p className="font-IranYekanRegular xs:text-xs sm:text-sm md:text-xs lg:text-sm xl:text-base">زمان سفر</p>}
						</div>
						<Icon icon="solar:calendar-linear" className="xs:w-5 xs:h-5 sm:w-6 sm:h-6 md:w-5 md:h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6" />
					</Button>
				</PopoverTrigger>

				<PopoverContent
					className="w-auto p-0 overflow-hidden xs:max-w-[280px] xs:h-[340px] sm:max-w-[400px] sm:h-[460px] md:max-w-[300px] md:h-[420px] lg:max-w-[450px] lg:h-[398px] xl:max-w-[580px] xl:h-[428px] xs:ml-20 sm:ml-40 md:ml-60 lg:ml-64 xl:ml-64"
					align="start"
					alignOffset={0}
					dir="rtl"
					side="bottom"
					sideOffset={5}
					avoidCollisions={false}
					collisionPadding={{ top: 8, right: 8, bottom: 8, left: 8 }}
					style={{ width: '100%' }}
				>
					<div className="relative rounded-md border h-full flex flex-col">
						{/* Navigation buttons */}
						<div className="flex justify-between items-center px-3 xs:py-1.5 sm:py-2.5 md:py-2 lg:py-3 xl:py-3 border-b">
							<Button
								variant="outline"
								size="icon"
								className="border rounded-full xs:w-6 xs:h-6 sm:w-8 sm:h-8 md:w-8 md:h-8 lg:w-7 lg:h-7 xl:w-8 xl:h-8 hover:bg-gray-100"
								onClick={nextMonth}
							>
								<ChevronRight className="xs:h-3 xs:w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-4 lg:w-4 xl:h-5 xl:w-5" />
							</Button>

							<div className="text-center xs:text-sm sm:text-base md:text-base lg:text-base xl:text-lg font-IranYekanBold">
								{`${PERSIAN_MONTHS[currentMonth.jMonth()]} ${toPersianNum(currentMonth.jYear())}`}
							</div>

							<Button
								variant="outline"
								size="icon"
								className="border rounded-full xs:w-6 xs:h-6 sm:w-8 sm:h-8 md:w-8 md:h-8 lg:w-7 lg:h-7 xl:w-8 xl:h-8 hover:bg-gray-100"
								onClick={previousMonth}
							>
								<ChevronLeft className="xs:h-3 xs:w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-4 lg:w-4 xl:h-5 xl:w-5" />
							</Button>
						</div>

						{/* Important: Wrap the calendars in a container with flex-direction: row */}
						{/* For RTL, the first child will be on the right and the second on the left */}
						<div
							className="flex flex-col lg:flex-row xs:h-[calc(100%-82px)] sm:h-[calc(100%-90px)] md:h-[calc(100%-96px)] lg:h-[calc(100%-100px)] xl:h-[calc(100%-104px)] xs:p-2 sm:p-3 md:p-3 lg:p-4 xl:p-4 flex-grow"
							style={{ direction: 'rtl' }}
						>
							{/* Current Month - Will appear on the right in RTL on lg+ screens */}
							<div className="flex-1 flex flex-col">
								{/* Month title */}
								<div className="text-center font-IranYekanBold xs:text-xs sm:text-sm md:text-base lg:text-sm xl:text-base xs:mb-1 sm:mb-2 md:mb-2 lg:mb-3 xl:mb-3">
									{`${PERSIAN_MONTHS[currentMonth.jMonth()]} ${toPersianNum(currentMonth.jYear())}`}
								</div>

								{/* Weekday headers */}
								<div className="grid grid-cols-7 xs:mb-0.5 sm:mb-1.5 md:mb-1 lg:mb-2 xl:mb-2 font-IranYekanRegular">
									{PERSIAN_WEEKDAYS_SHORT.map((day, index) => (
										<div
											key={index}
											className={cn(
												"text-center xs:text-[9px] sm:text-xs md:text-xs lg:text-[10px] xl:text-xs font-medium",
												index === 6 ? "text-red-500" : "text-muted-foreground" // Friday (index 6) in red
											)}
										>
											{day}
										</div>
									))}
								</div>

								{/* Calendar grid */}
								<div className="grid grid-cols-7 gap-0.5 font-IranYekanRegular justify-items-center">
									{generateCalendar(currentMonth).map((week, weekIndex) => (
										<React.Fragment key={weekIndex}>
											{week.map((day, dayIndex) => (
												<React.Fragment key={dayIndex}>{day}</React.Fragment>
											))}
										</React.Fragment>
									))}
								</div>
							</div>

							{/* Next Month - Only shows on lg and larger screens */}
							<div className="flex-1 flex flex-col lg:pr-4 xl:pr-6 hidden lg:flex lg:border-r">
								<div className="text-center font-IranYekanBold lg:text-sm xl:text-base xs:mb-1 sm:mb-2 md:mb-2 lg:mb-3 xl:mb-3">
									{`${PERSIAN_MONTHS[currentMonth.clone().add(1, 'jMonth').jMonth()]} ${toPersianNum(currentMonth.clone().add(1, 'jMonth').jYear())}`}
								</div>

								{/* Weekday headers */}
								<div className="grid grid-cols-7 xs:mb-0.5 sm:mb-1.5 md:mb-1 lg:mb-2 xl:mb-2 font-IranYekanRegular">
									{PERSIAN_WEEKDAYS_SHORT.map((day, index) => (
										<div
											key={index}
											className={cn(
												"text-center lg:text-[10px] xl:text-xs font-medium",
												index === 6 ? "text-red-500" : "text-muted-foreground" // Friday (index 6) in red
											)}
										>
											{day}
										</div>
									))}
								</div>

								{/* Calendar grid */}
								<div className="grid grid-cols-7 gap-0.5 font-IranYekanRegular justify-items-center">
									{generateNextMonthCalendar().map((week, weekIndex) => (
										<React.Fragment key={weekIndex}>
											{week.map((day, dayIndex) => (
												<React.Fragment key={dayIndex}>{day}</React.Fragment>
											))}
										</React.Fragment>
									))}
								</div>
							</div>
						</div>

						{/* Today button and current date display at bottom */}
						<div className="border-t  xs:py-1.5 sm:py-2 md:py-2 lg:py-2 xl:py-2 xs:px-2 sm:px-4 md:px-4 lg:px-4 xl:px-4 flex items-center justify-between">
							<div className="flex xs:gap-3 sm:gap-3 md:gap-3 lg:gap-2 xl:gap-2">
								<Button
									variant="outline"
									className="rounded-md xs:py-0.5 sm:py-1 md:py-1 lg:py-1 xl:py-1 xs:px-1.5 sm:px-3 md:px-3 lg:px-3 xl:px-3 font-IranYekanRegular text-[#0D5990] hover:bg-gray-50 border-[#0D5990] xs:text-[10px] sm:text-xs md:text-xs lg:text-xs xl:text-sm"
									onClick={goToToday}
								>
									برو به امروز
								</Button>

								<Button
									variant="default"
									className="rounded-md xs:py-0.5 sm:py-1 md:py-1 lg:py-1 xl:py-1 xs:px-1.5 sm:px-3 md:px-3 lg:px-3 xl:px-3 font-IranYekanRegular bg-[#0D5990] hover:bg-[#094675] text-white xs:text-[10px] sm:text-xs md:text-xs lg:text-xs xl:text-sm"
									onClick={handleSelectToday}
								>
									انتخاب امروز
								</Button>
							</div>

							<div className="flex items-center gap-1 xs:hidden sm:flex md:hidden lg:flex xl:flex">
								<span className="text-muted-foreground font-IranYekanRegular sm:text-xs lg:text-xs xl:text-sm">امروز:</span>
								<span className="font-IranYekanMedium sm:text-xs lg:text-xs xl:text-sm">
									{today.format('dddd')} {toPersianNum(today.jDate())} {PERSIAN_MONTHS[today.jMonth()]} {toPersianNum(today.jYear())}
								</span>
							</div>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
}

export default DatePickerBig;


