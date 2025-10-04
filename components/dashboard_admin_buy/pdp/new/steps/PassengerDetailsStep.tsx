"use client";

import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { PassengerDetailsForm } from '@/components/dashboard_admin_buy/pdp/previous/passenger_details/passenger_details';
import { useTicketStore } from '@/store/TicketStore';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toPersianDigits } from '../BusReservationWithStepper';

interface PassengerDetailsStepProps {
	onValidationChange?: (validationData: {
		isAnyPassengerValid: boolean;
		allPassengersValid: boolean;
	}) => void;
}

const PassengerDetailsStep = forwardRef<any, PassengerDetailsStepProps>(({
	onValidationChange
}, ref) => {
	const { selectedSeats } = useTicketStore();
	const passengerDetailsRef = useRef<any>(null);

	// Expose methods to parent component
	useImperativeHandle(ref, () => ({
		validate: () => {
			// This will be handled by the PassengerDetailsForm component
			// The validation is managed internally by that component
			return true;
		},
		savePassengers: async () => {
			if (passengerDetailsRef.current?.savePassengers) {
				return await passengerDetailsRef.current.savePassengers();
			}
			return { success: false, passengers: [] };
		}
	}));


	return (
		<div className="space-y-6">
			{/* Selected Seats Info */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg font-iran-yekan-bold text-center">
						اطلاعات صندلی‌های انتخاب شده
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
						{selectedSeats.map((seat: any, index: number) => (
							<div
								key={seat.id}
								className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow"
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
								<div className="font-iran-yekan-bold text-blue-800 text-sm">
									مسافر {toPersianDigits(index + 1)}
								</div>
								<div className="text-xs text-blue-600 mt-1">
									صندلی {toPersianDigits(seat.seatNo || 0)}
								</div>
								<div className="text-xs text-blue-500 mt-1">
									{seat.state === 'selected-male' ? 'آقا' : 'خانم'}
								</div>
							</div>
						))}
					</div>
					<div className="mt-4 pt-4 border-t border-blue-200">
						<p className="text-sm text-blue-600 text-center">
							لطفا اطلاعات مسافر برای هر صندلی را تکمیل کنید
						</p>
					</div>
				</CardContent>
			</Card>

			{/* Passenger Details Form */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg font-iran-yekan-bold text-center">
						مشخصات مسافران
					</CardTitle>
				</CardHeader>
				<CardContent>
					<PassengerDetailsForm
						ref={passengerDetailsRef}
						seats={selectedSeats.map(seat => ({
							...seat,
							seatNo: typeof seat.seatNo === 'string' ? parseInt(seat.seatNo) : seat.seatNo
						}))}
						onRemovePassenger={(seatId: number) => {
							// Handle seat removal if needed
						}}
						onSeatStateChange={(seatId: number, newState?: string) => {
							// Handle seat state change if needed
						}}
						onValidationChange={onValidationChange}
					/>
				</CardContent>
			</Card>

			{/* Instructions */}
			<Card className="bg-yellow-50 border-yellow-200">
				<CardContent className="pt-6">
					<div className="space-y-2 text-center">
						<h3 className="font-iran-yekan-bold text-yellow-800">
							راهنمای تکمیل اطلاعات:
						</h3>
						<ul className="space-y-1 text-sm text-yellow-700 text-center">
							<li>• تمام فیلدهای ضروری را با دقت تکمیل کنید</li>
							<li>• کد ملی باید معتبر و یکتا باشد</li>
							<li>• شماره تلفن باید معتبر باشد</li>
							<li>• نام و نام خانوادگی باید به فارسی باشد</li>
						</ul>
					</div>
				</CardContent>
			</Card>
		</div>
	);
});

PassengerDetailsStep.displayName = 'PassengerDetailsStep';

export default PassengerDetailsStep;
