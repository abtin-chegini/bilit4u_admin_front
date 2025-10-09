"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import moment from "jalali-moment";
import ClockIcon from "@/components/ui/icons_custom/ClockIcon";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouteInfoWithIds } from '@/lib/RouteMapData';
import numberConvertor from "@/lib/numberConvertor";
import { useToast } from "@/hooks/use-toast";

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
  factorUrl?: string;
}

interface TicketCardLgProps {
  ticketDetails: ServiceDetails;
  orderData?: OrderData; // Made optional for backward compatibility
  isDimmed?: boolean; // For refunded tickets
}

const TicketCardLg: React.FC<TicketCardLgProps> = ({ ticketDetails, orderData, isDimmed = false }) => {
  const router = useRouter();
  const { toast } = useToast();
  const [showAmenities, setShowAmenities] = useState(false);
  const [showRefundRules, setShowRefundRules] = useState(false);

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

  // Use city codes directly without fallbacks
  const srcCityCode = ticketDetails?.SrcCityCode || '';
  const desCityCode = ticketDetails?.DesCityCode || '';

  // Get route information using the city codes
  const routeInfo = useRouteInfoWithIds(srcCityCode, desCityCode);

  // Format duration to Persian with hours and minutes (original word format)
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

  // Fixed Persian date parsing function for format like ۱۴۰۴/۰۴/۱۰
  const parsePersianDate = (persianDate: string) => {
    try {
      // Convert Persian digits to English digits first
      const englishDate = toEnglishDigits(persianDate);

      // Split the date - it's in YYYY/MM/DD format
      const parts = englishDate.split('/');
      if (parts.length !== 3) {
        throw new Error('Invalid date format');
      }

      const [year, month, day] = parts.map(Number);

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

      return result;
    } catch (error) {
      // console.error('Error formatting Persian date:', error);
      return 'نامشخص';
    }
  };

  // Calculate arrival time function with proper 24-hour format - FIXED
  // **Alternative simpler approach**
  const calculateArrivalTime = (departTime: string | undefined, duration: string | null) => {
    if (!departTime || !duration) {
      return 'نامشخص';
    }

    try {
      // Parse departure time (convert Persian to English first)
      const cleanDepartTime = toEnglishDigits(departTime);
      const [dHours, dMinutes] = cleanDepartTime.split(':').map(num => parseInt(num, 10));

      // Parse duration
      const [durHours, durMinutes] = duration.split(':').map(num => parseInt(num, 10));

      // console.log(`Departure: ${dHours}:${dMinutes}, Duration: ${durHours}:${durMinutes}`);

      // Simple addition
      let totalHours = dHours + durHours;
      let totalMinutes = dMinutes + durMinutes;

      // Handle minute overflow
      if (totalMinutes >= 60) {
        totalHours += Math.floor(totalMinutes / 60);
        totalMinutes = totalMinutes % 60;
      }

      // Handle 24-hour overflow
      totalHours = totalHours % 24;

      // console.log(`Result: ${totalHours}:${totalMinutes}`);

      // Format and convert to Persian
      const result = `${toPersianDigits(totalHours.toString().padStart(2, '0'))}:${toPersianDigits(totalMinutes.toString().padStart(2, '0'))}`;

      return result;
    } catch (error) {
      // console.error('Error calculating arrival time:', error);
      return 'نامشخص';
    }
  };
  // Calculate arrival date using Persian date input with proper 24-hour handling - FIXED
  const calculateArrivalDate = (departDate: string | undefined, departTime: string | undefined, duration: string | null) => {
    if (!departDate || !departTime || !duration) {
      return 'نامشخص';
    }

    try {
      // Parse departure time directly (already in HH:MM format)
      const [dHours, dMinutes] = departTime.split(':').map(Number);

      // Parse duration
      const [durHours, durMinutes] = duration.split(':').map(Number);

      // Parse Persian date and create departure moment
      const departMoment = parsePersianDate(departDate);

      // Set the exact departure time
      departMoment.hours(dHours).minutes(dMinutes).seconds(0);

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
      // console.error('Error calculating arrival date:', error);
      return 'نامشخص';
    }
  };

  // Calculate all the values - use API values if available, otherwise calculate
  const formattedDuration = ticketDetails?.TravelDuration || formatDurationToPersian(routeInfo.duration);
  const arrivalTime = ticketDetails?.ArrivalTime || calculateArrivalTime(ticketDetails?.DepartTime, routeInfo.duration);
  const arrivalDate = ticketDetails?.ArrivalDate ? formatPersianDateToReadable(ticketDetails.ArrivalDate) : calculateArrivalDate(ticketDetails?.DepartDate, ticketDetails?.DepartTime, routeInfo.duration);
  const departureDate = formatPersianDateToReadable(ticketDetails?.DepartDate);

  // Debug log to see which values are used
  console.log('📊 TicketCardLg - Display values:', {
    formattedDuration: {
      fromAPI: ticketDetails?.TravelDuration,
      calculated: formatDurationToPersian(routeInfo.duration),
      used: formattedDuration
    },
    arrivalTime: {
      fromAPI: ticketDetails?.ArrivalTime,
      calculated: calculateArrivalTime(ticketDetails?.DepartTime, routeInfo.duration),
      used: arrivalTime
    },
    arrivalDate: {
      fromAPI: ticketDetails?.ArrivalDate,
      calculated: calculateArrivalDate(ticketDetails?.DepartDate, ticketDetails?.DepartTime, routeInfo.duration),
      used: arrivalDate
    }
  });

  // Seat availability calculations (used when orderData is not provided)
  const availableSeats = parseInt(ticketDetails?.Cnt ?? "0");
  const totalSeats = 44; // Total capacity
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
    if (!ticketDetails?.DepartTime || !ticketDetails?.DepartDate) {
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
      // console.error('Error calculating departure info:', error);
      return { isDepartingSoon: false, minutesLeft: 0 };
    }
  }, [ticketDetails?.DepartDate, ticketDetails?.DepartTime]);

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
      <div className={`hidden lg:block relative h-[340px] border rounded-lg shadow-md ${isDimmed ? 'bg-gray-100 border-gray-300 opacity-60' : 'bg-white border-[#CCD6E1]'}`}>
        <div
          className="
                  absolute left-[30%] z-40 
                  -top-[1px] 
                  w-[55px] h-[25px] 
                  bg-[#f9fafb] 
                  border-b border-l border-r border-[#CCD6E1] 
                  rounded-b-full
                  overflow-hidden
                "
        ></div>
        <div
          className="
                  absolute left-[30%] z-50
                  -bottom-[1px] 
                  w-[55px] h-[25px] 
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
            <span className="absolute -left-[1px] top-[40%] h-[10px] w-[1px] bg-[#0D5990]"></span>
            <span className="absolute -left-[1px] bottom-0 h-[20px] w-[1px] bg-[#0D5990]"></span>

            <div className="w-full h-full flex items-center gap-8 justify-start pr-8 text-[#000000] font-IranYekanRegular text-[14px]">
              <div>
                <Image
                  src={ticketDetails?.LogoUrl || "https://cdn.bilit4u.com/images/CardBackground.png"}
                  alt={ticketDetails?.CoName || "لوگو"}
                  width={78}
                  height={47}
                  className="rounded-md shadow-md max-w-full h-auto object-contain"
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
          style={{
            backgroundImage:
              "url('https://cdn.bilit4u.com/images/ticket-bg.svg')",
          }}
        >
          {/* bottom right ticket */}
          <div className="relative w-[66.5%]  h-full">
            <span className="absolute -left-[1px] top-[5%] h-[20px] w-[1px] bg-[#0D5990]"></span>
            <span className="absolute -left-[1px] top-[20%] h-[20px] w-[1px] bg-[#0D5990]"></span>
            <span className="absolute -left-[1px] top-[35%] h-[20px] w-[1px] bg-[#0D5990]"></span>
            <span className="absolute -left-[1px] top-[50%] h-[20px] w-[1px] bg-[#0D5990]"></span>
            <span className="absolute -left-[1px] top-[65%] h-[20px] w-[1px] bg-[#0D5990]"></span>
            <span className="absolute -left-[1px] bottom-[14%] h-[10px] w-[1px] bg-[#0D5990]"></span>

            <div className="flex flex-col justify-between w-full h-full">
              {/* Journey visualization */}
              <div className="flex justify-center items-center py-6 px-8 w-full">
                <div className="w-[30%] text-center">
                  <div className="text-[#9D9A9A] text-[12px] font-IranYekanRegular mb-2">
                    مبدا
                  </div>
                  <div
                    className="font-IranYekanBold text-[14px] mb-1"
                    style={{ direction: "rtl" }}
                  >
                    {numberConvertor(ticketDetails?.DepartTime || "10:30")}
                  </div>
                  <div className="font-IranYekanRegular text-[#000000]  text-[14px] mb-2"
                    style={{ direction: "rtl" }}>
                    {departureDate}
                  </div>
                  <div className="text-[#9D9A9A] text-[12px] font-IranYekanRegular">
                    {ticketDetails?.SrcCityName || "تهران"}
                  </div>
                </div>
                <div className="w-[85%] text-center">
                  <div className="relative w-full h-[70px]">
                    {/* "زمان تقریبی" text above the curve */}
                    <div className="text-[#7A7A7A] text-[10px] font-IranYekanRegular mb-1">
                      زمان تقریبی
                    </div>

                    <div className="absolute top-1/2 left-0 w-full border-t-2 border-dashed border-[#0D5990] -translate-y-1/2" />

                    <div className="absolute w-4 h-4 bg-[#0D5990] rounded-full top-1/2 left-0 -translate-y-1/2" />

                    <div className="absolute w-4 h-4 bg-[#0D5990] rounded-full top-1/2 right-0 -translate-y-1/2" />

                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#E8F2FC] text-[#0D5990] px-4 py-1 rounded-full font-IranYekanRegular text-[11px] border border-[#CCD6E1] min-w-[120px] max-w-[200px] text-center">
                      {formattedDuration}
                    </div>

                    <div className="absolute left-1/2 top-[75%] -translate-x-1/2 mt-2 text-center text-[#323232] text-[10px] font-IranYekanLight">
                      {routeInfo.formattedDistance}
                    </div>
                  </div>
                </div>
                <div className="w-[25%] text-center">
                  <div className="text-[#9D9A9A] text-[12px] font-IranYekanRegular mb-2">
                    مقصد
                  </div>
                  <div
                    className="font-IranYekanBold text-[14px] mb-1"
                    style={{ direction: "rtl" }}
                  >
                    {arrivalTime}
                  </div>
                  <div className="font-IranYekanRegular text-[#000000] text-[14px] mb-2">
                    {arrivalDate}
                  </div>
                  <div className="text-[#9D9A9A] text-[12px] font-IranYekanRegular">
                    {ticketDetails?.DesCityName || "شیراز"}
                  </div>
                </div>
              </div>

              {/* Passenger information */}
              {passenger && (
                <div className="mx-8 mb-6 px-4 py-3 bg-[#F8FBFF] border border-[#E1EAF4] rounded-md flex items-center gap-3">
                  <div className="flex-grow">
                    <div className="flex justify-between items-center">
                      <h3 className="font-IranYekanBold text-gray-800 text-sm">
                        {passenger.name}
                      </h3>
                      <span className="bg-[#E8F2FC] text-[#0D5990] px-2 py-0.5 rounded-full text-xs">
                        صندلی {toPersianDigits(passenger.seatNo)}
                      </span>
                    </div>
                    {passenger.nationalCode && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        کد ملی: {toPersianDigits(passenger.nationalCode)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* bottom left ticket */}
          <div className="w-[33.5%]  h-full">
            <div className="flex flex-col items-center px-8 py-8 w-full h-full">
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
                        px-6 py-2
                        font-IranYekanRegular
                        text-[15px]
                        hover:bg-gray-50  
                        transition-colors
                        duration-200
                        mb-2
                      "
                >
                  قوانین استرداد
                </button>
              </div>
              <div className="w-full space-y-2">
                {/* Amenities button */}
                <button
                  onClick={() => setShowAmenities(true)}
                  className="
                        bg-white
                        text-[#0D5990]
                        border border-[#CCD6E1]
                        shadow-sm
                        w-full
                        rounded-lg   
                        px-6 py-2
                        font-IranYekanRegular
                        text-[15px]
                        hover:bg-gray-50  
                        transition-colors
                        duration-200
                        flex justify-center items-center gap-2
                      "
                >
                  <span>امکانات</span>
                  {amenitiesCount > 0 && (
                    <span className="bg-[#0D5990] text-white text-[11px] rounded-full w-5 h-5 flex items-center justify-center">
                      {toPersianDigits(amenitiesCount)}
                    </span>
                  )}
                </button>

                {/* Download Ticket Button */}
                {orderData?.factorUrl && (
                  <button
                    onClick={handleDownloadTicket}
                    className="
                      bg-white
                      text-[#0D5990]
                      border border-[#CCD6E1]
                      shadow-sm
                      w-full
                      rounded-lg   
                      px-6 py-2
                      font-IranYekanRegular
                      text-[15px]
                      hover:bg-gray-50  
                      transition-colors
                      duration-200
                      flex justify-center items-center
                    "
                  >
                    <span>دانلود بلیط</span>
                  </button>
                )}
              </div>

              {/* Only show seat availability when not showing a specific passenger */}
              {!hasPassengers && (
                <div className="w-full mb-4">
                  <div className={`text-center ${isFullCapacity ? "text-gray-400" : "text-[#0D5990]"} font-IranYekanRegular text-[13px]`}>
                    {isFullCapacity ?
                      "ظرفیت تکمیل" :
                      `${toPersianDigits(availableSeats)} صندلی خالی`
                    }
                  </div>

                  {/* Progress bar for seat fill level */}
                  <div className="bg-[#ECF4FC] h-2 rounded-lg overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-lg ${isFullCapacity ? "bg-gray-300" : "bg-[#0D5990]"}`}
                      style={{
                        width: `${filledPercentage}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Price section - moved to very bottom */}
              <div className="w-full mt-auto pt-4">
                <div
                  className="w-full flex text-[#0D5990] gap-2 text-center justify-center font-IranYekanBold
                        text-[16px]"
                >
                  <div className="">قیمت</div>
                  <div className="">{formatPrice(ticketDetails?.FullPrice || "0")}</div>
                  <div className="">تومان</div>
                </div>
              </div>
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
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
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
                  <path d="M2 4v16" />
                  <path d="M2 8h18a2 2 0 0 1 2 2v10" />
                  <path d="M2 17h20" />
                  <path d="M6 8V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" />
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
                  <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
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
                  <path d="M5 18H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.19M15 6h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3.19" />
                  <line x1="23" y1="13" x2="23" y2="11" />
                  <polyline points="11,6 7,12 13,12 9,18" />
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
                  <path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3" />
                  <path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                  <path d="M4 18v2" />
                  <path d="M20 18v2" />
                  <path d="M12 4v4" />
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
                  <rect x="8" y="6" width="8" height="12" rx="1" />
                  <path d="m8 18-2 2" />
                  <path d="m16 18 2 2" />
                  <path d="M8 14h8" />
                  <path d="M8 10h8" />
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
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v6m0 6v6" />
                  <path d="M22.5 12h-6m-9 0h-6" />
                  <path d="M19.07 4.93l-4.24 4.24m0 5.66l4.24 4.24" />
                  <path d="M4.93 4.93l4.24 4.24m0 5.66l-4.24 4.24" />
                  <path d="M18 6l-3 3m0 6l3 3" />
                  <path d="M6 6l3 3m0 6l-3 3" />
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

export default TicketCardLg;