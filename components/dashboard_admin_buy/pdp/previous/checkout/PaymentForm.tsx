import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { usePassengerStore } from '@/store/PassengerStore';
import { useUserStore } from '@/store/UserStore';
import { ServiceDetails } from '@/app/actions/bus-ticket';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useAuth } from "@/contexts/AuthContext";
import axios from 'axios';
import { useRouter } from "next/navigation";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import { useSeatLayoutStore } from '@/store/SeatLayoutStore';
import { useTicketStore } from '@/store/TicketStore';
import { getUploadData, getAssetIdCookie, getAssetIdFromHash } from '@/utils/sessionUtils';
import { getRouteInfoStatic } from '@/utils/RouteMapData';
// moment-jalaali will be required in the functions where needed

interface PaymentFormProps {
	serviceData: ServiceDetails | null;
	onComplete: () => void;
	onBack: () => void;
	token: string;
	ticketId: string;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ serviceData,
	onComplete,
	onBack,
	token,
	ticketId }) => {
	const [showPaymentDialog, setShowPaymentDialog] = useState(false);
	const [isTestingOrder, setIsTestingOrder] = useState(false);

	const { session } = useAuth();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [paymentMethod, setPaymentMethod] = useState<'bank' | 'wallet'>('bank');
	const [paymentGateway, setPaymentGateway] = useState<'sep'>('sep');
	const [progress, setProgress] = useState(0);
	const { toast } = useToast();

	// Seat layout store
	const { setSeatLayoutData } = useSeatLayoutStore();
	// console.log('PaymentForm Props:', { serviceData, token, ticketId });

	const router = useRouter();

	// Get passenger data from store
	const { passengers, currentSessionId } = usePassengerStore();
	const storedPassengers = passengers.filter(p => p.sessionId === currentSessionId);

	// Get user info from store
	const { user } = useUserStore();

	// Debug UserStore on PaymentForm load
	useEffect(() => {
		console.log('💳 PaymentForm - UserStore user object:', user);
		console.log('💳 PaymentForm - user?.additionalPhone:', user?.additionalPhone);
		console.log('💳 PaymentForm - user?.additionalEmail:', user?.additionalEmail);
		console.log('💳 PaymentForm - user?.phoneNumber:', user?.phoneNumber);
		console.log('💳 PaymentForm - user?.email:', user?.email);
	}, [user]);

	// Get the assetId from stored upload data
	const { assetId: uploadAssetId } = getUploadData();
	console.log('PaymentForm - Retrieved assetId from upload data:', uploadAssetId);

	// Try to get assetId from cookie as fallback
	const cookieAssetId = getAssetIdCookie();
	console.log('PaymentForm - Retrieved assetId from cookie:', cookieAssetId);

	// Try to get assetId from hash storage as another fallback
	const hashAssetId = getAssetIdFromHash();
	console.log('PaymentForm - Retrieved assetId from hash storage:', hashAssetId);

	// Use upload data first, then hash storage, then cookie
	const assetId = uploadAssetId || hashAssetId || cookieAssetId;

	// Log which source provided the assetId
	if (assetId) {
		if (uploadAssetId) {
			console.log('PaymentForm - Using assetId from upload data');
		} else if (hashAssetId) {
			console.log('PaymentForm - Using assetId from hash storage');
		} else if (cookieAssetId) {
			console.log('PaymentForm - Using assetId from cookie');
		}
		console.log('PaymentForm - Final assetId to send to AddOrder:', assetId);
	} else {
		console.warn('PaymentForm - No assetId found in any storage. PDF may not include seat layout image.');
	}

	// Calculate total price - Convert from Rial to Toman (divide by 10)
	const pricePerTicket = Math.floor((Number(serviceData?.FullPrice) || 0) / 10);
	const totalPrice = storedPassengers.length * pricePerTicket;
	const formattedPrice = new Intl.NumberFormat('fa-IR').format(totalPrice);

	// Helper function to convert Persian digits to English
	const toEnglishDigits = (input: string): string => {
		const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
		return input.replace(/[۰-۹]/g, (match) => persianDigits.indexOf(match).toString());
	};

	// Helper function to convert English digits to Persian
	const toPersianDigits = (input: string | number): string => {
		const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
		return input.toString().replace(/\d/g, (match) => persianDigits[parseInt(match)]);
	};

	// Helper function to convert DD/MM/YYYY to YYYY/MM/DD
	const convertDateFormat = (dateString: string): string => {
		if (!dateString) return '';

		try {
			// Convert Persian digits to English first
			const englishDate = toEnglishDigits(dateString);

			// Split the date (assuming DD/MM/YYYY format)
			const [day, month, year] = englishDate.split('/');

			// Return in YYYY/MM/DD format
			return `${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')}`;
		} catch (error) {
			console.error('Error converting date format:', error);
			return dateString; // Return original if conversion fails
		}
	};
	// Calculate arrival time function
	const calculateArrivalTime = (departTime: string | undefined, duration: string | null) => {
		if (!departTime || !duration) {
			return '';
		}

		try {
			// Parse departure time (convert Persian to English first)
			const cleanDepartTime = toEnglishDigits(departTime);
			const [dHours, dMinutes] = cleanDepartTime.split(':').map(num => parseInt(num, 10));

			// Parse duration
			const [durHours, durMinutes] = duration.split(':').map(num => parseInt(num, 10));

			console.log(`Calculating arrival time - Departure: ${dHours}:${dMinutes}, Duration: ${durHours}:${durMinutes}`);

			// Use the same pattern as TicketLg
			const moment = require('jalali-moment');
			const departMoment = moment().startOf('day').hours(dHours).minutes(dMinutes);
			const arrivalMoment = departMoment.clone().add(durHours, 'hours').add(durMinutes, 'minutes');

			const arrivalHours = arrivalMoment.hours();
			const arrivalMinutes = arrivalMoment.minutes();

			console.log(`Arrival time result: ${arrivalHours}:${arrivalMinutes}`);

			// Format in English digits (HH:MM format)
			const result = `${arrivalHours.toString().padStart(2, '0')}:${arrivalMinutes.toString().padStart(2, '0')}`;

			return result;
		} catch (error) {
			console.error('Error calculating arrival time:', error);
			return '';
		}
	};

	// Calculate arrival date function
	const calculateArrivalDate = (departDate: string | undefined, departTime: string | undefined, duration: string | null) => {
		if (!departDate || !departTime || !duration) {
			return '';
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

			// Format the arrival date in YYYY/MM/DD format with English digits
			const arrivalYear = arrivalMoment.jYear();
			const arrivalMonth = arrivalMoment.jMonth() + 1; // jMonth is 0-based
			const arrivalDay = arrivalMoment.jDate();

			// Format as YYYY/MM/DD with English digits
			const result = `${arrivalYear}/${arrivalMonth.toString().padStart(2, '0')}/${arrivalDay.toString().padStart(2, '0')}`;

			return result;
		} catch (error) {
			console.error('Error calculating arrival date:', error);
			return '';
		}
	};

	// Helper function to parse Persian date
	const parsePersianDate = (persianDate: string) => {
		try {
			// Convert Persian digits to English
			const englishDate = toEnglishDigits(persianDate);

			// Parse the date (assuming format like "14/02/1403" - DD/MM/YYYY as used in existing components)
			const [day, month, year] = englishDate.split('/').map(num => parseInt(num, 10));

			// Create moment object with Persian calendar using the same pattern as TicketLg
			const moment = require('jalali-moment');
			return moment().jYear(year).jMonth(month - 1).jDate(day).startOf('day');
		} catch (error) {
			console.error('Error parsing Persian date:', error);
			const moment = require('jalali-moment');
			return moment();
		}
	};

	// Helper function to convert numbers to Persian
	const numberConvertor = (input: string): string => {
		const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
		return input.replace(/\d/g, (match) => persianDigits[parseInt(match)]);
	};
	const handleTestOrder = async () => {
		if (isTestingOrder) return;

		setIsTestingOrder(true);

		try {
			console.log('TEST: Creating order only (no payment)');

			// Check if we have the necessary data
			if (!session?.access_token) {
				throw new Error('لطفا وارد حساب کاربری خود شوید');
			}

			if (!serviceData) {
				throw new Error('اطلاعات سرویس یافت نشد');
			}

			if (storedPassengers.length === 0) {
				throw new Error('لطفا حداقل یک مسافر اضافه کنید');
			}

			// Format passengers according to the required structure
			const formattedPassengers = storedPassengers.map(passenger => {
				return {
					userID: parseInt(String(user?.userId || "0")),
					fName: passenger.name || '',
					lName: passenger.family || '',
					gender: passenger.gender === 2,
					nationalCode: passenger.nationalId || '',
					address: '',
					dateOfBirth: passenger.birthDate || '13720704',
					phoneNumber: user?.additionalPhone || user?.phoneNumber || '',
					email: user?.additionalEmail || user?.email || '',
					seatID: String(passenger.seatId || ''),
					seatNo: String(passenger.seatNo || '')
				};
			});

			// Get route info for duration calculation
			const routeInfo = getRouteInfoStatic(serviceData?.SrcCityCode || null, serviceData?.DesCityCode || null);
			console.log('TEST: Route info for arrival calculation:', routeInfo);
			console.log('TEST: Travel duration from route info:', routeInfo.duration);

			console.log('TEST: Service Data:', serviceData.DepartDate);

			// Calculate arrival time and date
			const calculatedArrivalTime = calculateArrivalTime(serviceData?.DepartTime, routeInfo.duration);
			const calculatedArrivalDate = calculateArrivalDate(serviceData?.DepartDate, serviceData?.DepartTime, routeInfo.duration);

			console.log('TEST: Calculated arrival time:', calculatedArrivalTime);
			console.log('TEST: Calculated arrival date:', calculatedArrivalDate);

			// Prepare SrvTicket data from serviceData with proper format
			const srvTicket = {
				logoUrl: serviceData.LogoUrl || '',
				srvNo: ticketId,
				srvName: serviceData.Description || 'Bus Service',
				coToken: token || '',
				departureTime: serviceData.DepartTime || '',
				arrivalTime: calculatedArrivalTime || '', // Use calculated arrival time
				departureCity: serviceData.SrcCityName || '',
				arrivalCity: serviceData.DesCityName || '',
				departureDate: convertDateFormat(serviceData.DepartDate) || '', // Convert format here
				arrivalDate: calculatedArrivalDate || '', // Use calculated arrival date
				price: Number(serviceData.FullPrice) || 0,
				companyName: serviceData.CoName || '',
				isCharger: Boolean(serviceData.IsCharger),
				isMonitor: Boolean(serviceData.IsMonitor),
				isBed: Boolean(serviceData.IsBed),
				isVIP: Boolean(serviceData.IsVIP),
				isSofa: Boolean(serviceData.IsSofa),
				isMono: Boolean(serviceData.IsMono),
				isAirConditionType: Boolean(serviceData.IsAirConditionType),
				srcCityCode: serviceData.SrcCityCode || '',
				desCityCode: serviceData.DesCityCode || '',
				travelDuration: routeInfo.duration || '' // Add travel duration from route info
			};

			// Prepare request payload with the exact structure required
			const payload = {
				order: {
					userID: parseInt(String(user?.userId || "0")),
					description: `Bus ticket from ${srvTicket.departureCity} to ${srvTicket.arrivalCity}`,
					addedPhone: user?.additionalPhone || user?.phoneNumber || '',
					addedEmail: user?.additionalEmail || user?.email || '',
					SrvTicket: srvTicket,
					passengers: formattedPassengers,
					OrderAssetId: assetId || null // Include the assetId for PDF generation
				},
				token: session.access_token,
				refreshToken: session.refresh_token || ''
			};

			console.log('📱 Additional Phone from UserStore:', user?.additionalPhone);
			console.log('📧 Additional Email from UserStore:', user?.additionalEmail);
			console.log('📞 Fallback Phone (user):', user?.phoneNumber);
			console.log('✉️ Fallback Email (user):', user?.email);
			console.log('🚀 Final addedPhone in payload:', user?.additionalPhone || user?.phoneNumber || '');
			console.log('🚀 Final addedEmail in payload:', user?.additionalEmail || user?.email || '');
			console.log('TEST: Sending order to API with OrderAssetId:', assetId);
			console.log('TEST: OrderAssetId field in payload:', payload.order.OrderAssetId);
			console.log('TEST: SrvTicket data being sent:', srvTicket);
			console.log('TEST: Full payload:', JSON.stringify(payload, null, 2));

			// Create order using axios
			const orderResponse = await axios.post(
				'https://api.bilit4u.com/order/api/v1/order/add',
				payload,
				{
					headers: {
						'Content-Type': 'application/json',
					}
				}
			);

			console.log('TEST: Order API Response:', orderResponse.data);

			// Check if the order was created successfully
			if (!orderResponse.data.success) {
				throw new Error(orderResponse.data.message || 'Failed to create order');
			}

			// Extract the reference number from the response
			const refNum = orderResponse.data.refNum || orderResponse.data.refNumber || orderResponse.data.referenceNumber;

			if (!refNum) {
				throw new Error('Reference number not found in response');
			}

			console.log('TEST: Order Reference Number:', refNum);

			toast({
				title: "سفارش تست ایجاد شد",
				description: `سفارش با موفقیت ایجاد شد. شماره مرجع: ${refNum}`,
				variant: "default",
			});

		} catch (error) {
			console.error("TEST: Order error:", error);

			// Handle axios errors specifically
			if (axios.isAxiosError(error)) {
				const errorMessage = error.response?.data?.message ||
					error.message ||
					"متأسفانه مشکلی در ایجاد سفارش به وجود آمد";

				console.error('TEST: Axios Error Response:', error.response?.data);

				toast({
					title: "خطا در ایجاد سفارش",
					description: errorMessage,
					variant: "destructive",
				});
			} else {
				toast({
					title: "خطا در ایجاد سفارش",
					description: error instanceof Error ? error.message : "متأسفانه مشکلی در ایجاد سفارش به وجود آمد. لطفا دوباره تلاش کنید.",
					variant: "destructive",
				});
			}
		} finally {
			setIsTestingOrder(false);
		}
	};
	// Payment processing using Axios
	const handleSubmitPayment = async () => {
		if (isSubmitting) return;

		setIsSubmitting(true);
		setProgress(10);
		// Show the payment dialog
		setShowPaymentDialog(true);

		try {
			setProgress(20);

			console.log('User Info:', user);
			console.log('Passengers:', storedPassengers);
			console.log('Service Data:', serviceData);
			console.log('Total Price (Toman):', totalPrice);
			console.log('AccessToken:', session?.access_token);
			console.log('RefreshToken:', session?.refresh_token);
			console.log('OrderAssetId:', assetId);
			console.log('📱 Additional Phone from UserStore:', user?.additionalPhone);
			console.log('📧 Additional Email from UserStore:', user?.additionalEmail);
			console.log('📞 Fallback Phone (user):', user?.phoneNumber);
			console.log('✉️ Fallback Email (user):', user?.email);
			console.log('🚀 Final addedPhone in payload:', user?.additionalPhone || user?.phoneNumber || '');
			console.log('🚀 Final addedEmail in payload:', user?.additionalEmail || user?.email || '');

			// Check if we have the necessary data
			if (!session?.access_token) {
				throw new Error('لطفا وارد حساب کاربری خود شوید');
			}

			if (!serviceData) {
				throw new Error('اطلاعات سرویس یافت نشد');
			}

			if (storedPassengers.length === 0) {
				throw new Error('لطفا حداقل یک مسافر اضافه کنید');
			}

			// Format passengers according to the required structure
			const formattedPassengers = storedPassengers.map(passenger => {
				return {
					userID: parseInt(String(user?.userId || "0")), // Convert to string first, then parse to int
					fName: passenger.name || '',
					lName: passenger.family || '',
					gender: passenger.gender === 2, // true for male, false for female
					nationalCode: passenger.nationalId || '',
					address: '',  // Add default address
					dateOfBirth: passenger.birthDate || '13720704', // Default format if not available
					phoneNumber: user?.additionalPhone || user?.phoneNumber || '',
					email: user?.additionalEmail || user?.email || '',
					seatID: String(passenger.seatId || ''), // Ensure it's a string
					seatNo: String(passenger.seatNo || '') // Ensure it's a string
				};
			});

			console.log('Formatted Passengers:', formattedPassengers);

			// Get route info for duration calculation
			const routeInfo = getRouteInfoStatic(serviceData?.SrcCityCode || null, serviceData?.DesCityCode || null);
			console.log('Route info for arrival calculation:', routeInfo);
			console.log('Travel duration from route info:', routeInfo.duration);

			// Calculate arrival time and date
			const calculatedArrivalTime = calculateArrivalTime(serviceData?.DepartTime, routeInfo.duration);
			const calculatedArrivalDate = calculateArrivalDate(serviceData?.DepartDate, serviceData?.DepartTime, routeInfo.duration);

			console.log('Calculated arrival time:', calculatedArrivalTime);
			console.log('Calculated arrival date:', calculatedArrivalDate);

			// Prepare SrvTicket data from serviceData with proper format
			const srvTicket = {
				logoUrl: serviceData.LogoUrl || '',
				srvNo: ticketId,
				srvName: serviceData.Description || 'Bus Service',
				coToken: token || '',
				departureTime: serviceData.DepartTime || '',
				arrivalTime: calculatedArrivalTime || '', // Use calculated arrival time
				departureCity: serviceData.SrcCityName || '',
				arrivalCity: serviceData.DesCityName || '',
				departureDate: convertDateFormat(serviceData.DepartDate) || '', // Convert format here
				arrivalDate: calculatedArrivalDate || serviceData.DepartDate || '', // Use calculated arrival date
				price: Number(serviceData.FullPrice) || 0, // Keep in Rial as API expects
				companyName: serviceData.CoName || '',
				isCharger: Boolean(serviceData.IsCharger),
				isMonitor: Boolean(serviceData.IsMonitor),
				isBed: Boolean(serviceData.IsBed),
				isVIP: Boolean(serviceData.IsVIP),
				isSofa: Boolean(serviceData.IsSofa),
				isMono: Boolean(serviceData.IsMono),
				isAirConditionType: Boolean(serviceData.IsAirConditionType),
				srcCityCode: serviceData.SrcCityCode || '',
				desCityCode: serviceData.DesCityCode || '',
				travelDuration: routeInfo.duration || '' // Add travel duration from route info
			};

			// Prepare request payload with the exact structure required
			const payload = {
				order: {

					userID: parseInt(String(user?.userId || "0")), // Convert to string first, then parse to int
					description: `Bus ticket from ${srvTicket.departureCity} to ${srvTicket.arrivalCity}`,
					addedPhone: user?.additionalPhone || user?.phoneNumber || '',
					addedEmail: user?.additionalEmail || user?.email || '',
					SrvTicket: srvTicket,
					passengers: formattedPassengers,
					OrderAssetId: assetId || null // Include the assetId for PDF generation
				},
				token: session.access_token,
				refreshToken: session.refresh_token || ''
			};

			console.log('📱 Additional Phone from UserStore (handleSubmitPayment):', user?.additionalPhone);
			console.log('📧 Additional Email from UserStore (handleSubmitPayment):', user?.additionalEmail);
			console.log('📞 Fallback Phone (user):', user?.phoneNumber);
			console.log('✉️ Fallback Email (user):', user?.email);
			console.log('🚀 Final addedPhone in payload (handleSubmitPayment):', user?.additionalPhone || user?.phoneNumber || '');
			console.log('🚀 Final addedEmail in payload (handleSubmitPayment):', user?.additionalEmail || user?.email || '');
			console.log('Sending order to API with OrderAssetId:', assetId);
			console.log('OrderAssetId field in payload:', payload.order.OrderAssetId);
			console.log('User object for debugging:', user);
			console.log('SrvTicket data being sent:', srvTicket);
			console.log('Full payload:', JSON.stringify(payload, null, 2));
			setProgress(30);

			// STEP 1: Create order using axios
			const orderResponse = await axios.post(
				'https://api.bilit4u.com/order/api/v1/order/add',
				payload,
				{
					headers: {
						'Content-Type': 'application/json',
						// 'Authorization': `Bearer ${session.user.accessToken}`
					}
				}
			);

			console.log('Order API Response:', orderResponse.data);
			setProgress(60);

			// Check if the order was created successfully
			if (!orderResponse.data.success) {
				throw new Error(orderResponse.data.message || 'Failed to create order');
			}

			// Extract the reference number from the response
			const refNum = orderResponse.data.refNum || orderResponse.data.refNumber || orderResponse.data.referenceNumber;

			if (!refNum) {
				throw new Error('Reference number not found in response');
			}

			console.log('Order Reference Number:', refNum);
			setProgress(70);

			// Get the origin for CallBackUrl
			const origin = typeof window !== 'undefined' ? window.location.origin : '';
			console.log('Origin for CallBackUrl:', ticketId);

			// *******************************************// 
			// Prepare tickets/buy request payload
			// *******************************************// 

			// Get redisKey from localStorage (saved from ReserveNow API)
			const redisKey = typeof window !== 'undefined' ? localStorage.getItem('redisKey') : null;
			console.log('🔑 Retrieved redisKey from localStorage:', redisKey);
			console.log('🔍 RedisKey type:', typeof redisKey);
			console.log('🔍 RedisKey length:', redisKey ? redisKey.length : 'null/undefined');

			// Check all localStorage keys for debugging
			if (typeof window !== 'undefined') {
				console.log('📋 All localStorage keys:', Object.keys(localStorage));
				console.log('🔍 All localStorage values:', Object.keys(localStorage).map(key => `${key}: ${localStorage.getItem(key)}`));
			}

			const buyTicketPayload = {
				token: session.access_token,
				refreshToken: session.refresh_token || '',
				BusTicket: {
					CoToken: token || '',
					SrvNo: ticketId,
					RefNum: refNum,
					redisKey: redisKey || '', // Move redisKey inside BusTicket object
					CallBackUrl: `${origin}/invoice/${refNum}`,
					PhoneNumber: user?.phoneNumber || '09122028679', // Default phone number if not available
				}
			};

			console.log('🔍 Final redisKey value in payload:', buyTicketPayload.BusTicket.redisKey);
			// *******************************************// 

			console.log('Sending tickets/buy request:', JSON.stringify(buyTicketPayload, null, 2));

			setProgress(80);
			// *******************************************// 

			// STEP 2: Request payment URL using tickets/buy endpoint
			// *******************************************// 
			const buyResponse = await axios.post(
				'https://api.bilit4u.com/order/api/v1/tickets/buy',
				buyTicketPayload,
				{
					headers: {
						'Content-Type': 'application/json',
						// 'Authorization': `Bearer ${session.user.accessToken}`
					}
				}
			);
			// *******************************************// 
			// Log the entire response data to debug
			// *******************************************// 
			console.log('Buy Ticket Response Data:', buyResponse.data);
			// *******************************************// 
			// Check if the response contains a paymentUrl (using a more robust approach)
			// *******************************************// 
			let paymentUrl = null;

			if (buyResponse.data?.paymentUrl) {
				paymentUrl = buyResponse.data.paymentUrl;
			} else if (buyResponse.data?.redirectUrl) {
				paymentUrl = buyResponse.data.redirectUrl;
			} else if (buyResponse.data?.url) {
				paymentUrl = buyResponse.data.url;
			}

			if (!paymentUrl) {
				console.error('Payment URL missing. Full response:', JSON.stringify(buyResponse.data, null, 2));
				throw new Error('Payment URL not found in response');
			}
			console.log('Found payment URL:', paymentUrl);

			setProgress(90);
			// *******************************************// 
			// Show toast notification
			// *******************************************// 
			toast({
				title: "انتقال به درگاه پرداخت",
				description: "در حال انتقال به درگاه پرداخت...",
				variant: "default",
			});
			// *******************************************// 
			// Redirect to SEP payment page
			// *******************************************// 
			setTimeout(() => {
				setProgress(100);
				window.location.href = paymentUrl;
			}, 5000);
			// *******************************************// 

			// Use the test RefNum
			// const testRefNum = "BL250526BF6FD3";

			// Create test payload for septoken
			// *******************************************// 

			// const sepPayload = {
			// 	SepRequest: {
			// 		Amount: 12000,
			// 		ReturnUrl: `https://api.bilit4u.com/order/api/v1/payment/callback`,
			// 		PhoneNumber: "09122028679",
			// 		Description: "Abtin.Chegini@gmail.com",
			// 		RefNum: refNum
			// 	}
			// };

			// console.log('Sending test SEP token request:', JSON.stringify(sepPayload, null, 2));
			// setProgress(50);
			// *******************************************// 

			// Call the septoken endpoint
			// *******************************************// 

			// const sepResponse = await axios.post(
			// 	'https://api.bilit4u.com/order/api/v1/septoken',
			// 	sepPayload,
			// 	{
			// 		headers: {
			// 			'Content-Type': 'application/json',
			// 			// 'Authorization': `Bearer ${session.user.accessToken}`
			// 		}
			// 	}
			// );

			// console.log('SEP Token Response:', sepResponse.data.response.paymentUrl);
			// setProgress(80);
			// *******************************************// 


			// Check if the response contains a paymentUrl
			// *******************************************// 

			// let paymentUrl = null;
			// *******************************************// 

			// if (sepResponse.data?.paymentUrl) {
			// 	paymentUrl = sepResponse.data.paymentUrl;
			// } else if (sepResponse.data?.redirectUrl) {
			// 	paymentUrl = sepResponse.data.redirectUrl;
			// } else if (sepResponse.data?.url) {
			// 	paymentUrl = sepResponse.data.url;
			// }
			// *******************************************// 

			// paymentUrl = sepResponse.data.response.paymentUrl;
			// if (!paymentUrl) {
			// 	console.error('Payment URL missing. Full response:', JSON.stringify(sepResponse.data, null, 2));
			// 	throw new Error('Payment URL not found in response');
			// }

			// console.log('Found payment URL:', paymentUrl);
			// setProgress(90);
			// *******************************************// 

			// Show toast notification
			// *******************************************// 

			// toast({
			// 	title: "انتقال به درگاه پرداخت تست",
			// 	description: "در حال انتقال به درگاه پرداخت سپ...",
			// 	variant: "default",
			// });
			// *******************************************// 

			// Redirect to SEP payment page
			// *******************************************// 

			// setTimeout(() => {
			// 	setProgress(100);
			// 	window.location.href = paymentUrl;
			// }, 3000);

		} catch (error) {
			console.error("Payment error:", error);

			// Hide dialog on error

			setShowPaymentDialog(false);

			// Handle axios errors specifically
			if (axios.isAxiosError(error)) {
				const errorMessage = error.response?.data?.message ||
					error.message ||
					"متأسفانه مشکلی در پردازش پرداخت به وجود آمد";

				console.error('Axios Error Response:', error.response?.data);

				toast({
					title: "خطا در پرداخت",
					description: errorMessage,
					variant: "destructive",
				});
			} else {
				toast({
					title: "خطا در پرداخت",
					description: error instanceof Error ? error.message : "متأسفانه مشکلی در پردازش پرداخت به وجود آمد. لطفا دوباره تلاش کنید.",
					variant: "destructive",
				});
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			<div className="w-full max-w-3xl mx-auto" dir="rtl">
				{/* <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
					<p className="text-sm font-IranYekanBold text-yellow-800 mb-2">حالت تست - فقط برای توسعه</p>
					<Button
						onClick={handleTestOrder}
						disabled={isTestingOrder}
						variant="outline"
						className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300"
					>
						{isTestingOrder ? (
							<>
								<svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
									<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								در حال ایجاد سفارش تست...
							</>
						) : (
							"تست: فقط ایجاد سفارش (بدون پرداخت)"
						)}
					</Button>
				</div> */}

				{/* Payment Summary Card */}
				<Card className="mb-6 bg-white">
					<CardHeader className="pb-3">
						<CardTitle className="text-lg font-IranYekanBold text-[#0D5990]">اطلاعات پرداخت</CardTitle>
						<CardDescription className="text-sm font-IranYekanRegular text-gray-500">
							خلاصه سفارش و اطلاعات پرداخت
						</CardDescription>
					</CardHeader>

					<CardContent>
						{/* Order Summary */}
						<div className="space-y-4">
							<div className="flex justify-between items-center">
								<span className="text-sm font-IranYekanRegular text-gray-600">تعداد مسافران:</span>
								<span className="text-sm font-IranYekanBold">{storedPassengers.length} نفر</span>
							</div>

							<div className="flex justify-between items-center">
								<span className="text-sm font-IranYekanRegular text-gray-600">قیمت هر بلیط:</span>
								<span className="text-sm font-IranYekanBold">{new Intl.NumberFormat('fa-IR').format(pricePerTicket)} تومان</span>
							</div>

							<Separator className="my-2" />

							<div className="flex justify-between items-center">
								<span className="text-base font-IranYekanBold text-gray-800">مبلغ قابل پرداخت:</span>
								<span className="text-lg font-IranYekanBold text-[#0D5990]">{formattedPrice} تومان</span>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Payment Methods Card */}
				<Card className="mb-6 bg-white">
					<CardHeader className="pb-3">
						<CardTitle className="text-lg font-IranYekanBold text-[#0D5990]">روش پرداخت</CardTitle>
						<CardDescription className="text-sm font-IranYekanRegular text-gray-500">
							لطفاً روش پرداخت خود را انتخاب کنید
						</CardDescription>
					</CardHeader>

					<CardContent>
						<div className="space-y-3">
							{/* Bank Payment Option */}
							<div
								className={cn(
									"border rounded-md p-4 cursor-pointer transition-all",
									paymentMethod === 'bank'
										? "border-[#0D5990] bg-[#F0F7FF]"
										: "border-gray-200 hover:border-gray-300"
								)}
								onClick={() => setPaymentMethod('bank')}
							>
								<div className="flex items-center gap-3">
									<div className={cn(
										"w-5 h-5 rounded-full border flex items-center justify-center",
										paymentMethod === 'bank' ? "border-[#0D5990]" : "border-gray-300"
									)}>
										{paymentMethod === 'bank' && (
											<div className="w-3 h-3 rounded-full bg-[#0D5990]" />
										)}
									</div>
									<div className="flex items-center gap-2">
										<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
											<rect width="24" height="24" rx="4" fill="#F0F7FF" />
											<path d="M19 8H5C4.44772 8 4 8.44772 4 9V17C4 17.5523 4.44772 18 5 18H19C19.5523 18 20 17.5523 20 17V9C20 8.44772 19.5523 8 19 8Z" stroke="#0D5990" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
											<path d="M4 11H20" stroke="#0D5990" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
											<path d="M8 15H10" stroke="#0D5990" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
										</svg>
										<span className="font-IranYekanBold text-gray-800">پرداخت بانکی</span>
									</div>
								</div>
								<p className="text-xs font-IranYekanRegular text-gray-500 mt-2 pr-8">انتقال به درگاه پرداخت بانکی</p>
							</div>

							{/* Wallet Payment Option */}
							<div
								className={cn(
									"border rounded-md p-4 cursor-pointer transition-all",
									paymentMethod === 'wallet'
										? "border-[#0D5990] bg-[#F0F7FF]"
										: "border-gray-200 hover:border-gray-300"
								)}
								onClick={() => setPaymentMethod('wallet')}
							>
								<div className="flex items-center gap-3">
									<div className={cn(
										"w-5 h-5 rounded-full border flex items-center justify-center",
										paymentMethod === 'wallet' ? "border-[#0D5990]" : "border-gray-300"
									)}>
										{paymentMethod === 'wallet' && (
											<div className="w-3 h-3 rounded-full bg-[#0D5990]" />
										)}
									</div>
									<div className="flex items-center gap-2">
										<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
											<rect width="24" height="24" rx="4" fill="#F0F7FF" />
											<path d="M16 12H18C18.5523 12 19 11.5523 19 11V8C19 7.44772 18.5523 7 18 7H6C5.44772 7 5 7.44772 5 8V16C5 16.5523 5.44772 17 6 17H18C18.5523 17 19 16.5523 19 16V13C19 12.4477 18.5523 12 18 12H16V12Z" stroke="#0D5990" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
											<path d="M16 9H16.01" stroke="#0D5990" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
											<path d="M12 14.5C12.8284 14.5 13.5 13.8284 13.5 13C13.5 12.1716 12.8284 11.5 12 11.5C11.1716 11.5 10.5 12.1716 10.5 13C10.5 13.8284 11.1716 14.5 12 14.5Z" stroke="#0D5990" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
										</svg>
										<span className="font-IranYekanBold text-gray-800">کیف پول</span>
									</div>
								</div>
								<p className="text-xs font-IranYekanRegular text-gray-500 mt-2 pr-8">پرداخت از موجودی کیف پول</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Payment Gateway Selection */}
				{paymentMethod === 'bank' && (
					<Card className="mb-6 bg-white">
						<CardHeader className="pb-3">
							<CardTitle className="text-lg font-IranYekanBold text-[#0D5990]">انتخاب درگاه پرداخت</CardTitle>
							<CardDescription className="text-sm font-IranYekanRegular text-gray-500">
								درگاه پرداخت مورد نظر خود را انتخاب کنید
							</CardDescription>
						</CardHeader>

						<CardContent>
							<div
								className={cn(
									"border rounded-md p-4 cursor-pointer transition-all border-[#0D5990] bg-[#F0F7FF]"
								)}
							>
								<div className="flex items-center gap-3">
									<div className="w-5 h-5 rounded-full border border-[#0D5990] flex items-center justify-center">
										<div className="w-3 h-3 rounded-full bg-[#0D5990]" />
									</div>
									<div className="flex items-center gap-2">
										<div className="relative w-14 h-14">
											<Image
												src="https://cdn.bilit4u.com/images/sep-logo.png"
												alt="سپ"
												fill
												sizes="67px"
												className="object-contain"
											/>
										</div>
										<span className="font-IranYekanBold text-gray-800">درگاه سپ</span>
									</div>
								</div>
								<p className="text-xs font-IranYekanRegular text-gray-500 mt-2 pr-8">پرداخت از طریق درگاه امن سپ</p>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Passenger Information Summary */}
				<Card className="mb-6 bg-white">
					<CardHeader className="pb-3">
						<CardTitle className="text-lg font-IranYekanBold text-[#0D5990]">اطلاعات مسافران</CardTitle>
					</CardHeader>

					<CardContent>
						<div className="space-y-4">
							{storedPassengers.map((passenger, index) => (
								<div key={index} className="p-3 border border-gray-100 rounded-md bg-gray-50">
									<div className="flex justify-between">
										<span className="text-sm font-IranYekanBold text-gray-700">
											{passenger.name} {passenger.family}
										</span>
										<span className="text-xs font-IranYekanRegular text-gray-500">
											صندلی {passenger.seatNo}
										</span>
									</div>
									<div className="text-xs text-gray-500 mt-1">
										{passenger.nationalId && `کد ملی: ${passenger.nationalId}`}
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Action Buttons */}
				<div className="flex flex-col-reverse sm:flex-row justify-between gap-3 sm:gap-4 mt-6">
					<Button
						variant="outline"
						onClick={onBack}
						disabled={isSubmitting}
						className="border-[#0D5990] text-[#0D5990] hover:bg-[#E6F0F9] transition-colors flex items-center justify-center whitespace-nowrap px-3 sm:px-4 py-2.5 text-[13px] sm:text-[14px]"
					>
						<svg className="ml-1.5 sm:ml-2 w-3.5 h-3.5 sm:w-4 sm:h-4 rotate-180" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
						</svg>
						<span className="truncate">بازگشت به مرحله قبل</span>
					</Button>

					<Button
						onClick={handleSubmitPayment}
						disabled={isSubmitting}
						className="bg-[#0D5990] hover:bg-[#0D4570] text-white relative overflow-hidden px-3 py-2.5 sm:px-5 sm:py-3 text-[14px] font-IranYekanBold rounded-md min-h-[48px] flex items-center justify-center"
					>
						{isSubmitting ? (
							<>
								{/* Progress bar background */}
								<div className="absolute inset-0 bg-[#0D5990] bg-opacity-70"></div>

								{/* Moving progress indicator */}
								<div
									className="absolute left-0 top-0 bottom-0 bg-[#0D5990] transition-all duration-300"
									style={{ width: `${progress}%` }}
								></div>

								{/* Progress text */}
								<div className="relative z-10 flex items-center justify-center">
									<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									<span className="text-[13px] sm:text-[14px]">در حال پردازش پرداخت...</span>
								</div>
							</>
						) : (
							<div className="flex items-center justify-center">
								<span className="text-[13px] sm:text-[14px]">پرداخت و صدور بلیط</span>
								<svg className="mr-1.5 sm:mr-2 w-3.5 h-3.5 sm:w-4 sm:h-4" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							</div>
						)}
					</Button>
				</div>
			</div >

			{/* Payment Processing Dialog */}
			< Dialog open={showPaymentDialog} onOpenChange={(open) => {
				// Only allow closing dialog if we're not in the middle of processing
				if (!isSubmitting) setShowPaymentDialog(open);
			}}>
				<DialogContent className="sm:max-w-md text-center" dir="rtl">
					<DialogTitle className="text-lg font-IranYekanBold text-[#0D5990]">
						در حال پردازش پرداخت
					</DialogTitle>
					<DialogDescription className="text-sm font-IranYekanRegular text-gray-500">
						در حال انتقال به صفحه‌ی پرداخت می‌باشید
					</DialogDescription>

					<div className="my-6 flex flex-col items-center justify-center">
						<div className="w-16 h-16 relative mb-4">
							<svg className="animate-spin w-full h-full text-[#0D5990]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
								<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
						</div>

						{/* Progress bar */}
						<div className="w-full bg-gray-200 rounded-full h-2 mb-4">
							<div
								className="bg-[#0D5990] h-2 rounded-full transition-all duration-300"
								style={{ width: `${progress}%` }}
							></div>
						</div>

						<p className="text-sm text-gray-600 mb-2">پیشرفت: {progress}%</p>

						{/* Seat layout capture status */}
						{/* isCapturing && (
							<div className="flex items-center gap-2 text-sm text-blue-600 mt-2">
								<div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
								<span>در حال ثبت نقشه صندلی...</span>
							</div>
						) */}

						{/* captureError && (
							<div className="text-sm text-red-600 mt-2">
								خطا در ثبت نقشه صندلی: {captureError}
							</div>
						) */}
					</div>
				</DialogContent>
			</ Dialog>
		</>
	);
};

export default PaymentForm;