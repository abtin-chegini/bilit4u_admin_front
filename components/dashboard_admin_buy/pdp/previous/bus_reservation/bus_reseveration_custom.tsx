"use client";

import React, { forwardRef, useCallback, useImperativeHandle } from "react";
import { BusLayout } from "@/components/dashboard_admin_buy/pdp/previous/bus_layout/bus_layout";
import { MediumBusLayout } from "@/components/dashboard_admin_buy/pdp/previous/bus_layout_medium/bus_layout_medium";
import { MobileBusLayout } from "@/components/dashboard_admin_buy/pdp/previous/bus_layout_mobile/bus_layout_mobile";
import { PassengerDetailsForm } from '@/components/dashboard_admin_buy/pdp/previous/passenger_details/passenger_details';
import { useTicketStore } from '@/store/TicketStore';
import { usePassengerStore, StoredPassenger } from '@/store/PassengerStore';
import { useScreenSize } from '@/hooks/useScreenSize';
import { useEffect, useState, useRef } from "react";
import { useRouter } from 'next/navigation';
import { RouteUtils } from "@/lib/RouteUtil";
import { useToast } from "@/hooks/use-toast";
import { Session } from '@supabase/supabase-js'
import axios from 'axios';

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function toPersianDigits(num: number | string): string {
	return num.toString().replace(/\d/g, (digit) =>
		"۰۱۲۳۴۵۶۷۸۹"[parseInt(digit, 10)]
	);
}

export function formatPrice(price: number): string {
	// Format with commas and convert to Persian digits
	return toPersianDigits(price.toLocaleString('fa-IR'));
}

interface BusReservationProps {
	onTimeExpire?: () => void;
	seatPriceServiceDetail?: any;
	onContinue?: (seats: any) => void;
	onValidationChange?: (validationData: {
		isAnyPassengerValid: boolean;
		allPassengersValid: boolean;
	}) => void;
	hideContinueButton?: boolean; // New prop to control button visibility
}

