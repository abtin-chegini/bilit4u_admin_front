"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import moment from "jalali-moment";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouteInfoWithIds } from '@/lib/RouteMapData';
import numberConvertor from "@/lib/numberConvertor";
import { useToast } from "@/hooks/use-toast";
import { formatDurationToPersian } from "@/lib/durationFormatter";

// Import utility function or define it inline
const toPersianDigits = (input: string | number): string => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return input.toString().replace(/\d/g, (match) => persianDigits[parseInt(match)]);
};

// Convert Persian digits to English
const toEnglishDigits = (input: string): string => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    let result = input;
    persianDigits.forEach((persian, index) => {
        result = result.replace(new RegExp(persian, 'g'), index.toString());
    });
    return result;
};

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
    ArrivalTime?: string;
    ArrivalDate?: string;
    TravelDuration?: string;
}

// Interface for order data
export interface OrderData {
    refNum: string;
    passengers: {
        id: number;
        name: string;
        seatNo: string;
        nationalCode?: string;
        gender?: boolean;
    }[];
    isPastTrip?: boolean;
    status?: string;
    factorUrl?: string;
}

interface TicketCardSmProps {
    ticketDetails: ServiceDetails;
    orderData?: OrderData; // Made optional for backward compatibility
    busCapacity?: number;
    isDimmed?: boolean; // For refunded tickets
}

// Helper function to extract time
const extractTime = (timeStr?: string): string => {
    if (!timeStr) return "۱۰:۳۰"; // Default fallback time

    // If it's already in the correct time format (HH:MM), just convert to Persian digits
    if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
        return toPersianDigits(timeStr);
    }

    // Try to extract time from the timeStr in case it's a datetime string
    try {
        // For date strings that might have a time component
        const parsedTime = moment(timeStr);
        if (parsedTime.isValid()) {
            return toPersianDigits(parsedTime.format("HH:mm"));
        }
    } catch (error) {
        // console.error("Error parsing time:", error);
    }

    return "۱۰:۳۰";
};

// City name to city code mapping - Add more as needed
const cityNameToCodeMap: { [key: string]: string } = {
    'تهران': 'THR',
    'شیراز': 'SHZ',
    'اصفهان': 'IFH',
    'مشهد': 'MSH',
    'تبریز': 'TBZ',
    'اهواز': 'AWZ',
    'کرمان': 'KER',
    'یزد': 'YZD',
    'قم': 'QOM',
    'کرج': 'KRJ',
    'رشت': 'RST',
    'ساری': 'SAR',
    'بابل': 'BAB',
    'گرگان': 'GOR',
    'زاهدان': 'ZAH',
    'بندرعباس': 'BND',
    'کیش': 'KIS',
    'بوشهر': 'BSH',
    'همدان': 'HAM',
    'کرمانشاه': 'KRM',
    'سنندج': 'SNJ',
    'ارومیه': 'URM',
    'اردبیل': 'ARD',
    'قزوین': 'QAZ',
    'زنجان': 'ZAN',
    'ایلام': 'ILA',
    'لرستان': 'LOR',
    'خوزستان': 'KHU',
    'فارس': 'FAR',
    'کردستان': 'KUR',
    'آذربایجان شرقی': 'AZE',
    'آذربایجان غربی': 'AZW',
    'اصفهان استان': 'ISF'
};

// Helper function to get city code from city name
const getCityCodeFromName = (cityName: string): string => {
    // First try direct lookup
    if (cityNameToCodeMap[cityName]) {
        return cityNameToCodeMap[cityName];
    }

    // Try partial matching
    const normalizedName = cityName.trim();
    for (const [name, code] of Object.entries(cityNameToCodeMap)) {
        if (name.includes(normalizedName) || normalizedName.includes(name)) {
            return code;
        }
    }

    // If no match found, create a code from the first 3 characters
    return normalizedName.substring(0, 3).toUpperCase();
};

