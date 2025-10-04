"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import moment from "jalali-moment";
import ClockIcon from "@/components/ui/icons_custom/ClockIcon";
import numberConvertor from "@/lib/numberConvertor";
import { useRouter } from "next/navigation";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
	DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouteInfoWithIds } from '@/lib/RouteMapData';

interface TicketMdProps {
	ticketDetails: ServiceDetails | null;
	busCapacity?: number; // Add this prop for bus capacity
}

export interface ServiceDetails {
	ServiceNo: string;
	DepartDate: string;
	DepartTime: string;
	Price: string;
	Description: string | null;
	LogoUrl: string;
	IsCharger: boolean;
	IsMonitor: boolean;
	IsBed: boolean;
	IsVIP: boolean;
	IsSofa: boolean;
	IsMono: boolean;
	IsAirConditionType: boolean;
	SrcCityCode: string;
	DesCityCode: string;
	SrcCityName: string;
	DesCityName: string;
	Cnt: string;
	FullPrice: string;
	CoName: string;
	Group: string;
	BusType: string;
	BusTypeFull: string;
	RequestToken: string;
	TicketNo: string;
	Timestamp: string;
	SrcCityId?: string;
	DesCityId?: string;
}

const TicketMd: React.FC<TicketMdProps> = ({ ticketDetails, busCapacity = 44 }) => {
	const router = useRouter();
	const [openAmenities, setOpenAmenities] = useState(false);
	const [openStops, setOpenStops] = useState(false);

	// Get route information using city IDs from data
	const routeInfo = useRouteInfoWithIds(ticketDetails?.SrcCityCode, ticketDetails?.DesCityCode);

	// Format duration to Persian with hours and minutes
	const formatDurationToPersian = (duration: string | null) => {
		if (!duration) return 'نامشخص';

		try {
			const [hours, minutes] = duration.split(':').map(Number);
			const persianHours = numberConvertor(hours.toString());
			const persianMinutes = numberConvertor(minutes.toString());

			if (hours > 0 && minutes > 0) {
				return `${persianHours} ساعت و ${persianMinutes} دقیقه`;
			} else if (hours > 0) {
				return `${persianHours} ساعت`;
			} else if (minutes > 0) {
				return `${persianMinutes} دقیقه`;
			}
			return 'نامشخص';
		} catch (error) {
			return 'نامشخص';
		}
	};

	// Parse Persian date format (DD/MM/YYYY) and convert to moment
	const parsePersianDate = (persianDate: string) => {
		try {
			// Split the Persian date (format: DD/MM/YYYY)
			const [day, month, year] = persianDate.split('/').map(Number);

			// Create jalali moment from Persian date
			const jMoment = moment().jYear(year).jMonth(month - 1).jDate(day).startOf('day');

			return jMoment;
		} catch (error) {
			console.error('Error parsing Persian date:', error);
			return moment();
		}
	};

	// Format Persian date to readable format
	const formatPersianDateToReadable = (persianDate: string | undefined) => {
		if (!persianDate) return 'نامشخص';

		try {
			const [day, month, year] = persianDate.split('/').map(Number);

			// Persian month names
			const persianMonths = [
				'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
				'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
			];

			const persianYearStr = numberConvertor(year.toString());
			const persianDayStr = numberConvertor(day.toString());
			const persianMonthName = persianMonths[month - 1];

			return `${persianDayStr} ${persianMonthName} ${persianYearStr}`;
		} catch (error) {
			console.error('Error formatting Persian date:', error);
			return 'نامشخص';
		}
	};

	// Calculate arrival time function
	const calculateArrivalTime = (departTime: string | undefined, duration: string | null) => {
		if (!departTime || !duration) {
			return 'نامشخص';
		}

		try {
			// Parse departure time
			const [dHours, dMinutes] = departTime.split(':').map(Number);
			// Parse duration
			const [durHours, durMinutes] = duration.split(':').map(Number);

			// Create moment objects for calculation
			const departMoment = moment().startOf('day').hours(dHours).minutes(dMinutes);
			const arrivalMoment = departMoment.clone().add(durHours, 'hours').add(durMinutes, 'minutes');

			const arrivalHours = arrivalMoment.hours();
			const arrivalMinutes = arrivalMoment.minutes();

			const result = `${numberConvertor(arrivalHours.toString().padStart(2, '0'))} : ${numberConvertor(arrivalMinutes.toString().padStart(2, '0'))}`;

			return result;
		} catch (error) {
			console.error('Error calculating arrival time:', error);
			return 'نامشخص';
		}
	};

	// Calculate arrival date using Persian date input
	const calculateArrivalDate = (departDate: string | undefined, departTime: string | undefined, duration: string | null) => {
		if (!departDate || !departTime || !duration) {
			return 'نامشخص';
		}

		try {
			// Parse departure time
			const [dHours, dMinutes] = departTime.split(':').map(Number);
			// Parse duration
			const [durHours, durMinutes] = duration.split(':').map(Number);

			// Parse Persian date and create departure moment
			const departMoment = parsePersianDate(departDate).hours(dHours).minutes(dMinutes);

			// Add duration to get arrival moment
			const arrivalMoment = departMoment.clone().add(durHours, 'hours').add(durMinutes, 'minutes');

			// Format the arrival date in Persian
			const arrivalYear = arrivalMoment.jYear();
			const arrivalMonth = arrivalMoment.jMonth() + 1; // jMonth is 0-based
			const arrivalDay = arrivalMoment.jDate();

			// Persian month names
			const persianMonths = [
				'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
				'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
			];

			const persianYearStr = numberConvertor(arrivalYear.toString());
			const persianDayStr = numberConvertor(arrivalDay.toString());
			const persianMonthName = persianMonths[arrivalMonth - 1];

			const result = `${persianDayStr} ${persianMonthName} ${persianYearStr}`;

			return result;
		} catch (error) {
			console.error('Error calculating arrival date:', error);
			return 'نامشخص';
		}
	};

	// Calculate all the values
	const formattedDuration = formatDurationToPersian(routeInfo.duration);
	const arrivalTime = calculateArrivalTime(ticketDetails?.DepartTime, routeInfo.duration);
	const arrivalDate = calculateArrivalDate(ticketDetails?.DepartDate, ticketDetails?.DepartTime, routeInfo.duration);
	const departureDate = formatPersianDateToReadable(ticketDetails?.DepartDate);

	// Seat availability calculations
	const availableSeats = parseInt(ticketDetails?.Cnt ?? "0");
	const totalSeats = busCapacity; // Use the busCapacity prop instead of hardcoded value
	const filledPercentage = ((totalSeats - availableSeats) / totalSeats * 100);
	const isFullCapacity = availableSeats === 0;

	// Departure countdown calculation
	const departureInfo = useMemo(() => {
		if (!ticketDetails?.DepartDate || !ticketDetails?.DepartTime) {
			return { isDepartingSoon: false, minutesLeft: 0 };
		}

		try {
			const departTimeStr = ticketDetails.DepartTime;
			const departDateStr = ticketDetails.DepartDate;

			// Parse the Persian departure date
			const departMoment = parsePersianDate(departDateStr);
			const [dHours, dMinutes] = departTimeStr.split(':').map(Number);
			departMoment.hours(dHours).minutes(dMinutes).seconds(0);

			const currentMoment = moment();

			const diffMinutes = departMoment.diff(currentMoment, 'minutes');

			return {
				isDepartingSoon: diffMinutes >= 0 && diffMinutes <= 30,
				minutesLeft: diffMinutes
			};
		} catch (error) {
			console.error('Error calculating departure info:', error);
			return { isDepartingSoon: false, minutesLeft: 0 };
		}
	}, [ticketDetails?.DepartDate, ticketDetails?.DepartTime]);

	const { isDepartingSoon, minutesLeft } = departureInfo;

	// Format price
	const formatPrice = (priceStr?: string) => {
		if (!priceStr) return "0";
		const price = parseInt(priceStr);
		return numberConvertor((price / 10).toLocaleString());
	};

	return (
		<div className="block md:hidden lg:hidden mx-2 relative bg-white h-[310px] border border-[#CCD6E1] rounded-lg shadow-md">
			{/* Top ticket */}
			<div
				className="w-full flex h-[75%] bg-white rounded-t-lg overflow-hidden border-b border-[#CCD6E1]"
				style={{
					backgroundImage: "url('https://cdn.bilit4u.com/images/ticket-bg.svg')",
					backgroundSize: "cover",
					backgroundPosition: "center",
				}}
			>
				{/* Main ticket content */}
				<div className="relative w-full h-full px-2">
					{/* Header section with company logo */}
					<div className="w-full flex h-[18%] rounded-t-lg overflow-hidden py-2 sm:py-3">
						<div className="relative w-full h-full">
							<div className="w-full h-full flex items-center gap-2 justify-start pr-2 sm:pr-4 text-[#000000] font-IranYekanRegular">
								{/* Logo container with responsive sizing */}
								<div className="flex-shrink-0 flex items-center justify-center w-[40px] sm:w-[50px] h-[26px] sm:h-[30px]">
									<Image
										src={ticketDetails?.LogoUrl || "https://cdn.bilit4u.com/images/CardBackground.png"}
										alt={ticketDetails?.CoName || "لوگو"}
										width={40}
										height={26}
										className="rounded-md shadow-sm max-w-full max-h-full object-contain"
									/>
								</div>
								<h6 className="text-[10px] sm:text-[11px] truncate max-w-[110px]">
									{ticketDetails?.CoName || "شرکت اتوبوسرانی"}
								</h6>
							</div>
						</div>
					</div>

					{/* Origin-Destination section */}
					<div className="flex justify-center items-center w-full mt-1">
						{/* Origin */}
						<div className="w-[35%] text-center">
							<div className="text-[#9D9A9A] text-[10px] sm:text-[11px] font-IranYekanRegular mb-1 sm:mb-2">
								مبدا
							</div>
							<div
								className="font-IranYekanBold text-[10px] sm:text-[11px] mb-1"
								style={{ direction: "ltr" }}
							>
								{numberConvertor(ticketDetails?.DepartTime || "10:30")}
							</div>
							<div className="font-IranYekanRegular text-[#000000] text-[9px] sm:text-[10px] mb-1 sm:mb-2">
								{departureDate}
							</div>
							<div className="text-[#9D9A9A] text-[9px] sm:text-[10px] font-IranYekanRegular">
								{ticketDetails?.SrcCityName || "تهران"}
							</div>
						</div>

						{/* Journey duration with "زمان تقریبی" text */}
						<div className="w-[30%] text-center">
							{/* "زمان تقریبی" text above the curve */}
							<div className="text-[#7A7A7A] text-[8px] sm:text-[9px] font-IranYekanRegular  ">
								زمان تقریبی
							</div>

							<div className="relative w-full h-[40px] ">
								<div className="absolute top-1/2 left-0 w-full border-t-2 border-dashed border-[#0D5990] -translate-y-1/2" />

								<div className="absolute w-2 h-2 bg-[#0D5990] rounded-full top-1/2 left-0 -translate-y-1/2" />

								<div className="absolute w-2 h-2 bg-[#0D5990] rounded-full top-1/2 right-0 -translate-y-1/2" />

								<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#E8F2FC] text-[#0D5990] px-2 py-1 rounded-full font-IranYekanRegular text-[7px] sm:text-[8px] border border-[#CCD6E1] min-w-[60px] sm:min-w-[70px] text-center">
									{formattedDuration}
								</div>
							</div>

							{/* Distance below the curve */}
							<div className=" text-center text-[#323232] text-[7px] sm:text-[8px] font-IranYekanLight">
								{routeInfo.formattedDistance}
							</div>
						</div>

						{/* Destination */}
						<div className="w-[35%] text-center">
							<div className="text-[#9D9A9A] text-[10px] sm:text-[11px] font-IranYekanRegular mb-1 sm:mb-2">
								مقصد
							</div>
							<div
								className="font-IranYekanBold text-[10px] sm:text-[11px] mb-1"
								style={{ direction: "ltr" }}
							>
								{arrivalTime}
							</div>
							<div className="font-IranYekanRegular text-[#000000] text-[9px] sm:text-[10px] mb-1">
								{arrivalDate}
							</div>
							<div className="text-[#9D9A9A] text-[9px] sm:text-[10px] font-IranYekanRegular">
								{ticketDetails?.DesCityName || "شیراز"}
							</div>
						</div>
					</div>

					{/* Bus type and availability section */}
					<div className="w-full flex justify-between items-center px-3 sm:px-6 gap-2 sm:gap-4 mt-2">
						<div className="w-full">
							<button
								className="
                                    bg-white
                                    text-[#0D5990]
                                    border
                                    border-[#CCD6E1]
                                    !bg-[#ECF4FC]
                                    shadow-sm
                                    w-full
                                    rounded-lg   
                                    px-1 sm:px-3 py-1
                                    font-IranYekanRegular
                                    text-[9px] sm:text-[10px]
                                    hover:bg-gray-50  
                                    transition-colors
                                    duration-200
                                "
							>
								{ticketDetails?.BusType || "نوع اتوبوس"}
							</button>
						</div>

						{/* Available seats */}
						<div className="w-full">
							<div className={`text-[9px] sm:text-[10px] font-IranYekanRegular text-center py-1 px-1 rounded-lg border border-[#CCD6E1] ${isFullCapacity ? "text-gray-400" : "text-[#0D5990]"}`}>
								{isFullCapacity ?
									"ظرفیت تکمیل" :
									`${numberConvertor(availableSeats.toString())} صندلی خالی`
								}
							</div>
						</div>
					</div>

					{/* New buttons for amenities and stops list */}
					<div className="w-full flex justify-between items-center px-3 sm:px-6 gap-2 sm:gap-4 mt-2">
						{/* Amenities button */}
						<Dialog open={openAmenities} onOpenChange={setOpenAmenities}>
							<DialogTrigger asChild>
								<button
									className="
                                        bg-white
                                        text-[#0D5990]
                                        border
                                        border-[#CCD6E1]
                                        !bg-white
                                        shadow-sm
                                        w-full
                                        rounded-lg   
                                        px-1 sm:px-3 py-1
                                        font-IranYekanRegular
                                        text-[9px] sm:text-[10px]
                                        hover:bg-gray-50  
                                        transition-colors
                                        duration-200
                                    "
								>
									امکانات
								</button>
							</DialogTrigger>
							<DialogContent className="sm:max-w-[425px] font-IranYekanRegular" dir="rtl">
								<DialogHeader>
									<DialogTitle className="text-center text-[#0D5990] font-IranYekanBold text-[14px]">امکانات اتوبوس</DialogTitle>
								</DialogHeader>
								<div className="grid gap-3 py-4">
									<div className="grid grid-cols-2 gap-y-2 gap-x-4">
										<div className="flex items-center gap-2">
											<div className={`w-4 h-4 rounded-full border ${ticketDetails?.IsBed ? "bg-[#0D5990]" : "bg-gray-200"}`}></div>
											<span className="text-[12px]">صندلی تختخوابشو</span>
										</div>
										<div className="flex items-center gap-2">
											<div className={`w-4 h-4 rounded-full border ${ticketDetails?.IsMonitor ? "bg-[#0D5990]" : "bg-gray-200"}`}></div>
											<span className="text-[12px]">مانیتور</span>
										</div>
										<div className="flex items-center gap-2">
											<div className={`w-4 h-4 rounded-full border ${ticketDetails?.IsCharger ? "bg-[#0D5990]" : "bg-gray-200"}`}></div>
											<span className="text-[12px]">شارژر موبایل</span>
										</div>
										<div className="flex items-center gap-2">
											<div className={`w-4 h-4 rounded-full border ${ticketDetails?.IsVIP ? "bg-[#0D5990]" : "bg-gray-200"}`}></div>
											<span className="text-[12px]">  VIP </span>
										</div>
										<div className="flex items-center gap-2">
											<div className={`w-4 h-4 rounded-full border ${ticketDetails?.IsSofa ? "bg-[#0D5990]" : "bg-gray-200"}`}></div>
											<span className="text-[12px]"> صندلی مبلی</span>
										</div>
										<div className="flex items-center gap-2">
											<div className={`w-4 h-4 rounded-full border ${ticketDetails?.IsMono ? "bg-[#0D5990]" : "bg-gray-200"}`}></div>
											<span className="text-[12px]">تک صندلی</span>
										</div>
										<div className="flex items-center gap-2">
											<div className={`w-4 h-4 rounded-full border ${ticketDetails?.IsAirConditionType ? "bg-[#0D5990]" : "bg-gray-200"}`}></div>
											<span className="text-[12px]">تهویه مطبوع</span>
										</div>
									</div>
								</div>
								<DialogFooter>
									<DialogClose asChild>
										<Button
											variant="outline"
											className="w-full bg-[#0D5990] text-white hover:bg-[#0D5990]/90"
										>
											بستن
										</Button>
									</DialogClose>
								</DialogFooter>
							</DialogContent>
						</Dialog>

						{/* Stops list button */}
						<Dialog open={openStops} onOpenChange={setOpenStops}>
							<DialogTrigger asChild>
								<button
									className="
        bg-white
        text-[#0D5990]
        border
        border-[#CCD6E1]
        !bg-white
        shadow-sm
        w-full
        rounded-lg   
        px-1 sm:px-3 py-1
        font-IranYekanRegular
        text-[9px] sm:text-[10px]
        hover:bg-gray-50  
        transition-colors
        duration-200
      "
								>
									لیست توقف‌ها
								</button>
							</DialogTrigger>
							<DialogContent className="sm:max-w-[425px] font-IranYekanRegular" dir="rtl">
								<DialogHeader>
									<DialogTitle className="text-center text-[#0D5990] font-IranYekanBold text-[14px]">لیست توقف‌های مسیر</DialogTitle>
								</DialogHeader>
								<div className="py-8 flex flex-col items-center justify-center">
									{/* Updated message */}
									<div className="text-center">
										<svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										<h3 className="mt-2 text-[14px] font-IranYekanBold text-gray-700">در حال بروزرسانی هستیم</h3>
										<p className="mt-1 text-[12px] text-gray-500">به زودی اطلاعات دقیق توقف‌ها در دسترس قرار خواهد گرفت.</p>
									</div>
								</div>
								<DialogFooter>
									<DialogClose asChild>
										<Button
											variant="outline"
											className="w-full bg-[#0D5990] text-white hover:bg-[#0D5990]/90"
										>
											بستن
										</Button>
									</DialogClose>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</div>

					{/* Departure countdown */}
					{isDepartingSoon && (
						<div className="flex items-center justify-center gap-x-1 sm:gap-x-2 mt-2">
							<ClockIcon className="text-red-500 w-2.5 h-2.5 sm:w-3 sm:h-3" />
							<div className="text-red-500 text-[9px] sm:text-[10px] font-IranYekanBold">
								{numberConvertor(minutesLeft.toString())} دقیقه تا حرکت
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Bottom price and action section */}
			<div className="w-full flex items-center justify-between h-[25%] px-3 sm:px-8 py-4 sm:py-6 bg-[#ECF4FC] rounded-b-lg border-b-[1px] border-[#CCD6E1] overflow-hidden">
				<div className="flex items-center justify-between w-full h-full gap-1 sm:gap-3">
					{/* Price display */}
					<div className="flex flex-col text-center">
						<div className="text-[#5D6974] text-[8px] sm:text-[9px] font-IranYekanRegular mb-0.5 sm:mb-1">
							قیمت برای هر صندلی
						</div>
						<div className="flex items-center justify-center text-[#0D5990] font-IranYekanBold text-[11px] sm:text-[13px] gap-1">
							<span>{formatPrice(ticketDetails?.FullPrice)}</span>
							<span className="text-[9px] sm:text-[10px]">تومان</span>
						</div>
					</div>

					{/* Change ticket button */}
					<div className="flex items-center justify-center">
						<button
							onClick={() => router.back()}
							className="
          bg-[#0D5990]
          text-[#ffffff]                           
          rounded-lg   
          px-2
          w-[70px] sm:w-[85px]                                        
          py-1 sm:py-1.5
          font-IranYekanRegular
          text-[10px] sm:text-[11px]
          transition-colors
          duration-200                                   
        "
						>
							تغییر بلیط
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default TicketMd;