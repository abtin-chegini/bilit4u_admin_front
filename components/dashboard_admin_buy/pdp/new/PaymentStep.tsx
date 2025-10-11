"use client";

import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useTicketStore } from '@/store/TicketStore';
import { usePassengerStore } from '@/store/PassengerStore';
import { useUserStore } from '@/store/UserStore';
import axios from 'axios';
import { getRouteInfo } from "@/lib/RouteMapData";
import moment from "jalali-moment";

// Helper function to convert Persian digits to English
const toEnglishDigits = (str: string): string => {
	const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
	let result = str;
	persianDigits.forEach((persian, index) => {
		result = result.replace(new RegExp(persian, 'g'), index.toString());
	});
	return result;
};

// Calculate arrival time based on departure time and duration
const calculateArrivalTime = (departTime: string | undefined, duration: string | null) => {
	if (!departTime || !duration) {
		return '';
	}

	try {
		const cleanDepartTime = toEnglishDigits(departTime);
		const [dHours, dMinutes] = cleanDepartTime.split(':').map(num => parseInt(num, 10));
		const [durHours, durMinutes] = duration.split(':').map(num => parseInt(num, 10));

		const departMoment = moment().startOf('day').hours(dHours).minutes(dMinutes);
		const arrivalMoment = departMoment.clone().add(durHours, 'hours').add(durMinutes, 'minutes');

		const arrivalHours = arrivalMoment.hours();
		const arrivalMinutes = arrivalMoment.minutes();

		return `${arrivalHours.toString().padStart(2, '0')}:${arrivalMinutes.toString().padStart(2, '0')}`;
	} catch (error) {
		console.error('Error calculating arrival time:', error);
		return '';
	}
};

// Parse Persian date
const parsePersianDate = (persianDate: string) => {
	const englishDate = toEnglishDigits(persianDate);
	const parts = englishDate.split('/');

	if (parts.length === 3) {
		// Check if format is DD/MM/YYYY or YYYY/MM/DD
		if (parts[0].length === 4) {
			// YYYY/MM/DD format
			return moment(`${parts[0]}/${parts[1]}/${parts[2]}`, 'jYYYY/jMM/jDD');
		} else {
			// DD/MM/YYYY format
			return moment(`${parts[2]}/${parts[1]}/${parts[0]}`, 'jYYYY/jMM/jDD');
		}
	}
	return moment();
};

// Calculate arrival date
const calculateArrivalDate = (departDate: string | undefined, departTime: string | undefined, duration: string | null) => {
	if (!departDate || !departTime || !duration) {
		return '';
	}

	try {
		const [dHours, dMinutes] = departTime.split(':').map(Number);
		const [durHours, durMinutes] = duration.split(':').map(Number);

		const departMoment = parsePersianDate(departDate);
		departMoment.hours(dHours).minutes(dMinutes).seconds(0);

		const arrivalMoment = departMoment.clone().add(durHours, 'hours').add(durMinutes, 'minutes');

		const arrivalYear = arrivalMoment.jYear();
		const arrivalMonth = arrivalMoment.jMonth() + 1;
		const arrivalDay = arrivalMoment.jDate();

		return `${arrivalYear}/${arrivalMonth.toString().padStart(2, '0')}/${arrivalDay.toString().padStart(2, '0')}`;
	} catch (error) {
		console.error('Error calculating arrival date:', error);
		return '';
	}
};

interface PaymentStepProps {
	onBack: () => void;
	onPaymentSuccess?: (paymentData: any) => void;
	onPaymentClick?: () => void;
}

