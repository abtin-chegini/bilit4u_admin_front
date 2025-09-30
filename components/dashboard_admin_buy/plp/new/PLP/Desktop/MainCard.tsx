import React, { FunctionComponent, useCallback, useMemo, useState } from "react";
import Image from "next/image";
import ShareIcon from "@/components/ui/icons_custom/Share";
import ClockIcon from "@/components/ui/icons_custom/ClockIcon";
import { SrvRequestResItem } from "@/constants/interfaces";
import numberConvertor from "@/lib/numberConvertor";
import Skeleton from "react-loading-skeleton";
import { cx } from "class-variance-authority";
import SeatData from "@/components/dashboard_admin_buy/plp/previous/PLP/Desktop/SeatData";
import moment from "jalali-moment";
import { useRouter } from "next/navigation";
import { useTicketStore } from "@/store/TicketStore";
import { RouteUtils } from "@/lib/RouteUtil";
import { useRouteInfoWithIds } from '@/lib/RouteMapData';
import { useFlowSession } from '@/hooks/useFlowSession';
import { useScreenSize } from "@/hooks/useScreenSize";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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

interface MainCardProps {
  data?: SrvRequestResItem;
  isPending?: boolean;
}

const MainCard: FunctionComponent<MainCardProps> = ({
  data,
  isPending = true,
}) => {

  const [showRefundRules, setShowRefundRules] = useState(false);
  const screenSize = useScreenSize();

  // Determine if mobile based on screen size
  const isMobile = screenSize === 'xs' || screenSize === 'sm';

  // Get route information using city IDs from data
  const routeInfo = useRouteInfoWithIds(data?.SrcCityId, data?.DesCityId);

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

      console.log('Parsed Persian date:', { day, month, year, moment: jMoment.format('jYYYY/jMM/jDD') });

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
      console.log('Missing data:', { departTime, duration });
      return 'نامشخص';
    }

    try {
      console.log('Calculating arrival time with:', { departTime, duration });

      // Parse departure time
      const [dHours, dMinutes] = departTime.split(':').map(Number);
      // Parse duration
      const [durHours, durMinutes] = duration.split(':').map(Number);

      console.log('Parsed values:', { dHours, dMinutes, durHours, durMinutes });

      // Create moment objects for calculation
      const departMoment = moment().startOf('day').hours(dHours).minutes(dMinutes);
      const arrivalMoment = departMoment.clone().add(durHours, 'hours').add(durMinutes, 'minutes');

      const arrivalHours = arrivalMoment.hours();
      const arrivalMinutes = arrivalMoment.minutes();

      console.log('Calculated arrival:', { arrivalHours, arrivalMinutes });

      const result = `${numberConvertor(arrivalHours.toString().padStart(2, '0'))} : ${numberConvertor(arrivalMinutes.toString().padStart(2, '0'))}`;
      console.log('Final result:', result);

      return result;
    } catch (error) {
      console.error('Error calculating arrival time:', error);
      return 'نامشخص';
    }
  };

  // Calculate arrival date using Persian date input
  const calculateArrivalDate = (departDate: string | undefined, departTime: string | undefined, duration: string | null) => {
    if (!departDate || !departTime || !duration) {
      console.log('Missing data for arrival date calculation:', { departDate, departTime, duration });
      return 'نامشخص';
    }

    try {
      console.log('Calculating arrival date with:', { departDate, departTime, duration });

      // Parse departure time
      const [dHours, dMinutes] = departTime.split(':').map(Number);
      // Parse duration
      const [durHours, durMinutes] = duration.split(':').map(Number);

      // Parse Persian date and create departure moment
      const departMoment = parsePersianDate(departDate).hours(dHours).minutes(dMinutes);
      console.log('Departure moment:', departMoment.format('jYYYY/jMM/jDD HH:mm'));

      // Add duration to get arrival moment
      const arrivalMoment = departMoment.clone().add(durHours, 'hours').add(durMinutes, 'minutes');
      console.log('Arrival moment:', arrivalMoment.format('jYYYY/jMM/jDD HH:mm'));

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
      console.log('Formatted arrival date:', result);

      return result;
    } catch (error) {
      console.error('Error calculating arrival date:', error);
      return 'نامشخص';
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

  const formattedDuration = formatDurationToPersian(routeInfo.duration);
  const arrivalTime = calculateArrivalTime(data?.DepartTime, routeInfo.duration);
  const arrivalDate = calculateArrivalDate(data?.DepartDate, data?.DepartTime, routeInfo.duration);
  const departureDate = formatPersianDateToReadable(data?.DepartDate);

  // Debug logging
  console.log('Debug info:', {
    departTime: data?.DepartTime,
    departDate: data?.DepartDate,
    duration: routeInfo.duration,
    formattedDuration,
    arrivalTime,
    arrivalDate,
    departureDate,
    fullData: data
  });

  // Check if no seats are available
  const availableSeats = parseInt(data?.Cnt ?? "0");
  const isFullCapacity = availableSeats === 0;
  const router = useRouter();
  const setTicketInfo = useTicketStore(state => state.setTicketInfo);
  const { initializeFlowWithTicket, goToNextStep } = useFlowSession();

  // Calculate if departure time is within 30 minutes of current time
  // Calculate if departure time is within 30 minutes of current time AND is today
  const departureInfo = useMemo(() => {
    if (!data?.DepartDate || !data?.DepartTime) return { isDepartingSoon: false, minutesLeft: 0 };

    try {
      const departTimeStr = data.DepartTime;
      const departDateStr = data.DepartDate;

      // Parse the Persian departure date
      const departMoment = parsePersianDate(departDateStr);
      const [dHours, dMinutes] = departTimeStr.split(':').map(Number);
      departMoment.hours(dHours).minutes(dMinutes).seconds(0);

      const currentMoment = moment();

      // First check: Is the departure date today?
      const isToday = departMoment.format('jYYYY/jMM/jDD') === currentMoment.format('jYYYY/jMM/jDD');

      // If not today, immediately return false
      if (!isToday) {
        console.log('Departure is not today:', {
          departureDate: departMoment.format('jYYYY/jMM/jDD'),
          currentDate: currentMoment.format('jYYYY/jMM/jDD')
        });
        return { isDepartingSoon: false, minutesLeft: 0 };
      }

      // Second check: Time difference (only if it's today)
      const diffMinutes = departMoment.diff(currentMoment, 'minutes');

      // Only show as "departing soon" if:
      // 1. It's today (already checked above)
      // 2. The departure is in the future (diffMinutes >= 0)
      // 3. The departure is within 30 minutes (diffMinutes <= 30)
      const isDepartingSoon = diffMinutes >= 0 && diffMinutes <= 30;

      console.log('Departure check:', {
        departureDateTime: departMoment.format('jYYYY/jMM/jDD HH:mm'),
        currentDateTime: currentMoment.format('jYYYY/jMM/jDD HH:mm'),
        isToday,
        diffMinutes,
        isDepartingSoon
      });

      return {
        isDepartingSoon,
        minutesLeft: diffMinutes
      };
    } catch (error) {
      console.error('Error calculating departure info:', error);
      return { isDepartingSoon: false, minutesLeft: 0 };
    }
  }, [data?.DepartDate, data?.DepartTime]);
  const { isDepartingSoon, minutesLeft } = departureInfo;

  const handleBuyTicket = useCallback(async () => {
    if (!data || isFullCapacity) return;

    const token = data.Token || "11839-79";
    const ticketid = data.ServiceNo || data.ServiceNo;

    console.log("Starting ticket purchase flow with:", { token, ticketid });

    // Set ticket info in store immediately (for fast navigation)
    setTicketInfo(ticketid, token);

    // Navigate immediately for better UX - don't wait for slow operations
    router.push(`/ticket/${token}/${ticketid}`);

    // Handle slow operations in background without blocking navigation
    try {
      // Prepare ticket data for flow
      const ticketData = {
        token,
        ticketid,
        serviceNo: data.ServiceNo,
        companyName: data.CoName,
        logoUrl: data.LogoUrl,
        busType: data.BusType,
        fullPrice: data.FullPrice,
        sourceCity: data.SrcCityName,
        destinationCity: data.DesCityName,
        sourceCityId: data.SrcCityId,
        destinationCityId: data.DesCityId,
        departDate: data.DepartDate,
        departTime: data.DepartTime,
        availableSeats: data.Cnt,
        routeInfo: {
          duration: routeInfo.duration,
          distance: routeInfo.distance,
          formattedDistance: routeInfo.formattedDistance
        }
      };

      // Initialize flow session in background (non-blocking)
      initializeFlowWithTicket(ticketData).then(sessionId => {
        console.log("✅ Flow session initialized:", sessionId);
      }).catch(error => {
        console.error("❌ Background flow initialization failed:", error);
      });

      // Save return route in background (non-blocking)
      const currentPath = window.location.pathname;
      const currentSearch = window.location.search;
      const fullPath = currentPath + (currentSearch ? currentSearch : '');

      RouteUtils.saveRoute(fullPath).then(() => {
        console.log("✅ Return route saved:", fullPath);
      }).catch(err => {
        console.error("❌ Failed to save route:", err);
      });

    } catch (error) {
      console.error("❌ Background operations failed:", error);
    }
  }, [data, isFullCapacity, router, setTicketInfo, initializeFlowWithTicket, routeInfo]);

  return (
    <>
      <div>
        {/* Desktop view */}
        <div className="shadow-lg rounded-xl border border-[#CCD6E1] relative hidden lg:block font-IranYekanRegular">
          <div
            className={cx([
              "flex px-9 items-center justify-between bg-[#ECF4FC] border-b-2 border-[#CCD6E1] rounded-t-xl",
              isPending && "py-2",
            ])}
          >
            {isPending ? (
              <>
                <Skeleton
                  width={64}
                  height={39}
                  highlightColor="#CCD6E1"
                  style={{ borderRadius: "5px" }}
                />
                <div className="flex items-center gap-x-6">
                  <Skeleton
                    width={305}
                    height={39}
                    highlightColor="#CCD6E1"
                    style={{ borderRadius: "5px" }}
                  />
                  <Skeleton
                    width={78}
                    height={39}
                    highlightColor="#CCD6E1"
                    style={{ borderRadius: "5px" }}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <ShareIcon className="text-[#0D5990] cursor-pointer" />
                </div>
                <div className="flex items-center gap-x-6">
                  <div className="text-black text-base font-bold">
                    {data?.CoName}
                  </div>
                  <div className="p-2">
                    <Image
                      src={data?.LogoUrl ?? "/assets/Company.svg"}
                      alt=""
                      width="70"
                      height="70"
                      className="w-14 h-14"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center relative">
            <Image
              src="https://cdn.bilit4u.com/images/CardBackground.png"
              alt="Card Background"
              width={1200}
              height={400}
              className="absolute top-0 left-0 w-full h-full z-10"
              style={{
                width: '100%',
                height: '100%',
                opacity: 0.3,
                objectFit: 'cover'
              }}
            />

            <div className="flex items-center py-3.5 z-20 w-full">
              <div className="flex flex-col px-5 xl:px-9 gap-y-4 w-1/3">
                {isPending ? (
                  <Skeleton height={41} style={{ borderRadius: "5px" }} />
                ) : (
                  <button
                    onClick={() => setShowRefundRules(true)}
                    className="shadow-1 rounded-lg text-[#0D5990] border border-[#CCD6E1] py-0.5 px-7 text-center bg-white"
                  >
                    قوانین استرداد
                  </button>
                )}
                {isPending ? (
                  <Skeleton height={41} style={{ borderRadius: "5px" }} />
                ) : (
                  <div className="bg-[#CCD6E1] text-black rounded-md min-w-full py-1 text-sm text-center">
                    {numberConvertor(data?.BusType ?? "")}
                  </div>
                )}

                {isPending ? (
                  <Skeleton
                    width={128}
                    height={30}
                    style={{ borderRadius: "5px" }}
                    containerClassName="self-end"
                  />
                ) : (
                  <div className="flex items-center gap-x-2 min-h-[30px]">
                    {isDepartingSoon && (
                      <>
                        <ClockIcon className="text-red-500 px-0.5" />
                        <div className="text-red-500 text-sm font-IranYekanBold">
                          {numberConvertor(minutesLeft.toString())} دقیقه تا حرکت
                        </div>
                      </>
                    )}
                  </div>
                )}
                {isPending ? (
                  <Skeleton height={41} style={{ borderRadius: "5px" }} />
                ) : (
                  <div className="flex items-center justify-between">
                    <button
                      className={`shadow-1 rounded-lg text-sm xl:text-base font-bold py-1 px-6 text-center ${isFullCapacity
                        ? "bg-gray-400 text-gray-200 cursor-not-allowed opacity-70"
                        : "bg-[#0D5990] text-white"
                        }`}
                      disabled={isFullCapacity}
                      onClick={handleBuyTicket}
                    >
                      خرید بلیط
                    </button>

                    <div className="text-sm xl:text-base text-[#0D5990] font-IranYekanBold">
                      {numberConvertor(
                        parseInt(data?.FullPrice ? (parseInt(data.FullPrice) / 10).toString() : "")?.toLocaleString() ?? ""
                      )}{" "}
                      تومان
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col w-2/3 gap-y-2.5 px-5 xl:px-9">
                <div className="flex items-center">
                  {/* Manual Destination Data with calculated arrival time and date */}
                  <div className="flex flex-col items-center gap-y-1.5 w-1/4">
                    {isPending ? (
                      <Skeleton width={39} height={9} style={{ borderRadius: "5px" }} />
                    ) : (
                      <div className="text-deactive text-xxs">مقصد</div>
                    )}
                    {isPending ? (
                      <Skeleton
                        width={54}
                        height={14}
                        style={{ borderRadius: "5px" }}
                      />
                    ) : (
                      <div className="font-IranYekanBold text-black text-base">
                        {arrivalTime}
                      </div>
                    )}
                    {isPending ? (
                      <Skeleton
                        width={104}
                        height={14}
                        style={{ borderRadius: "5px" }}
                      />
                    ) : (
                      <div className="text-deactive text-xxs">{data?.DesCityName}</div>
                    )}
                    {isPending ? (
                      <Skeleton
                        width={80}
                        height={12}
                        style={{ borderRadius: "5px" }}
                      />
                    ) : (
                      <div className="text-deactive text-xxs">{arrivalDate}</div>
                    )}
                  </div>

                  {/* Updated StopData with separate layout for time text and distance */}
                  {isPending ? (
                    <div className="w-[40%] text-center">
                      <Skeleton height={90} style={{ borderRadius: "5px" }} />
                    </div>
                  ) : (
                    <div className="w-[40%] text-center">
                      <div className="relative w-full h-[90px] flex flex-col justify-center">
                        {/* "زمان تقریبی" text above the curve */}
                        <div className="text-[#7A7A7A] text-[8px] font-IranYekanRegular text-center mb-1">
                          زمان تقریبی
                        </div>

                        {/* Curve section */}
                        <div className="relative w-full h-[40px] mb-2">
                          {/* Extended dashed line for longer curve */}
                          <div className="absolute top-1/2 left-0 w-full border-t-2 border-dashed border-[#0D5990] -translate-y-1/2 scale-x-110" />
                          <div className="absolute w-4 h-4 bg-[#0D5990] rounded-full top-1/2 left-0 -translate-y-1/2" />
                          <div className="absolute w-4 h-4 bg-[#0D5990] rounded-full top-1/2 right-0 -translate-y-1/2" />

                          {/* Only duration inside the curve */}
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#E8F2FC] text-[#0D5990] px-2 py-1 rounded-full font-IranYekanBold text-[10px] border border-[#CCD6E1] min-w-[80px] text-center">
                            {formattedDuration}
                          </div>
                        </div>

                        {/* Distance below the curve */}
                        <div className="text-[#7A7A7A] text-[12px] font-IranYekanRegular text-center">
                          {routeInfo.formattedDistance}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Manual Source Data with departure date */}
                  <div className="flex flex-col items-center gap-y-1.5 w-1/4">
                    {isPending ? (
                      <Skeleton width={39} height={9} style={{ borderRadius: "5px" }} />
                    ) : (
                      <div className="text-deactive text-xxs">مبدا</div>
                    )}
                    {isPending ? (
                      <Skeleton
                        width={54}
                        height={14}
                        style={{ borderRadius: "5px" }}
                      />
                    ) : (
                      <div className="font-IranYekanBold text-black text-base">
                        {numberConvertor(data?.DepartTime ?? "")}
                      </div>
                    )}
                    {isPending ? (
                      <Skeleton
                        width={104}
                        height={14}
                        style={{ borderRadius: "5px" }}
                      />
                    ) : (
                      <div className="text-deactive text-xxs">{data?.SrcCityName}</div>
                    )}
                    {isPending ? (
                      <Skeleton
                        width={80}
                        height={12}
                        style={{ borderRadius: "5px" }}
                      />
                    ) : (
                      <div className="text-deactive text-xxs">{departureDate}</div>
                    )}
                  </div>
                </div>
                <SeatData data={data} isPending={isPending} />
              </div>
            </div>
          </div>
        </div>

        {/* Tablet view */}
        <div className="shadow-2 rounded-xl relative hidden sm:block lg:hidden font-IranYekanRegular">
          {/* Tablet header */}
          {isPending ? (
            <div className="flex px-9 items-center justify-between bg-white border-b border-secondary rounded-t-xl py-2">
              <Skeleton
                width={64}
                height={39}
                highlightColor="#CCD6E1"
                style={{ borderRadius: "5px" }}
              />
              <div className="flex items-center gap-x-6">
                <Skeleton
                  width={305}
                  height={39}
                  highlightColor="#CCD6E1"
                  style={{ borderRadius: "5px" }}
                />
                <Skeleton
                  width={78}
                  height={39}
                  highlightColor="#CCD6E1"
                  style={{ borderRadius: "5px" }}
                />
              </div>
            </div>
          ) : (
            <div className="flex px-9 items-center justify-between bg-white border-b border-secondary rounded-t-xl font-IranYekanRegular">
              <div>
                <ShareIcon className="text-primary cursor-pointer" />
              </div>
              <div className="flex items-center gap-x-6">
                <div className="text-black text-base font-IranYekanBold ">
                  {data?.CoName}
                </div>
                <div className="p-2">
                  <Image
                    src={data?.LogoUrl ?? "/assets/Company.svg"}
                    alt=""
                    width="50"
                    height="50"
                    className="w-10 h-10"
                  />
                </div>
              </div>
            </div>
          )}
          <div className="flex flex-col items-center relative">
            <Image
              src="https://cdn.bilit4u.com/images/CardBackground.png"
              alt="Card Background"
              width={1000}
              height={400}
              className="absolute w-full z-10 top-0 h-full"
            />
            <div className="flex flex-col gap-y-2.5 p-4 w-full">
              <div className="flex items-center">
                {/* Manual Destination Data for Tablet with arrival date */}
                <div className="flex flex-col items-center gap-y-1.5 w-1/4">
                  {isPending ? (
                    <Skeleton width={39} height={9} style={{ borderRadius: "5px" }} />
                  ) : (
                    <div className="text-deactive text-xxs">مقصد</div>
                  )}
                  {isPending ? (
                    <Skeleton
                      width={54}
                      height={14}
                      style={{ borderRadius: "5px" }}
                    />
                  ) : (
                    <div className="font-IranYekanBold text-black text-base">
                      {arrivalTime}
                    </div>
                  )}
                  {isPending ? (
                    <Skeleton
                      width={104}
                      height={14}
                      style={{ borderRadius: "5px" }}
                    />
                  ) : (
                    <div className="text-deactive text-xxs">{data?.DesCityName}</div>
                  )}
                  {isPending ? (
                    <Skeleton
                      width={80}
                      height={10}
                      style={{ borderRadius: "5px" }}
                    />
                  ) : (
                    <div className="text-deactive text-xxs">{arrivalDate}</div>
                  )}
                </div>

                {/* Updated StopData for tablet with separate layout */}
                {isPending ? (
                  <div className="w-1/2 text-center">
                    <Skeleton height={70} style={{ borderRadius: "5px" }} />
                  </div>
                ) : (
                  <div className="w-1/2 text-center">
                    <div className="relative w-full h-[120px] flex flex-col justify-center">
                      {/* "زمان تقریبی" text above the curve */}
                      <div className="text-[#7A7A7A] text-[10px] mb-6 font-IranYekanRegular text-center ">
                        زمان تقریبی
                      </div>

                      {/* Curve section */}
                      <div className="relative w-full h-[35px] mb-2">
                        {/* Extended dashed line for longer curve */}
                        <div className="absolute top-1/2 left-0 w-full border-t-2 border-dashed border-[#0D5990] -translate-y-1/2 scale-x-110" />
                        <div className="absolute w-4 h-4 bg-[#0D5990] rounded-full top-1/2 left-0 -translate-y-1/2" />
                        <div className="absolute w-4 h-4 bg-[#0D5990] rounded-full top-1/2 right-0 -translate-y-1/2" />

                        {/* Only duration inside the curve */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#E8F2FC] text-[#0D5990] px-3 py-4 rounded-full font-IranYekanBold text-[12px] border border-[#CCD6E1] min-w-[100px] text-center">
                          {formattedDuration}
                        </div>
                      </div>

                      {/* Distance below the curve */}
                      <div className="text-[#7A7A7A] text-[12px] mt-3 font-IranYekanRegular text-center">
                        {routeInfo.formattedDistance}
                      </div>
                    </div>
                  </div>
                )}

                {/* Manual Source Data for Tablet with departure date */}
                <div className="flex flex-col items-center gap-y-1.5 w-1/4">
                  {isPending ? (
                    <Skeleton width={39} height={9} style={{ borderRadius: "5px" }} />
                  ) : (
                    <div className="text-deactive text-xxs">مبدا</div>
                  )}
                  {isPending ? (
                    <Skeleton
                      width={54}
                      height={14}
                      style={{ borderRadius: "5px" }}
                    />
                  ) : (
                    <div className="font-IranYekanBold text-black text-base">
                      {numberConvertor(data?.DepartTime ?? "")}
                    </div>
                  )}
                  {isPending ? (
                    <Skeleton
                      width={104}
                      height={14}
                      style={{ borderRadius: "5px" }}
                    />
                  ) : (
                    <div className="text-deactive text-xxs">{data?.SrcCityName}</div>
                  )}
                  {isPending ? (
                    <Skeleton
                      width={80}
                      height={10}
                      style={{ borderRadius: "5px" }}
                    />
                  ) : (
                    <div className="text-deactive text-xxs">{departureDate}</div>
                  )}
                </div>
              </div>
              <div className="flex  items-center gap-x-2 justify-end min-h-[24px]">
                {!isPending && isDepartingSoon && (
                  <>
                    <ClockIcon className="text-red-500 px-0.5" />
                    <div className="text-red-500 text-xs font-IranYekanBold">
                      {numberConvertor(minutesLeft.toString())} دقیقه تا حرکت
                    </div>
                  </>
                )}
              </div>
              <SeatData data={data} isPending={isPending} />
            </div>
            <div className="bg-active border-t border-secondary flex items-center justify-between rounded-b-xl py-3 px-4 w-full">
              {isPending ? (
                <div className="flex flex-col gap-y-2">
                  <Skeleton
                    width={150}
                    height={30}
                    highlightColor="#CCD6E1"
                    style={{ borderRadius: "5px" }}
                  />
                  <Skeleton
                    width={150}
                    height={30}
                    highlightColor="#CCD6E1"
                    style={{ borderRadius: "5px" }}
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-y-2">
                  <div className="text-base text-primary font-IranYekanRegular text-center ">
                    {numberConvertor(
                      parseInt(data?.FullPrice ? (parseInt(data.FullPrice) / 10).toString() : "")?.toLocaleString() ?? ""
                    )}{" "}
                    تومان
                  </div>
                  <button
                    className={`shadow-md rounded-lg text-base font-IranYekanBold py-1 px-10 text-center ${isFullCapacity
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed opacity-70"
                      : "bg-[#0D5990] text-white"
                      }`}
                    disabled={isFullCapacity}
                    onClick={handleBuyTicket}
                  >
                    خرید بلیط
                  </button>
                </div>
              )}

              {isPending ? (
                <div className="flex flex-col gap-y-2">
                  <Skeleton
                    width={300}
                    height={30}
                    highlightColor="#CCD6E1"
                    style={{ borderRadius: "5px" }}
                  />
                  <Skeleton
                    width={300}
                    height={30}
                    highlightColor="#CCD6E1"
                    style={{ borderRadius: "5px" }}
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-y-2">
                  <button
                    onClick={() => setShowRefundRules(true)}
                    className="shadow-1 rounded-lg text-[#0D5990] border border-[#CCD6E1] py-0.5 px-7 text-center bg-white"
                  >
                    قوانین استرداد
                  </button>
                  <div className="bg-secondary text-black rounded-lg px-7 py-0.5 text-base text-center">
                    {numberConvertor(data?.BusType ?? "")}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="shadow-lg rounded-xl border border-[#CCD6E1] flex flex-col gap-y-2.5 my-4 sm:hidden font-IranYekanRegular">
          {/* Mobile header */}
          {isPending ? (
            <div className="flex items-center gap-x-2.5 justify-center px-4">
              <Skeleton height={30} width={200} style={{ borderRadius: "5px" }} />
              <Skeleton height={30} width={50} style={{ borderRadius: "5px" }} />
            </div>
          ) : (
            <div className="flex items-center gap-x-2.5 justify-center px-4">
              <div className="text-black text-base font-bold ">
                {data?.CoName}
              </div>
              <div className="p-2">
                <Image
                  src={data?.LogoUrl ?? "/assets/Company.svg"}
                  alt=""
                  width="50"
                  height="50"
                  className="w-10 h-10"
                />
              </div>
            </div>
          )}

          {/* Mobile city information with route data */}
          <div className="flex flex-col items-center px-4">
            {/* City information row */}
            <div className="flex items-center w-full mb-2">
              <div className="flex flex-col items-center gap-y-1.5 w-1/4">
                {isPending ? (
                  <Skeleton width={39} height={9} style={{ borderRadius: "5px" }} />
                ) : (
                  <div className="text-deactive text-xxs">مقصد</div>
                )}
                {isPending ? (
                  <Skeleton
                    width={54}
                    height={14}
                    style={{ borderRadius: "5px" }}
                  />
                ) : (
                  <div className="font-IranYekanBold text-black text-base">
                    {arrivalTime}
                  </div>
                )}
                {isPending ? (
                  <Skeleton
                    width={104}
                    height={14}
                    style={{ borderRadius: "5px" }}
                  />
                ) : (
                  <div className="text-deactive text-xxs">{data?.DesCityName}</div>
                )}
                {isPending ? (
                  <Skeleton
                    width={60}
                    height={8}
                    style={{ borderRadius: "5px" }}
                  />
                ) : (
                  <div className="text-deactive text-xxs">{arrivalDate}</div>
                )}
              </div>

              <div className="flex flex-col items-center w-1/2">
                {/* "زمان تقریبی" text above the entire curve */}
                {!isPending && (
                  <div className="text-[#7A7A7A] text-[10px] font-IranYekanRegular mb-5">
                    زمان تقریبی
                  </div>
                )}

                {/* Curve with dashes and circles */}
                <div className="flex items-center h-full w-full relative">
                  <div className="w-3 h-3 bg-[#0D5990] rounded-full px-1" />
                  {/* Extended dashed line for mobile */}
                  <hr className="border-dashed border-primary w-full scale-x-110" />
                  <div className="w-3 h-3 bg-[#0D5990] rounded-full px-1" />
                  {/* Duration inside the curve */}
                  {!isPending && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#E8F2FC] text-[#0D5990] px-2 py-2 rounded-full text-[10px] border border-[#CCD6E1] min-w-[120px] text-center font-IranYekanBold">
                      {formattedDuration}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-center gap-y-1.5 w-1/4">
                {isPending ? (
                  <Skeleton width={39} height={9} style={{ borderRadius: "5px" }} />
                ) : (
                  <div className="text-deactive text-xxs">مبدا</div>
                )}
                {isPending ? (
                  <Skeleton
                    width={54}
                    height={14}
                    style={{ borderRadius: "5px" }}
                  />
                ) : (
                  <div className="font-IranYekanBold text-black text-base">
                    {numberConvertor(data?.DepartTime ?? "")}
                  </div>
                )}
                {isPending ? (
                  <Skeleton
                    width={104}
                    height={14}
                    style={{ borderRadius: "5px" }}
                  />
                ) : (
                  <div className="text-deactive text-xxs">{data?.SrcCityName}</div>
                )}
                {isPending ? (
                  <Skeleton
                    width={60}
                    height={8}
                    style={{ borderRadius: "5px" }}
                  />
                ) : (
                  <div className="text-deactive text-xxs">{departureDate}</div>
                )}
              </div>
            </div>

            {/* Distance and Capacity info below the curve */}
            {!isPending && (
              <div className="flex flex-col items-center gap-1">
                <div className="text-[#7A7A7A] text-[12px] font-IranYekanRegular">
                  {routeInfo.formattedDistance}
                </div>

              </div>
            )}
          </div>

          <div className="flex  items-center gap-x-2 justify-center px-4 min-h-[20px]">
            {!isPending && isDepartingSoon && (
              <>
                <ClockIcon className="text-red-500 px-0.5" />
                <div className="text-red-500 text-xxs font-IranYekanBold">
                  {numberConvertor(minutesLeft.toString())} دقیقه تا حرکت
                </div>
              </>
            )}
          </div>

          {/* Mobile policy info */}
          {isPending ? (
            <div className="flex items-center justify-center gap-x-6 px-4">
              <Skeleton
                width={130}
                height={24}
                style={{ borderRadius: "25px" }}
              />
              <Skeleton
                width={130}
                height={24}
                style={{ borderRadius: "25px" }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center gap-x-5">
              <button
                onClick={() => setShowRefundRules(true)}
                className="border border-secondary py-0.5 px-3 text-xs rounded-full bg-white"
              >
                قوانین استرداد
              </button>
              <div className="bg-active border border-secondary py-0.5 px-3 text-xs rounded-full">
                {numberConvertor(data?.BusType ?? "")}
              </div>
            </div>
          )}

          {isPending ? (
            <div className="bg-active border-t border-secondary flex items-center justify-between rounded-b-lg py-3 px-4">
              <Skeleton width={150} height={30} style={{ borderRadius: "5px" }} />
              <Skeleton width={200} height={30} style={{ borderRadius: "5px" }} />
            </div>
          ) : (
            <div className="bg-active border-t shadow-lg border-[#CCD6E1] flex items-center justify-between rounded-b-xl py-4 px-4">
              <button
                className={`shadow-md rounded-lg text-sm font-IranYekanBold py-2 px-6 text-center ${isFullCapacity
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed opacity-70"
                  : "bg-[#0D5990] text-white"
                  }`}
                disabled={isFullCapacity}
                onClick={handleBuyTicket}
              >
                {isFullCapacity ? "ظرفیت تکمیل" : "خرید بلیط"}
              </button>

              {/* Simple Capacity Information */}
              <div className="flex flex-col items-center justify-center">
                <div className="text-[#7A7A7A] text-[10px] font-IranYekanRegular mb-1">
                  ظرفیت باقیمانده
                </div>
                <div className={`text-sm font-IranYekanBold ${isFullCapacity
                  ? 'text-red-600'
                  : availableSeats <= 5
                    ? 'text-orange-600'
                    : 'text-[#0D5990]'
                  }`}>
                  {isFullCapacity ? 'تکمیل شده' : `${numberConvertor(availableSeats.toString())} صندلی`}
                </div>
              </div>

              <div className="text-sm xl:text-base text-[#0D5990] font-IranYekanBold">
                {numberConvertor(
                  parseInt(data?.FullPrice ? (parseInt(data.FullPrice) / 10).toString() : "")?.toLocaleString() ?? ""
                )}{" "}
                تومان
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Responsive Refund Rules Dialog */}
      <Dialog open={showRefundRules} onOpenChange={setShowRefundRules}>
        <DialogContent
          className={`${isMobile ? 'sm:max-w-[350px]' : 'sm:max-w-[500px]'} font-IranYekanRegular`}
        >
          <DialogHeader>
            <DialogTitle className={`text-center text-[#0D5990] font-IranYekanBold ${isMobile ? 'text-[14px]' : 'text-lg'}`}>
              قوانین استرداد بلیط
            </DialogTitle>
            {!isMobile && (
              <DialogDescription className="text-center text-gray-500 text-sm mt-1">
                شرایط و قوانین مربوط به استرداد بلیط {data?.CoName || ""}
              </DialogDescription>
            )}
          </DialogHeader>

          {isMobile ? (
            // Mobile version - similar to ticket-card-sm
            <div className="py-2">
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

                {/* Contact info for mobile */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mt-4">
                  <div className="flex items-start">
                    <svg className="h-4 w-4 text-gray-500 mt-0.5 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-600 text-xs">
                      جهت استرداد با پشتیبانی به شماره <span className="font-IranYekanBold text-[#0D5990]" dir="ltr">۰۲۱-۹۱۰۵۵۰۱۱</span> تماس بگیرید.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Desktop version - detailed version from ticket-card-lg
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
                      <span className="font-IranYekanBold">{formatPrice(data?.FullPrice || "0")} تومان</span>
                    </div>
                    <div className="flex justify-between mt-1 pb-2 border-b border-dashed border-gray-200">
                      <span className="text-red-500">کسر جریمه (۱۰٪):</span>
                      <span className="text-red-500">{toPersianDigits(Math.floor(parseInt(data?.FullPrice || "0") * 0.1 / 10).toLocaleString())} تومان</span>
                    </div>
                    <div className="flex justify-between mt-2 text-[#0D5990] font-IranYekanBold">
                      <span>مبلغ قابل استرداد:</span>
                      <span>{calculateRefund(data?.FullPrice || "0", 10)} تومان</span>
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
                      <span className="font-IranYekanBold">{formatPrice(data?.FullPrice || "0")} تومان</span>
                    </div>
                    <div className="flex justify-between mt-1 pb-2 border-b border-dashed border-gray-200">
                      <span className="text-red-500">کسر جریمه (۵۰٪):</span>
                      <span className="text-red-500">{toPersianDigits(Math.floor(parseInt(data?.FullPrice || "0") * 0.5 / 10).toLocaleString())} تومان</span>
                    </div>
                    <div className="flex justify-between mt-2 text-[#0D5990] font-IranYekanBold">
                      <span>مبلغ قابل استرداد:</span>
                      <span>{calculateRefund(data?.FullPrice || "0", 50)} تومان</span>
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
                    جهت استرداد بلیط با پشتیبانی بیلیت‌فوریو به شماره <span className="font-IranYekanBold text-[#0D5990] tracking-wider" dir="ltr">۰۲۱-۹۱۰۵۵۰۱۱</span> تماس بگیرید یا از طریق چت آنلاین در وبسایت با ما در ارتباط باشید.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setShowRefundRules(false)}
              className={`bg-[#0D5990] hover:bg-[#0D4570] text-white w-full font-IranYekanRegular ${isMobile ? 'text-sm py-2' : ''}`}
            >
              بستن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MainCard;