"use client";

import React, { forwardRef, useCallback, useImperativeHandle, useEffect } from "react";
import { BusLayout } from "@/components/dashboard_admin_buy/pdp/previous/bus_layout/bus_layout";
import { MediumBusLayout } from "@/components/dashboard_admin_buy/pdp/previous/bus_layout_medium/bus_layout_medium";
import { MobileBusLayout } from "@/components/dashboard_admin_buy/pdp/previous/bus_layout_mobile/bus_layout_mobile";
import { PassengerDetailsForm } from '@/components/dashboard_admin_buy/pdp/previous/passenger_details/passenger_details';
import { useTicketStore } from '@/store/TicketStore';
import { usePassengerStore, StoredPassenger } from '@/store/PassengerStore';
import { useUserStore } from '@/store/UserStore';
import { useScreenSize } from '@/hooks/useScreenSize';
import { useToast } from "@/hooks/use-toast";
import { Session } from '@supabase/supabase-js'
import { RouteUtils } from "@/lib/RouteUtil";
import { useRouter } from 'next/navigation';

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import axios from 'axios';

export function toPersianDigits(num: number | string): string {
	return num.toString().replace(/\d/g, (digit) =>
		"۰۱۲۳۴۵۶۷۸۹"[parseInt(digit, 10)]
	);
}

export function formatPrice(price: number): string {
	return toPersianDigits(price.toLocaleString('fa-IR'));
}

interface BusReservationWithFlowProps {
	onTimeExpire?: () => void;
	seatPriceServiceDetail?: any;
	onContinue?: (seats: any) => void;
	onValidationChange?: (validationData: {
		isAnyPassengerValid: boolean;
		allPassengersValid: boolean;
	}) => void;
	hideContinueButton?: boolean;
}

