"use client";

import React, { useMemo, useState } from "react";
import TicketCardLg, { ServiceDetails } from "@/components/dashboard_admin_buy/pdp/previous/ticket-card-lg/index";
import { useTicketStore } from "@/store/TicketStore";
import { usePassengerStore, StoredPassenger } from "@/store/PassengerStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, User, CreditCard, Ticket } from "lucide-react";
import axios from "axios";
import { Session } from '@supabase/supabase-js';
import { useRouter } from "next/navigation";

// Helper function to convert numbers to Persian digits
const toPersianDigits = (input: string | number): string => {
	const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
	return input.toString().replace(/\d/g, (match) => persianDigits[parseInt(match)]);
};

// Helper function to format price
const formatPrice = (price: number): string => {
	return toPersianDigits(price.toLocaleString('fa-IR'));
};

interface CheckoutProps {
	ticketDetails: ServiceDetails;
	onBack?: () => void;
}

export const Checkout: React.FC<CheckoutProps> = ({ ticketDetails, onBack }) => {
	const router = useRouter();
	const { toast } = useToast();
	const [isProcessing, setIsProcessing] = useState(false);
	const { selectedSeats } = useTicketStore();
	const { getSessionPassengers } = usePassengerStore();
	const passengers = getSessionPassengers();

	// Get session from localStorage
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

	// Calculate pricing
	const seatPrice = ticketDetails?.FullPrice ? parseInt(ticketDetails.FullPrice) / 10 : 0;
	const totalSeats = selectedSeats.length;
	const subtotal = totalSeats * seatPrice;
	const tax = 0; // Add tax calculation if needed
	const totalPrice = subtotal + tax;

	// Match passengers with seats
	const passengersWithSeats = useMemo(() => {
		return passengers.map(passenger => {
			const seat = selectedSeats.find(s => s.id === passenger.seatId);
			return {
				...passenger,
				seatNo: seat?.seatNo || passenger.seatNo || 'نامشخص',
				genderLabel: passenger.gender === 1 ? 'خانم' : 'آقا'
			};
		});
	}, [passengers, selectedSeats]);

	// Handle payment with gift pool
	const handlePayment = async () => {
		if (!session?.access_token) {
			toast({
				title: "خطا در احراز هویت",
				description: "لطفاً دوباره وارد شوید",
				variant: "destructive"
			});
			return;
		}

		setIsProcessing(true);

		try {
			// Prepare payment data
			const paymentData = {
				ticketId: ticketDetails.TicketNo,
				requestToken: ticketDetails.RequestToken,
				amount: totalPrice,
				passengers: passengersWithSeats.map(p => ({
					seatId: p.seatId,
					seatNo: p.seatNo,
					firstName: p.name,
					lastName: p.family,
					nationalCode: p.nationalId,
					gender: p.gender === 1 ? false : true, // Convert to boolean for API
					dateOfBirth: p.birthDate
				})),
				paymentMethod: "giftPool" // Payment from gift pool
			};

			console.log("Processing payment with gift pool:", paymentData);

			// Make API call to process payment
			const response = await axios.post(
				'https://api.bilit4u.com/admin/api/v1/admin/tickets/reserve',
				paymentData,
				{
					headers: {
						'Authorization': `Bearer ${session.access_token}`,
						'Content-Type': 'application/json'
					}
				}
			);

			if (response.data.success) {
				toast({
					title: "پرداخت موفق",
					description: "بلیط شما با موفقیت رزرو شد",
					variant: "default"
				});

				// Navigate to success page or ticket details
				// router.push(`/ticket/${response.data.ticketId}`);
			} else {
				throw new Error(response.data.message || "خطا در پردازش پرداخت");
			}

		} catch (error: any) {
			console.error("Payment error:", error);

			toast({
				title: "خطا در پرداخت",
				description: error.response?.data?.message || "مشکلی در پردازش پرداخت رخ داد. لطفاً دوباره تلاش کنید",
				variant: "destructive"
			});
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<div className="max-w-[1200px] mx-auto px-4 py-6 space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-3">
					<CheckCircle2 className="h-6 w-6 text-[#0D5990]" />
					<h1 className="text-xl md:text-2xl font-IranYekanBold text-[#2B2B2B]">
						تکمیل خرید و پرداخت
					</h1>
				</div>
				{onBack && (
					<Button
						variant="outline"
						onClick={onBack}
						className="font-IranYekanRegular"
					>
						بازگشت
					</Button>
				)}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left Column - Ticket and Passengers */}
				<div className="lg:col-span-2 space-y-6">
					{/* Section 1: Ticket Details */}
					<Card className="border-[#CCD6E1]">
						<CardContent className="p-0">
							<div className="p-4 border-b border-[#CCD6E1] bg-[#F8FBFF]">
								<div className="flex items-center gap-2">
									<Ticket className="h-5 w-5 text-[#0D5990]" />
									<h2 className="text-lg font-IranYekanBold text-[#2B2B2B]">
										اطلاعات سفر
									</h2>
								</div>
							</div>
							<div className="p-4">
								<TicketCardLg ticketDetails={ticketDetails} />
							</div>
						</CardContent>
					</Card>

					{/* Section 2: Passenger Review */}
					<Card className="border-[#CCD6E1]">
						<CardContent className="p-0">
							<div className="p-4 border-b border-[#CCD6E1] bg-[#F8FBFF]">
								<div className="flex items-center gap-2">
									<User className="h-5 w-5 text-[#0D5990]" />
									<h2 className="text-lg font-IranYekanBold text-[#2B2B2B]">
										مسافران ({toPersianDigits(passengersWithSeats.length)} نفر)
									</h2>
								</div>
							</div>
							<div className="p-4">
								<div className="space-y-3">
									{passengersWithSeats.length === 0 ? (
										<div className="text-center py-8 text-gray-500 font-IranYekanRegular">
											هیچ مسافری انتخاب نشده است
										</div>
									) : (
										passengersWithSeats.map((passenger, index) => (
											<div
												key={`passenger-${passenger.id || index}`}
												className="flex items-center justify-between p-4 bg-[#F8FBFF] border border-[#E1EAF4] rounded-md hover:shadow-sm transition-shadow"
											>
												<div className="flex items-center gap-4">
													{/* Passenger Icon */}
													<div className={`w-10 h-10 rounded-full flex items-center justify-center ${passenger.gender === 1 ? 'bg-green-100' : 'bg-blue-100'
														}`}>
														<User className={`h-5 w-5 ${passenger.gender === 1 ? 'text-green-600' : 'text-blue-600'
															}`} />
													</div>

													{/* Passenger Info */}
													<div>
														<div className="flex items-center gap-2">
															<h3 className="font-IranYekanBold text-[#2B2B2B] text-sm md:text-base">
																{passenger.name} {passenger.family}
															</h3>
															<span className={`text-xs px-2 py-0.5 rounded-full ${passenger.gender === 1
																? 'bg-green-100 text-green-700'
																: 'bg-blue-100 text-blue-700'
																}`}>
																{passenger.genderLabel}
															</span>
														</div>
														<p className="text-xs md:text-sm text-gray-600 font-IranYekanRegular mt-1">
															کد ملی: {toPersianDigits(passenger.nationalId)}
														</p>
													</div>
												</div>

												{/* Seat Number */}
												<div className="text-left">
													<div className="bg-white border border-[#CCD6E1] rounded-md px-3 py-2">
														<div className="text-xs text-gray-500 font-IranYekanRegular mb-1">
															صندلی
														</div>
														<div className="text-lg font-IranYekanBold text-[#0D5990]">
															{toPersianDigits(passenger.seatNo?.toString() || '0')}
														</div>
													</div>
												</div>
											</div>
										))
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Right Column - Payment Summary */}
				<div className="lg:col-span-1">
					<Card className="border-[#CCD6E1] sticky top-6">
						<CardContent className="p-0">
							<div className="p-4 border-b border-[#CCD6E1] bg-[#F8FBFF]">
								<div className="flex items-center gap-2">
									<CreditCard className="h-5 w-5 text-[#0D5990]" />
									<h2 className="text-lg font-IranYekanBold text-[#2B2B2B]">
										خلاصه پرداخت
									</h2>
								</div>
							</div>

							<div className="p-4 space-y-4">
								{/* Price Breakdown */}
								<div className="space-y-3">
									<div className="flex justify-between items-center text-sm">
										<span className="text-gray-600 font-IranYekanRegular">
											تعداد صندلی
										</span>
										<span className="font-IranYekanMedium text-gray-800">
											{toPersianDigits(totalSeats)} صندلی
										</span>
									</div>

									<div className="flex justify-between items-center text-sm">
										<span className="text-gray-600 font-IranYekanRegular">
											قیمت هر صندلی
										</span>
										<span className="font-IranYekanMedium text-gray-800">
											{formatPrice(seatPrice)} تومان
										</span>
									</div>

									<div className="border-t border-dashed border-gray-300 pt-3">
										<div className="flex justify-between items-center text-sm">
											<span className="text-gray-600 font-IranYekanRegular">
												جمع جزء
											</span>
											<span className="font-IranYekanMedium text-gray-800">
												{formatPrice(subtotal)} تومان
											</span>
										</div>
									</div>

									{tax > 0 && (
										<div className="flex justify-between items-center text-sm">
											<span className="text-gray-600 font-IranYekanRegular">
												مالیات
											</span>
											<span className="font-IranYekanMedium text-gray-800">
												{formatPrice(tax)} تومان
											</span>
										</div>
									)}
								</div>

								{/* Total Price */}
								<div className="border-t-2 border-[#CCD6E1] pt-4">
									<div className="flex justify-between items-center">
										<span className="text-base font-IranYekanBold text-gray-800">
											مبلغ قابل پرداخت
										</span>
										<span className="text-xl font-IranYekanBold text-[#0D5990]">
											{formatPrice(totalPrice)} تومان
										</span>
									</div>
								</div>

								{/* Payment Method */}
								<div className="bg-gradient-to-r from-[#E8F2FC] to-[#F0F7FF] border border-[#CCD6E1] rounded-md p-4">
									<div className="flex items-center gap-2 mb-2">
										<CreditCard className="h-4 w-4 text-[#0D5990]" />
										<h3 className="font-IranYekanBold text-sm text-[#0D5990]">
											روش پرداخت
										</h3>
									</div>
									<p className="text-sm text-gray-700 font-IranYekanRegular">
										پرداخت از گیف پول
									</p>
									<p className="text-xs text-gray-500 font-IranYekanLight mt-1">
										مبلغ از موجودی حساب کسر می‌شود
									</p>
								</div>

								{/* Payment Button */}
								<Button
									onClick={handlePayment}
									disabled={isProcessing || passengersWithSeats.length === 0}
									className="w-full bg-[#0D5990] hover:bg-[#064272] text-white font-IranYekanBold py-6 text-base disabled:bg-gray-300 disabled:cursor-not-allowed"
								>
									{isProcessing ? (
										<>
											<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
											در حال پردازش...
										</>
									) : (
										<>
											تایید و پرداخت
											<svg
												className="mr-2"
												width="20"
												height="20"
												viewBox="0 0 24 24"
												fill="none"
												xmlns="http://www.w3.org/2000/svg"
											>
												<path
													d="M9 5L16 12L9 19"
													stroke="currentColor"
													strokeWidth="2"
													strokeLinecap="round"
													strokeLinejoin="round"
													transform="scale(-1, 1) translate(-24, 0)"
												/>
											</svg>
										</>
									)}
								</Button>

								{/* Security Notice */}
								<div className="flex items-start gap-2 text-xs text-gray-500 font-IranYekanLight">
									<svg
										className="h-4 w-4 mt-0.5 flex-shrink-0"
										viewBox="0 0 24 24"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
										<path
											d="M12 8V12"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
										<path
											d="M12 16H12.01"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									</svg>
									<p>
										پرداخت شما از طریق درگاه امن بانکی و با رعایت استانداردهای امنیتی انجام می‌شود.
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
};

export default Checkout;
