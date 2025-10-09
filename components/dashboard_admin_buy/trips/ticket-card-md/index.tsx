"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import moment from "moment";
import ClockIcon from "@/components/ui/icons_custom/ClockIcon";
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

// Import utility function or define it inline
const toPersianDigits = (input: string | number): string => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return input.toString().replace(/\d/g, (match) => persianDigits[parseInt(match)]);
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
    ArrivalTime?: string;
    ArrivalDate?: string;
    TravelDuration?: string;
}

// New interface for order data
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
}

interface TicketCardMdProps {
    ticketDetails: ServiceDetails;
    orderData?: OrderData; // Made optional for backward compatibility
    busCapacity?: number;
}

// Add this helper function with the other formatting functions
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

    // If we still have a format like "۲۰/۰۳/۱۴۰۴", which is incorrect for time
    // Return a default time
    return "۱۰:۳۰";
};

const TicketCardMd: React.FC<TicketCardMdProps> = ({ ticketDetails, orderData, busCapacity = 44 }) => {
    const router = useRouter();
    const [showAmenities, setShowAmenities] = useState(false);
    const [showRefundRules, setShowRefundRules] = useState(false);

    // Seat availability calculations (used when orderData is not provided)
    const availableSeats = parseInt(ticketDetails?.Cnt ?? "0");
    const totalSeats = busCapacity;
    const filledPercentage = ((totalSeats - availableSeats) / totalSeats * 100);
    const isFullCapacity = availableSeats === 0;

    // Check if we have order data with passengers
    const hasPassengers = orderData && orderData.passengers && orderData.passengers.length > 0;

    // Get the first passenger (for single passenger display)
    const passenger = hasPassengers ? orderData?.passengers[0] : null;

    // Count how many amenities are available
    const amenitiesCount = [
        ticketDetails?.IsCharger,
        ticketDetails?.IsMonitor,
        ticketDetails?.IsBed,
        ticketDetails?.IsVIP,
        ticketDetails?.IsSofa,
        ticketDetails?.IsMono,
        ticketDetails?.IsAirConditionType
    ].filter(Boolean).length;

    // Departure countdown calculation
    const departureInfo = useMemo(() => {
        if (!ticketDetails?.DepartTime) {
            return { isDepartingSoon: false, minutesLeft: 0 };
        }

        const departTimeMoment = moment(ticketDetails.DepartTime, "HH:mm");
        const currentMoment = moment();

        const departHours = departTimeMoment.hours();
        const departMinutes = departTimeMoment.minutes();
        const currentHours = currentMoment.hours();
        const currentMinutes = currentMoment.minutes();

        const departureToday = moment().hours(departHours).minutes(departMinutes).seconds(0);
        const currentTime = moment().hours(currentHours).minutes(currentMinutes).seconds(0);

        const diffMinutes = departureToday.diff(currentTime, 'minutes');

        return {
            isDepartingSoon: diffMinutes >= 0 && diffMinutes <= 30,
            minutesLeft: diffMinutes
        };
    }, [ticketDetails?.DepartTime]);

    const { isDepartingSoon, minutesLeft } = departureInfo;

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

            // If all else fails, return original string with Persian digits
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

    // Calculate refund amount based on departure time
    const calculateRefund = (price: string, percentDeduction: number): string => {
        if (!price) return "0";
        const numPrice = parseInt(price);
        const refundAmount = numPrice - (numPrice * (percentDeduction / 100));
        return toPersianDigits((refundAmount / 10).toLocaleString());
    };

    return (
        <>
            <div className="block md:hidden lg:hidden relative bg-white h-[290px] border border-[#CCD6E1] rounded-lg shadow-md">
                <div
                    className="
                  absolute left-[30%] z-40 
                  -top-[1px] 
                  w-[40px] h-[20px] 
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
                  w-[40px] h-[20px] 
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
                    <div className="relative w-[66.5%] h-full">
                        <span className="absolute -left-[1px] top-[40%] h-[10px] w-[1px] bg-[#0D5990]"></span>
                        <span className="absolute -left-[1px] bottom-0 h-[20px] w-[1px] bg-[#0D5990]"></span>

                        <div className="w-full h-full flex items-center gap-2 justify-start pr-4 text-[#000000] font-IranYekanRegular text-[12px]">
                            <div className="flex-shrink-0 flex items-center justify-center w-[40px] h-[26px]">
                                <Image
                                    src={ticketDetails?.LogoUrl || "https://cdn.bilit4u.com/images/CardBackground.png"}
                                    alt={ticketDetails?.CoName || "لوگو"}
                                    width={40}
                                    height={26}
                                    className="rounded-md shadow-sm max-w-full max-h-full object-contain"
                                />
                            </div>
                            <h6 className="truncate max-w-[110px]">{ticketDetails?.CoName || "شرکت اتوبوسرانی"}</h6>
                        </div>
                    </div>
                    {/* top left ticket */}
                    <div className="w-[33.5%] h-full">
                        <div className="flex items-center justify-end gap-3 pl-3 w-full h-full">
                            <div>
                                <svg
                                    className="cursor-pointer w-3 h-4"
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
                                    className="cursor-pointer w-4 h-3"
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
                    style={{
                        backgroundImage: "url('https://cdn.bilit4u.com/images/ticket-bg.svg')",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                >
                    {/* bottom right ticket */}
                    <div className="relative w-[66.5%] h-full">
                        <span className="absolute -left-[1px] top-[5%] h-[10px] w-[1px] bg-[#0D5990]"></span>
                        <span className="absolute -left-[1px] top-[20%] h-[10px] w-[1px] bg-[#0D5990]"></span>
                        <span className="absolute -left-[1px] top-[35%] h-[10px] w-[1px] bg-[#0D5990]"></span>
                        <span className="absolute -left-[1px] top-[50%] h-[10px] w-[1px] bg-[#0D5990]"></span>
                        <span className="absolute -left-[1px] top-[65%] h-[10px] w-[1px] bg-[#0D5990]"></span>
                        <span className="absolute -left-[1px] bottom-[14%] h-[6px] w-[1px] bg-[#0D5990]"></span>

                        <div className="flex flex-col justify-between w-full h-full px-2 py-2">
                            {/* Journey visualization */}
                            <div className="flex justify-center items-center w-full">
                                <div className="w-[30%] text-center">
                                    <div className="text-[#9D9A9A] text-[10px] font-IranYekanRegular mb-1">
                                        مبدا
                                    </div>
                                    <div
                                        className="font-IranYekanBold text-[10px] mb-1"
                                        style={{ direction: "rtl" }}
                                    >
                                        {extractTime(ticketDetails?.DepartTime || "10:30")}
                                    </div>
                                    <div className="font-IranYekanRegular text-[#000000] text-[9px] mb-1"
                                        style={{ direction: "rtl" }}>
                                        {formatDate(ticketDetails?.DepartDate || "")}
                                    </div>
                                    <div className="text-[#9D9A9A] text-[9px] font-IranYekanRegular">
                                        {ticketDetails?.SrcCityName || "تهران"}
                                    </div>
                                </div>
                                <div className="w-[40%] text-center">
                                    <div className="relative w-full h-[60px]">
                                        <div className="absolute top-1/2 left-0 w-full border-t-2 border-dashed border-[#0D5990] -translate-y-1/2" />
                                        <div className="absolute w-2 h-2 bg-[#0D5990] rounded-full top-1/2 left-0 -translate-y-1/2" />
                                        <div className="absolute w-2 h-2 bg-[#0D5990] rounded-full top-1/2 right-0 -translate-y-1/2" />
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#E8F2FC] text-[#0D5990] px-2 py-[2px] rounded-full font-IranYekanRegular text-[7px] border border-[#CCD6E1]">
                                            حدود ۹ ساعت
                                        </div>
                                        <div className="absolute left-1/2 top-[65%] -translate-x-1/2 mt-1 text-center text-[#323232] text-[6px] font-IranYekanLight">
                                            ۳ توقف در مسیر
                                        </div>
                                    </div>
                                </div>
                                <div className="w-[30%] text-center">
                                    <div className="text-[#9D9A9A] text-[10px] font-IranYekanRegular mb-1">
                                        مقصد
                                    </div>
                                    <div
                                        className="font-IranYekanBold text-[10px] mb-1"
                                        style={{ direction: "rtl" }}
                                    >
                                        {toPersianDigits("19:30")}
                                    </div>
                                    <div className="font-IranYekanRegular text-[#000000] text-[9px] mb-1">
                                        {formatDate(ticketDetails?.DepartDate || "")}
                                    </div>
                                    <div className="text-[#9D9A9A] text-[9px] font-IranYekanRegular">
                                        {ticketDetails?.DesCityName || "شیراز"}
                                    </div>
                                </div>
                            </div>

                            {/* Passenger information */}
                            {passenger && (
                                <div className="mx-3 mb-2 px-2 py-1 bg-[#F8FBFF] border border-[#E1EAF4] rounded-md flex items-center gap-2">
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-IranYekanBold text-gray-800 text-[9px]">
                                                {passenger.name}
                                            </h3>
                                            <span className="bg-[#E8F2FC] text-[#0D5990] px-1.5 py-0.5 rounded-full text-[8px]">
                                                صندلی {toPersianDigits(passenger.seatNo)}
                                            </span>
                                        </div>
                                        {passenger.nationalCode && (
                                            <p className="text-[8px] text-gray-500 mt-0.5">
                                                کد ملی: {toPersianDigits(passenger.nationalCode)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* bottom left ticket */}
                    <div className="w-[33.5%] h-full">
                        <div className="flex flex-col items-center px-2 py-2 w-full h-full">
                            <div className="w-full">
                                <button
                                    onClick={() => setShowRefundRules(true)}
                                    className="
                    bg-white
                    text-[#0D5990]
                    border border-[#CCD6E1]
                    shadow-sm
                    w-full
                    rounded-lg   
                    px-1 py-1
                    font-IranYekanRegular
                    text-[9px]
                    hover:bg-gray-50  
                    transition-colors
                    duration-200
                    mb-2
                  "
                                >
                                    قوانین استرداد
                                </button>
                            </div>
                            <div className="w-full">
                                {/* Amenities button */}
                                <button
                                    onClick={() => setShowAmenities(true)}
                                    className="
                    bg-[#E8F2FC]
                    text-[#0D5990]                           
                    w-full
                    rounded-lg
                    border border-[#CCD6E1]   
                    px-1 py-1
                    font-IranYekanRegular
                    text-[9px]
                    hover:bg-[#d8ecff]
                    transition-colors
                    duration-200
                    mb-2
                    flex justify-center items-center gap-1
                  "
                                >
                                    <span>امکانات</span>
                                    {amenitiesCount > 0 && (
                                        <span className="bg-[#0D5990] text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center">
                                            {toPersianDigits(amenitiesCount)}
                                        </span>
                                    )}
                                </button>
                            </div>

                            {/* Only show seat availability when not showing a specific passenger */}
                            {!hasPassengers && (
                                <div className="w-full mb-2">
                                    <div className={`text-center ${isFullCapacity ? "text-gray-400" : "text-[#0D5990]"} font-IranYekanRegular text-[9px]`}>
                                        {isFullCapacity ?
                                            "ظرفیت تکمیل" :
                                            `${toPersianDigits(availableSeats)} صندلی خالی`
                                        }
                                    </div>

                                    {/* Progress bar for seat fill level */}
                                    <div className="bg-[#ECF4FC] h-1.5 rounded-lg overflow-hidden mt-1">
                                        <div
                                            className={`h-full rounded-lg ${isFullCapacity ? "bg-gray-300" : "bg-[#0D5990]"}`}
                                            style={{
                                                width: `${filledPercentage}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Past trip indicator */}
                            {orderData?.isPastTrip && (
                                <div className="w-full mb-2 flex items-center justify-center text-gray-500 gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-[8px] font-IranYekanBold">
                                        سفر انجام شده
                                    </span>
                                </div>
                            )}

                            <div
                                className="w-full flex text-[#0D5990] gap-1 text-center justify-center font-IranYekanBold
                  text-[11px]"
                            >
                                <div className="">{formatPrice(ticketDetails?.FullPrice || "0")}</div>
                                <div className="">تومان</div>
                            </div>

                            {/* Change ticket button */}
                            {!orderData?.isPastTrip && (
                                <button
                                    onClick={() => router.back()}
                                    className="
                    bg-[#0D5990]
                    text-[#ffffff]                           
                    rounded-lg   
                    px-2
                    w-full                                        
                    py-1
                    font-IranYekanRegular
                    text-[9px]
                    transition-colors
                    duration-200
                    mt-1                                   
                  "
                                >
                                    تغییر بلیط
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Amenities Dialog */}
            <Dialog open={showAmenities} onOpenChange={setShowAmenities}>
                <DialogContent className="sm:max-w-[500px]" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="text-center text-[#0D5990] font-IranYekanBold text-lg">امکانات اتوبوس</DialogTitle>
                        <DialogDescription className="text-center text-gray-500 text-sm mt-1">
                            {ticketDetails?.BusTypeFull ? ticketDetails.BusTypeFull : ticketDetails?.BusType || "اتوبوس استاندارد"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-6">
                        {/* VIP */}
                        <div className={`flex items-center gap-3 p-3 rounded-lg ${ticketDetails?.IsVIP ? 'bg-[#E8F2FC] border border-[#CCD6E1]' : 'bg-gray-100'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${ticketDetails?.IsVIP ? 'bg-[#0D5990] text-white' : 'bg-gray-200 text-gray-400'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 6H4V18H20V6Z" />
                                    <path d="M12 6V18" />
                                    <path d="M12 12H20" />
                                    <path d="M4 12H12" />
                                </svg>
                            </div>
                            <div>
                                <p className={`font-IranYekanBold text-sm ${ticketDetails?.IsVIP ? 'text-[#0D5990]' : 'text-gray-500'}`}>VIP</p>
                                <p className={`text-xs ${ticketDetails?.IsVIP ? 'text-gray-600' : 'text-gray-400'}`}>اتوبوس VIP</p>
                            </div>
                        </div>

                        {/* BED */}
                        <div className={`flex items-center gap-3 p-3 rounded-lg ${ticketDetails?.IsBed ? 'bg-[#E8F2FC] border border-[#CCD6E1]' : 'bg-gray-100'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${ticketDetails?.IsBed ? 'bg-[#0D5990] text-white' : 'bg-gray-200 text-gray-400'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M2 9V5c0-1.1.9-2 2-2h16a2 2 0 0 1 2 2v4" />
                                    <path d="M2 11v4c0 1.1.9 2 2 2h16a2 2 0 0 0 2-2v-4" />
                                    <path d="M2 9h20" />
                                    <path d="M2 17h20" />
                                </svg>
                            </div>
                            <div>
                                <p className={`font-IranYekanBold text-sm ${ticketDetails?.IsBed ? 'text-[#0D5990]' : 'text-gray-500'}`}>تختخوابشو</p>
                                <p className={`text-xs ${ticketDetails?.IsBed ? 'text-gray-600' : 'text-gray-400'}`}>صندلی تختخوابشو</p>
                            </div>
                        </div>

                        {/* MONITOR */}
                        <div className={`flex items-center gap-3 p-3 rounded-lg ${ticketDetails?.IsMonitor ? 'bg-[#E8F2FC] border border-[#CCD6E1]' : 'bg-gray-100'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${ticketDetails?.IsMonitor ? 'bg-[#0D5990] text-white' : 'bg-gray-200 text-gray-400'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
                                    <polyline points="17 2 12 7 7 2" />
                                </svg>
                            </div>
                            <div>
                                <p className={`font-IranYekanBold text-sm ${ticketDetails?.IsMonitor ? 'text-[#0D5990]' : 'text-gray-500'}`}>مانیتور</p>
                                <p className={`text-xs ${ticketDetails?.IsMonitor ? 'text-gray-600' : 'text-gray-400'}`}>دارای مانیتور</p>
                            </div>
                        </div>

                        {/* CHARGER */}
                        <div className={`flex items-center gap-3 p-3 rounded-lg ${ticketDetails?.IsCharger ? 'bg-[#E8F2FC] border border-[#CCD6E1]' : 'bg-gray-100'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${ticketDetails?.IsCharger ? 'bg-[#0D5990] text-white' : 'bg-gray-200 text-gray-400'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M13 2L7 14h6l-1 8 6-12h-6l1-8z" />
                                </svg>
                            </div>
                            <div>
                                <p className={`font-IranYekanBold text-sm ${ticketDetails?.IsCharger ? 'text-[#0D5990]' : 'text-gray-500'}`}>شارژر</p>
                                <p className={`text-xs ${ticketDetails?.IsCharger ? 'text-gray-600' : 'text-gray-400'}`}>دارای شارژر USB</p>
                            </div>
                        </div>

                        {/* SOFA */}
                        <div className={`flex items-center gap-3 p-3 rounded-lg ${ticketDetails?.IsSofa ? 'bg-[#E8F2FC] border border-[#CCD6E1]' : 'bg-gray-100'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${ticketDetails?.IsSofa ? 'bg-[#0D5990] text-white' : 'bg-gray-200 text-gray-400'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 10V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3" />
                                    <path d="M2 15v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2" />
                                    <path d="M4 10h16v5H4v-5Z" />
                                </svg>
                            </div>
                            <div>
                                <p className={`font-IranYekanBold text-sm ${ticketDetails?.IsSofa ? 'text-[#0D5990]' : 'text-gray-500'}`}>مبلی</p>
                                <p className={`text-xs ${ticketDetails?.IsSofa ? 'text-gray-600' : 'text-gray-400'}`}>صندلی مبلی</p>
                            </div>
                        </div>

                        {/* MONO */}
                        <div className={`flex items-center gap-3 p-3 rounded-lg ${ticketDetails?.IsMono ? 'bg-[#E8F2FC] border border-[#CCD6E1]' : 'bg-gray-100'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${ticketDetails?.IsMono ? 'bg-[#0D5990] text-white' : 'bg-gray-200 text-gray-400'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="6" y="4" width="12" height="16" rx="2" />
                                    <line x1="12" y1="2" x2="12" y2="4" />
                                    <line x1="12" y1="20" x2="12" y2="22" />
                                </svg>
                            </div>
                            <div>
                                <p className={`font-IranYekanBold text-sm ${ticketDetails?.IsMono ? 'text-[#0D5990]' : 'text-gray-500'}`}>تک صندلی</p>
                                <p className={`text-xs ${ticketDetails?.IsMono ? 'text-gray-600' : 'text-gray-400'}`}>چیدمان تک صندلی</p>
                            </div>
                        </div>

                        {/* Air Condition */}
                        <div className={`flex items-center gap-3 p-3 rounded-lg ${ticketDetails?.IsAirConditionType ? 'bg-[#E8F2FC] border border-[#CCD6E1]' : 'bg-gray-100'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${ticketDetails?.IsAirConditionType ? 'bg-[#0D5990] text-white' : 'bg-gray-200 text-gray-400'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M8 2a7.21 7.21 0 0 0-4 2 7.2 7.2 0 0 0-2 4 7.196 7.196 0 0 0 2 4 7.22 7.22 0 0 0 4 2 7.212 7.212 0 0 0 4-2 7.2 7.2 0 0 0 2-4 7.2 7.2 0 0 0-2-4 7.212 7.212 0 0 0-4-2Z" />
                                    <path d="M12 12h.01" />
                                    <path d="M9 13a6.156 6.156 0 0 1-2 3 6.56 6.56 0 0 1-3 2" />
                                    <path d="M12 17a6.156 6.156 0 0 0 3 2 6.56 6.56 0 0 0 3-2" />
                                    <path d="M15 7a6.156 6.156 0 0 0-3-2 6.56 6.56 0 0 0-3 2" />
                                </svg>
                            </div>
                            <div>
                                <p className={`font-IranYekanBold text-sm ${ticketDetails?.IsAirConditionType ? 'text-[#0D5990]' : 'text-gray-500'}`}>تهویه مطبوع</p>
                                <p className={`text-xs ${ticketDetails?.IsAirConditionType ? 'text-gray-600' : 'text-gray-400'}`}>سیستم تهویه مطبوع</p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={() => setShowAmenities(false)}
                            className="bg-[#0D5990] hover:bg-[#0D4570] text-white w-full font-IranYekanRegular"
                        >
                            بستن
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Refund Rules Dialog */}
            <Dialog open={showRefundRules} onOpenChange={setShowRefundRules}>
                <DialogContent className="sm:max-w-[500px]" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="text-center text-[#0D5990] font-IranYekanBold text-lg">قوانین استرداد بلیط</DialogTitle>
                        <DialogDescription className="text-center text-gray-500 text-sm mt-1">
                            شرایط و قوانین مربوط به استرداد بلیط {ticketDetails?.CoName || ""}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-6">
                        {/* Rules Card */}
                        <div className="bg-[#F8FBFF] border border-[#CCD6E1] rounded-lg p-4">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#E8F2FC] text-[#0D5990]">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 6v6l4 2" />
                                    </svg>
                                </div>
                                <h3 className="mr-3 text-[#0D5990] font-IranYekanBold text-base">بیش از ۱ ساعت تا زمان حرکت</h3>
                            </div>

                            <div className="space-y-3 text-[13px]">
                                <div className="flex items-start">
                                    <svg className="h-5 w-5 text-[#0D5990] mt-0.5 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p>امکان استرداد بلیت تا ۱ ساعت قبل از حرکت با کسر ۱۰٪ از مبلغ بلیت وجود دارد.</p>
                                </div>
                                <div className="bg-white rounded p-3 border border-[#E1EAF4] mr-7">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">مبلغ بلیط:</span>
                                        <span className="font-IranYekanBold">{formatPrice(ticketDetails?.FullPrice || "0")} تومان</span>
                                    </div>
                                    <div className="flex justify-between mt-1 pb-2 border-b border-dashed border-gray-200">
                                        <span className="text-red-500">کسر جریمه (۱۰٪):</span>
                                        <span className="text-red-500">{calculateRefund(ticketDetails?.FullPrice || "0", 10)} تومان</span>
                                    </div>
                                    <div className="flex justify-between mt-2 text-[#0D5990] font-IranYekanBold">
                                        <span>مبلغ قابل استرداد:</span>
                                        <span>{calculateRefund(ticketDetails?.FullPrice || "0", 10)} تومان</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#F8FBFF] border border-[#CCD6E1] rounded-lg p-4">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#FFE8E8] text-[#FF4D4D]">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 6v6l4 2" />
                                    </svg>
                                </div>
                                <h3 className="mr-3 text-[#FF4D4D] font-IranYekanBold text-base">کمتر از ۱ ساعت تا زمان حرکت</h3>
                            </div>

                            <div className="space-y-3 text-[13px]">
                                <div className="flex items-start">
                                    <svg className="h-5 w-5 text-[#FF4D4D] mt-0.5 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <p>امکان استرداد بلیت از ۱ ساعت قبل از حرکت با کسر ۵۰٪ از مبلغ بلیت وجود دارد.</p>
                                </div>
                                <div className="bg-white rounded p-3 border border-[#E1EAF4] mr-7">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">مبلغ بلیط:</span>
                                        <span className="font-IranYekanBold">{formatPrice(ticketDetails?.FullPrice || "0")} تومان</span>
                                    </div>
                                    <div className="flex justify-between mt-1 pb-2 border-b border-dashed border-gray-200">
                                        <span className="text-red-500">کسر جریمه (۵۰٪):</span>
                                        <span className="text-red-500">{calculateRefund(ticketDetails?.FullPrice || "0", 50)} تومان</span>
                                    </div>
                                    <div className="flex justify-between mt-2 text-[#0D5990] font-IranYekanBold">
                                        <span>مبلغ قابل استرداد:</span>
                                        <span>{calculateRefund(ticketDetails?.FullPrice || "0", 50)} تومان</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div className="flex items-start">
                                <svg className="h-5 w-5 text-gray-500 mt-0.5 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-gray-600 text-sm">
                                    جهت استرداد بلیط با پشتیبانی بیلیت‌فوریو به شماره <span className="font-IranYekanBold text-[#0D5990] tracking-wider" dir="ltr">۰۲۱۹۱۰۹۶۱۱۶</span> تماس بگیرید یا از طریق چت آنلاین در وبسایت با ما در ارتباط باشید.
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            onClick={() => setShowRefundRules(false)}
                            className="bg-[#0D5990] hover:bg-[#0D4570] text-white w-full font-IranYekanRegular"
                        >
                            بستن
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default TicketCardMd;