const TicketCardSm: React.FC<TicketCardSmProps> = ({ ticketDetails, orderData, busCapacity = 44, isDimmed = false }) => {
    const router = useRouter();
    const { toast } = useToast();
    const [openAmenities, setOpenAmenities] = useState(false);
    const [openRefundRules, setOpenRefundRules] = useState(false);

    // Handle ticket download
    const handleDownloadTicket = () => {
        try {
            // Check if orderData and factorUrl exist
            if (!orderData?.factorUrl) {
                toast({
                    title: "خطا در دانلود بلیط",
                    description: "آدرس فاکتور در دسترس نیست. لطفاً مجدداً تلاش کنید.",
                    variant: "destructive",
                });
                return;
            }

            // Open the factor URL in a new window
            window.open(orderData.factorUrl, '_blank');

            // Show success toast
            toast({
                title: "بلیت باز شد",
                description: "بلیت شما در پنجره جدید باز شد.",
                variant: "default",
            });
        } catch (error) {
            console.error('Error opening ticket:', error);

            // Error toast
            toast({
                title: "خطا در دانلود بلیط",
                description: "خطایی در باز کردن بلیت رخ داد. لطفاً مجدداً تلاش کنید.",
                variant: "destructive",
            });
        }
    };

    // console.log("TicketCardSm rendered with ticketDetails:", ticketDetails);
    // console.log("Order data:", orderData);

    // Ensure city codes have values - use fallback logic
    const srcCityCode = useMemo(() => {
        if (ticketDetails?.SrcCityCode && ticketDetails.SrcCityCode.trim() !== '') {
            return ticketDetails.SrcCityCode;
        }
        // Fallback to SrcCityId if available
        if (ticketDetails?.SrcCityId && ticketDetails.SrcCityId.trim() !== '') {
            return ticketDetails.SrcCityId;
        }
        // Fallback to generating from city name
        if (ticketDetails?.SrcCityName && ticketDetails.SrcCityName.trim() !== '') {
            return getCityCodeFromName(ticketDetails.SrcCityName);
        }
        return 'THR'; // Default fallback
    }, [ticketDetails?.SrcCityCode, ticketDetails?.SrcCityId, ticketDetails?.SrcCityName]);

    const desCityCode = useMemo(() => {
        if (ticketDetails?.DesCityCode && ticketDetails.DesCityCode.trim() !== '') {
            return ticketDetails.DesCityCode;
        }
        // Fallback to DesCityId if available
        if (ticketDetails?.DesCityId && ticketDetails.DesCityId.trim() !== '') {
            return ticketDetails.DesCityId;
        }
        // Fallback to generating from city name
        if (ticketDetails?.DesCityName && ticketDetails.DesCityName.trim() !== '') {
            return getCityCodeFromName(ticketDetails.DesCityName);
        }
        return 'SHZ'; // Default fallback
    }, [ticketDetails?.DesCityCode, ticketDetails?.DesCityId, ticketDetails?.DesCityName]);

    // Get route information using the ensured city codes
    const routeInfo = useRouteInfoWithIds(srcCityCode, desCityCode);

    // Debug logging
    // console.log('Source City Code:', srcCityCode);
    // console.log('Destination City Code:', desCityCode);
    // console.log('Route Info:', routeInfo);

    // Duration formatting moved to shared utility: /lib/durationFormatter.ts

    // Fixed Persian date parsing function for format like ۱۴۰۴/۰۴/۱۰
    const parsePersianDate = (persianDate: string) => {
        try {
            // console.log('Input Persian date:', persianDate);

            // Convert Persian digits to English digits first
            const englishDate = toEnglishDigits(persianDate);
            // console.log('Converted to English digits:', englishDate);

            // Split the date - it's in YYYY/MM/DD format
            const parts = englishDate.split('/');
            if (parts.length !== 3) {
                throw new Error('Invalid date format');
            }

            const [year, month, day] = parts.map(Number);
            // console.log('Parsed values - Year:', year, 'Month:', month, 'Day:', day);

            // Validate the values
            if (year < 1300 || year > 1500) {
                throw new Error(`Invalid Jalali year: ${year}`);
            }
            if (month < 1 || month > 12) {
                throw new Error(`Invalid Jalali month: ${month}`);
            }
            if (day < 1 || day > 31) {
                throw new Error(`Invalid Jalali day: ${day}`);
            }

            // Create jalali moment from Persian date
            const jMoment = moment().jYear(year).jMonth(month - 1).jDate(day).startOf('day');
            // console.log('Created moment:', jMoment.format('jYYYY/jMM/jDD'));

            return jMoment;
        } catch (error) {
            // console.error('Error parsing Persian date:', error, 'Input:', persianDate);
            return moment();
        }
    };

    // Format Persian date to readable format (input format: YYYY/MM/DD)
    const formatPersianDateToReadable = (persianDate: string | undefined) => {
        if (!persianDate) return 'نامشخص';

        try {
            // console.log('Formatting Persian date to readable:', persianDate);

            // Convert Persian digits to English first
            const englishDate = toEnglishDigits(persianDate);

            // Split the date - it's in YYYY/MM/DD format
            const parts = englishDate.split('/');
            if (parts.length !== 3) {
                throw new Error('Invalid date format');
            }

            const [year, month, day] = parts.map(Number);

            // Persian month names
            const persianMonths = [
                'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
                'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
            ];

            const persianYearStr = numberConvertor(year.toString());
            const persianDayStr = numberConvertor(day.toString());
            const persianMonthName = persianMonths[month - 1];

            const result = `${persianDayStr} ${persianMonthName} ${persianYearStr}`;
            // console.log('Formatted result:', result);

            return result;
        } catch (error) {
            // console.error('Error formatting Persian date:', error);
            return 'نامشخص';
        }
    };

    // Calculate arrival time function with proper 24-hour format
    const calculateArrivalTime = (departTime: string | undefined, duration: string | null) => {
        if (!departTime || !duration) {
            return 'نامشخص';
        }

        try {
            // Convert Persian digits to English for calculation
            const englishDepartTime = toEnglishDigits(departTime);

            // Parse departure time
            const [dHours, dMinutes] = englishDepartTime.split(':').map(Number);

            // Parse duration
            const [durHours, durMinutes] = duration.split(':').map(Number);

            // console.log(`Departure: ${dHours}:${dMinutes}, Duration: ${durHours}:${durMinutes}`);

            // Calculate total minutes from departure
            const totalDepartMinutes = dHours * 60 + dMinutes;
            const totalDurationMinutes = durHours * 60 + durMinutes;
            const totalArrivalMinutes = totalDepartMinutes + totalDurationMinutes;

            // Convert back to hours and minutes (handle 24-hour overflow)
            const arrivalHours = Math.floor(totalArrivalMinutes / 60) % 24;
            const arrivalMinutes = totalArrivalMinutes % 60;

            // console.log(`Calculated arrival: ${arrivalHours}:${arrivalMinutes}`);

            const result = `${numberConvertor(arrivalHours.toString().padStart(2, '0'))}:${numberConvertor(arrivalMinutes.toString().padStart(2, '0'))}`;

            return result;
        } catch (error) {
            // console.error('Error calculating arrival time:', error);
            return 'نامشخص';
        }
    };

    // Calculate arrival date using Persian date input with proper 24-hour handling
    const calculateArrivalDate = (departDate: string | undefined, departTime: string | undefined, duration: string | null) => {
        if (!departDate || !departTime || !duration) {
            return 'نامشخص';
        }

        try {
            // Convert Persian digits to English for calculation
            const englishDepartTime = toEnglishDigits(departTime);

            // Parse departure time
            const [dHours, dMinutes] = englishDepartTime.split(':').map(Number);

            // Parse duration
            const [durHours, durMinutes] = duration.split(':').map(Number);

            // console.log(`Calculating arrival date - Depart: ${dHours}:${dMinutes}, Duration: ${durHours}:${durMinutes}`);

            // Parse Persian date and create departure moment
            const departMoment = parsePersianDate(departDate);

            // Set the exact departure time
            departMoment.hours(dHours).minutes(dMinutes).seconds(0);

            // console.log('Departure moment:', departMoment.format('jYYYY/jMM/jDD HH:mm'));

            // Add duration to get arrival moment
            const arrivalMoment = departMoment.clone().add(durHours, 'hours').add(durMinutes, 'minutes');

            // console.log('Arrival moment:', arrivalMoment.format('jYYYY/jMM/jDD HH:mm'));

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

            // console.log('Final arrival date:', result);

            return result;
        } catch (error) {
            // console.error('Error calculating arrival date:', error);
            return 'نامشخص';
        }
    };

    // Calculate all the values - use API values if available, otherwise calculate
    const formattedDuration = ticketDetails?.TravelDuration || formatDurationToPersian(routeInfo.duration);
    const arrivalTime = ticketDetails?.ArrivalTime || calculateArrivalTime(ticketDetails?.DepartTime, routeInfo.duration);
    const arrivalDate = ticketDetails?.ArrivalDate ? formatPersianDateToReadable(ticketDetails.ArrivalDate) : calculateArrivalDate(ticketDetails?.DepartDate, ticketDetails?.DepartTime, routeInfo.duration);
    const departureDate = formatPersianDateToReadable(ticketDetails?.DepartDate);

    // Seat availability calculations
    const availableSeats = parseInt(ticketDetails?.Cnt ?? "0");
    const totalSeats = busCapacity;
    const isFullCapacity = availableSeats === 0;

    // Check if we have order data with passengers
    const hasPassengers = orderData && orderData.passengers && orderData.passengers.length > 0;

    // Get the first passenger (for single passenger display)
    const passenger = hasPassengers ? orderData?.passengers[0] : null;

    // Calculate feature count
    const featureCount = useMemo(() => {
        if (!ticketDetails) return 0;

        let count = 0;
        if (ticketDetails.IsBed) count++;
        if (ticketDetails.IsMonitor) count++;
        if (ticketDetails.IsCharger) count++;
        if (ticketDetails.IsVIP) count++;
        if (ticketDetails.IsSofa) count++;
        if (ticketDetails.IsMono) count++;
        if (ticketDetails.IsAirConditionType) count++;

        return count;
    }, [ticketDetails]);

    // Format date
    const formatDate = (dateStr?: string): string => {
        if (!dateStr) return "نامشخص";

        // Check if the date string is in DD/MM/YYYY format
        const ddmmyyyyPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        // Check if the date string is already in YYYY/MM/DD format
        const yyyymmddPattern = /^(\d{4})\/(\d{2})\/(\d{2})$/;

        // Check for Persian digits format (both patterns)
        const persianDdmmyyyyPattern = /^[۰-۹]{2}\/[۰-۹]{2}\/[۰-۹]{4}$/;
        const persianYyyymmddPattern = /^[۰-۹]{4}\/[۰-۹]{2}\/[۰-۹]{2}$/;

        try {
            // If it's already in Persian YYYY/MM/DD format, return as is
            if (persianYyyymmddPattern.test(dateStr)) {
                return dateStr;
            }

            // If it's in Persian DD/MM/YYYY format, reverse it
            if (persianDdmmyyyyPattern.test(dateStr)) {
                // Convert Persian to English digits for manipulation
                const englishDigits = dateStr.replace(/[۰-۹]/g, (d) =>
                    String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
                );

                const parts = englishDigits.split('/');
                const reversed = `${parts[2]}/${parts[1]}/${parts[0]}`;

                // Convert back to Persian digits
                return toPersianDigits(reversed);
            }

            // If it's in DD/MM/YYYY format, convert to YYYY/MM/DD
            if (ddmmyyyyPattern.test(dateStr)) {
                const matches = dateStr.match(ddmmyyyyPattern);
                if (matches) {
                    const [_, day, month, year] = matches;
                    return toPersianDigits(`${year}/${month}/${day}`);
                }
            }

            // If it's already in YYYY/MM/DD format, just convert digits
            if (yyyymmddPattern.test(dateStr)) {
                return toPersianDigits(dateStr);
            }

            // For other date formats, try to parse with moment
            const momentDate = moment(dateStr);
            if (momentDate.isValid()) {
                return toPersianDigits(momentDate.format('YYYY/MM/DD'));
            }

            return toPersianDigits(dateStr);
        } catch (error) {
            // console.error('Error formatting date:', error);
            return toPersianDigits(dateStr);
        }
    };

    // Format price
    const formatPrice = (priceStr?: string) => {
        if (!priceStr) return "0";
        const price = parseInt(priceStr);
        return toPersianDigits((price / 10).toLocaleString());
    };

    return (
        <>
            {/* Card sized to fit TicketCardManager status section */}
            <div className={`block md:hidden lg:hidden mx-0.5 relative h-[280px] border rounded-lg shadow-md ${isDimmed ? 'bg-gray-100 border-gray-300 opacity-60' : 'bg-white border-[#CCD6E1]'}`}>
                {/* Top ticket */}
                <div
                    className="w-full flex h-[88%] bg-white rounded-t-lg overflow-hidden border-b border-[#CCD6E1]"
                    style={{
                        backgroundImage: "url('https://cdn.bilit4u.com/images/ticket-bg.svg')",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                >
                    {/* Main ticket content */}
                    <div className="relative w-full h-full px-3">
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
                        <div className="flex justify-between items-start w-full mt-2 px-2">
                            {/* Origin */}
                            <div className="flex flex-col items-center text-center min-w-0 flex-1">
                                <div className="text-[#9D9A9A] text-[9px] font-IranYekanRegular mb-1">
                                    مبدا
                                </div>
                                <div
                                    className="font-IranYekanBold text-[12px] mb-1 text-[#0D5990]"
                                    style={{ direction: "ltr" }}
                                >
                                    {numberConvertor(ticketDetails?.DepartTime || "10:30")}
                                </div>
                                <div className="font-IranYekanRegular text-[#000000] text-[8px] mb-1 leading-tight">
                                    {departureDate}
                                </div>
                                <div className="text-[#9D9A9A] text-[8px] font-IranYekanRegular leading-tight">
                                    {ticketDetails?.SrcCityName || "تهران"}
                                </div>
                            </div>

                            {/* Journey duration with "زمان تقریبی" text */}
                            <div className="flex flex-col items-center text-center px-2 flex-1">
                                {/* "زمان تقریبی" text above the curve */}
                                <div className="text-[#7A7A7A] text-[7px] font-IranYekanRegular mb-1">
                                    زمان تقریبی
                                </div>

                                <div className="relative w-full h-[40px]">
                                    {/* Full-width dotted line like ticket-card-lg */}
                                    <div className="absolute top-1/2 left-0 w-full border-t-2 border-dashed border-[#0D5990] -translate-y-1/2" />

                                    {/* Start point dot */}
                                    <div className="absolute w-2 h-2 bg-[#0D5990] rounded-full top-1/2 left-0 -translate-y-1/2" />

                                    {/* End point dot */}
                                    <div className="absolute w-2 h-2 bg-[#0D5990] rounded-full top-1/2 right-0 -translate-y-1/2" />

                                    {/* Duration time curve in center */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#E8F2FC] text-[#0D5990] px-2 py-[2px] rounded-full font-IranYekanRegular text-[7px] border border-[#CCD6E1] min-w-[90px] max-w-[120px] text-center whitespace-nowrap">
                                        {formattedDuration}
                                    </div>
                                </div>

                                {/* Distance below the curve */}
                                <div className="mt-1 text-center text-[#323232] text-[7px] font-IranYekanLight">
                                    {routeInfo.formattedDistance}
                                </div>
                            </div>

                            {/* Destination */}
                            <div className="flex flex-col items-center text-center min-w-0 flex-1">
                                <div className="text-[#9D9A9A] text-[9px] font-IranYekanRegular mb-1">
                                    مقصد
                                </div>
                                <div
                                    className="font-IranYekanBold text-[12px] mb-1 text-[#0D5990]"
                                    style={{ direction: "ltr" }}
                                >
                                    {arrivalTime}
                                </div>
                                <div className="font-IranYekanRegular text-[#000000] text-[8px] mb-1 leading-tight">
                                    {arrivalDate}
                                </div>
                                <div className="text-[#9D9A9A] text-[8px] font-IranYekanRegular leading-tight">
                                    {ticketDetails?.DesCityName || "شیراز"}
                                </div>
                            </div>
                        </div>

                        {/* Passenger information (show when hasPassengers) */}
                        {hasPassengers && passenger && (
                            <div className="w-full flex justify-center items-center px-3 sm:px-6 gap-2 sm:gap-4 mt-1">
                                <div className="w-full bg-[#E8F2FC] rounded-lg px-2 py-1 border border-[#CCD6E1]">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-[#0D5990] flex items-center justify-center text-white text-[8px]">
                                                {passenger.gender !== undefined ? (
                                                    passenger.gender ? "آ" : "خ"
                                                ) : "م"}
                                            </div>
                                            <span className="text-[9px] sm:text-[10px] font-IranYekanBold text-[#0D5990] truncate max-w-[80px]">
                                                {passenger.name}
                                            </span>
                                        </div>
                                        <span className="text-[9px] sm:text-[10px] font-IranYekanBold text-[#0D5990]">
                                            صندلی {toPersianDigits(passenger.seatNo)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Bus type and availability section (show when no passengers) */}
                        {!hasPassengers && (
                            <div className="w-full flex justify-between items-center px-3 sm:px-6 gap-2 sm:gap-4 mt-1">
                                <div className="w-full">
                                    <button
                                        className="
                                            bg-[#ECF4FC]
                                            text-[#0D5990]
                                            border
                                            border-[#CCD6E1]
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
                                            `${toPersianDigits(availableSeats.toString())} صندلی خالی`
                                        }
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Buttons for amenities, refund rules, download, and routes */}
                        <div className="w-full grid grid-cols-2 gap-1 px-3 sm:px-6 mt-1 mb-2">
                            {/* Amenities button with notification badge */}
                            <Dialog open={openAmenities} onOpenChange={setOpenAmenities}>
                                <DialogTrigger asChild>
                                    <button
                                        className="
                                            bg-white
                                            text-[#0D5990]
                                            border
                                            border-[#CCD6E1]
                                            shadow-sm
                                            rounded-lg   
                                            px-2 py-1
                                            font-IranYekanRegular
                                            text-[8px] sm:text-[9px]
                                            hover:bg-gray-50  
                                            transition-colors
                                            duration-200
                                            relative
                                        "
                                    >
                                        امکانات
                                        {/* Feature count notification badge */}
                                        {featureCount > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-[#0D5990] text-white text-[6px] font-IranYekanBold rounded-full w-3 h-3 flex items-center justify-center">
                                                {toPersianDigits(featureCount)}
                                            </span>
                                        )}
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px] font-IranYekanRegular" dir="rtl">
                                    <DialogHeader>
                                        <DialogTitle className="text-center text-[#0D5990] font-IranYekanBold text-[14px]">
                                            امکانات اتوبوس ({toPersianDigits(featureCount)} مورد)
                                        </DialogTitle>
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
                                                <span className="text-[12px]">VIP</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-4 h-4 rounded-full border ${ticketDetails?.IsSofa ? "bg-[#0D5990]" : "bg-gray-200"}`}></div>
                                                <span className="text-[12px]">صندلی مبلی</span>
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

                            {/* Refund Rules button */}
                            <Dialog open={openRefundRules} onOpenChange={setOpenRefundRules}>
                                <DialogTrigger asChild>
                                    <button
                                        className="
                                            bg-white
                                            text-[#0D5990]
                                            border
                                            border-[#CCD6E1]
                                            shadow-sm
                                            rounded-lg   
                                            px-2 py-1
                                            font-IranYekanRegular
                                            text-[8px] sm:text-[9px]
                                            hover:bg-gray-50  
                                            transition-colors
                                            duration-200
                                        "
                                    >
                                        قوانین استرداد
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px] font-IranYekanRegular" dir="rtl">
                                    <DialogHeader>
                                        <DialogTitle className="text-center text-[#0D5990] font-IranYekanBold text-[14px]">قوانین استرداد بلیط</DialogTitle>
                                    </DialogHeader>

                                    {/* Warning */}
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                                        <div className="flex items-start gap-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600 mt-0.5 flex-shrink-0">
                                                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                                                <path d="M12 9v4" />
                                                <path d="M12 17h.01" />
                                            </svg>
                                            <div>
                                                <p className="text-sm font-IranYekanBold text-yellow-800 mb-1">توجه</p>
                                                <p className="text-xs text-yellow-700 font-IranYekanRegular">
                                                    درخواست استرداد ممکن است شامل کسورات قانونی باشد. مبلغ نهایی استرداد پس از بررسی اعلام خواهد شد.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 py-2">
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-2">
                                                <div className="w-2 h-2 bg-[#0D5990] rounded-full mt-2 flex-shrink-0"></div>
                                                <p className="text-xs text-gray-700">استرداد بلیط حداکثر تا ۲ ساعت قبل از حرکت امکان‌پذیر است</p>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <div className="w-2 h-2 bg-[#0D5990] rounded-full mt-2 flex-shrink-0"></div>
                                                <p className="text-xs text-gray-700">در صورت استرداد، کسورات طبق مقررات اعمال خواهد شد</p>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <div className="w-2 h-2 bg-[#0D5990] rounded-full mt-2 flex-shrink-0"></div>
                                                <p className="text-xs text-gray-700">مبلغ استرداد حداکثر ظرف ۷۲ ساعت به حساب شما برگردانده می‌شود</p>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <div className="w-2 h-2 bg-[#0D5990] rounded-full mt-2 flex-shrink-0"></div>
                                                <p className="text-xs text-gray-700">برای استرداد بلیط، شماره پیگیری الزامی است</p>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <div className="w-2 h-2 bg-[#0D5990] rounded-full mt-2 flex-shrink-0"></div>
                                                <p className="text-xs text-gray-700">در صورت تاخیر یا کنسلی سفر توسط شرکت، کل مبلغ بدون کسورات بازگردانده می‌شود</p>
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

                            {/* Download Ticket Button */}
                            {orderData?.factorUrl && (
                                <button
                                    onClick={handleDownloadTicket}
                                    className="
                                        bg-white
                                        text-[#0D5990]
                                        border
                                        border-[#CCD6E1]
                                        shadow-sm
                                        rounded-lg   
                                        px-2 py-1
                                        font-IranYekanRegular
                                        text-[8px] sm:text-[9px]
                                        hover:bg-gray-50  
                                        transition-colors
                                        duration-200
                                    "
                                >
                                    دانلود بلیط
                                </button>
                            )}

                            {/* Routes Button */}
                            <button
                                onClick={() => {
                                    toast({
                                        title: "در حال بروزرسانی",
                                        description: "در حال بروزرسانی هستیم",
                                        variant: "default",
                                    });
                                }}
                                className="
                                    bg-white
                                    text-[#0D5990]
                                    border
                                    border-[#CCD6E1]
                                    shadow-sm
                                    rounded-lg   
                                    px-2 py-1
                                    font-IranYekanRegular
                                    text-[8px] sm:text-[9px]
                                    hover:bg-gray-50  
                                    transition-colors
                                    duration-200
                                "
                            >
                                مسیرها
                            </button>
                        </div>
                    </div>
                </div>

                {/* Price section - minimal spacing with bottom margin */}
                <div className="w-full px-3 py-1 mb-3 flex items-center justify-center min-h-[16px]">
                    <div className="flex items-center justify-center text-[#0D5990] font-IranYekanBold text-[14px] gap-1">
                        <span>قیمت</span>
                        <span>{formatPrice(ticketDetails?.FullPrice)}</span>
                        <span className="text-[12px]">تومان</span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TicketCardSm;