export const PaymentStep = forwardRef<{ initiatePayment: () => void }, PaymentStepProps>(
	({ onBack, onPaymentSuccess }, ref) => {
		const { toast } = useToast();
		const { serviceData, srvTicket } = useTicketStore();
		const { passengers, currentSessionId } = usePassengerStore();
		const { user } = useUserStore();

		console.log('📊 Payment Step - Store data:', {
			serviceData,
			srvTicket,
			passengerCount: passengers.filter(p => p.sessionId === currentSessionId).length
		});

		// Get session from localStorage
		const getAuthSession = () => {
			if (typeof window === 'undefined') return null;
			try {
				const sessionData = localStorage.getItem('auth_session');
				return sessionData ? JSON.parse(sessionData) : null;
			} catch (error) {
				console.error('Failed to get auth session:', error);
				return null;
			}
		};

		const session = getAuthSession();
		const storedPassengers = passengers.filter(p => p.sessionId === currentSessionId);

		// Payment states
		const [paymentMethod, setPaymentMethod] = useState<'wallet'>('wallet');
		const [showConfirmDialog, setShowConfirmDialog] = useState(false);
		const [showPaymentDialog, setShowPaymentDialog] = useState(false);
		const [paymentProgress, setPaymentProgress] = useState(0);
		const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false);

		// Expose initiatePayment function to parent
		useImperativeHandle(ref, () => ({
			initiatePayment: () => {
				setShowConfirmDialog(true);
			}
		}));

		const handlePaymentSubmit = async () => {
			if (isPaymentSubmitting) return;

			setShowConfirmDialog(false);
			setIsPaymentSubmitting(true);
			setPaymentProgress(10);
			setShowPaymentDialog(true);

			try {
				setPaymentProgress(20);

				// Check if we have the necessary data
				if (!session?.access_token) {
					throw new Error('لطفا وارد حساب کاربری خود شوید');
				}

				if (!serviceData && !srvTicket) {
					throw new Error('اطلاعات سرویس یافت نشد');
				}

				if (storedPassengers.length === 0) {
					throw new Error('لطفا حداقل یک مسافر اضافه کنید');
				}

				// Get redisKey from localStorage
				const redisKey = typeof window !== 'undefined' ? localStorage.getItem('redisKey') : null;

				console.log('═══════════════════════════════════════════');
				console.log('🔑 REDIS KEY RETRIEVAL');
				console.log('═══════════════════════════════════════════');
				console.log('RedisKey from localStorage:', redisKey);
				console.log('═══════════════════════════════════════════');

				if (!redisKey) {
					console.error('❌ No redisKey found in localStorage!');
					throw new Error('کلید رزرو یافت نشد. لطفاً مجدداً صندلی را رزرو کنید');
				}

				setPaymentProgress(30);

				// Use srvTicket if available, otherwise use serviceData
				const ticketData = srvTicket || serviceData;

				// Get route info for duration calculation
				const routeInfo = getRouteInfo(ticketData?.SrcCityCode, ticketData?.DesCityCode);
				console.log('📍 Route Info:', routeInfo);

				// Calculate arrival time and date
				const calculatedArrivalTime = calculateArrivalTime(ticketData?.DepartTime, routeInfo.duration);
				const calculatedArrivalDate = calculateArrivalDate(ticketData?.DepartDate, ticketData?.DepartTime, routeInfo.duration);

				console.log('🕒 Calculated arrival time:', calculatedArrivalTime);
				console.log('📅 Calculated arrival date:', calculatedArrivalDate);
				console.log('⏱️ Travel duration:', routeInfo.duration);

				// Format passengers according to the required structure (gender: 2→true, 1→false)
				const formattedPassengers = storedPassengers.map(passenger => {
					return {
						id: 0,
						userID: parseInt(String(user?.userId || "0")),
						fName: passenger.name || '',
						lName: passenger.family || '',
						gender: passenger.gender === 2, // Convert: 2=male→true, 1=female→false
						nationalCode: passenger.nationalId || '',
						address: '',
						phoneNumber: user?.additionalPhone || user?.phoneNumber || '',
						dateOfBirth: passenger.birthDate || '',
						email: user?.additionalEmail || user?.email || '',
						seatNo: String(passenger.seatNo || ''),
						seatID: String(passenger.seatId || '')
					};
				});

				// Prepare SrvTicket data from serviceData with proper format
				const srvTicketPayload = {
					logoUrl: ticketData?.LogoUrl || '',
					srvNo: ticketData?.ServiceNo || '',
					srvName: ticketData?.Description || 'Bus Service',
					coToken: ticketData?.RequestToken || '',
					departureTime: ticketData?.DepartTime || '',
					arrivalTime: calculatedArrivalTime || '',
					departureCity: ticketData?.SrcCityName || '',
					arrivalCity: ticketData?.DesCityName || '',
					departureDate: ticketData?.DepartDate || '',
					arrivalDate: calculatedArrivalDate || '',
					price: pricePerTicket, // Use calculated price
					companyName: ticketData?.CoName || '',
					isCharger: Boolean(ticketData?.IsCharger),
					isMonitor: Boolean(ticketData?.IsMonitor),
					isBed: Boolean(ticketData?.IsBed),
					isVIP: Boolean(ticketData?.IsVIP),
					isSofa: Boolean(ticketData?.IsSofa),
					isMono: Boolean(ticketData?.IsMono),
					isAirConditionType: Boolean(ticketData?.IsAirConditionType),
					srcCityCode: ticketData?.SrcCityCode || '',
					desCityCode: ticketData?.DesCityCode || '',
					travelDuration: routeInfo.duration || ''
				};

				// Prepare buyticketwallet payload
				const buyTicketWalletPayload = {
					redisKey: redisKey,
					userId: parseInt(String(user?.userId || "0")),
					orderDto: {
						userID: parseInt(String(user?.userId || "0")),
						refreshToken: session.refresh_token || '',
						description: `Support buy ticket for customer - ${srvTicketPayload.departureCity} to ${srvTicketPayload.arrivalCity}`,
						srvTicket: srvTicketPayload,
						passengers: formattedPassengers,
						addedPhone: user?.additionalPhone || user?.phoneNumber || '',
						addedEmail: user?.additionalEmail || user?.email || '',
						orderAssetId: null
					}
				};

				console.log('═══════════════════════════════════════════');
				console.log('💳 BUY TICKET WALLET - API REQUEST');
				console.log('═══════════════════════════════════════════');
				console.log('🔗 URL:', 'https://api.bilit4u.com/admin/api/v1/orders/buyticketwallet');
				console.log('📦 PAYLOAD:', JSON.stringify(buyTicketWalletPayload, null, 2));
				console.log('-------------------------------------------');
				console.log('📋 Payload Summary:');
				console.log('  - redisKey:', redisKey);
				console.log('  - userId:', buyTicketWalletPayload.userId);
				console.log('  - orderDto.userID:', buyTicketWalletPayload.orderDto.userID);
				console.log('  - orderDto.srvTicket.srvNo:', srvTicketPayload.srvNo);
				console.log('  - orderDto.srvTicket.coToken:', srvTicketPayload.coToken);
				console.log('  - orderDto.passengers.length:', formattedPassengers.length);
				console.log('  - orderDto.addedPhone:', buyTicketWalletPayload.orderDto.addedPhone);
				console.log('  - orderDto.addedEmail:', buyTicketWalletPayload.orderDto.addedEmail);
				console.log('-------------------------------------------');
				console.log('🔑 Headers:');
				console.log('  - Token:', `${session.access_token.substring(0, 30)}...`);
				console.log('  - Content-Type: application/json');
				console.log('═══════════════════════════════════════════');

				setPaymentProgress(50);

				// Call buyticketwallet API
				const buyResponse = await axios.post(
					'https://api.bilit4u.com/admin/api/v1/orders/buyticketwallet',
					buyTicketWalletPayload,
					{
						headers: {
							'Token': session.access_token,
							'Content-Type': 'application/json',
						}
					}
				);

				console.log('═══════════════════════════════════════════');
				console.log('📥 BUY TICKET WALLET - API RESPONSE');
				console.log('═══════════════════════════════════════════');
				console.log('✅ Full Response:', JSON.stringify(buyResponse.data, null, 2));
				console.log('-------------------------------------------');
				console.log('📊 Response Summary:');
				console.log('  - Success:', buyResponse.data.success);
				console.log('  - Message:', buyResponse.data.message);
				console.log('  - Status Code:', buyResponse.status);
				console.log('  - RefNum:', buyResponse.data.refNum || 'N/A');
				console.log('  - RedirectUrl:', buyResponse.data.redirectUrl || 'N/A');
				console.log('═══════════════════════════════════════════');

				setPaymentProgress(90);

				if (buyResponse.data?.success) {
					setPaymentProgress(100);

					// Prepare complete payment data
					const completePaymentData = {
						success: true,
						...buyResponse.data,
						passengers: storedPassengers,
						ticketData: srvTicket || serviceData,
						totalPrice: storedPassengers.length * pricePerTicket,
						pricePerTicket: pricePerTicket
					};

					// Store payment data in sessionStorage for invoice page
					sessionStorage.setItem('paymentData', JSON.stringify(completePaymentData));
					console.log('💾 Payment data stored in sessionStorage:', completePaymentData);

					toast({
						title: "پرداخت موفق",
						description: "پرداخت با کیف پول با موفقیت انجام شد",
						variant: "default",
					});

					// Call onPaymentSuccess callback to move to invoice step
					setTimeout(() => {
						setShowPaymentDialog(false);
						if (onPaymentSuccess) {
							onPaymentSuccess(completePaymentData);
						}
					}, 1500);
				} else {
					throw new Error(buyResponse.data?.message || 'Payment failed');
				}

			} catch (error) {
				console.error("❌ Payment error:", error);
				setShowPaymentDialog(false);

				let errorMessage = "متأسفانه مشکلی در پردازش پرداخت به وجود آمد";

				if (axios.isAxiosError(error)) {
					console.error('Response data:', error.response?.data);
					console.error('Response status:', error.response?.status);
					errorMessage = error.response?.data?.message || error.message || errorMessage;
				} else if (error instanceof Error) {
					errorMessage = error.message;
				}

				// Prepare failed payment data
				const failedPaymentData = {
					success: false,
					message: errorMessage,
					passengers: storedPassengers,
					ticketData: srvTicket || serviceData,
					totalPrice: storedPassengers.length * pricePerTicket,
					pricePerTicket: pricePerTicket,
					error: error
				};

				// Store failed payment data in sessionStorage
				sessionStorage.setItem('paymentData', JSON.stringify(failedPaymentData));
				console.log('💾 Failed payment data stored in sessionStorage:', failedPaymentData);

				toast({
					title: "خطا در پرداخت",
					description: errorMessage,
					variant: "destructive",
				});

				// Call onPaymentSuccess callback to move to invoice step (even for failed payments)
				setTimeout(() => {
					if (onPaymentSuccess) {
						onPaymentSuccess(failedPaymentData);
					}
				}, 1500);

			} finally {
				setIsPaymentSubmitting(false);
			}
		};

		// Calculate price - FullPrice is already the price per ticket
		// Try serviceData first, then srvTicket as fallback (both have FullPrice and Price with capital letters)
		const pricePerTicket = Number(
			serviceData?.FullPrice ||
			serviceData?.Price ||
			srvTicket?.FullPrice ||
			srvTicket?.Price ||
			0
		);
		const totalPrice = storedPassengers.length * pricePerTicket;
		const formattedPrice = new Intl.NumberFormat('fa-IR').format(totalPrice);

		console.log('💰 Payment Step - Price calculation:', {
			serviceData: serviceData,
			srvTicket: srvTicket,
			serviceDataFullPrice: serviceData?.FullPrice,
			serviceDataPrice: serviceData?.Price,
			srvTicketFullPrice: srvTicket?.FullPrice,
			srvTicketPrice: srvTicket?.Price,
			pricePerTicket,
			passengerCount: storedPassengers.length,
			totalPrice,
			formattedPrice
		});

		return (
			<div className="w-full" dir="rtl">
				<div className="space-y-6">
					{/* Combined Passengers and Payment Info Card */}
					<Card className="bg-white shadow-lg border border-gray-200 rounded-2xl overflow-hidden">
						<CardHeader className="pb-6 pt-8 px-8 bg-[#ecf4fc] border-b border-[#d0e5f7]">
							<div className="flex justify-between items-center">
								<div>
									<CardTitle className="text-2xl font-IranYekanBold text-[#094c7d] mb-2">اطلاعات مسافران و پرداخت</CardTitle>
									<CardDescription className="text-base text-[#0D5990] font-IranYekanRegular flex items-center gap-2">
										<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="#0D5990" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
											<path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="#0D5990" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
											<path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="#0D5990" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
											<path d="M16 3.13C16.8604 3.3503 17.623 3.8507 18.1676 4.55231C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="#0D5990" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
										</svg>
										<span>{storedPassengers.length} مسافر</span>
										<span className="text-gray-400 mx-1">•</span>
										<span>پرداخت از کیف پول</span>
									</CardDescription>
								</div>
								<div className="flex items-center gap-3 bg-gradient-to-br from-[#0D5990] to-[#094c7d] px-5 py-3 rounded-xl shadow-md">
									<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M16 12H18C18.5523 12 19 11.5523 19 11V8C19 7.44772 18.5523 7 18 7H6C5.44772 7 5 7.44772 5 8V16C5 16.5523 5.44772 17 6 17H18C18.5523 17 19 16.5523 19 16V13C19 12.4477 18.5523 12 18 12H16V12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
										<path d="M16 9H16.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
										<path d="M12 14.5C12.8284 14.5 13.5 13.8284 13.5 13C13.5 12.1716 12.8284 11.5 12 11.5C11.1716 11.5 10.5 12.1716 10.5 13C10.5 13.8284 11.1716 14.5 12 14.5Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
									</svg>
									<div className="text-right">
										<span className="text-white font-IranYekanBold text-sm block">کیف پول</span>
										<span className="text-white/80 font-IranYekanRegular text-xs">روش پرداخت</span>
									</div>
								</div>
							</div>
						</CardHeader>

						<CardContent className="p-0">
							{/* Data Grid Header */}
							<div className="grid grid-cols-7 gap-3 px-6 py-4 bg-[#F8F9FA] border-b border-gray-200">
								<div className="col-span-1 text-right">
									<span className="text-sm font-IranYekanBold text-gray-700">نام</span>
								</div>
								<div className="col-span-1 text-right">
									<span className="text-sm font-IranYekanBold text-gray-700">نام خانوادگی</span>
								</div>
								<div className="col-span-1 text-right">
									<span className="text-sm font-IranYekanBold text-gray-700">کد ملی</span>
								</div>
								<div className="col-span-1 text-right">
									<span className="text-sm font-IranYekanBold text-gray-700">جنسیت</span>
								</div>
								<div className="col-span-1 text-right">
									<span className="text-sm font-IranYekanBold text-gray-700">تاریخ تولد</span>
								</div>
								<div className="col-span-1 text-right">
									<span className="text-sm font-IranYekanBold text-gray-700">شماره صندلی</span>
								</div>
								<div className="col-span-1 text-right">
									<span className="text-sm font-IranYekanBold text-gray-700">قیمت بلیط</span>
								</div>
							</div>

							{/* Data Grid Rows */}
							<div className="divide-y divide-gray-100">
								{storedPassengers.map((passenger, index) => (
									<div
										key={index}
										className="grid grid-cols-7 gap-3 px-6 py-5 hover:bg-gray-50/50 transition-colors duration-150"
									>
										<div className="col-span-1 flex items-center justify-start">
											<span className="text-sm font-IranYekanBold text-gray-800">
												{passenger.name}
											</span>
										</div>
										<div className="col-span-1 flex items-center justify-start">
											<span className="text-sm font-IranYekanBold text-gray-800">
												{passenger.family}
											</span>
										</div>
										<div className="col-span-1 flex items-center justify-start">
											<span className="text-sm font-IranYekanRegular text-gray-700">
												{passenger.nationalId || '-'}
											</span>
										</div>
										<div className="col-span-1 flex items-center justify-start">
											<span className={cn(
												"px-3 py-1 rounded-md text-xs font-IranYekanBold inline-block",
												passenger.gender === 2
													? "bg-blue-50 text-blue-600 border border-blue-200"
													: "bg-pink-50 text-pink-600 border border-pink-200"
											)}>
												{passenger.gender === 2 ? 'مرد' : 'زن'}
											</span>
										</div>
										<div className="col-span-1 flex items-center justify-start">
											<span className="text-sm font-IranYekanRegular text-gray-700">
												{passenger.birthDate || '-'}
											</span>
										</div>
										<div className="col-span-1 flex items-center justify-start">
											<span className="text-sm font-IranYekanRegular text-gray-700">
												{passenger.seatNo}
											</span>
										</div>
										<div className="col-span-1 flex items-center justify-start">
											<span className="text-sm font-IranYekanBold text-gray-800">
												{new Intl.NumberFormat('fa-IR').format(pricePerTicket)} تومان
											</span>
										</div>
									</div>
								))}
							</div>

							{/* Total Section */}
							<div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-t-2 border-[#0D5990] px-6 py-6">
								<div className="flex justify-between items-center">
									<div className="flex items-center gap-3">
										<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0D5990] to-[#0A4A7A] flex items-center justify-center shadow-lg">
											<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
												<path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
												<path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
											</svg>
										</div>
										<div>
											<span className="text-base font-IranYekanBold text-gray-700 block">جمع کل قابل پرداخت</span>
											<span className="text-xs font-IranYekanRegular text-gray-500">{storedPassengers.length} بلیط × {new Intl.NumberFormat('fa-IR').format(pricePerTicket)} تومان</span>
										</div>
									</div>
									<div className="text-left">
										<div className="text-3xl font-IranYekanBold text-[#0D5990]">
											{formattedPrice}
											<span className="text-lg font-IranYekanRegular text-gray-600 mr-2">تومان</span>
										</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

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
							در حال پردازش پرداخت از کیف پول می‌باشید
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

				{/* Payment Confirmation Dialog */}
				<Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
					<DialogContent className="sm:max-w-md" dir="rtl">
						<DialogTitle className="text-xl font-IranYekanBold text-[#0D5990] flex items-center gap-2">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
							تایید پرداخت
						</DialogTitle>
						<DialogDescription className="text-base text-gray-700 font-IranYekanRegular mt-4">
							<div className="space-y-4">
								<p>آیا از پرداخت مبلغ <span className="font-IranYekanBold text-[#0D5990]">{formattedPrice} تومان</span> از کیف پول خود اطمینان دارید؟</p>
								<div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
									<div className="flex justify-between">
										<span>تعداد مسافران:</span>
										<span className="font-IranYekanBold">{storedPassengers.length} نفر</span>
									</div>
									<div className="flex justify-between">
										<span>قیمت هر بلیط:</span>
										<span className="font-IranYekanBold">{new Intl.NumberFormat('fa-IR').format(pricePerTicket)} تومان</span>
									</div>
									<div className="flex justify-between border-t border-gray-200 pt-2">
										<span>جمع کل:</span>
										<span className="font-IranYekanBold text-[#0D5990]">{formattedPrice} تومان</span>
									</div>
								</div>
							</div>
						</DialogDescription>
						<div className="flex gap-3 mt-6">
							<Button
								onClick={handlePaymentSubmit}
								className="flex-1 bg-[#0D5990] hover:bg-[#0A4A7A] text-white font-IranYekanBold"
							>
								تایید و پرداخت
							</Button>
							<Button
								onClick={() => setShowConfirmDialog(false)}
								variant="outline"
								className="flex-1 font-IranYekanBold"
							>
								انصراف
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>
		);
	});

PaymentStep.displayName = 'PaymentStep';
