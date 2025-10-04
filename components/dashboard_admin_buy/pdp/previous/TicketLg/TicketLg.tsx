"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import moment from "jalali-moment";
import ClockIcon from "@/components/ui/icons_custom/ClockIcon";
import numberConvertor from "@/lib/numberConvertor";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useRouteInfoWithIds } from '@/lib/RouteMapData';

interface TicketLgProps {
	ticketDetails: ServiceDetails | null;
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

const TicketLg: React.FC<TicketLgProps> = ({ ticketDetails }) => {
	const router = useRouter();

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

			const result = `${numberConvertor(arrivalHours.toString().padStart(2, '0'))}:${numberConvertor(arrivalMinutes.toString().padStart(2, '0'))}`;

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
	const totalSeats = 44; // Total capacity
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
		<div className="hidden md:block relative bg-white h-[370px] border border-[#CCD6E1] rounded-lg shadow-md">
			<div className="flex flex-col space-y-4 absolute left-[35%] lg:left-[32%] z-40">
				<span className="h-[20px] w-[2px] bg-[#0D5990]"></span>
				<span className="h-[20px] w-[2px] bg-[#0D5990]"></span>
				<span className="h-[20px] w-[2px] bg-[#0D5990]"></span>
				<span className="h-[20px] w-[2px] bg-[#0D5990]"></span>
				<span className="h-[20px] w-[2px] bg-[#0D5990]"></span>
				<span className="h-[20px] w-[2px] bg-[#0D5990]"></span>
				<span className="h-[20px] w-[2px] bg-[#0D5990]"></span>
				<span className="h-[20px] w-[2px] bg-[#0D5990]"></span>
				<span className="h-[20px] w-[2px] bg-[#0D5990]"></span>
				<span className="h-[10px] w-[2px] bg-[#0D5990]"></span>
			</div>
			<div
				className="
                absolute left-[30%] z-40 
                -top-[1px] 
                w-[50px] h-[25px] 
                bg-white 
                border-b border-l border-r border-[#CCD6E1] 
                rounded-b-full
                       overflow-hidden
                  "
			></div>
			<div
				className="
                absolute left-[30%] z-50
                -bottom-[1px] 
                w-[50px] h-[25px] 
                bg-white
                border-t border-l border-r border-[#CCD6E1] 
                rounded-t-full
                  "
				style={{
					boxShadow: `
                      inset 0 4px 6px -2px rgba(0,0,0,0.15),   /* top inner gray shadow */
                      inset 0 -4px 6px -2px #ffffff,          /* bottom inner white */
                      0 7px 6px 2px #ffffff                     /* outer white glow */
                    `,
				}}
			></div>

			{/* top ticket */}
			<div className="w-full flex h-[25%] bg-[#ECF4FC] rounded-t-lg border-b-[1px] border-[#CCD6E1] overflow-hidden">
				{/* top right ticket */}
				<div className="relative w-[66.5%]  h-full">
					<div className="w-full h-full flex items-center gap-8 justify-start pr-8 text-[#000000] font-IranYekanRegular text-[14px]">
						<div>
							<Image
								src={ticketDetails?.LogoUrl || "https://cdn.bilit4u.com/images/CardBackground.png"}
								alt={ticketDetails?.CoName || "لوگو"}
								width={78}
								height={47}
								className=" max-w-full h-auto object-contain"
							/>
						</div>
						<h6>{ticketDetails?.CoName || "شرکت اتوبوسرانی"}</h6>
					</div>
				</div>
				{/* top left ticket */}
				<div className="w-[33.5%]  h-full">
					<div className="flex items-center justify-end gap-6 pl-6 w-full h-full">
						<div>
							<svg
								className="cursor-pointer"
								width="14"
								height="18"
								viewBox="0 0 14 18"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M12 0H2C0.9 0 0 0.9 0 2V18L7 15L14 18V2C14 0.9 13.1 0 12 0ZM12 15L7 12.82L2 15V2H12V15Z"
									fill="#0D5990"
								/>
							</svg>
						</div>
						<div>
							<svg
								className="cursor-pointer"
								width="24"
								height="15"
								viewBox="0 0 24 15"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M7 3V0L0 7L7 14V11L3 7L7 3ZM13 4V0L6 7L13 14V9.9C18 9.9 21.5 11.5 24 15C23 10 20 5 13 4Z"
									fill="#0D5990"
								/>
							</svg>
						</div>
					</div>
				</div>
			</div>

			{/* bottom ticket */}
			<div
				className="w-full flex h-[75%] bg-white rounded-b-lg overflow-hidden"
				style={{ backgroundImage: "url('https://cdn.bilit4u.com/images/CardBackground.png')" }}
			>
				{/* bottom right ticket */}
				<div className="relative w-[66.5%]  h-full">
					<div className="flex justify-center mt-8 w-full mb-6">
						<div className="w-[30%] text-center">
							<div className="text-[#9D9A9A] text-[12px] font-IranYekanRegular mb-2">مبدا</div>
							<div className="font-IranYekanBold text-[14px] mb-1" style={{ direction: "ltr" }}>
								{numberConvertor(ticketDetails?.DepartTime || "10:30")}
							</div>
							<div className="font-IranYekanRegular text-[#000000] text-[14px] mb-2">
								{departureDate}
							</div>
							<div className="text-[#9D9A9A] text-[12px] font-IranYekanRegular">
								{ticketDetails?.SrcCityName || "تهران"}
							</div>
						</div>

						{/* Updated curve section with "زمان تقریبی" text and bigger size */}
						<div className="w-[40%] text-center">
							{/* "زمان تقریبی" text above the curve */}
							<div className="text-[#7A7A7A] text-[12px] font-IranYekanRegular ">
								زمان تقریبی
							</div>

							{/* Bigger curve section for desktop */}
							<div className="relative w-full h-[80px]">
								<div className="absolute top-1/2 left-0 w-full border-t-2 border-dashed border-[#0D5990] -translate-y-1/2 scale-x-110" />

								<div className="absolute w-5 h-5 bg-[#0D5990] rounded-full top-1/2 left-0 -translate-y-1/2" />

								<div className="absolute w-5 h-5 bg-[#0D5990] rounded-full top-1/2 right-0 -translate-y-1/2" />

								<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#E8F2FC] text-[#0D5990] px-4 py-2 rounded-full font-IranYekanBold text-[12px] border border-[#CCD6E1] min-w-[140px] text-center">
									{formattedDuration}
								</div>
							</div>

							{/* Bigger distance below the curve */}
							<div className=" text-center text-[#323232] text-[12px] font-IranYekanLight">
								{routeInfo.formattedDistance}
							</div>
						</div>

						<div className="w-[30%] text-center">
							<div className="text-[#9D9A9A] text-[12px] font-IranYekanRegular mb-2">مقصد</div>
							<div className="font-IranYekanBold text-[14px] mb-1" style={{ direction: "ltr" }}>
								{arrivalTime}
							</div>
							<div className="font-IranYekanRegular text-[#000000] text-[14px] mb-2">
								{arrivalDate}
							</div>
							<div className="text-[#9D9A9A] text-[12px] font-IranYekanRegular">
								{ticketDetails?.DesCityName}
							</div>
						</div>
					</div>
					<div className="border border-[#CCD6E1] rounded-md shadow-sm bg-white px-6 py-2 flex items-center justify-between w-[85%] mx-auto">
						{/* Right side: features */}
						<div className="flex flex-col gap-y-4 justify-between w-[64%] lg:w-[50%]">
							{/* Features container */}
							<div className="flex items-center justify-start gap-4">
								{/* Bed feature */}
								{ticketDetails?.IsBed && (
									<div className="flex items-center gap-2">
										<svg
											width="21"
											height="20"
											viewBox="0 0 21 20"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												d="M4.87956 10.8333C5.52956 10.8333 6.17122 10.5833 6.66289 10.0833C7.62956 9.09167 7.61289 7.51667 6.62956 6.55C6.13789 6.075 5.50456 5.83333 4.87956 5.83333C4.22956 5.83333 3.58789 6.08333 3.09622 6.58333C2.12956 7.575 2.14622 9.15 3.12956 10.1167C3.62122 10.5917 4.25456 10.8333 4.87956 10.8333ZM4.28789 7.75C4.44622 7.59167 4.65456 7.5 4.87956 7.5C5.09622 7.5 5.30456 7.58333 5.46289 7.73333C5.79622 8.05833 5.79622 8.575 5.47956 8.90833C5.31289 9.075 5.10456 9.16667 4.87956 9.16667C4.66289 9.16667 4.45456 9.08333 4.29622 8.93333C3.96289 8.6 3.96289 8.08333 4.28789 7.75ZM15.7129 5.83333H8.21289V10.8333H19.0462V9.16667C19.0462 7.325 17.5546 5.83333 15.7129 5.83333ZM9.87956 9.16667V7.5H15.7129C16.6296 7.5 17.3796 8.25 17.3796 9.16667H9.87956ZM2.37956 13.3333H7.37956H14.0462H19.0462V11.6667H2.37956V13.3333Z"
												fill="#0D5990"
											/>
										</svg>
										<span className="text-[12px] lg:text-[14px] text-gray-700 font-IranYekanRegular">
											تخت خواب شو
										</span>
									</div>
								)}

								{/* Monitor feature */}
								{ticketDetails?.IsMonitor && (
									<div className="flex items-center gap-2">
										<svg
											width="19"
											height="17"
											viewBox="0 0 19 17"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												d="M17.2129 0.166992H2.21293C1.29626 0.166992 0.546265 0.916992 0.546265 1.83366V11.8337C0.546265 12.7503 1.29626 13.5003 2.21293 13.5003H8.04626V15.167H6.3796V16.8337H13.0463V15.167H11.3796V13.5003H17.2129C18.1296 13.5003 18.8796 12.7503 18.8796 11.8337V1.83366C18.8796 0.916992 18.1296 0.166992 17.2129 0.166992ZM17.2129 11.8337H2.21293V1.83366H17.2129V11.8337Z"
												fill="#0D5990"
											/>
										</svg>
										<span className="text-[12px] lg:text-[14px] text-gray-700 font-IranYekanRegular">
											مانیتور
										</span>
									</div>
								)}

								{/* Charger feature */}
								{ticketDetails?.IsCharger && (
									<div className="flex items-center gap-2">
										<svg
											width="11"
											height="16"
											viewBox="0 0 11 16"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												d="M9.04622 5.5V9.38333L6.12956 12.3083V13.8333H5.29622V12.3083L2.37956 9.375V5.5H9.04622ZM9.04622 0.5H7.37956V3.83333H4.04622V0.5H2.37956V3.83333H2.37122C1.46289 3.825 0.712891 4.575 0.712891 5.48333V10.0833L3.62956 13V15.5H7.79622V13L10.7129 10.075V5.5C10.7129 4.58333 9.96289 3.83333 9.04622 3.83333V0.5Z"
												fill="#0D5990"
											/>
										</svg>
										<span className="text-[12px] lg:text-[14px] text-gray-700 font-IranYekanRegular">
											پریز شارژ
										</span>
									</div>
								)}
							</div>
						</div>

						<div className="flex w-[130px] lg:w-[150px] flex-col gap-y-2">
							<div className="flex items-center gap-x-4">
								<div className={isFullCapacity ? "text-gray-400 font-semibold" : "text-[#0D5990] font-IranYekanRegular"}>
									{isFullCapacity ? (
										"ظرفیت تکمیل"
									) : (
										<>
											{numberConvertor(availableSeats.toString())}{" "}
											صندلی خالی
										</>
									)}
								</div>
								<svg
									width="17"
									height="16"
									viewBox="0 0 17 16"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
									className={isFullCapacity ? "text-gray-400 opacity-60" : "text-[#0D5990]"}
								>
									<path
										d="M2.90164 3.19492C2.15 2.66159 1.96627 1.62826 2.49242 0.869924C3.01856 0.119924 4.0625 -0.0634089 4.82249 0.461591C5.57413 0.994924 5.75786 2.02826 5.23172 2.78659C4.69722 3.53659 3.66163 3.71992 2.90164 3.19492V3.19492ZM11.796 14.3283H5.89149C4.65546 14.3283 3.60317 13.4283 3.41944 12.2116L1.77419 4.32826H0.103882L1.76583 12.4616C2.08319 14.4949 3.83701 15.9949 5.89984 15.9949H11.796V14.3283ZM11.9881 10.9949H7.91256L7.05235 7.57826C8.37189 8.31992 9.79165 8.86159 11.3534 8.59492V6.81992C9.99209 7.07826 8.48046 6.59492 7.43652 5.77826L6.06687 4.71992C5.87478 4.56992 5.65764 4.46992 5.43215 4.40326C5.16491 4.32826 4.88095 4.30326 4.60535 4.35326H4.58865C3.56141 4.53659 2.87659 5.51159 3.05197 6.52826L4.17943 11.4616C4.41327 12.6449 5.44051 13.4949 6.64312 13.4949H12.3639L15.5542 15.9949L16.8069 14.7449L11.9881 10.9949Z"
										fill="currentColor"
									/>
								</svg>
							</div>
							{/* Progress bar */}
							<div className="bg-[#ECF4FC] shadow-1 h-2 rounded-lg overflow-hidden relative">
								<div
									className={`h-full rounded-lg ${isFullCapacity ? "bg-gray-300" : "bg-[#0D5990]"}`}
									style={{
										width: isFullCapacity ? "100%" : `${filledPercentage}%`,
										position: 'absolute',
										left: 0,
										top: 0,
									}}
								/>
							</div>
						</div>
					</div>
				</div>
				{/* bottom left ticket */}
				<div className="w-[33.5%]  h-full">
					<div className="flex flex-col items-center px-8 lg:px-16 py-6 w-full h-full">
						<div className="w-full">
							<motion.button
								onClick={() => router.back()}
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								className="
      bg-[#0D5990]
      text-white
      w-full
      rounded-lg   
      px-6 py-2
      font-IranYekanRegular
      text-[15px]
      transition-colors
      duration-200
      mb-4
      hover:bg-[#0D5990]/90
      flex
      items-center
      justify-center
    "
							>
								تغییر بلیط
							</motion.button>
						</div>
						<div className="w-full">
							<button
								className="
                        bg-[#CCD6E1]
                        text-[#000000]                           
                        w-full
                        rounded-lg   
                        px-6 py-2
                        font-IranYekanRegular
                        text-[13px]                         
                        transition-colors
                        duration-200
                        mb-4
                      "
							>
								{ticketDetails?.BusType}
							</button>
						</div>
						<div className="w-full mb-6">
							<div className="flex items-center gap-2">
								<h6 className="text-[10px] font-IranYekanRegular">
									{isDepartingSoon && (
										<div className="flex items-center gap-x-2">
											<ClockIcon className="text-red-500 w-4 h-4" />
											<div className="text-red-500 text-xs font-IranYekanBold">
												{numberConvertor(minutesLeft.toString())} دقیقه تا حرکت
											</div>
										</div>
									)}
								</h6>
							</div>
						</div>
						<div className="w-full flex gap-4 items-center justify-between">
							<div className="flex items-center justify-center">
								<div className="text-[#9D9A9A] text-[14px] font-IranYekanRegular mb-2">
									قیمت هر صندلی
								</div>
							</div>
							<div className="flex text-[#0D5990] items-center gap-2 text-center justify-center font-IranYekanBold text-[14px]">
								<div className="">{formatPrice(ticketDetails?.FullPrice)}</div>
								<div className="">تومان</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div >
	);
};

export default TicketLg;