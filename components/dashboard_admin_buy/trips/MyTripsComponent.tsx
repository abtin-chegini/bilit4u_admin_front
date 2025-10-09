"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { TicketManager } from "./ticketCardManager";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import moment from 'jalali-moment';

function toPersianDigits(num: number | string): string {
	return String(num).replace(/\d/g, (digit) =>
		['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'][parseInt(digit, 10)]
	);
}

const formatDate = (dateStr?: string): string => {
	if (!dateStr) return "نامشخص";

	const ddmmyyyyPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
	const yyyymmddPattern = /^(\d{4})\/(\d{2})\/(\d{2})$/;
	const persianDdmmyyyyPattern = /^[۰-۹]{2}\/[۰-۹]{2}\/[۰-۹]{4}$/;
	const persianYyyymmddPattern = /^[۰-۹]{4}\/[۰-۹]{2}\/[۰-۹]{2}$/;

	try {
		if (persianYyyymmddPattern.test(dateStr)) {
			return dateStr;
		}

		if (persianDdmmyyyyPattern.test(dateStr)) {
			const englishDigits = dateStr.replace(/[۰-۹]/g, (d) =>
				String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
			);

			const parts = englishDigits.split('/');
			const reversed = `${parts[2]}/${parts[1]}/${parts[0]}`;

			return toPersianDigits(reversed);
		}

		if (ddmmyyyyPattern.test(dateStr)) {
			const matches = dateStr.match(ddmmyyyyPattern);
			if (matches) {
				const [_, day, month, year] = matches;
				return toPersianDigits(`${year}/${month}/${day}`);
			}
		}

		if (yyyymmddPattern.test(dateStr)) {
			return toPersianDigits(dateStr);
		}

		const momentDate = moment(dateStr);
		if (momentDate.isValid()) {
			return toPersianDigits(momentDate.format('YYYY/MM/DD'));
		}

		return toPersianDigits(dateStr);
	} catch (error) {
		return toPersianDigits(dateStr);
	}
};

function formatToPersianDate(dateString: string): string {
	try {
		if (!dateString) return 'تاریخ نامشخص';

		const date = moment(dateString);

		if (!date.isValid()) {
			return dateString;
		}

		const persianMonths = [
			'فروردین', 'اردیبهشت', 'خرداد',
			'تیر', 'مرداد', 'شهریور',
			'مهر', 'آبان', 'آذر',
			'دی', 'بهمن', 'اسفند'
		];

		const jalaliDate = date.locale('fa');
		const jalaliDay = parseInt(jalaliDate.format('jD'));
		const jalaliMonth = parseInt(jalaliDate.format('jM')) - 1;
		const jalaliYear = parseInt(jalaliDate.format('jYYYY'));

		const dayOfWeek = getPersianDayOfWeek(date.day());
		const formattedDate = `${toPersianDigits(jalaliDay)} ${persianMonths[jalaliMonth]} ${toPersianDigits(jalaliYear)}`;

		return `${dayOfWeek}، ${formattedDate}`;
	} catch (error) {
		return dateString;
	}
}

function formatToPersianTime(timeString: string): string {
	try {
		if (!timeString) return '';
		return toPersianDigits(timeString);
	} catch (error) {
		return timeString;
	}
}

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

	const safeIndex = ((dayIndex % 7) + 7) % 7;
	return persianDays[safeIndex];
}

const formatPrice = (price: number): string => {
	return `${toPersianDigits(Math.floor(price / 10).toLocaleString())} تومان`;
};

interface Passenger {
	id: number;
	userID: number;
	fName: string;
	lName: string;
	gender: number;
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
	travelDuration?: string;
	coToken?: string;
	srcCityCode?: string;
	desCityCode?: string;
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
	lastStatus?: string;
	isInquery?: boolean;
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
	ArrivalTime?: string;
	ArrivalDate?: string;
	TravelDuration?: string;
}

