"use client";

import React, { useState } from 'react';
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

interface PaymentStepProps {
	onBack: () => void;
	onPaymentSuccess?: () => void;
}

export function PaymentStep({ onBack, onPaymentSuccess }: PaymentStepProps) {
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
	const [showPaymentDialog, setShowPaymentDialog] = useState(false);
	const [paymentProgress, setPaymentProgress] = useState(0);
	const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false);

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
			const srvTicketPayload = {
				logoUrl: serviceData?.LogoUrl || '',
				srvNo: serviceData?.ServiceNo || '',
				srvName: serviceData?.Description || 'Bus Service',
				coToken: serviceData?.RequestToken || '',
				departureTime: serviceData?.DepartTime || '',
				arrivalTime: '', // Will be calculated
				departureCity: serviceData?.SrcCityName || '',
				arrivalCity: serviceData?.DesCityName || '',
				departureDate: serviceData?.DepartDate || '',
				arrivalDate: '', // Will be calculated
				price: pricePerTicket, // Use calculated price
				companyName: serviceData?.CoName || '',
				isCharger: Boolean(serviceData?.IsCharger),
				isMonitor: Boolean(serviceData?.IsMonitor),
				isBed: Boolean(serviceData?.IsBed),
				isVIP: Boolean(serviceData?.IsVIP),
				isSofa: Boolean(serviceData?.IsSofa),
				isMono: Boolean(serviceData?.IsMono),
				isAirConditionType: Boolean(serviceData?.IsAirConditionType),
				srcCityCode: serviceData?.SrcCityCode || '',
				desCityCode: serviceData?.DesCityCode || '',
				travelDuration: ''
			};

			// Prepare request payload
			const payload = {
				order: {
					userID: parseInt(String(user?.userId || "0")),
					description: `Bus ticket from ${srvTicketPayload.departureCity} to ${srvTicketPayload.arrivalCity}`,
					addedPhone: user?.additionalPhone || user?.phoneNumber || '',
					addedEmail: user?.additionalEmail || user?.email || '',
					SrvTicket: srvTicketPayload,
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

			// For wallet payment, we'll process the payment directly
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
					PaymentMethod: 'wallet' // Specify wallet payment
				}
			};

			setPaymentProgress(80);

			// Process wallet payment directly
			const buyResponse = await axios.post(
				'https://api.bilit4u.com/order/api/v1/tickets/buy',
				buyTicketPayload,
				{
					headers: {
						'Content-Type': 'application/json',
					}
				}
			);

			setPaymentProgress(90);

			if (buyResponse.data?.success) {
				toast({
					title: "پرداخت موفق",
					description: "پرداخت با کیف پول با موفقیت انجام شد",
					variant: "default",
				});

				setTimeout(() => {
					setPaymentProgress(100);
					// Redirect to success page or invoice
					if (buyResponse.data?.redirectUrl) {
						window.location.href = buyResponse.data.redirectUrl;
					} else {
						window.location.href = `${origin}/invoice/${refNum}`;
					}
				}, 2000);
			} else {
				throw new Error(buyResponse.data?.message || 'Payment failed');
			}

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
		</div>
	);
}