const BusReservationWithFlow = forwardRef<any, BusReservationWithFlowProps>(({
	onTimeExpire,
	seatPriceServiceDetail,
	onContinue,
	onValidationChange,
	hideContinueButton = false
}, ref) => {
	const router = useRouter();
	const { toast } = useToast();
	// Get session from localStorage with proper Supabase types
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
	const [isTimeoutDialogOpen, setIsTimeoutDialogOpen] = React.useState(false);
	const { addPassengers } = usePassengerStore();

	// Simple state management without flow session
	const [isProcessing, setIsProcessing] = React.useState(false);

	// State management
	const [submissionState, setSubmissionState] = React.useState({
		isSubmitting: false,
		progress: 0
	});

	const [passengerValidation, setPassengerValidation] = React.useState({
		isAnyPassengerValid: false,
		allPassengersValid: false
	});

	// Step management
	const [currentStep, setCurrentStep] = React.useState(1); // 1: Seat Selection, 2: Payment

	// Payment page states
	const [showPaymentDialog, setShowPaymentDialog] = React.useState(false);
	const [paymentMethod, setPaymentMethod] = React.useState<'bank' | 'wallet'>('bank');
	const [paymentGateway, setPaymentGateway] = React.useState<'sep'>('sep');
	const [paymentProgress, setPaymentProgress] = React.useState(0);
	const [isPaymentSubmitting, setIsPaymentSubmitting] = React.useState(false);

	// Reference to the PassengerDetailsForm component
	const detailsFormRef = React.useRef<{
		savePassengers: () => Promise<{ success: boolean; passengers: StoredPassenger[]; buyerInfo?: any }>;
		restorePassengerData: (passengers: StoredPassenger[]) => void;
	}>(null);

	// Define functions first
	const savePassengerData = async (): Promise<{ success: boolean; passengers?: StoredPassenger[], buyerInfo?: any; }> => {
		console.log("Bus Reservation With Flow: Calling passenger details form savePassengers method");

		if (detailsFormRef.current?.savePassengers) {
			try {
				const result = await detailsFormRef.current.savePassengers();
				console.log("PassengerDetailsForm.savePassengers result:", result);
				return {
					success: result.success,
					passengers: result.passengers,
					buyerInfo: result.buyerInfo
				};
			} catch (error) {
				console.error("Error calling PassengerDetailsForm.savePassengers:", error);
				return { success: false };
			}
		} else {
			console.warn("PassengerDetailsForm ref or savePassengers method not available");
			return { success: false };
		}
	};

	const handleContinueClick = async () => {
		console.log("🔘 Continue button clicked - Starting passenger save process with flow");
		console.log("🔍 Current passenger validation state:", passengerValidation);
		console.log("🔍 Current submission state:", submissionState);
		console.log("🔍 Selected seats length:", selectedSeats.length);

		if (!passengerValidation.isAnyPassengerValid || submissionState.isSubmitting) {
			console.log("❌ Save validation failed:", {
				isAnyPassengerValid: passengerValidation.isAnyPassengerValid,
				isSubmitting: submissionState.isSubmitting,
				selectedSeats: selectedSeats.length
			});
			return;
		}

		console.log("✅ Validation passed, proceeding with save...");
		setSubmissionState({ isSubmitting: true, progress: 10 });

		try {
			// Save passenger data
			console.log("📝 Calling savePassengerData...");
			const result = await savePassengerData();
			console.log("📋 Save passenger data result:", result);

			if (!result.success) {
				console.log("❌ Save passenger data failed");
				toast({
					title: "خطا در ذخیره اطلاعات",
					description: "مشکلی در ذخیره اطلاعات مسافران رخ داد. لطفا دوباره تلاش کنید",
					variant: "destructive"
				});
				setSubmissionState({ isSubmitting: false, progress: 0 });
				return;
			}

			console.log("✅ Save passenger data succeeded, proceeding to next step...");
			setSubmissionState({ isSubmitting: true, progress: 100 });

			toast({
				title: "اطلاعات مسافران ذخیره شد",
				description: "در حال انتقال به صفحه بعدی...",
				variant: "default"
			});

			setTimeout(() => {
				console.log("⏰ Navigation timeout triggered - Moving to payment step");
				setCurrentStep(2); // Move to payment step
				setSubmissionState({ isSubmitting: false, progress: 0 });
			}, 300);

		} catch (error) {
			console.error("❌ Error in save process:", error);
			toast({
				title: "خطا در ذخیره اطلاعات",
				description: "مشکلی در ذخیره اطلاعات مسافران رخ داد. لطفا دوباره تلاش کنید",
				variant: "destructive"
			});
			setSubmissionState({ isSubmitting: false, progress: 0 });
		}
	};

	// Expose the internal methods via ref to parent component
	useImperativeHandle(ref, () => ({
		detailsFormRef,
		handleContinueClick,
		passengerValidation,
		savePassengerData,
		restorePassengerData: (passengers: StoredPassenger[]) => {
			console.log("BusReservationWithFlow: Restoring passenger data", passengers);
			if (detailsFormRef.current && detailsFormRef.current.restorePassengerData) {
				detailsFormRef.current.restorePassengerData(passengers);
			} else {
				console.error("Unable to restore passenger data - form reference not ready");
			}
		}
	}), []); // Empty dependencies to prevent infinite loops

	// Get data from stores
	const { selectedSeats, clearSelectedSeats, handleSeatClick, removeSelectedSeat, serviceData } = useTicketStore();
	const { passengers, currentSessionId } = usePassengerStore();
	const { user } = useUserStore();
	const storedPassengers = passengers.filter(p => p.sessionId === currentSessionId);
	const screenSize = useScreenSize();
	const isMedium = screenSize === 'md';
	const isMobile = screenSize === 'xs' || screenSize === 'sm';

	// Constants
	const maxSelectable = 7;
	const seatPrice = seatPriceServiceDetail ? parseInt(seatPriceServiceDetail) / 10 : 250000;
	const totalPrice = selectedSeats.length * seatPrice;

	// Simple component initialization - just log for debugging
	React.useEffect(() => {
		console.log('🚀 BusReservationWithFlow mounted');

		// Log ticket data once on mount for debugging
		const storeState = useTicketStore.getState();
		console.log('📋 Initial ticketId:', storeState.ticketId);
		console.log('🎫 Initial token:', storeState.token);
		console.log('📦 Full ticket store state:', storeState);
	}, []); // Empty dependency array - run once on mount



	const handleRemovePassenger = (seatId: number) => {
		console.log('BusReservationWithFlow: Removing passenger', seatId);
		removeSelectedSeat(seatId);
	};

	const handleValidationChange = React.useCallback((validationData: {
		isAnyPassengerValid: boolean,
		allPassengersValid: boolean
	}) => {
		setPassengerValidation(prev => {
			// Only update if values actually changed to prevent unnecessary re-renders
			if (prev.isAnyPassengerValid !== validationData.isAnyPassengerValid ||
				prev.allPassengersValid !== validationData.allPassengersValid) {
				// Schedule parent callback for next tick to avoid setState during render
				setTimeout(() => {
					onValidationChange?.(validationData);
				}, 0);
				return validationData;
			}
			return prev;
		});
	}, [onValidationChange]);

	const handleSeatStateChange = React.useCallback((seatId: number, newState?: string) => {
		console.log('BusReservationWithFlow: Changing seat state', seatId, newState);
		if (!newState) return;
		if (newState === "default") {
			removeSelectedSeat(seatId);
		}
	}, [removeSelectedSeat]);

	const handleTimeExpire = React.useCallback(() => {
		console.log("Timer expired in bus_reservation_with_flow component");
		if (!onTimeExpire) {
			clearSelectedSeats();
			setIsTimeoutDialogOpen(true);
		} else {
			console.log("Calling parent's onTimeExpire handler");
			onTimeExpire();
		}
	}, [onTimeExpire, clearSelectedSeats]);


	const navigateBack = React.useCallback(() => {
		setIsTimeoutDialogOpen(false);
		try {
			console.log("Time expired, navigating to stored route");
			RouteUtils.navigateToStoredRoute(router);
		} catch (error) {
			console.error("Failed to navigate to stored route:", error);
			router.push('/');
		}
	}, [router]);

	// Payment logic
	const handleBackToSeatSelection = () => {
		setCurrentStep(1);
	};

	const handlePaymentSubmit = async () => {
		if (isPaymentSubmitting) return;

		setIsPaymentSubmitting(true);
		setPaymentProgress(10);
		setShowPaymentDialog(true);

		try {
			setPaymentProgress(20);

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

			// Prepare SrvTicket data from serviceData with proper format
			const srvTicket = {
				logoUrl: serviceData.LogoUrl || '',
				srvNo: serviceData.ServiceNo || '',
				srvName: serviceData.Description || 'Bus Service',
				coToken: serviceData.RequestToken || '',
				departureTime: serviceData.DepartTime || '',
				arrivalTime: '', // Will be calculated
				departureCity: serviceData.SrcCityName || '',
				arrivalCity: serviceData.DesCityName || '',
				departureDate: serviceData.DepartDate || '',
				arrivalDate: '', // Will be calculated
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
				travelDuration: ''
			};

			// Prepare request payload
			const payload = {
				order: {
					userID: parseInt(String(user?.userId || "0")),
					description: `Bus ticket from ${srvTicket.departureCity} to ${srvTicket.arrivalCity}`,
					addedPhone: user?.additionalPhone || user?.phoneNumber || '',
					addedEmail: user?.additionalEmail || user?.email || '',
					SrvTicket: srvTicket,
					passengers: formattedPassengers,
					OrderAssetId: null
				},
				token: session.access_token,
				refreshToken: session.refresh_token || ''
			};

			setPaymentProgress(30);

			// Create order
			const orderResponse = await axios.post(
				'https://api.bilit4u.com/order/api/v1/order/add',
				payload,
				{
					headers: {
						'Content-Type': 'application/json',
					}
				}
			);

			setPaymentProgress(60);

			if (!orderResponse.data.success) {
				throw new Error(orderResponse.data.message || 'Failed to create order');
			}

			const refNum = orderResponse.data.refNum || orderResponse.data.refNumber || orderResponse.data.referenceNumber;

			if (!refNum) {
				throw new Error('Reference number not found in response');
			}

			setPaymentProgress(70);

			// Get redisKey from localStorage
			const redisKey = typeof window !== 'undefined' ? localStorage.getItem('redisKey') : null;
			const origin = typeof window !== 'undefined' ? window.location.origin : '';

			const buyTicketPayload = {
				token: session.access_token,
				refreshToken: session.refresh_token || '',
				BusTicket: {
					CoToken: serviceData.RequestToken || '',
					SrvNo: serviceData.ServiceNo || '',
					RefNum: refNum,
					redisKey: redisKey || '',
					CallBackUrl: `${origin}/invoice/${refNum}`,
					PhoneNumber: user?.phoneNumber || '09122028679',
				}
			};

			setPaymentProgress(80);

			// Request payment URL
			const buyResponse = await axios.post(
				'https://api.bilit4u.com/order/api/v1/tickets/buy',
				buyTicketPayload,
				{
					headers: {
						'Content-Type': 'application/json',
					}
				}
			);

			let paymentUrl = null;
			if (buyResponse.data?.paymentUrl) {
				paymentUrl = buyResponse.data.paymentUrl;
			} else if (buyResponse.data?.redirectUrl) {
				paymentUrl = buyResponse.data.redirectUrl;
			} else if (buyResponse.data?.url) {
				paymentUrl = buyResponse.data.url;
			}

			if (!paymentUrl) {
				throw new Error('Payment URL not found in response');
			}

			setPaymentProgress(90);

			toast({
				title: "انتقال به درگاه پرداخت",
				description: "در حال انتقال به درگاه پرداخت...",
				variant: "default",
			});

			setTimeout(() => {
				setPaymentProgress(100);
				window.location.href = paymentUrl;
			}, 2000);

		} catch (error) {
			console.error("Payment error:", error);
			setShowPaymentDialog(false);

			if (axios.isAxiosError(error)) {
				const errorMessage = error.response?.data?.message ||
					error.message ||
					"متأسفانه مشکلی در پردازش پرداخت به وجود آمد";

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
			setIsPaymentSubmitting(false);
		}
	};

	// Memoize guidance data to prevent unnecessary re-renders
	const guidanceData = React.useMemo(() => ({
		selectedSeats,
		maxSelectable,
		seatPrice,
		totalPrice,
		handleTimeExpire
	}), [selectedSeats, maxSelectable, seatPrice, totalPrice, handleTimeExpire]);

	const renderBusLayout = React.useCallback(() => {
		if (isMobile) {
			return (
				<MobileBusLayout
					maxSelectable={maxSelectable}
					spaces={[]}
					guidanceData={guidanceData}
				/>
			);
		} else if (isMedium) {
			return (
				<MediumBusLayout
					maxSelectable={maxSelectable}
					spaces={[]}
					guidanceData={guidanceData}
				/>
			);
		} else {
			return (
				<BusLayout
					maxSelectable={maxSelectable}
					spaces={[]}
					guidanceData={guidanceData}
				/>
			);
		}
	}, [isMobile, isMedium, maxSelectable, guidanceData]);

	// Payment page component
	const renderPaymentPage = () => {
		const pricePerTicket = Math.floor((Number(serviceData?.FullPrice) || 0) / 10);
		const totalPrice = storedPassengers.length * pricePerTicket;
		const formattedPrice = new Intl.NumberFormat('fa-IR').format(totalPrice);

		return (
			<div className="min-h-screen bg-gray-50 p-4 md:p-6" dir="rtl">
				<div className="max-w-2xl mx-auto">
					{/* Step Indicator */}
					<div className="flex items-center justify-center mb-6">
						<div className="flex items-center space-x-4">
							{/* Step 1: Seat Selection */}
							<div className="flex items-center">
								<div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-[#0D5990] text-white">
									1
								</div>
								<span className="mr-2 text-sm font-medium text-[#0D5990]">
									انتخاب صندلی
								</span>
							</div>

							{/* Connector */}
							<div className="w-12 h-0.5 bg-[#0D5990]" />

							{/* Step 2: Payment */}
							<div className="flex items-center">
								<div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-[#0D5990] text-white">
									2
								</div>
								<span className="mr-2 text-sm font-medium text-[#0D5990]">
									پرداخت
								</span>
							</div>
						</div>
					</div>

					{/* Time Remaining Header */}
					<div className="mb-6 text-left">
						<span className="text-sm text-gray-600">زمان باقیمانده: </span>
						<span className="text-sm font-bold text-gray-800">۱۴:۲۲</span>
						<svg className="inline-block w-4 h-4 mr-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>

					{/* Payment Information Card */}
					<Card className="mb-6 bg-white shadow-sm border-0">
						<CardHeader className="pb-4">
							<CardTitle className="text-lg font-bold text-[#0D5990]">اطلاعات پرداخت</CardTitle>
							<CardDescription className="text-sm text-gray-500">
								خلاصه سفارش و اطلاعات پرداخت
							</CardDescription>
						</CardHeader>
						<CardContent className="pt-0">
							<div className="space-y-4">
								<div className="flex justify-between items-center">
									<span className="text-sm text-gray-600">تعداد مسافران:</span>
									<span className="text-sm font-bold">{storedPassengers.length} نفر</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-sm text-gray-600">قیمت هر بلیط:</span>
									<span className="text-sm font-bold">{new Intl.NumberFormat('fa-IR').format(pricePerTicket)} تومان</span>
								</div>
								<Separator className="my-3" />
								<div className="flex justify-between items-center">
									<span className="text-base font-bold text-gray-800">مبلغ قابل پرداخت:</span>
									<span className="text-lg font-bold text-[#0D5990]">{formattedPrice} تومان</span>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Payment Method Card */}
					<Card className="mb-6 bg-white shadow-sm border-0">
						<CardHeader className="pb-4">
							<CardTitle className="text-lg font-bold text-[#0D5990]">روش پرداخت</CardTitle>
							<CardDescription className="text-sm text-gray-500">
								لطفاً روش پرداخت خود را انتخاب کنید
							</CardDescription>
						</CardHeader>
						<CardContent className="pt-0">
							<div className="space-y-3">
								{/* Bank Payment Option */}
								<div
									className={cn(
										"border rounded-lg p-4 cursor-pointer transition-all",
										paymentMethod === 'bank'
											? "border-[#0D5990] bg-[#F0F7FF]"
											: "border-gray-200 hover:border-gray-300"
									)}
									onClick={() => setPaymentMethod('bank')}
								>
									<div className="flex items-center gap-3">
										<div className={cn(
											"w-5 h-5 rounded-full border-2 flex items-center justify-center",
											paymentMethod === 'bank' ? "border-[#0D5990]" : "border-gray-300"
										)}>
											{paymentMethod === 'bank' && (
												<div className="w-2.5 h-2.5 rounded-full bg-[#0D5990]" />
											)}
										</div>
										<div className="flex items-center gap-2">
											<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path d="M19 8H5C4.44772 8 4 8.44772 4 9V17C4 17.5523 4.44772 18 5 18H19C19.5523 18 20 17.5523 20 17V9C20 8.44772 19.5523 8 19 8Z" stroke="#0D5990" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
												<path d="M4 11H20" stroke="#0D5990" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
												<path d="M8 15H10" stroke="#0D5990" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
											</svg>
											<span className="font-bold text-gray-800">پرداخت بانکی</span>
										</div>
									</div>
									<p className="text-xs text-gray-500 mt-2 pr-8">انتقال به درگاه پرداخت بانکی</p>
								</div>

								{/* Wallet Payment Option */}
								<div
									className={cn(
										"border rounded-lg p-4 cursor-pointer transition-all",
										paymentMethod === 'wallet'
											? "border-[#0D5990] bg-[#F0F7FF]"
											: "border-gray-200 hover:border-gray-300"
									)}
									onClick={() => setPaymentMethod('wallet')}
								>
									<div className="flex items-center gap-3">
										<div className={cn(
											"w-5 h-5 rounded-full border-2 flex items-center justify-center",
											paymentMethod === 'wallet' ? "border-[#0D5990]" : "border-gray-300"
										)}>
											{paymentMethod === 'wallet' && (
												<div className="w-2.5 h-2.5 rounded-full bg-[#0D5990]" />
											)}
										</div>
										<div className="flex items-center gap-2">
											<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path d="M16 12H18C18.5523 12 19 11.5523 19 11V8C19 7.44772 18.5523 7 18 7H6C5.44772 7 5 7.44772 5 8V16C5 16.5523 5.44772 17 6 17H18C18.5523 17 19 16.5523 19 16V13C19 12.4477 18.5523 12 18 12H16V12Z" stroke="#0D5990" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
												<path d="M16 9H16.01" stroke="#0D5990" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
												<path d="M12 14.5C12.8284 14.5 13.5 13.8284 13.5 13C13.5 12.1716 12.8284 11.5 12 11.5C11.1716 11.5 10.5 12.1716 10.5 13C10.5 13.8284 11.1716 14.5 12 14.5Z" stroke="#0D5990" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
											</svg>
											<span className="font-bold text-gray-800">کیف پول</span>
										</div>
									</div>
									<p className="text-xs text-gray-500 mt-2 pr-8">پرداخت از موجودی کیف پول</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Payment Gateway Selection */}
					{paymentMethod === 'bank' && (
						<Card className="mb-6 bg-white shadow-sm border-0">
							<CardHeader className="pb-4">
								<CardTitle className="text-lg font-bold text-[#0D5990]">انتخاب درگاه پرداخت</CardTitle>
								<CardDescription className="text-sm text-gray-500">
									درگاه پرداخت مورد نظر خود را انتخاب کنید
								</CardDescription>
							</CardHeader>
							<CardContent className="pt-0">
								<div className="border rounded-lg p-4 border-[#0D5990] bg-[#F0F7FF]">
									<div className="flex items-center gap-3">
										<div className="w-5 h-5 rounded-full border-2 border-[#0D5990] flex items-center justify-center">
											<div className="w-2.5 h-2.5 rounded-full bg-[#0D5990]" />
										</div>
										<div className="flex items-center gap-2">
											<div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border">
												<span className="text-[#0D5990] font-bold text-lg">سپ</span>
											</div>
											<span className="font-bold text-gray-800">درگاه سپ</span>
										</div>
									</div>
									<p className="text-xs text-gray-500 mt-2 pr-8">پرداخت از طریق درگاه امن سپ</p>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Passenger Information Card */}
					<Card className="mb-6 bg-white shadow-sm border-0">
						<CardHeader className="pb-4">
							<CardTitle className="text-lg font-bold text-[#0D5990]">اطلاعات مسافران</CardTitle>
						</CardHeader>
						<CardContent className="pt-0">
							<div className="space-y-3">
								{storedPassengers.map((passenger, index) => (
									<div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
										<div className="flex justify-between items-center">
											<span className="text-sm font-bold text-gray-700">
												{passenger.name} {passenger.family}
											</span>
											<span className="text-xs text-gray-500">
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
					<div className="bg-[#0D5990] p-6 rounded-lg">
						<div className="flex flex-col-reverse sm:flex-row justify-between gap-4">
							<Button
								variant="outline"
								onClick={handleBackToSeatSelection}
								disabled={isPaymentSubmitting}
								className="bg-white border-white text-[#0D5990] hover:bg-gray-50 transition-colors flex items-center justify-center px-6 py-3 text-sm font-bold"
							>
								<ArrowLeft className="ml-2 w-4 h-4" />
								بازگشت به مرحله قبل
							</Button>

							<Button
								onClick={handlePaymentSubmit}
								disabled={isPaymentSubmitting}
								className="bg-white text-[#0D5990] hover:bg-gray-50 transition-colors px-6 py-3 text-sm font-bold flex items-center justify-center"
							>
								{isPaymentSubmitting ? (
									<>
										<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#0D5990]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										در حال پردازش پرداخت...
									</>
								) : (
									<>
										پرداخت و صدور بلیط
										<svg className="mr-2 w-4 h-4" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
										</svg>
									</>
								)}
							</Button>
						</div>
					</div>
				</div>

				{/* Payment Processing Dialog */}
				<Dialog open={showPaymentDialog} onOpenChange={(open) => {
					if (!isPaymentSubmitting) setShowPaymentDialog(open);
				}}>
					<DialogContent className="sm:max-w-md text-center" dir="rtl">
						<DialogTitle className="text-lg font-bold text-[#0D5990]">
							در حال پردازش پرداخت
						</DialogTitle>
						<DialogDescription className="text-sm text-gray-500">
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
									style={{ width: `${paymentProgress}%` }}
								></div>
							</div>

							<p className="text-sm text-gray-600 mb-2">پیشرفت: {paymentProgress}%</p>
						</div>
					</DialogContent>
				</Dialog>
			</div>
		);
	};

	// Show payment page if we're on step 2
	if (currentStep === 2) {
		return renderPaymentPage();
	}

	return (
		<div className="max-w-[1200px] mx-auto mt-6 flex flex-col gap-6">

			{/* Step Indicator */}
			<div className="flex items-center justify-center mb-4">
				<div className="flex items-center space-x-4">
					{/* Step 1: Seat Selection */}
					<div className="flex items-center">
						<div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === 1 ? 'bg-[#0D5990] text-white' : 'bg-gray-200 text-gray-600'
							}`}>
							1
						</div>
						<span className={`mr-2 text-sm font-medium ${currentStep === 1 ? 'text-[#0D5990]' : 'text-gray-500'
							}`}>
							انتخاب صندلی
						</span>
					</div>

					{/* Connector */}
					<div className={`w-12 h-0.5 ${currentStep >= 2 ? 'bg-[#0D5990]' : 'bg-gray-200'}`} />

					{/* Step 2: Payment */}
					<div className="flex items-center">
						<div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === 2 ? 'bg-[#0D5990] text-white' : 'bg-gray-200 text-gray-600'
							}`}>
							2
						</div>
						<span className={`mr-2 text-sm font-medium ${currentStep === 2 ? 'text-[#0D5990]' : 'text-gray-500'
							}`}>
							پرداخت
						</span>
					</div>
				</div>
			</div>

			{/* Timeout Dialog */}
			<Dialog open={isTimeoutDialogOpen} onOpenChange={setIsTimeoutDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="font-IranYekanBold text-center text-lg">زمان انتخاب صندلی تمام شده است</DialogTitle>
					</DialogHeader>
					<DialogDescription className="font-IranYekanRegular text-center">
						زمان مجاز برای انتخاب صندلی به پایان رسیده است.<br />
						لطفاً مجددا صندلی مورد نظر خود را انتخاب کنید.
					</DialogDescription>
					<DialogFooter className="flex justify-center">
						<Button
							onClick={navigateBack}
							className="bg-[#0D5990] text-white hover:bg-[#064272] font-IranYekanMedium px-6"
						>
							بازگشت
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<div className="flex flex-col md:flex-row gap-6">
				{/* Bus seat guidance side panel - only show on desktop */}
				{!isMedium && !isMobile && (
					<div className="w-full md:w-[360px] flex flex-col gap-6">
						<div className="bg-white border border-gray-300 p-4 rounded-md flex flex-col justify-between shadow-md">
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
										<h2 className="mt-4 mb-2 text-[#4B5259] font-IranYekanBold text-[14px] text-md">
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

										<div className="flex justify-between items-center text-sm">
											<span className="text-gray-600">
												{toPersianDigits(selectedSeats.length)} × {formatPrice(seatPrice)}:
											</span>
											<span className="font-IranYekanMedium">{formatPrice(totalPrice)} تومان</span>
										</div>

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
				<div className={`flex-1 bg-white border border-gray-300 p-4 rounded-md shadow-md ${isMedium ? 'w-full' : ''}`}>
					{renderBusLayout()}
				</div>
			</div>

			{/* Passenger details form - only show when seats are selected */}
			{selectedSeats.length > 0 && (
				<div className="mt-6 transition-all duration-300 ease-in-out">
					<div className="bg-white border border-gray-300 p-4 rounded-md shadow-md">
						<PassengerDetailsForm
							ref={detailsFormRef}
							seats={selectedSeats.map(seat => ({
								...seat,
								seatNo: typeof seat.seatNo === 'string' ? parseInt(seat.seatNo) : seat.seatNo
							}))}
							onRemovePassenger={handleRemovePassenger}
							onSeatStateChange={handleSeatStateChange}
							onValidationChange={handleValidationChange}
						/>
					</div>

					{/* Continue Button with Progress Bar - Only show if not hidden */}
					{!hideContinueButton && (
						<div className="mt-6 flex justify-center">
							<button
								onClick={handleContinueClick}
								disabled={!passengerValidation.isAnyPassengerValid || submissionState.isSubmitting || selectedSeats.length === 0}
								className={`
                  py-3 px-6
                  rounded-md
                  font-IranYekanBold
                  text-[16px]
                  transition-all
                  w-full md:w-2/3 lg:w-1/2
                  ${passengerValidation.isAnyPassengerValid && selectedSeats.length > 0 && !submissionState.isSubmitting
										? 'bg-[#0D5990] text-white hover:bg-[#064272]'
										: 'bg-gray-300 text-gray-500 cursor-not-allowed'}
                  flex items-center justify-center gap-2
                  relative overflow-hidden
                `}
							>
								{submissionState.isSubmitting ? (
									<>
										<div className="absolute inset-0 bg-[#0D5990] bg-opacity-70"></div>
										<div
											className="absolute left-0 top-0 bottom-0 bg-[#0D5990] transition-all duration-300"
											style={{ width: `${submissionState.progress}%` }}
										></div>
										<div className="relative z-10 flex items-center">
											<span>در حال پردازش... {toPersianDigits(submissionState.progress)}%</span>
										</div>
									</>
								) : (
									<>
										<span className="font-IranYekanRegular">ذخیره اطلاعات و ادامه</span>
										<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
										</svg>
									</>
								)}
							</button>
						</div>
					)}
				</div>
			)}

			{/* Bottom continue button for mobile and tablet views */}
			{(isMobile || isMedium) && !hideContinueButton ? (
				<div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50">
					<button
						onClick={handleContinueClick}
						disabled={selectedSeats.length === 0 || !passengerValidation.isAnyPassengerValid || submissionState.isSubmitting}
						className={`
              py-3
              rounded-md
              font-IranYekanBold
              text-[16px]
              transition-all
              w-full
              flex items-center justify-center gap-2
              relative overflow-hidden
              ${selectedSeats.length > 0 && passengerValidation.isAnyPassengerValid && !submissionState.isSubmitting
								? 'bg-[#0D5990] text-white hover:bg-[#064272]'
								: 'bg-gray-300 text-gray-500 cursor-not-allowed'}
            `}
					>
						{submissionState.isSubmitting ? (
							<>
								<div className="absolute inset-0 bg-[#0D5990] bg-opacity-70"></div>
								<div
									className="absolute left-0 top-0 bottom-0 bg-[#0D5990] transition-all duration-300"
									style={{ width: `${submissionState.progress}%` }}
								></div>
								<div className="relative z-10 flex items-center">
									<span>در حال پردازش... {toPersianDigits(submissionState.progress)}%</span>
								</div>
							</>
						) : (
							<>
								<span>ذخیره اطلاعات و ادامه</span>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							</>
						)}
					</button>
				</div>
			) : null}
		</div>
	);
});

BusReservationWithFlow.displayName = 'BusReservationWithFlow';

export default BusReservationWithFlow;