export default function MyTripsComponent() {
	const [orders, setOrders] = useState<Order[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [apiFilter, setApiFilter] = useState<string>('ALL');
	const [hasInitialLoad, setHasInitialLoad] = useState(false);
	const [userId, setUserId] = useState<number | null>(null);
	const { toast } = useToast();

	// Helper function to determine bus type
	const getBusType = (ticket: Ticket): string => {
		if (ticket.isVIP) return 'VIP';
		if (ticket.isBed) return 'تخت‌دار';
		if (ticket.isMonitor) return 'مانیتوردار';
		if (ticket.isCharger) return 'شارژردار';
		return 'معمولی';
	};

	// Function to map Ticket to ServiceDetails
	const mapTicketToServiceDetails = (ticket: Ticket, order: Order): ServiceDetails => {
		const getBusTypeFull = (): string => {
			const types = [];
			if (ticket.isVIP) types.push('VIP');
			if (ticket.isBed) types.push('تخت‌دار');
			if (ticket.isMonitor) types.push('مانیتوردار');
			if (ticket.isCharger) types.push('شارژردار');

			return types.length > 0 ? types.join(' - ') : 'معمولی';
		};

		const getBusTypeCode = (): string => {
			if (ticket.isVIP) return 'VIP';
			if (ticket.isBed) return 'BED';
			if (ticket.isMonitor) return 'MONITOR';
			if (ticket.isCharger) return 'CHARGER';
			return 'NORMAL';
		};

		console.log('🔄 Mapping ticket data:', {
			arrivalTime: ticket.arrivalTime,
			arrivalDate: ticket.arrivalDate,
			travelDuration: ticket.travelDuration,
			departureTime: ticket.departureTime,
			departureDate: ticket.departureDate
		});

		return {
			ServiceNo: ticket.srvNo || '',
			DepartDate: formatDate(ticket.departureDate),
			DepartTime: ticket.departureTime ? toPersianDigits(ticket.departureTime) : 'نامشخص',
			Price: ticket.price.toString(),
			Description: ticket.srvName || null,
			LogoUrl: ticket.logoUrl || '',
			IsCharger: ticket.isCharger,
			IsMonitor: ticket.isMonitor,
			IsBed: ticket.isBed,
			IsVIP: ticket.isVIP,
			IsSofa: false,
			IsMono: false,
			IsAirConditionType: false,
			SrcCityCode: ticket.srcCityCode || ticket.departureCityId,
			DesCityCode: ticket.desCityCode || ticket.arrivalCityId,
			SrcCityName: ticket.departureCity,
			DesCityName: ticket.arrivalCity,
			Cnt: toPersianDigits(order.passengers.length.toString()),
			FullPrice: ticket.price.toString(),
			CoName: ticket.companyName,
			Group: '',
			BusType: getBusTypeCode(),
			BusTypeFull: getBusTypeFull(),
			RequestToken: ticket.coToken || '',
			TicketNo: toPersianDigits(order.refNum || ''),
			Timestamp: formatToPersianDate(order.creationDate),
			// Add missing fields from API response
			ArrivalTime: ticket.arrivalTime ? toPersianDigits(ticket.arrivalTime) : 'نامشخص',
			ArrivalDate: ticket.arrivalDate ? formatDate(ticket.arrivalDate) : 'نامشخص',
			TravelDuration: ticket.travelDuration || 'نامشخص'
		};
	};

	// Fetch user profile to get userId
	const fetchUserProfile = async (token: string) => {
		try {
			console.log('📞 Fetching user profile...');

			const response = await axios({
				method: 'GET',
				url: 'https://api.bilit4u.com/admin/api/v1/admin/profile',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			});

			console.log('✅ Profile response:', response.data);

			if (response.data && response.data.userId) {
				setUserId(response.data.userId);
				return response.data.userId;
			} else {
				throw new Error('UserId not found in profile response');
			}
		} catch (err) {
			console.error('❌ Error fetching profile:', err);
			throw err;
		}
	};

	// Fetch orders for the user
	const fetchOrdersWithFilter = async (filter: string, isRefresh: boolean = false) => {
		// Get auth session from localStorage
		const sessionData = typeof window !== 'undefined' ? localStorage.getItem('auth_session') : null;

		if (!sessionData) {
			setError("لطفا وارد حساب کاربری خود شوید");
			return;
		}

		let session;
		try {
			session = JSON.parse(sessionData);
		} catch (e) {
			setError("خطا در خواندن اطلاعات احراز هویت");
			return;
		}

		if (!session?.access_token) {
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
			// First, get userId if we don't have it
			let currentUserId = userId;
			if (!currentUserId) {
				currentUserId = await fetchUserProfile(session.access_token);
			}

			if (!currentUserId) {
				throw new Error('شناسه کاربر یافت نشد');
			}

			console.log('📞 Fetching orders for userId:', currentUserId);

			// Now fetch orders for this user
			const response = await axios({
				method: 'GET',
				url: `https://api.bilit4u.com/admin/api/v1/orders/user/${currentUserId}`,
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${session.access_token}`
				}
			});

			console.log("✅ Orders API Response:", response.data);

			if (response.data && Array.isArray(response.data.orders)) {
				// Sort orders by creation date (newest first)
				const sortedOrders = response.data.orders.sort((a: Order, b: Order) => {
					return new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime();
				});

				setOrders(sortedOrders);
				setApiFilter(filter);
			} else {
				setError("خطا در دریافت اطلاعات سفرها");
			}
		} catch (err) {
			console.error("❌ Error fetching orders:", err);

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

			for (const passenger of order.passengers) {
				const mappedOrder = {
					refNum: order.refNum,
					passengers: [{
						id: passenger.id,
						name: `${passenger.fName} ${passenger.lName}`,
						seatNo: passenger.seatNo,
						nationalCode: passenger.nationalCode,
						gender: passenger.gender === 1
					}],
					isPastTrip: isPastTrip,
					status: order.payment.status,
					orderId: order.orderId,
					creationDate: order.creationDate,
					factorUrl: order.factorUrl,
					seatMapURL: order.seatMapURL,
					totalAmount: ticket.price * order.passengers.length,
					paymentStatus: order.payment.status,
					LastStatus: order.lastStatus,
					Inquery: order.isInquery || false,
					isVerified: order.isVerified
				};

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

