"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Session } from '@supabase/supabase-js';
import { PaymentStep } from './PaymentStep';

// Import exact same components from previous PDP
import { BusLayout } from "@/components/dashboard_admin_buy/pdp/previous/bus_layout/bus_layout";
import { MediumBusLayout } from "@/components/dashboard_admin_buy/pdp/previous/bus_layout_medium/bus_layout_medium";
import { MobileBusLayout } from "@/components/dashboard_admin_buy/pdp/previous/bus_layout_mobile/bus_layout_mobile";
import { PassengerDetailsForm } from '@/components/dashboard_admin_buy/pdp/previous/passenger_details/passenger_details';
import TicketCardLg, { ServiceDetails } from '@/components/dashboard_admin_buy/pdp/previous/ticket-card-lg/index';

// Import stores
import { useTicketStore } from '@/store/TicketStore';
import { usePassengerStore, StoredPassenger } from '@/store/PassengerStore';
import { useScreenSize } from '@/hooks/useScreenSize';

// Import UI components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Steps from "@/components/ui/steps";

// Import utilities (same as previous PDP)
import { RouteUtils } from "@/lib/RouteUtil";
import axios from 'axios';
import Image from "next/image";
import moment from "jalali-moment";
import { useRouteInfoWithIds } from '@/lib/RouteMapData';
import numberConvertor from "@/lib/numberConvertor";
import { fetchSrvDetails } from '@/services/SeatService';