// Changed to forwardRef and added useImperativeHandle to expose internal methods
const BusReservation = forwardRef<any, BusReservationProps>(({
	onTimeExpire,
	seatPriceServiceDetail,
	onContinue,
	onValidationChange,
	hideContinueButton = false // Default to showing the button
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
	const [isTimeoutDialogOpen, setIsTimeoutDialogOpen] = useState(false);
	const { addPassengers } = usePassengerStore();

	// Reference to the PassengerDetailsForm component
	const detailsFormRef = useRef<{
		savePassengers: () => Promise<{ success: boolean; passengers: StoredPassenger[]; buyerInfo?: any }>;
		restorePassengerData: (passengers: StoredPassenger[]) => void;
	}>(null);

	// Expose the internal methods via ref to parent component
	useImperativeHandle(ref, () => ({
		detailsFormRef, // Expose the detailsFormRef
		handleContinueClick, // Expose the handleContinueClick function
		passengerValidation, // Expose validation state
		savePassengerData, // Expose savePassengerData function
		// New method to restore passenger data
		restorePassengerData: (passengers: StoredPassenger[]) => {
			console.log("BusReservation: Restoring passenger data", passengers);

			// Pass down to the PassengerDetailsForm if it exists
			if (detailsFormRef.current && detailsFormRef.current.restorePassengerData) {
				detailsFormRef.current.restorePassengerData(passengers);
			} else {
				console.error("Unable to restore passenger data - form reference not ready");
			}
		}
	}));

	// Update the submission state to track progress percentage
	const [submissionState, setSubmissionState] = useState({
		isSubmitting: false,
		progress: 0
	});

	// Update the validation state to track how many passengers are complete
	const [passengerValidation, setPassengerValidation] = useState({
		isAnyPassengerValid: false, // At least one passenger complete
		allPassengersValid: false   // All passengers complete
	});

	// Get only what we need from the store
	const { selectedSeats, clearSelectedSeats, handleSeatClick, removeSelectedSeat } = useTicketStore();
	const screenSize = useScreenSize();
	const isMedium = screenSize === 'md';
	const isMobile = screenSize === 'xs' || screenSize === 'sm';

	// Define maxSelectable as a constant
	const maxSelectable = 7;
	const seatPrice = seatPriceServiceDetail ? parseInt(seatPriceServiceDetail) / 10 : 250000;
	const totalPrice = selectedSeats.length * seatPrice;

	// Log screen size changes for debugging
	useEffect(() => {
		console.log('Screen size changed to:', screenSize);
	}, [screenSize]);

	// Pass validation changes to parent component if callback provided
	useEffect(() => {
		if (onValidationChange) {
			onValidationChange(passengerValidation);
		}
	}, [passengerValidation, onValidationChange]);

	const handleRemovePassenger = (seatId: number) => {
		console.log('BusReservation: Removing passenger', seatId);
		removeSelectedSeat(seatId);
	};

	// Update the validation handler to use the new state
	const handleValidationChange = (validationData: {
		isAnyPassengerValid: boolean,
		allPassengersValid: boolean
	}) => {
		setPassengerValidation(validationData);
	};

	const handleSeatStateChange = (seatId: number, newState?: string) => {
		console.log('BusReservation: Changing seat state', seatId, newState);

		if (!newState) return;

		if (newState === "default") {
			removeSelectedSeat(seatId);
		}
	};

	const handleTimeExpire = () => {
		console.log("Timer expired in bus_reservation component");

		// Only handle if we don't have a parent handler
		if (!onTimeExpire) {
			// Clear selected seats
			clearSelectedSeats();

			setIsTimeoutDialogOpen(true);
		} else {
			// Just call the parent handler
			console.log("Calling parent's onTimeExpire handler");
			onTimeExpire();
		}
	};

	// Function to get user profile ID
	const getUserProfile = async (token: string, refreshToken: string): Promise<string | null> => {
		try {
			const response = await axios.post(
				'https://api.bilit4u.com/user/api/v1/profile',
				{
					Token: token,
					RefreshToken: refreshToken
				},
				{
					headers: {
						'Content-Type': 'application/json'
					}
				}
			);

			if (response.data && response.data.userId) {
				return response.data.userId;
			}
			return null;
		} catch (error) {
			console.error("Failed to get user profile:", error);
			return null;
		}
	};


	// Improved function to save passenger data
	const savePassengerData = async (): Promise<{ success: boolean; passengers?: StoredPassenger[], buyerInfo?: any; }> => {
		console.log("Bus Reservation: Calling passenger details form savePassengers method");

		// Simply call the savePassengers method on the PassengerDetailsForm
		if (detailsFormRef.current?.savePassengers) {
			try {
				// This already includes all the functionality we need
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
	// Fallback method to get passenger data if ref method fails
	const fetchPassengerDataFromForm = async (): Promise<StoredPassenger[]> => {
		// This is a simplified version - replace with actual implementation if needed
		return [];
	};

	// Update the continue button handler
	// Update your handleContinueClick function with additional logs:
	const handleContinueClick = async () => {
		console.log("Save button clicked - Starting passenger save process");

		if (!passengerValidation.isAnyPassengerValid || submissionState.isSubmitting) {
			console.log("Save validation failed:", {
				isAnyPassengerValid: passengerValidation.isAnyPassengerValid,
				isSubmitting: submissionState.isSubmitting,
				selectedSeats: selectedSeats.length
			});
			return;
		}
		console.log("Save validation passed - Proceeding with save");

		// Set initial submission state
		setSubmissionState({ isSubmitting: true, progress: 10 });
		console.log("Submission state set to 10% - Beginning save process");

		try {
			// Save passenger data using the ref to PassengerDetailsForm
			const result = await savePassengerData();
			console.log("Save passenger data result:", {
				success: result.success,
				passengersCount: result.passengers?.length || 0,
				passengers: result.passengers
			});

			if (!result.success) {
				console.log("Save failed - showing error toast");
				toast({
					title: "خطا در ذخیره اطلاعات",
					description: "مشکلی در ذخیره اطلاعات مسافران رخ داد. لطفا دوباره تلاش کنید",
					variant: "destructive"
				});
				setSubmissionState({ isSubmitting: false, progress: 0 });
				return;
			}

			// Progress update
			setSubmissionState(prev => ({ isSubmitting: true, progress: 70 }));
			console.log("Submission state advanced to 70% - Save successful, preparing for navigation");

			// Final progress
			setSubmissionState({ isSubmitting: true, progress: 100 });
			console.log("Submission state completed to 100% - Ready for navigation");

			// Show success message
			toast({
				title: "اطلاعات مسافران ذخیره شد",
				description: "در حال انتقال به صفحه پرداخت...",
				variant: "default"
			});

			// Small delay to show 100% before proceeding
			setTimeout(() => {
				console.log("Navigation timeout triggered - Proceeding to next step");
				if (onContinue) {
					console.log("Calling parent onContinue with seats:", selectedSeats);
					onContinue(selectedSeats);
				} else {
					// If no parent handler, navigate to next page
					console.log("No parent onContinue handler, would navigate to checkout");
					// router.push('/checkout');
				}
				// Reset submission state after navigation is initiated
				setSubmissionState({ isSubmitting: false, progress: 0 });
			}, 300);
		} catch (error) {
			console.error("Error in save process:", error);

			toast({
				title: "خطا در ذخیره اطلاعات",
				description: "مشکلی در ذخیره اطلاعات مسافران رخ داد. لطفا دوباره تلاش کنید",
				variant: "destructive"
			});

			// Reset submission state
			setSubmissionState({ isSubmitting: false, progress: 0 });
		}
	};
	// Prepare guidance data to pass to layout components
	const guidanceData = {
		selectedSeats,
		maxSelectable,
		seatPrice,
		totalPrice,
		handleTimeExpire
	};

	const navigateBack = () => {
		// Close dialog
		setIsTimeoutDialogOpen(false);

		// Handle navigation ourselves since we're in the "else" branch
		// of handleTimeExpire where there's no parent handler
		try {
			console.log("Time expired, navigating to stored route");
			RouteUtils.navigateToStoredRoute(router);
		} catch (error) {
			console.error("Failed to navigate to stored route:", error);
			router.push('/');
		}
	};

	// Function to determine which bus layout component to render
	const renderBusLayout = () => {
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
	};

	return (
		<div className="max-w-[1200px] mx-auto mt-6 flex flex-col gap-6">
			{/* Only show our dialog if we don't have a parent handler */}
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
				{/* Bus seat guidance side panel - only show on desktop (not medium or mobile) */}
				{!isMedium && !isMobile && (
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
										<h2 className="mt-4 mb-2 text-gray-800 font-IranYekanBold text-[#4B5259] text-[14px] text-md">
											راهنمای انتخاب صندلی اتوبوس
										</h2>
									</div>

									{/* <CountdownTimer initialSeconds={900} onExpire={handleTimeExpire} /> */}
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
				<div className={`flex-1 bg-white border border-gray-300 p-4 rounded-md shadow-md ${isMedium ? 'w-full' : ''}`}>
					{/* Render the appropriate bus layout component based on screen size */}
					{renderBusLayout()}
				</div>
			</div>

			{/* Passenger details form - only show when seats are selected */}
			{selectedSeats.length > 0 && (
				<div className="mt-6 transition-all duration-300 ease-in-out">
					<div className="bg-white border border-gray-300 p-4 rounded-md shadow-md">
						{/* PassengerDetailsForm instead of PassengerDialog */}
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
										{/* Progress bar background */}
										<div className="absolute inset-0 bg-[#0D5990] bg-opacity-70"></div>

										{/* Moving progress indicator */}
										<div
											className="absolute left-0 top-0 bottom-0 bg-[#0D5990] transition-all duration-300"
											style={{ width: `${submissionState.progress}%` }}
										></div>

										{/* Progress text */}
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

			{/* Bottom continue button for mobile and tablet views - Only show if not hidden */}
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
								{/* Progress bar background */}
								<div className="absolute inset-0 bg-[#0D5990] bg-opacity-70"></div>

								{/* Moving progress indicator */}
								<div
									className="absolute left-0 top-0 bottom-0 bg-[#0D5990] transition-all duration-300"
									style={{ width: `${submissionState.progress}%` }}
								></div>

								{/* Progress text */}
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

// Add display name for React DevTools
BusReservation.displayName = 'BusReservation';

export default BusReservation;