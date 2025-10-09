"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import withAuth from "@/lib/withAuth";
import TicketManager from "@/components/PDP/TicketCardManager/ticketCardManager";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import moment from 'jalali-moment';
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

function toPersianDigits(num: number | string): string {
  return String(num).replace(/\d/g, (digit) =>
    ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'][parseInt(digit, 10)]
  );
}

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

function formatToPersianDate(dateString: string): string {
  try {
    // If the input is empty or invalid, return a placeholder
    if (!dateString) return 'تاریخ نامشخص';

    // Parse the date with moment (supports ISO format and other common formats)
    const date = moment(dateString);

    // Check if the date is valid
    if (!date.isValid()) {
      // console.warn('Invalid date input:', dateString);
      return dateString; // Return the original string if invalid
    }

    // Get Persian month name
    const persianMonths = [
      'فروردین', 'اردیبهشت', 'خرداد',
      'تیر', 'مرداد', 'شهریور',
      'مهر', 'آبان', 'آذر',
      'دی', 'بهمن', 'اسفند'
    ];

    // Convert to Jalali (Persian) calendar
    const jalaliDate = date.locale('fa');
    const jalaliDay = parseInt(jalaliDate.format('jD'));
    const jalaliMonth = parseInt(jalaliDate.format('jM')) - 1; // 0-based index
    const jalaliYear = parseInt(jalaliDate.format('jYYYY'));

    // Get day of week in Persian
    const dayOfWeek = getPersianDayOfWeek(date.day());

    // Format the date with Persian digits and month name
    const formattedDate = `${toPersianDigits(jalaliDay)} ${persianMonths[jalaliMonth]} ${toPersianDigits(jalaliYear)}`;

    // Return formatted date with day of week
    return `${dayOfWeek}، ${formattedDate}`;
  } catch (error) {
    // console.error('Error formatting date to Persian:', error);
    return dateString; // Return the original string on error
  }
}

// Helper function to format time to Persian digits
function formatToPersianTime(timeString: string): string {
  try {
    if (!timeString) return '';
    return toPersianDigits(timeString);
  } catch (error) {
    // console.error('Error formatting time to Persian:', error);
    return timeString;
  }
}

// Helper function to get Persian day of week
function getPersianDayOfWeek(dayIndex: number): string {
  const persianDays = [
    'یکشنبه',
    'دوشنبه',
    'سه‌شنبه',
    'چهارشنبه',
    'پنج‌شنبه',
    'جمعه',
    'شنبه'
  ];

  // Ensure the index is valid (0-6)
  const safeIndex = ((dayIndex % 7) + 7) % 7;
  return persianDays[safeIndex];
}

// Format price to Persian format with toman
const formatPrice = (price: number): string => {
  return `${toPersianDigits(Math.floor(price / 10).toLocaleString())} تومان`;
};

// Define ticket order interfaces
interface Passenger {
  id: number;
  userID: number;
  fName: string;
  lName: string;
  gender: number; // Change from boolean to number
  nationalCode: string;
  address: string;
  phoneNumber: string;
  dateOfBirth: string;
  email: string;
  seatNo: string;
  seatID: string;
}

interface Ticket {
  id: number;
  logoUrl: string;
  srvNo: string;
  srvName: string;
  arrivalCityId: string;
  departureCityId: string;
  departureTime: string;
  arrivalTime: string;
  departureCity: string;
  arrivalCity: string;
  departureDate: string;
  arrivalDate: string;
  price: number;
  companyName: string;
  isCharger: boolean;
  isMonitor: boolean;
  isBed: boolean;
  isVIP: boolean;
}

interface Payment {
  refNum: string;
  refcode: string;
  status: string;
  terminalId: string;
  amount: number;
  hashedCardNumber: string;
  traceNo: string;
  cellNumber: string;
  rrn: string;
  createdAt: string;
}

interface Order {
  orderId: number;
  description: string;
  creationDate: string;
  isVerified: boolean;
  refNum: string;
  factorUrl: string;
  seatMapURL: string;
  addedPhone: string;
  addedEmail: string;
  payment: Payment;
  ticket: Ticket;
  passengers: Passenger[];
  lastStatus?: string; // Payment status from backend (e.g., "DONE")
  isInquery?: boolean; // Whether the ticket has been refunded
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
}