// Define the interface for the API response data
interface ApiServiceData {
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

// Helper function to map serviceData to TicketCardLg expected format
const mapServiceDataToTicketCardLg = (data: ApiServiceData | any): ServiceDetails => {
	console.log('🔄 mapServiceDataToTicketCardLg - Input data:', {
		inputData: data,
		inputKeys: data ? Object.keys(data) : null,
		inputType: typeof data,
		isArray: Array.isArray(data),
		isNull: data === null,
		isUndefined: data === undefined
	});

	// Check if data is valid
	if (!data || typeof data !== 'object') {
		console.error('❌ mapServiceDataToTicketCardLg - Invalid input data:', data);
		throw new Error('Invalid service data provided to mapping function');
	}

	// Parse the response if it's a JSON string
	let parsedData = data;
	if (data.response && typeof data.response === 'string') {
		try {
			parsedData = JSON.parse(data.response);
			console.log('🔄 mapServiceDataToTicketCardLg - Parsed JSON response:', parsedData);
		} catch (parseError) {
			console.error('❌ mapServiceDataToTicketCardLg - Error parsing JSON response:', parseError);
			throw new Error('Failed to parse JSON response');
		}
	} else if (data.response && typeof data.response === 'object') {
		parsedData = data.response;
		console.log('🔄 mapServiceDataToTicketCardLg - Using object response:', parsedData);
	}

	console.log('🔄 mapServiceDataToTicketCardLg - Final data to map:', {
		parsedData: parsedData,
		parsedKeys: parsedData ? Object.keys(parsedData) : null,
		parsedType: typeof parsedData
	});

	const mappedData: ServiceDetails = {
		ServiceNo: parsedData.ServiceNo || '',
		CoName: parsedData.CoName || '',
		DepartDate: parsedData.DepartDate || '',
		DepartTime: parsedData.DepartTime || '',
		FullPrice: parsedData.FullPrice || parsedData.Price || '',
		SrcCityName: parsedData.SrcCityName || '',
		DesCityName: parsedData.DesCityName || '',
		LogoUrl: parsedData.LogoUrl || '',
		BusType: parsedData.BusType || '',
		IsBed: Boolean(parsedData.IsBed),
		IsMonitor: Boolean(parsedData.IsMonitor),
		IsCharger: Boolean(parsedData.IsCharger),
		SrcCityCode: parsedData.SrcCityCode || '',
		DesCityCode: parsedData.DesCityCode || '',
		Cnt: parsedData.Cnt || '',
		Group: parsedData.Group || '',
		BusTypeFull: parsedData.BusTypeFull || '',
		RequestToken: parsedData.RequestToken || '',
		TicketNo: parsedData.TicketNo || '',
		Timestamp: parsedData.Timestamp || '',
		Description: parsedData.Description || null,
		IsVIP: Boolean(parsedData.IsVIP),
		IsSofa: Boolean(parsedData.IsSofa),
		IsMono: Boolean(parsedData.IsMono),
		IsAirConditionType: Boolean(parsedData.IsAirConditionType),
		Price: parsedData.Price || parsedData.FullPrice || '',
		SrcCityId: parsedData.SrcCityId || parsedData.SrcCityCode,
		DesCityId: parsedData.DesCityId || parsedData.DesCityCode
	};

	console.log('🔄 mapServiceDataToTicketCardLg - Output mapped data:', {
		mappedData: mappedData,
		mappedKeys: Object.keys(mappedData),
		fieldMapping: {
			ServiceNo: `${parsedData.ServiceNo} → ${mappedData.ServiceNo}`,
			CoName: `${parsedData.CoName} → ${mappedData.CoName}`,
			DepartDate: `${parsedData.DepartDate} → ${mappedData.DepartDate}`,
			DepartTime: `${parsedData.DepartTime} → ${mappedData.DepartTime}`,
			FullPrice: `${parsedData.FullPrice} → ${mappedData.FullPrice}`,
			SrcCityName: `${parsedData.SrcCityName} → ${mappedData.SrcCityName}`,
			DesCityName: `${parsedData.DesCityName} → ${mappedData.DesCityName}`,
			LogoUrl: `${parsedData.LogoUrl} → ${mappedData.LogoUrl}`,
			BusType: `${parsedData.BusType} → ${mappedData.BusType}`,
			SrcCityCode: `${parsedData.SrcCityCode} → ${mappedData.SrcCityCode}`,
			DesCityCode: `${parsedData.DesCityCode} → ${mappedData.DesCityCode}`
		},
		hasAllRequiredFields: !!(mappedData.ServiceNo && mappedData.CoName && mappedData.DepartDate),
		validation: {
			hasServiceNo: !!mappedData.ServiceNo,
			hasCoName: !!mappedData.CoName,
			hasDepartDate: !!mappedData.DepartDate,
			hasDepartTime: !!mappedData.DepartTime,
			hasFullPrice: !!mappedData.FullPrice,
			hasSrcCityName: !!mappedData.SrcCityName,
			hasDesCityName: !!mappedData.DesCityName
		}
	});

	return mappedData;
};

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

export function toPersianDigits(num: number | string): string {
	return num.toString().replace(/\d/g, (digit) =>
		"۰۱۲۳۴۵۶۷۸۹"[parseInt(digit, 10)]
	);
}

export function formatPrice(price: number): string {
	return toPersianDigits(price.toLocaleString('fa-IR'));
}

// Helper functions for ticket card
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

const parsePersianDate = (persianDate: string) => {
	try {
		const [day, month, year] = persianDate.split('/').map(Number);
		const jMoment = moment().jYear(year).jMonth(month - 1).jDate(day).startOf('day');
		return jMoment;
	} catch (error) {
		return moment();
	}
};

const formatPersianDateToReadable = (persianDate: string | undefined) => {
	if (!persianDate) return 'نامشخص';
	try {
		const [day, month, year] = persianDate.split('/').map(Number);
		const persianMonths = [
			'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
			'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
		];
		const persianYearStr = numberConvertor(year.toString());
		const persianDayStr = numberConvertor(day.toString());
		const persianMonthName = persianMonths[month - 1];
		return `${persianDayStr} ${persianMonthName} ${persianYearStr}`;
	} catch (error) {
		return 'نامشخص';
	}
};

const calculateArrivalTime = (departTime: string | undefined, duration: string | null) => {
	if (!departTime || !duration) return 'نامشخص';
	try {
		const [dHours, dMinutes] = departTime.split(':').map(Number);
		const [durHours, durMinutes] = duration.split(':').map(Number);
		const departMoment = moment().startOf('day').hours(dHours).minutes(dMinutes);
		const arrivalMoment = departMoment.clone().add(durHours, 'hours').add(durMinutes, 'minutes');
		const arrivalHours = arrivalMoment.hours();
		const arrivalMinutes = arrivalMoment.minutes();
		return `${numberConvertor(arrivalHours.toString().padStart(2, '0'))}:${numberConvertor(arrivalMinutes.toString().padStart(2, '0'))}`;
	} catch (error) {
		return 'نامشخص';
	}
};

const calculateArrivalDate = (departDate: string | undefined, departTime: string | undefined, duration: string | null) => {
	if (!departDate || !departTime || !duration) return 'نامشخص';
	try {
		const [dHours, dMinutes] = departTime.split(':').map(Number);
		const [durHours, durMinutes] = duration.split(':').map(Number);
		const departMoment = parsePersianDate(departDate).hours(dHours).minutes(dMinutes);
		const arrivalMoment = departMoment.clone().add(durHours, 'hours').add(durMinutes, 'minutes');
		const arrivalYear = arrivalMoment.jYear();
		const arrivalMonth = arrivalMoment.jMonth() + 1;
		const arrivalDay = arrivalMoment.jDate();
		const persianMonths = [
			'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
			'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
		];
		const persianYearStr = numberConvertor(arrivalYear.toString());
		const persianDayStr = numberConvertor(arrivalDay.toString());
		const persianMonthName = persianMonths[arrivalMonth - 1];
		return `${persianDayStr} ${persianMonthName} ${persianYearStr}`;
	} catch (error) {
		return 'نامشخص';
	}
};

interface BusReservationWithStepperProps {
	onTimeExpire?: () => void;
	seatPriceServiceDetail?: any;
	hideContinueButton?: boolean;
	onContinue?: () => void;
}

const BusReservationWithStepper: React.FC<BusReservationWithStepperProps> = ({
	onTimeExpire,
	seatPriceServiceDetail,
	hideContinueButton = false,
	onContinue,
}) => {
	// State management
	const [currentStep, setCurrentStep] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [validationData, setValidationData] = useState<{
		isAnyPassengerValid: boolean;
		allPassengersValid: boolean;
	}>({
		isAnyPassengerValid: false,
		allPassengersValid: false
	});

	// Ref to access PassengerDetailsForm methods
	const passengerDetailsRef = useRef<{
		savePassengers: () => Promise<{ success: boolean; passengers: StoredPassenger[] }>;
		restorePassengerData: (passengers: StoredPassenger[]) => void;
	}>(null);

	// Hooks
	const router = useRouter();
	const params = useParams();
	const { toast } = useToast();
	const screenSize = useScreenSize();
	const isMobile = screenSize === 'xs' || screenSize === 'sm';
	const isTablet = screenSize === 'md';

	// Get URL parameters for ticket initialization
	const urlToken = params.token as string;
	const urlTicketId = params.ticketId as string;

	// Log component initialization
	useEffect(() => {
		console.log('🚀 PDP Component - BusReservationWithStepper initialized:', {
			urlToken,
			urlTicketId,
			seatPriceServiceDetail: !!seatPriceServiceDetail,
			hideContinueButton,
			componentMounted: true
		});

		// Log that we're ready to use real serviceData
		console.log('🚀 PDP Component - Ready to fetch and use real serviceData from API');
	}, []);

	// Store states
	const { selectedSeats, serviceData, ticketId, token, setSrvTicket } = useTicketStore();
	const { passengers, addPassengers } = usePassengerStore();

	// State for service details
	const [srvDetails, setSrvDetails] = useState<any>(null);
	const [isLoadingSrvDetails, setIsLoadingSrvDetails] = useState(false);

	// Fetch service details on component mount - prioritize URL params over store
	useEffect(() => {
		const fetchServiceDetails = async () => {
			// Use URL parameters first, fallback to store values
			const currentToken = urlToken || token;
			const currentTicketId = urlTicketId || ticketId;

			if (!currentToken || !currentTicketId) {
				console.log('Missing token or ticketId for service details:', {
					urlToken, urlTicketId, storeToken: token, storeTicketId: ticketId
				});
				return;
			}

			setIsLoadingSrvDetails(true);
			try {
				console.log('🔄 PDP Component - Fetching service details for ticket:', {
					token: currentToken,
					ticketId: currentTicketId,
					source: urlToken ? 'URL' : 'Store',
					apiEndpoint: '/srvdetail'
				});

				const details = await fetchSrvDetails({
					ticketId: currentTicketId,
					token: currentToken
				});

				console.log('✅ PDP Component - Service details fetched successfully:', {
					hasData: !!details,
					responseKeys: details ? Object.keys(details) : null,
					responseData: details
				});

				// Use the actual serviceData from the API response directly
				console.log('🎯 PDP Component - Using actual serviceData from API:', {
					rawResponse: details,
					responseKeys: details ? Object.keys(details) : null,
					responseType: typeof details,
					isArray: Array.isArray(details),
					isNull: details === null,
					isUndefined: details === undefined
				});

				// Validate that we have valid data before mapping
				if (!details || typeof details !== 'object') {
					console.error('❌ PDP Component - Invalid API response data:', details);
					throw new Error('Invalid API response data received');
				}

				// Map serviceData keys to TicketCardLg expected format
				try {
					const mappedServiceData = mapServiceDataToTicketCardLg(details);

					console.log('🔄 PDP Component - Mapped serviceData for TicketCardLg:', {
						mappedData: mappedServiceData,
						hasAllRequiredFields: !!(mappedServiceData.ServiceNo && mappedServiceData.CoName && mappedServiceData.DepartDate)
					});

					setSrvDetails(mappedServiceData);

					// Save to ticket store and localforage
					setSrvTicket(mappedServiceData);
					console.log('✅ srvTicket data saved to store and localforage');
				} catch (mappingError) {
					console.error('❌ PDP Component - Error in mapping serviceData:', mappingError);
					const errorMessage = mappingError instanceof Error ? mappingError.message : 'Unknown mapping error';
					throw new Error(`Failed to map service data: ${errorMessage}`);
				}
			} catch (error) {
				console.error('❌ PDP Component - Error fetching service details:', error);

				// If API call fails, try to use serviceData from store
				if (serviceData) {
					console.log('🔄 PDP Component - API failed, using serviceData from store as fallback');
					console.log('🔄 PDP Component - Store serviceData:', {
						storeData: serviceData,
						storeKeys: serviceData ? Object.keys(serviceData) : null,
						storeType: typeof serviceData
					});

					try {
						// Map serviceData from store to TicketCardLg expected format
						const mappedStoreData = mapServiceDataToTicketCardLg(serviceData);

						console.log('🔄 PDP Component - Mapped store serviceData for TicketCardLg:', mappedStoreData);
						setSrvDetails(mappedStoreData);

						// Save to ticket store and localforage
						setSrvTicket(mappedStoreData);
						console.log('✅ srvTicket data (from store fallback) saved to localforage');
					} catch (storeMappingError) {
						console.error('❌ PDP Component - Error mapping store serviceData:', storeMappingError);
						const errorMessage = storeMappingError instanceof Error ? storeMappingError.message : 'Unknown store mapping error';
						toast({
							title: "خطا در پردازش اطلاعات",
							description: `مشکلی در پردازش اطلاعات بلیط رخ داد: ${errorMessage}`,
							variant: "destructive"
						});
					}
				} else {
					console.log('❌ PDP Component - No serviceData available in store either');
					toast({
						title: "خطا در دریافت اطلاعات سرویس",
						description: "مشکلی در دریافت اطلاعات بلیط رخ داد. لطفا دوباره تلاش کنید.",
						variant: "destructive"
					});
				}
			} finally {
				setIsLoadingSrvDetails(false);
			}
		};

		fetchServiceDetails();
	}, [urlToken, urlTicketId, token, ticketId, toast]);

	// Get route information for ticket card - prioritize srvDetails from API, fallback to serviceData from store
	const ticketData = srvDetails || serviceData;

	// Log which data source we're using
	console.log('📊 PDP Component - Data source for TicketCardLg:', {
		usingSrvDetails: !!srvDetails,
		usingServiceData: !!serviceData && !srvDetails,
		ticketData: ticketData,
		ticketDataKeys: ticketData ? Object.keys(ticketData) : null
	});
	const routeInfo = useRouteInfoWithIds(ticketData?.SrcCityId, ticketData?.DesCityId);

	// Debug logging for ticket data
	useEffect(() => {
		console.log('🎫 PDP Component - Ticket data for components:', {
			srvDetails: !!srvDetails,
			serviceData: !!serviceData,
			ticketData: !!ticketData,
			urlToken,
			urlTicketId,
			storeToken: token,
			storeTicketId: ticketId,
			ticketDataKeys: ticketData ? Object.keys(ticketData) : null
		});

		// Log serviceData details when it changes
		if (serviceData) {
			console.log('📊 PDP Component - serviceData from store:', {
				ServiceNo: serviceData.ServiceNo,
				CoName: serviceData.CoName,
				DepartDate: serviceData.DepartDate,
				DepartTime: serviceData.DepartTime,
				FullPrice: serviceData.FullPrice,
				SrcCityName: serviceData.SrcCityName,
				DesCityName: serviceData.DesCityName,
				SrcCityId: serviceData.SrcCityId,
				DesCityId: serviceData.DesCityId,
				LogoUrl: serviceData.LogoUrl,
				BusType: serviceData.BusType,
				IsBed: serviceData.IsBed,
				IsMonitor: serviceData.IsMonitor,
				IsCharger: serviceData.IsCharger,
				fullObject: serviceData
			});
		}

		// Log srvDetails when it's fetched from API
		if (srvDetails) {
			console.log('🔍 PDP Component - srvDetails from API:', {
				ServiceNo: srvDetails.ServiceNo,
				CoName: srvDetails.CoName,
				DepartDate: srvDetails.DepartDate,
				DepartTime: srvDetails.DepartTime,
				FullPrice: srvDetails.FullPrice,
				SrcCityName: srvDetails.SrcCityName,
				DesCityName: srvDetails.DesCityName,
				SrcCityId: srvDetails.SrcCityId,
				DesCityId: srvDetails.DesCityId,
				LogoUrl: srvDetails.LogoUrl,
				BusType: srvDetails.BusType,
				IsBed: srvDetails.IsBed,
				IsMonitor: srvDetails.IsMonitor,
				IsCharger: srvDetails.IsCharger,
				fullObject: srvDetails
			});
		}
	}, [srvDetails, serviceData, ticketData, urlToken, urlTicketId, token, ticketId]);

	// Calculate ticket card data
	const formattedDuration = formatDurationToPersian(routeInfo.duration);
	const arrivalTime = calculateArrivalTime(ticketData?.DepartTime, routeInfo.duration);
	const arrivalDate = calculateArrivalDate(ticketData?.DepartDate, ticketData?.DepartTime, routeInfo.duration);
	const departureDate = formatPersianDateToReadable(ticketData?.DepartDate);

	// Constants (same as previous PDP)
	const maxSelectable = 7;
	// Use service details price if available, fallback to seatPriceServiceDetail
	const servicePrice = ticketData?.FullPrice ? parseInt(ticketData.FullPrice) / 10 : null;
	const seatPrice = servicePrice || (seatPriceServiceDetail ? parseInt(seatPriceServiceDetail.fullPrice || '250000') / 10 : 250000);
	const totalPrice = selectedSeats.length * seatPrice;

	// Handle time expire function (same as previous PDP)
	const handleTimeExpire = () => {
		if (onTimeExpire) {
			onTimeExpire();
		} else {
			router.push('/dashboard');
		}
	};

	// Memoize guidance data to prevent unnecessary re-renders (same as previous PDP)
	const guidanceData = React.useMemo(() => ({
		selectedSeats,
		maxSelectable,
		seatPrice,
		totalPrice,
		handleTimeExpire
	}), [selectedSeats, maxSelectable, seatPrice, totalPrice, handleTimeExpire]);

	// Session management
	const getAuthSession = (): Session | null => {
		if (typeof window === 'undefined') return null;
		try {
			const sessionData = localStorage.getItem('auth_session');
			return sessionData ? JSON.parse(sessionData) as Session : null;
		} catch (error) {
			console.error('Failed to get auth session:', error);
			return null;
		}
	};

	const session = getAuthSession();

	// Load data from localStorage on component mount
	useEffect(() => {
		try {
			const savedData = localStorage.getItem('bus_reservation_data');
			if (savedData) {
				const reservationData = JSON.parse(savedData);
				console.log('📦 Loaded reservation data from localStorage:', reservationData);

				// Check if the data is still valid (within 30 minutes)
				const savedTime = new Date(reservationData.timestamp);
				const now = new Date();
				const diffMinutes = (now.getTime() - savedTime.getTime()) / (1000 * 60);

				if (diffMinutes <= 30) {
					console.log('✅ Reservation data is still valid');
					// You can restore the data here if needed
				} else {
					console.log('⏰ Reservation data expired, clearing...');
					localStorage.removeItem('bus_reservation_data');
				}
			}
		} catch (error) {
			console.error('❌ Error loading from localStorage:', error);
		}
	}, []);

	// Step configuration - 3 steps: seat selection + passenger details, payment, ticket issuance
	const steps = [
		{
			id: 'seat-selection-and-passenger-details',
			title: 'انتخاب صندلی و مشخصات مسافران',
			description: 'صندلی مورد نظر خود را انتخاب کنید و اطلاعات مسافران را تکمیل کنید',
			component: 'seat-selection-and-passenger-details'
		},
		{
			id: 'payment',
			title: 'تایید اطلاعات و پرداخت',
			description: 'اطلاعات را بررسی کنید و پرداخت را انجام دهید',
			component: 'payment'
		},
		{
			id: 'ticket-issuance',
			title: 'صدور بلیط',
			description: 'بلیط شما صادر می‌شود',
			component: 'ticket-issuance'
		}
	];

	// Navigation functions
	const nextStep = () => {
		if (currentStep < steps.length - 1) {
			setCurrentStep(currentStep + 1);
		}
	};

	const prevStep = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	const goToStep = (stepIndex: number) => {
		if (stepIndex >= 0 && stepIndex < steps.length) {
			setCurrentStep(stepIndex);
		}
	};

	// Validation functions (exact same logic as previous PDP)
	const validateCurrentStep = async (): Promise<boolean> => {
		switch (currentStep) {
			case 0: // Combined seat selection and passenger details
				const filteredSeats = selectedSeats.filter(seat => seat.state.includes('selected'));
				if (filteredSeats.length === 0) {
					toast({
						title: "خطا",
						description: "لطفا حداقل یک صندلی انتخاب کنید",
						variant: "destructive"
					});
					return false;
				}
				// Check if all passengers have valid information
				if (!validationData.allPassengersValid) {
					toast({
						title: "خطا",
						description: "لطفا اطلاعات تمام مسافران را تکمیل کنید",
						variant: "destructive"
					});
					return false;
				}
				console.log('Seats selected:', filteredSeats.length);
				return true;

			default:
				return false;
		}
	};

	// Handle continue button click
	const handleContinue = async () => {
		console.log('Continue button clicked');
		console.log('Current step:', currentStep);
		console.log('Selected seats:', selectedSeats);

		// Validate current step before proceeding
		const isValid = await validateCurrentStep();
		if (!isValid) {
			return;
		}

		// Save passengers using the existing PassengerDetailsForm method
		if (currentStep === 0 && passengerDetailsRef.current) {
			console.log('📦 Calling savePassengers (only once on continue button)...');

			try {
				// Use the existing savePassengers method from PassengerDetailsForm
				const result = await passengerDetailsRef.current.savePassengers();

				if (!result.success) {
					console.log('❌ Failed to save passengers');
					return; // Don't proceed if save failed
				}

				console.log('✅ Passengers saved successfully');

			} catch (error) {
				console.error('❌ Error saving passengers:', error);
				toast({
					title: "خطا در ذخیره اطلاعات",
					description: "لطفا مجددا تلاش کنید",
					variant: "destructive"
				});
				return; // Don't proceed if there's an error
			}
		}

		// Proceed to next step
		nextStep();
	};

	// Handle validation change from passenger details
	const handleValidationChange = (data: {
		isAnyPassengerValid: boolean;
		allPassengersValid: boolean;
	}) => {
		setValidationData(data);
	};

	// Handle remove passenger (same as previous PDP)
	const handleRemovePassenger = (seatId: number) => {
		console.log('BusReservationWithStepper: Removing passenger', seatId);
		// Remove from ticket store
		const { removeSelectedSeat } = useTicketStore.getState();
		removeSelectedSeat(seatId);
	};

	// Handle seat state change (same as previous PDP)
	const handleSeatStateChange = (seatId: number, newState?: string) => {
		console.log('BusReservationWithStepper: Seat state change', seatId, newState);
		// Update seat state in ticket store
		const { updateSeatState } = useTicketStore.getState();
		updateSeatState(seatId, (newState || '') as any);
	};

	// Render step content using exact same components as previous PDP
	const renderStepContent = () => {
		switch (currentStep) {
			case 0: // Combined seat selection and passenger details
				return (
					<div dir="rtl" className="max-w-[1200px] mx-auto mt-6 flex flex-col gap-6">
						<div className="flex flex-col md:flex-row gap-6">
							{/* Bus seat guidance side panel - only show on desktop (not medium or mobile) */}
							{!isTablet && !isMobile && (
								<div className="w-full md:w-[360px] flex flex-col gap-6">
									<div className="bg-white border border-gray-300 p-4 rounded-md flex flex-col justify-between shadow-md">
										{/* Guidance panel content */}
										<div>
											<div className="flex justify-between items-center mb-6">
												<div className="flex items-center gap-2">
													<svg
														width="23"
														height="20"
														viewBox="0 0 23 20"
														fill="none"
														xmlns="http://www.w3.org/2000/svg"
													>
														<path
															d="M18.5041 4.10182C19.4841 3.45812 19.7236 2.21095 19.0376 1.29569C18.3516 0.390492 16.9905 0.16922 15.9996 0.802862C15.0196 1.44656 14.7801 2.69373 15.4661 3.60899C16.163 4.51419 17.5132 4.73546 18.5041 4.10182V4.10182ZM6.90741 17.539H14.6059C16.2174 17.539 17.5894 16.4528 17.829 14.9844L19.9741 5.46968H22.1519L19.985 15.2861C19.5712 17.7402 17.2845 19.5506 14.595 19.5506H6.90741V17.539ZM6.65697 13.5159H11.9707L13.0923 9.39223C11.3719 10.2874 9.52075 10.9411 7.48452 10.6193V8.47697C9.25941 8.78876 11.2303 8.2054 12.5914 7.21974L14.3772 5.9424C14.6276 5.76136 14.9107 5.64067 15.2047 5.5602C15.5532 5.46968 15.9234 5.43951 16.2827 5.49986H16.3045C17.6439 5.72113 18.5367 6.89789 18.3081 8.12494L16.8381 14.0792C16.5332 15.5074 15.1939 16.5333 13.6259 16.5333H6.16697L2.00741 19.5506L0.37408 18.0419L6.65697 13.5159Z"
															fill="#4B5259"
														/>
													</svg>
													<h2 className="mt-4 mb-2 font-IranYekanBold text-[#4B5259] text-[14px] text-md">
														راهنمای انتخاب صندلی اتوبوس
													</h2>
												</div>
											</div>

											<ul className="list-disc list-inside space-y-1 pr-2 font-IranYekanRegular text-[12px]">
												<li>با کلیک اول، صندلی برای <span className="font-IranYekanBold text-[#0D5990]">آقا</span> انتخاب می‌شود</li>
												<li>با کلیک دوم، صندلی برای <span className="font-IranYekanBold text-[#307F4F]">خانم</span> انتخاب می‌شود</li>
												<li>با کلیک سوم، انتخاب صندلی <span className="font-IranYekanBold">لغو</span> می‌شود</li>
											</ul>
										</div>

										<div>
											{/* Seat indicators */}
											<div className="grid grid-cols-3 gap-4 text-sm text-gray-700 mt-5">
												<div className="flex items-center gap-2">
													<div className="w-4 h-4 rounded-full bg-[#CEDFF7] border border-[#4379C4]" />
													<span className="font-IranYekanBold text-[11px]">رزرو شده آقا</span>
												</div>
												<div className="flex items-center gap-2">
													<div className="w-4 h-4 rounded-full bg-[#F7F9FA] border border-[#CCD6E1]" />
													<span className="font-IranYekanBold text-[11px]">قابل رزرو</span>
												</div>
												<div className="flex items-center gap-2">
													<div className="w-4 h-4 rounded-full bg-[#0D5990]" />
													<span className="font-IranYekanBold text-[11px]">رزرو شما</span>
												</div>
												<div className="flex items-center gap-2">
													<div className="w-4 h-4 rounded-full bg-[#CEF7DE] border border-[#43C45F]" />
													<span className="font-IranYekanBold text-[11px]">رزرو شده خانم</span>
												</div>
												<div className="flex items-center gap-2">
													<div className="w-4 h-4 rounded-full bg-[#CCD6E1] border border-[#4B5259]" />
													<span className="font-IranYekanBold text-[11px]">غیر قابل رزرو</span>
												</div>
											</div>

											{/* Selected seat count */}
											<div className="mt-6 text-sm text-gray-700 font-IranYekanBold border-t border-gray-200 pt-3">
												تعداد صندلی انتخاب شده: {toPersianDigits(selectedSeats.length)} از {toPersianDigits(maxSelectable)}
											</div>
											{selectedSeats.length > 0 && (
												<div className="mt-3 space-y-2">
													{/* Compact seat display with stars */}
													<div className="flex flex-wrap gap-1 mb-2">
														<span className="text-sm text-gray-700 font-IranYekanRegular">صندلی‌ها:</span>
														{selectedSeats.map((seat) => (
															<span key={`star-seat-${seat.id}`}
																className={`text-sm font-IranYekanMedium 
									${seat.state === 'selected-male' ? 'text-blue-600' : 'text-green-600'}`}>
																{toPersianDigits(seat.seatNo)}
																<span className="text-yellow-500">*</span>
																{seat !== selectedSeats[selectedSeats.length - 1] && <span className="text-gray-400 mx-0.5">،</span>}
															</span>
														))}
													</div>

													{/* Price line */}
													<div className="flex justify-between items-center text-sm">
														<span className="text-gray-600">
															{toPersianDigits(selectedSeats.length)} × {formatPrice(seatPrice)}:
														</span>
														<span className="font-IranYekanMedium">{formatPrice(totalPrice)} تومان</span>
													</div>

													{/* Total */}
													<div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200 mt-2">
														<span className="text-gray-800 font-IranYekanBold">مجموع:</span>
														<span className="font-IranYekanBold text-[#0D5990] text-[14px]">
															{formatPrice(totalPrice)} تومان
														</span>
													</div>
												</div>
											)}
										</div>
									</div>
								</div>
							)}

							{/* Bus layout main area */}
							<div className={`flex-1 bg-white border border-gray-300 p-4 rounded-md shadow-md ${isTablet ? 'w-full' : ''}`}>
								{/* Render the appropriate bus layout component based on screen size */}
								{isMobile ? (
									<MobileBusLayout
										maxSelectable={maxSelectable}
										spaces={[]}
										guidanceData={guidanceData}
									/>
								) : isTablet ? (
									<MediumBusLayout
										maxSelectable={maxSelectable}
										spaces={[]}
										guidanceData={guidanceData}
									/>
								) : (
									<BusLayout
										maxSelectable={maxSelectable}
										spaces={[]}
										guidanceData={guidanceData}
									/>
								)}
							</div>
						</div>

						{/* Passenger Details Form - Always show in step 0 */}
						<div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
							<h2 className="text-xl font-bold text-gray-800 mb-6 font-iran-yekan">مشخصات مسافران</h2>
							<PassengerDetailsForm
								ref={passengerDetailsRef}
								seats={selectedSeats.map((seat: any) => ({
									...seat,
									seatNo: typeof seat.seatNo === 'string' ? parseInt(seat.seatNo) : seat.seatNo
								}))}
								onRemovePassenger={handleRemovePassenger}
								onSeatStateChange={handleSeatStateChange}
								onValidationChange={handleValidationChange}
							/>
						</div>

					</div>
				);

			case 1: // Payment step
				return (
					<div dir="rtl" className="max-w-[1200px] mx-auto mt-6 flex flex-col gap-6">
						{/* Readonly Bus Layout */}
						<div className="bg-white border border-gray-300 rounded-xl shadow-md p-6 relative">
							<div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-4">
								<div className="flex items-center gap-3">
									<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M4 16C4 16.5304 4.21071 17.0391 4.58579 17.4142C4.96086 17.7893 5.46957 18 6 18H18C18.5304 18 19.0391 17.7893 19.4142 17.4142C19.7893 17.0391 20 16.5304 20 16V6C20 5.46957 19.7893 4.96086 19.4142 4.58579C19.0391 4.21071 18.5304 4 18 4H6C5.46957 4 4.96086 4.21071 4.58579 4.58579C4.21071 4.96086 4 5.46957 4 6V16Z" stroke="#0D5990" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
										<path d="M9 4V18" stroke="#0D5990" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
										<path d="M15 4V18" stroke="#0D5990" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
									</svg>
									<h3 className="text-lg font-IranYekanBold text-gray-800">نمای صندلی‌های انتخابی</h3>
								</div>
								<div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg">
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#0D5990" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
										<path d="M12 16V12" stroke="#0D5990" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
										<path d="M12 8H12.01" stroke="#0D5990" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
									</svg>
									<span className="text-xs font-IranYekanBold text-[#0D5990]">فقط نمایش</span>
								</div>
							</div>
							{/* Readonly overlay - prevents all interactions */}
							<div className="relative pointer-events-none select-none opacity-90">
								{/* Render the appropriate bus layout component based on screen size */}
								{isMobile ? (
									<MobileBusLayout
										maxSelectable={maxSelectable}
										spaces={[]}
										guidanceData={guidanceData}
									/>
								) : isTablet ? (
									<MediumBusLayout
										maxSelectable={maxSelectable}
										spaces={[]}
										guidanceData={guidanceData}
									/>
								) : (
									<BusLayout
										maxSelectable={maxSelectable}
										spaces={[]}
										guidanceData={guidanceData}
									/>
								)}
							</div>
						</div>

						{/* Payment Step Component */}
						<PaymentStep
							onBack={() => {
								console.log('Back to seat selection clicked');
								prevStep();
							}}
							onPaymentSuccess={() => {
								// Handle payment success if needed
								console.log('Payment successful');
							}}
						/>
					</div>
				);

			default:
				return <div>خطا در نمایش محتوا</div>;
		}
	};

	return (
		<div className="w-full max-w-7xl mx-auto p-4 space-y-6">
			{/* Stepper */}
			<Steps
				active={currentStep}
				onTimeUp={() => {
					toast({
						title: "زمان به پایان رسید",
						description: "زمان رزرو شما به پایان رسیده است. لطفا مجددا تلاش کنید.",
						variant: "destructive"
					});
					// Optionally redirect or reset the form
				}}
			/>

			{/* Ticket Card - Only show on desktop */}
			{!isMobile && !isTablet && (ticketData || isLoadingSrvDetails) && (
				<div dir="rtl" className="max-w-[1200px] mx-auto w-full">
					{isLoadingSrvDetails ? (
						<div className="bg-white border border-[#CCD6E1] rounded-lg shadow-md p-8 text-center">
							<div className="flex items-center justify-center">
								<div className="h-8 w-8 border-t-2 border-b-2 border-[#0D5990] rounded-full animate-spin"></div>
								<span className="mr-3 text-gray-600">در حال بارگذاری اطلاعات بلیط...</span>
							</div>
						</div>
					) : ticketData ? (
						<>
							{console.log('🎫 PDP Component - Rendering TicketCardLg with data:', {
								hasTicketData: !!ticketData,
								ticketDataKeys: Object.keys(ticketData),
								CoName: ticketData.CoName,
								DepartTime: ticketData.DepartTime,
								FullPrice: ticketData.FullPrice,
								SrcCityName: ticketData.SrcCityName,
								DesCityName: ticketData.DesCityName,
								ServiceNo: ticketData.ServiceNo,
								LogoUrl: ticketData.LogoUrl,
								BusType: ticketData.BusType,
								IsBed: ticketData.IsBed,
								IsMonitor: ticketData.IsMonitor,
								IsCharger: ticketData.IsCharger,
								validation: {
									hasServiceNo: !!ticketData.ServiceNo,
									hasCoName: !!ticketData.CoName,
									hasDepartDate: !!ticketData.DepartDate,
									hasDepartTime: !!ticketData.DepartTime,
									hasFullPrice: !!ticketData.FullPrice,
									hasSrcCityName: !!ticketData.SrcCityName,
									hasDesCityName: !!ticketData.DesCityName
								}
							})}
							{/* Always render TicketCardLg - data transformation handles missing fields */}
							{console.log('🎫 PDP Component - Data being passed to TicketCardLg:', {
								ticketData: ticketData,
								ticketDataKeys: ticketData ? Object.keys(ticketData) : null,
								ticketDataType: typeof ticketData,
								keyFields: {
									ServiceNo: ticketData?.ServiceNo,
									CoName: ticketData?.CoName,
									DepartDate: ticketData?.DepartDate,
									DepartTime: ticketData?.DepartTime,
									FullPrice: ticketData?.FullPrice,
									SrcCityName: ticketData?.SrcCityName,
									DesCityName: ticketData?.DesCityName,
									LogoUrl: ticketData?.LogoUrl,
									BusType: ticketData?.BusType,
									SrcCityCode: ticketData?.SrcCityCode,
									DesCityCode: ticketData?.DesCityCode
								},
								validation: {
									hasServiceNo: !!ticketData?.ServiceNo,
									hasCoName: !!ticketData?.CoName,
									hasDepartDate: !!ticketData?.DepartDate,
									hasDepartTime: !!ticketData?.DepartTime,
									hasFullPrice: !!ticketData?.FullPrice,
									hasSrcCityName: !!ticketData?.SrcCityName,
									hasDesCityName: !!ticketData?.DesCityName,
									hasLogoUrl: !!ticketData?.LogoUrl,
									hasBusType: !!ticketData?.BusType,
									hasSrcCityCode: !!ticketData?.SrcCityCode,
									hasDesCityCode: !!ticketData?.DesCityCode
								}
							})}
							<TicketCardLg ticketDetails={ticketData as ServiceDetails} />
						</>
					) : null}
				</div>
			)}

			{/* Step Content */}
			{currentStep === 0 ? (
				renderStepContent()
			) : (
				<div className="bg-white rounded-lg shadow-sm border p-6">
					{renderStepContent()}
				</div>
			)}

			{/* Navigation Buttons */}
			{!hideContinueButton && currentStep < steps.length && (
				<div className="flex justify-between items-center gap-4">
					{/* Next Step Button - Left Side */}
					{currentStep < steps.length - 1 && (
						<Button
							onClick={handleContinue}
							disabled={isLoading}
							className="bg-[#0D5990] hover:bg-[#0A4A7A] font-iran-yekan text-white px-8 py-3 text-lg font-medium cursor-pointer hover:cursor-pointer disabled:cursor-not-allowed"
						>
							{isLoading ? 'در حال پردازش...' : 'تایید و ادامه'}
						</Button>
					)}

					{/* Back Button - Right Side */}
					<Button
						variant="outline"
						onClick={currentStep === 0 ? () => {
							console.log('Back to dashboard clicked');
							router.push('/dashboard');
						} : () => {
							console.log('Previous step clicked');
							prevStep();
						}}
						className="font-iran-yekan flex items-center gap-2 px-6 py-3 text-base border-gray-300 hover:bg-gray-50 cursor-pointer hover:cursor-pointer"
					>
						<ArrowRight className="h-4 w-4" />
						{currentStep === 0 ? 'بازگشت به داشبورد' : 'مرحله قبلی'}
					</Button>
				</div>
			)}


		</div>
	);
};

export default BusReservationWithStepper;
