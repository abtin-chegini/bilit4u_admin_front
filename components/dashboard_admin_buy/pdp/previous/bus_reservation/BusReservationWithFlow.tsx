"use client";

import React, { forwardRef, useCallback, useImperativeHandle, useEffect } from "react";
import { BusLayout } from "@/components/dashboard_admin_buy/pdp/previous/bus_layout/bus_layout";
import { MediumBusLayout } from "@/components/dashboard_admin_buy/pdp/previous/bus_layout_medium/bus_layout_medium";
import { MobileBusLayout } from "@/components/dashboard_admin_buy/pdp/previous/bus_layout_mobile/bus_layout_mobile";
import { PassengerDetailsForm } from '@/components/dashboard_admin_buy/pdp/previous/passenger_details/passenger_details';
import { useTicketStore } from '@/store/TicketStore';
import { usePassengerStore, StoredPassenger } from '@/store/PassengerStore';
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
				console.log("⏰ Navigation timeout triggered - Proceeding to next step");
				if (onContinue) {
					console.log("➡️ Calling parent onContinue with seats:", selectedSeats);
					onContinue(selectedSeats);
				} else {
					console.log("⚠️ No parent onContinue handler, would navigate to checkout");
				}
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
	const { selectedSeats, clearSelectedSeats, handleSeatClick, removeSelectedSeat } = useTicketStore();
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

	return (
		<div className="max-w-[1200px] mx-auto mt-6 flex flex-col gap-6">

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
