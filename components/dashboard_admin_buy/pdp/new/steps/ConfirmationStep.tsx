"use client";

import React, { forwardRef, useImperativeHandle } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTicketStore } from '@/store/TicketStore';
import { usePassengerStore } from '@/store/PassengerStore';
import { toPersianDigits, formatPrice } from '../BusReservationWithStepper';

interface ConfirmationStepProps {
	seatPriceServiceDetail?: any;
}

const ConfirmationStep = forwardRef<any, ConfirmationStepProps>(({
	seatPriceServiceDetail
}, ref) => {
	const { selectedSeats } = useTicketStore();
	const { passengers } = usePassengerStore();

	// Expose methods to parent component
	useImperativeHandle(ref, () => ({
		validate: () => {
			// Confirmation step is always valid
			return true;
		},
		getConfirmationData: () => {
			return {
				selectedSeats,
				passengers,
				seatPriceServiceDetail
			};
		}
	}));

	const totalPrice = selectedSeats.length * (seatPriceServiceDetail?.price || 0);

	return (
		<div className="space-y-6">
			{/* Travel Information */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg font-iran-yekan-bold text-right">
						اطلاعات سفر
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="space-y-3">
							<div className="flex justify-between items-center py-2 border-b border-gray-200">
								<span className="text-gray-600">مبدا:</span>
								<span className="font-iran-yekan-bold">
									{seatPriceServiceDetail?.source || 'تهران'}
								</span>
							</div>
							<div className="flex justify-between items-center py-2 border-b border-gray-200">
								<span className="text-gray-600">مقصد:</span>
								<span className="font-iran-yekan-bold">
									{seatPriceServiceDetail?.destination || 'مشهد'}
								</span>
							</div>
							<div className="flex justify-between items-center py-2 border-b border-gray-200">
								<span className="text-gray-600">تاریخ سفر:</span>
								<span className="font-iran-yekan-bold">
									{seatPriceServiceDetail?.date || 'امروز'}
								</span>
							</div>
							<div className="flex justify-between items-center py-2 border-b border-gray-200">
								<span className="text-gray-600">ساعت حرکت:</span>
								<span className="font-iran-yekan-bold">
									{seatPriceServiceDetail?.departureTime || '08:00'}
								</span>
							</div>
						</div>
						<div className="space-y-3">
							<div className="flex justify-between items-center py-2 border-b border-gray-200">
								<span className="text-gray-600">شرکت:</span>
								<span className="font-iran-yekan-bold">
									{seatPriceServiceDetail?.company || 'اتوبوسرانی'}
								</span>
							</div>
							<div className="flex justify-between items-center py-2 border-b border-gray-200">
								<span className="text-gray-600">نوع اتوبوس:</span>
								<span className="font-iran-yekan-bold">
									{seatPriceServiceDetail?.busType || 'VIP'}
								</span>
							</div>
							<div className="flex justify-between items-center py-2 border-b border-gray-200">
								<span className="text-gray-600">مدت سفر:</span>
								<span className="font-iran-yekan-bold">
									{seatPriceServiceDetail?.duration || '8 ساعت'}
								</span>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Selected Seats */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg font-iran-yekan-bold text-right">
						صندلی‌های انتخاب شده
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
						{selectedSeats.map((seat: any) => (
							<div
								key={seat.id}
								className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center"
							>
								<div className="font-iran-yekan-bold text-blue-800">
									صندلی {toPersianDigits(seat.seatNo || 0)}
								</div>
								<div className="text-sm text-blue-600">
									ردیف {toPersianDigits(Math.ceil(Number(seat.seatNo || 0) / 4))}
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Passenger Information */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg font-iran-yekan-bold text-right">
						اطلاعات مسافران
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{passengers.map((passenger, index) => (
							<div key={index} className="bg-gray-50 rounded-lg p-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<div className="flex justify-between">
											<span className="text-gray-600">نام:</span>
											<span className="font-iran-yekan-bold">
												{passenger.name}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">نام خانوادگی:</span>
											<span className="font-iran-yekan-bold">
												{passenger.family}
											</span>
										</div>
									</div>
									<div className="space-y-2">
										<div className="flex justify-between">
											<span className="text-gray-600">کد ملی:</span>
											<span className="font-iran-yekan-bold">
												{toPersianDigits(passenger.nationalId || '')}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">جنسیت:</span>
											<span className="font-iran-yekan-bold">
												{passenger.gender === 1 ? 'زن' : 'مرد'}
											</span>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Price Summary */}
			<Card className="bg-green-50 border-green-200">
				<CardHeader>
					<CardTitle className="text-lg font-iran-yekan-bold text-right text-green-800">
						خلاصه قیمت
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						<div className="flex justify-between items-center">
							<span className="text-green-700">تعداد صندلی:</span>
							<span className="font-iran-yekan-bold text-green-800">
								{toPersianDigits(selectedSeats.length)}
							</span>
						</div>
						<div className="flex justify-between items-center">
							<span className="text-green-700">قیمت هر صندلی:</span>
							<span className="font-iran-yekan-bold text-green-800">
								{formatPrice(seatPriceServiceDetail?.price || 0)} تومان
							</span>
						</div>
						<div className="border-t border-green-300 pt-3">
							<div className="flex justify-between items-center">
								<span className="text-lg font-iran-yekan-bold text-green-800">
									مبلغ کل:
								</span>
								<span className="text-xl font-iran-yekan-bold text-green-800">
									{formatPrice(totalPrice)} تومان
								</span>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Confirmation Notice */}
			<Card className="bg-blue-50 border-blue-200">
				<CardContent className="pt-6">
					<div className="text-center space-y-2">
						<h3 className="font-iran-yekan-bold text-blue-800">
							تأیید نهایی
						</h3>
						<p className="text-sm text-blue-700">
							لطفا تمام اطلاعات را با دقت بررسی کنید. پس از تأیید، امکان تغییر وجود ندارد.
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
});

ConfirmationStep.displayName = 'ConfirmationStep';

export default ConfirmationStep;