interface ApiResponse {
  result: boolean;
  message: string;
  orders: Order[];
}

function MyTrips() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiFilter, setApiFilter] = useState<string>('ALL');
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const { toast } = useToast();

  // Helper function to determine bus type
  const getBusType = (ticket: Ticket): string => {
    if (ticket.isVIP) return 'VIP';
    if (ticket.isBed) return 'تخت‌دار';
    if (ticket.isMonitor) return 'مانیتوردار';
    if (ticket.isCharger) return 'شارژردار';
    return 'معمولی';
  };

  // Function to calculate total duration (estimate based on departure and arrival times)
  const calculateDuration = (departureTime: string, arrivalTime: string): string => {
    try {
      if (!departureTime || !arrivalTime) return "نامشخص";

      // Parse the time strings (assuming format like "08:30")
      const [departHours, departMinutes] = departureTime.split(':').map(Number);
      const [arriveHours, arriveMinutes] = arrivalTime.split(':').map(Number);

      // Calculate total minutes
      let totalMinutes = (arriveHours * 60 + arriveMinutes) - (departHours * 60 + departMinutes);

      // Handle overnight trips
      if (totalMinutes < 0) {
        totalMinutes += 24 * 60; // Add 24 hours
      }

      // Convert to hours and minutes
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      return toPersianDigits(`${hours} ساعت و ${minutes} دقیقه`);
    } catch (e) {
      // console.error("Error calculating duration:", e);
      return "نامشخص";
    }
  };

  // Function to map Ticket to ServiceDetails
  const mapTicketToServiceDetails = (ticket: Ticket, order: Order): ServiceDetails => {
    // Get bus type full description
    const getBusTypeFull = (): string => {
      const types = [];
      if (ticket.isVIP) types.push('VIP');
      if (ticket.isBed) types.push('تخت‌دار');
      if (ticket.isMonitor) types.push('مانیتوردار');
      if (ticket.isCharger) types.push('شارژردار');

      return types.length > 0 ? types.join(' - ') : 'معمولی';
    };

    // Get simple bus type code
    const getBusTypeCode = (): string => {
      if (ticket.isVIP) return 'VIP';
      if (ticket.isBed) return 'BED';
      if (ticket.isMonitor) return 'MONITOR';
      if (ticket.isCharger) return 'CHARGER';
      return 'NORMAL';
    };

    return {
      ServiceNo: ticket.srvNo || '',
      // Use Persian formatted date and time
      DepartDate: formatDate(ticket.departureDate),
      DepartTime: formatDate(ticket.departureTime),
      Price: ticket.price.toString(),
      Description: null,
      LogoUrl: ticket.logoUrl || '',
      IsCharger: ticket.isCharger,
      IsMonitor: ticket.isMonitor,
      IsBed: ticket.isBed,
      IsVIP: ticket.isVIP,
      IsSofa: false, // Default value as it's not in ticket
      IsMono: false, // Default value as it's not in ticket
      IsAirConditionType: false, // Default value as it's not in ticket
      SrcCityCode: ticket.departureCityId, // Not available in ticket data
      DesCityCode: ticket.arrivalCityId, // Not available in ticket data
      SrcCityName: ticket.departureCity,
      DesCityName: ticket.arrivalCity,
      Cnt: toPersianDigits(order.passengers.length.toString()), // Persian digits for passenger count
      FullPrice: ticket.price.toString(),
      CoName: ticket.companyName,
      Group: '', // Not available in ticket data
      BusType: getBusTypeCode(),
      BusTypeFull: getBusTypeFull(),
      RequestToken: '', // Not available in ticket data
      TicketNo: toPersianDigits(order.refNum || ''),
      Timestamp: formatToPersianDate(order.creationDate)
    };
  };

  const fetchOrdersWithFilter = async (filter: string, isRefresh: boolean = false) => {
    if (!session?.user?.accessToken) {
      setError("لطفا وارد حساب کاربری خود شوید");
      return;
    }

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await axios({
        method: 'GET',
        url: `https://api.bilit4u.com/order/api/v1/orders/filter/${filter}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.user.accessToken}`,
          'X-Refresh-Token': session.user.refreshToken || ''
        }
      });

      // console.log("API Response:", response.data);

      if (response.data && Array.isArray(response.data.orders)) {
        // Sort orders by creation date (newest first)
        const sortedOrders = response.data.orders.sort((a: Order, b: Order) => {
          return new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime();
        });

        setOrders(sortedOrders);
        setApiFilter(filter);
      } else {
        // console.error("Invalid API response format:", response.data);
        setError("خطا در دریافت اطلاعات سفرها");
      }
    } catch (err) {
      // console.error("Error fetching orders:", err);

      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setError("لطفاً دوباره وارد حساب کاربری خود شوید");
        } else {
          setError(err.response?.data?.message || "خطا در دریافت اطلاعات سفرها");
        }
      } else {
        setError("خطا در ارتباط با سرور");
      }

      toast({
        title: "خطا",
        description: "مشکلی در بارگیری سفرها رخ داد. لطفا دوباره تلاش کنید.",
        variant: "destructive"
      });
    } finally {
      if (isRefresh) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
      setHasInitialLoad(true);
    }
  };

  const convertOrdersToTickets = (orders: Order[]) => {
    const tickets = [];

    for (const order of orders) {
      const ticket = order.ticket;
      const isPastTrip = new Date(ticket.departureDate) < new Date();

      const ticketDetails = mapTicketToServiceDetails(ticket, order);

      // Debug: Log payment status for each order
      // console.log('Order payment status:', { 
      //   refNum: order.refNum, 
      //   paymentStatus: order.payment.status,
      //   payment: order.payment,
      //   lastStatus: order.lastStatus,
      //   isInquery: order.isInquery,
      //   isVerified: order.isVerified
      // });

      for (const passenger of order.passengers) {
        const mappedOrder = {
          refNum: order.refNum,
          passengers: [{
            id: passenger.id,
            name: `${passenger.fName} ${passenger.lName}`,
            seatNo: passenger.seatNo,
            nationalCode: passenger.nationalCode,
            gender: passenger.gender === 1 // Convert number to boolean (1 = true, other values = false)
          }],
          isPastTrip: isPastTrip,
          status: order.payment.status,
          orderId: order.orderId,
          creationDate: order.creationDate,
          factorUrl: order.factorUrl,
          seatMapURL: order.seatMapURL,
          totalAmount: ticket.price * order.passengers.length,
          paymentStatus: order.payment.status,
          LastStatus: order.lastStatus, // Use backend lastStatus
          Inquery: order.isInquery || false, // Use backend isInquery
          isVerified: order.isVerified // Pass isVerified from backend
        };

        // console.log('Mapped order for refNum:', order.refNum, mappedOrder);

        tickets.push({
          ticket: ticketDetails,
          order: mappedOrder
        });
      }
    }

    return tickets;
  };
  // Manual refresh function
  const handleRefresh = () => {
    fetchOrdersWithFilter(apiFilter, true);
  };

  // Only fetch data on initial load (when component mounts)
  useEffect(() => {
    if (!hasInitialLoad) {
      fetchOrdersWithFilter('ALL');
    }
  }, [hasInitialLoad]);

  // Check for loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] p-6">
        <motion.div
          className="max-w-7xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-4 w-64" />
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <Skeleton className="h-10 lg:col-span-2" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          </div>

          <div className="space-y-6">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-64 w-full rounded-lg" />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] p-6">
        <motion.div
          className="max-w-7xl mx-auto flex items-center justify-center min-h-[calc(100vh-3rem)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200 max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-IranYekanBold text-red-700 mb-2">خطا در بارگیری بلیط‌ها</h3>
            <p className="text-red-600 font-IranYekanRegular mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-IranYekanRegular"
            >
              تلاش مجدد
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Convert orders to tickets format for TicketManager
  const ticketsForManager = convertOrdersToTickets(orders);
  // console.log("Tickets for TicketManager:", ticketsForManager); // Debug log

  // Always render TicketManager - it will handle empty state internally
  return (
    <div className="min-h-screen bg-[#FAFAFA] p-6">
      <motion.div
        className="max-w-7xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <TicketManager
          tickets={ticketsForManager}
          itemsPerPage={10}
          showSearch={true}
          showFilter={true}
          onFilterChange={(filter) => fetchOrdersWithFilter(filter, false)}
          currentApiFilter={apiFilter}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
      </motion.div>
    </div>
  );
}

export default withAuth(MyTrips);