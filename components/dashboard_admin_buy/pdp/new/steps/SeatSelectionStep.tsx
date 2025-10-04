"use client";

import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { BusLayout } from "@/components/dashboard_admin_buy/pdp/previous/bus_layout/bus_layout";
import { MediumBusLayout } from "@/components/dashboard_admin_buy/pdp/previous/bus_layout_medium/bus_layout_medium";
import { MobileBusLayout } from "@/components/dashboard_admin_buy/pdp/previous/bus_layout_mobile/bus_layout_mobile";
import { useScreenSize } from '@/hooks/useScreenSize';
import { useTicketStore } from '@/store/TicketStore';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toPersianDigits } from '../BusReservationWithStepper';
import { PassengerForm } from '@/components/dashboard_admin_buy/pdp/previous/passenger_form/passenger_form';

interface SeatSelectionStepProps {
	onValidationChange?: (isValid: boolean) => void;
}

const SeatSelectionStep = forwardRef<any, SeatSelectionStepProps>(({
	onValidationChange
}, ref) => {
	const screenSize = useScreenSize();
	const isMobile = screenSize === 'xs' || screenSize === 'sm';
	const isTablet = screenSize === 'md';
	const { selectedSeats } = useTicketStore();
	const maxSelectable = 4; // Default max selectable seats

	// Expose methods to parent component
	useImperativeHandle(ref, () => ({
		validate: () => {
			const isValid = selectedSeats.length > 0;
			onValidationChange?.(isValid);
			return isValid;
		},
		getSelectedSeats: () => {
			return selectedSeats;
		}
	}));

	return (
		<div className="space-y-6">
			{/* Bus Layout - Using the exact same design as previous bus_layout */}
			<div className="bg-white rounded-lg border p-4">
				{isMobile ? (
					<MobileBusLayout maxSelectable={maxSelectable} />
				) : isTablet ? (
					<MediumBusLayout maxSelectable={maxSelectable} />
				) : (
					<BusLayout maxSelectable={maxSelectable} />
				)}
			</div>

			{/* Selected Seats Summary - Quick Overview */}
			{selectedSeats.length > 0 && (
				<Card className="border-2 border-green-200 bg-green-50/30">
					<CardHeader className="bg-green-100 rounded-t-lg">
						<CardTitle className="text-lg font-iran-yekan-bold text-right text-green-800">
							خلاصه صندلی‌های انتخاب شده
						</CardTitle>
						<p className="text-sm text-green-600 text-right mt-1">
							در زیر فرم‌های اطلاعات مسافران را مشاهده کنید
						</p>
					</CardHeader>
					<CardContent className="p-4">
						<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
							{selectedSeats.map((seat: any, index: number) => (
								<div
									key={seat.id}
									className="bg-white border-2 border-green-300 rounded-lg p-3 text-center shadow-sm hover:shadow-md transition-shadow"
								>
									<div className="flex items-center justify-center mb-2">
										<div className="relative w-8 h-8">
											<svg
												className="w-full h-full"
												viewBox="0 0 53 57"
												fill="none"
												xmlns="http://www.w3.org/2000/svg"
											>
												<rect
													x="1.00098"
													y="8.81641"
													width="45.2151"
													height="39.5244"
													rx="3.5"
													fill={seat.state === 'selected-male' ? '#0D5890' : '#0D5890'}
													stroke="white"
													strokeWidth="1"
												/>
												<rect
													x="12.0547"
													y="41.873"
													width="34.1637"
													height="13.9301"
													rx="3.5"
													fill={seat.state === 'selected-male' ? '#0D5890' : '#0D5890'}
													stroke="white"
													strokeWidth="1"
												/>
												<rect
													x="12.0547"
													y="1.35059"
													width="34.1637"
													height="13.9301"
													rx="3.5"
													fill={seat.state === 'selected-male' ? '#0D5890' : '#0D5890'}
													stroke="white"
													strokeWidth="1"
												/>
												<rect
													x="41.1904"
													y="6.67969"
													width="11.0561"
													height="41.6573"
													rx="3.5"
													fill={seat.state === 'selected-male' ? '#0D5890' : '#0D5890'}
													stroke="white"
													strokeWidth="1"
												/>
											</svg>
											<span className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs">
												{toPersianDigits(seat.seatNo || 0)}
											</span>
										</div>
									</div>
									<div className="font-iran-yekan-bold text-green-800 text-sm">
										مسافر {toPersianDigits(index + 1)}
									</div>
									<div className="text-xs text-green-600 mt-1">
										{seat.state === 'selected-male' ? 'آقا' : 'خانم'}
									</div>
								</div>
							))}
						</div>
						<div className="mt-4 pt-4 border-t border-green-200">
							<div className="flex justify-between items-center">
								<span className="font-iran-yekan-bold text-green-700">
									تعداد صندلی‌ها:
								</span>
								<span className="font-iran-yekan-bold text-green-600 text-lg">
									{toPersianDigits(selectedSeats.length)}
								</span>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Instructions */}
			<Card className="bg-blue-50 border-blue-200">
				<CardContent className="pt-6">
					<div className="space-y-2">
						<h3 className="font-iran-yekan-bold text-blue-800">
							راهنمای انتخاب صندلی:
						</h3>
						<ul className="space-y-1 text-sm text-blue-700">
							<li>• روی صندلی‌های سبز کلیک کنید تا انتخاب شوند</li>
							<li>• صندلی‌های قرمز قبلاً رزرو شده‌اند</li>
							<li>• صندلی‌های آبی انتخاب شده توسط شما هستند</li>
							<li>• حداقل یک صندلی باید انتخاب کنید</li>
						</ul>
					</div>
				</CardContent>
			</Card>

			{/* Passenger Details Section - Integrated with Seat Selection */}
			{selectedSeats.length > 0 && (
				<Card className="border-2 border-blue-200 bg-blue-50/30">
					<CardHeader className="bg-blue-100 rounded-t-lg">
						<CardTitle className="text-lg font-iran-yekan-bold text-right text-blue-800">
							اطلاعات مسافران - صندلی‌های انتخاب شده
						</CardTitle>
						<p className="text-sm text-blue-600 text-right mt-2">
							برای هر صندلی انتخاب شده، اطلاعات مسافر مربوطه را تکمیل کنید
						</p>
					</CardHeader>
					<CardContent className="p-6">
						<div className="space-y-6">
							{selectedSeats.map((seat: any, index: number) => (
								<div key={seat.id} className="border-2 border-blue-300 rounded-lg p-6 bg-white shadow-sm">
									{/* Seat Information Header */}
									<div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
										<div className="flex items-center space-x-4 space-x-reverse">
											{/* Seat Icon Preview */}
											<div className="relative w-16 h-16 flex items-center justify-center">
												<svg
													className="w-full h-full"
													viewBox="0 0 53 57"
													fill="none"
													xmlns="http://www.w3.org/2000/svg"
												>
													<rect
														x="1.00098"
														y="8.81641"
														width="45.2151"
														height="39.5244"
														rx="3.5"
														fill={seat.state === 'selected-male' ? '#0D5890' : '#0D5890'}
														stroke="white"
														strokeWidth="2"
													/>
													<rect
														x="12.0547"
														y="41.873"
														width="34.1637"
														height="13.9301"
														rx="3.5"
														fill={seat.state === 'selected-male' ? '#0D5890' : '#0D5890'}
														stroke="white"
														strokeWidth="2"
													/>
													<rect
														x="12.0547"
														y="1.35059"
														width="34.1637"
														height="13.9301"
														rx="3.5"
														fill={seat.state === 'selected-male' ? '#0D5890' : '#0D5890'}
														stroke="white"
														strokeWidth="2"
													/>
													<rect
														x="41.1904"
														y="6.67969"
														width="11.0561"
														height="41.6573"
														rx="3.5"
														fill={seat.state === 'selected-male' ? '#0D5890' : '#0D5890'}
														stroke="white"
														strokeWidth="2"
													/>
												</svg>
												<span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
													{toPersianDigits(seat.seatNo || 0)}
												</span>
											</div>

											{/* Seat Details */}
											<div>
												<h4 className="font-iran-yekan-bold text-lg text-gray-800">
													مسافر {toPersianDigits(index + 1)} - صندلی {toPersianDigits(seat.seatNo || 0)}
												</h4>
												<div className="flex items-center space-x-2 space-x-reverse mt-1">
													<div className={`w-3 h-3 rounded-full ${seat.state === 'selected-male' ? 'bg-blue-600' : 'bg-green-600'}`}></div>
													<span className="text-sm font-medium text-gray-600">
														{seat.state === 'selected-male' ? 'آقا' : 'خانم'}
													</span>
												</div>
											</div>
										</div>

										{/* Seat Status Badge */}
										<div className="flex items-center space-x-2 space-x-reverse">
											<div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
												صندلی انتخاب شده
											</div>
										</div>
									</div>

									{/* Passenger Form */}
									<div className="border-t border-gray-200 pt-4">
										<PassengerForm
											seatId={seat.id}
											seatNo={seat.seatNo}
											gender={seat.state === 'selected-male' ? 'male' : 'female'}
											name=""
											family=""
											nationalId=""
											phone=""
											onRemove={(seatId: number) => {
												// Handle seat removal if needed
											}}
											onChange={(seatId: number, field: string, value: string) => {
												// Handle passenger data changes if needed
											}}
											onCheckboxChange={(checked: boolean) => {
												// Handle additional contact checkbox if needed
											}}
											showAdditionalContact={false}
											onGenderChange={(seatId: number, gender: "male" | "female") => {
												// Handle gender change if needed
											}}
											isLastPassenger={index === selectedSeats.length - 1}
										/>
									</div>
								</div>
							))}
						</div>

						{/* Summary Section */}
						<div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-2 space-x-reverse">
									<svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
									</svg>
									<span className="font-iran-yekan-bold text-green-800">
										تعداد صندلی‌های انتخاب شده: {toPersianDigits(selectedSeats.length)}
									</span>
								</div>
								<div className="text-sm text-green-600">
									لطفاً اطلاعات تمام مسافران را تکمیل کنید
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
});

SeatSelectionStep.displayName = 'SeatSelectionStep';

export default SeatSelectionStep;
