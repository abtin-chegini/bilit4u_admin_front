"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BusReservationWithStepper } from '@/components/dashboard_admin_buy/pdp/new';
import { useTicketStore } from '@/store/TicketStore';
import { useFlowSessionStore } from '@/store/FlowSessionStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function TicketPurchasePage() {
	const params = useParams();
	const router = useRouter();
	const { token, ticketId } = params;

	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [ticketData, setTicketData] = useState<any>(null);

	const {
		ticketId: storeTicketId,
		token: storeToken,
		serviceData,
		setTicketInfo,
		setServiceData
	} = useTicketStore();

	const { getFlowSession, initializeFlowWithTicket } = useFlowSessionStore();

	useEffect(() => {
		const initializeTicketFlow = async () => {
			try {
				setIsLoading(true);
				setError(null);

				// Validate required parameters
				if (!token || !ticketId) {
					setError('پارامترهای مورد نیاز یافت نشد');
					return;
				}

				console.log('🎫 Initializing ticket flow:', { token, ticketId });

				// Set ticket info in store
				setTicketInfo(ticketId as string, token as string);

				// Try to get existing flow session
				const sessionId = getFlowSession();

				if (sessionId) {
					console.log('✅ Using existing flow session:', sessionId);
					// Load existing service data if available
					if (serviceData) {
						setTicketData(serviceData);
						setIsLoading(false);
						return;
					}
				}

				// If no existing session or data, we need to fetch ticket data
				// For now, we'll create a mock ticket data structure
				// In a real implementation, this would come from an API
				const mockTicketData = {
					token: token as string,
					ticketId: ticketId as string,
					serviceNo: ticketId as string,
					companyName: 'اتوبوسرانی',
					logoUrl: '/placeholder-logo.png',
					busType: 'VIP',
					fullPrice: 150000, // Price in Rials
					sourceCity: 'تهران',
					destinationCity: 'مشهد',
					sourceCityId: '1',
					destinationCityId: '2',
					departDate: new Date().toISOString().split('T')[0],
					departTime: '08:00',
					availableSeats: 45,
					routeInfo: {
						duration: '8 ساعت',
						distance: 900,
						formattedDistance: '900 کیلومتر'
					}
				};

				// Initialize flow session with ticket data
				const newSessionId = await initializeFlowWithTicket(mockTicketData);
				console.log('✅ New flow session initialized:', newSessionId);

				// Set service data in store
				setServiceData(mockTicketData);
				setTicketData(mockTicketData);

			} catch (err) {
				console.error('❌ Error initializing ticket flow:', err);
				setError('خطا در بارگذاری اطلاعات بلیط');
			} finally {
				setIsLoading(false);
			}
		};

		initializeTicketFlow();
	}, [token, ticketId, setTicketInfo, getFlowSession, initializeFlowWithTicket, serviceData, setServiceData]);

	const handleBackToPLP = () => {
		// Navigate back to the PLP or dashboard
		router.push('/dashboard');
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<Card className="w-full max-w-md">
					<CardContent className="p-8 text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
						<h2 className="text-lg font-iran-yekan-bold text-gray-800 mb-2">
							در حال بارگذاری اطلاعات بلیط...
						</h2>
						<p className="text-gray-600 text-sm">
							لطفا صبر کنید
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<Card className="w-full max-w-md">
					<CardContent className="p-8 text-center">
						<div className="text-red-500 text-4xl mb-4">⚠️</div>
						<h2 className="text-lg font-iran-yekan-bold text-gray-800 mb-2">
							خطا در بارگذاری
						</h2>
						<p className="text-gray-600 text-sm mb-4">
							{error}
						</p>
						<Button
							onClick={handleBackToPLP}
							className="bg-blue-600 hover:bg-blue-700"
						>
							بازگشت به داشبورد
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!ticketData) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<Card className="w-full max-w-md">
					<CardContent className="p-8 text-center">
						<div className="text-gray-500 text-4xl mb-4">❌</div>
						<h2 className="text-lg font-iran-yekan-bold text-gray-800 mb-2">
							اطلاعات بلیط یافت نشد
						</h2>
						<p className="text-gray-600 text-sm mb-4">
							لطفا مجددا تلاش کنید
						</p>
						<Button
							onClick={handleBackToPLP}
							className="bg-blue-600 hover:bg-blue-700"
						>
							بازگشت به داشبورد
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Prepare seat price service detail for the stepper
	const seatPriceServiceDetail = {
		token: ticketData.token,
		serviceNo: ticketData.serviceNo,
		companyName: ticketData.companyName,
		logoUrl: ticketData.logoUrl,
		busType: ticketData.busType,
		price: ticketData.fullPrice / 10, // Convert to Toman
		totalPrice: ticketData.fullPrice / 10,
		source: ticketData.sourceCity,
		destination: ticketData.destinationCity,
		date: ticketData.departDate,
		departureTime: ticketData.departTime,
		duration: ticketData.routeInfo.duration,
		distance: ticketData.routeInfo.formattedDistance,
		availableSeats: ticketData.availableSeats
	};

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header with back button */}
			<div className="bg-white border-b border-gray-200 px-4 py-3">
				<div className="max-w-7xl mx-auto flex items-center justify-between">
					<Button
						variant="ghost"
						onClick={handleBackToPLP}
						className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
					>
						<ArrowRight className="h-4 w-4" />
						بازگشت
					</Button>

					<div className="text-center">
						<h1 className="text-lg font-iran-yekan-bold text-gray-800">
							خرید بلیط اتوبوس
						</h1>
						<p className="text-sm text-gray-600">
							{ticketData.sourceCity} → {ticketData.destinationCity}
						</p>
					</div>

					<div></div> {/* Spacer for centering */}
				</div>
			</div>

			{/* Bus Reservation Stepper */}
			<div className="py-6">
				<BusReservationWithStepper
					seatPriceServiceDetail={seatPriceServiceDetail}
					onTimeExpire={() => {
						console.log('Time expired, redirecting to PLP');
						router.push('/dashboard');
					}}
					hideContinueButton={false}
				/>
			</div>
		</div>
	);
}
