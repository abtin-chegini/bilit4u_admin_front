"use client";

import React, { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTicketStore } from '@/store/TicketStore';
import { usePassengerStore } from '@/store/PassengerStore';
import { useRouter } from 'next/navigation';
import { formatPrice, toPersianDigits } from '../BusReservationWithStepper';

interface TicketIssueStepProps {
	seatPriceServiceDetail?: any;
}

const TicketIssueStep = forwardRef<any, TicketIssueStepProps>(({
	seatPriceServiceDetail
}, ref) => {
	const { selectedSeats } = useTicketStore();
	const { passengers } = usePassengerStore();
	const router = useRouter();
	const [ticketNumber, setTicketNumber] = useState<string>('');
	const [isGenerating, setIsGenerating] = useState(true);

	// Generate ticket number on mount
	useEffect(() => {
		const generateTicketNumber = () => {
			const timestamp = Date.now().toString(36);
			const random = Math.random().toString(36).substr(2, 5);
			setTicketNumber(`BLT-${timestamp.toUpperCase()}-${random.toUpperCase()}`);
		};

		// Simulate ticket generation delay
		setTimeout(() => {
			generateTicketNumber();
			setIsGenerating(false);
		}, 2000);
	}, []);

	// Expose methods to parent component
	useImperativeHandle(ref, () => ({
		validate: () => {
			return true; // Ticket issue step is always valid
		},
		getTicketInfo: () => {
			return {
				ticketNumber,
				selectedSeats,
				passengers,
				seatPriceServiceDetail
			};
		}
	}));

	const totalPrice = selectedSeats.length * (seatPriceServiceDetail?.price || 0);

	const handleDownloadTicket = () => {
		// Simulate ticket download
		const ticketData = {
			ticketNumber,
			passengers,
			seats: selectedSeats,
			totalPrice,
			travelInfo: seatPriceServiceDetail
		};

		const dataStr = JSON.stringify(ticketData, null, 2);
		const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

		const exportFileDefaultName = `ticket-${ticketNumber}.json`;

		const linkElement = document.createElement('a');
		linkElement.setAttribute('href', dataUri);
		linkElement.setAttribute('download', exportFileDefaultName);
		linkElement.click();
	};

	const handlePrintTicket = () => {
		window.print();
	};

	const handleReturnToDashboard = () => {
		router.push('/dashboard');
	};

	if (isGenerating) {
		return (
			<div className="space-y-6">
				<Card>
					<CardContent className="py-12">
						<div className="text-center space-y-4">
							<div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
							<h2 className="text-xl font-iran-yekan-bold text-gray-800">
								در حال صدور بلیط...
							</h2>
							<p className="text-gray-600">
								لطفا صبر کنید
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Success Message */}
			<Card className="bg-green-50 border-green-200">
				<CardContent className="py-12">
					<div className="text-center space-y-4">
						<div className="text-6xl text-green-600">✓</div>
						<h2 className="text-2xl font-iran-yekan-bold text-green-800">
							بلیط شما با موفقیت صادر شد
						</h2>
						<p className="text-green-700">
							شماره پیگیری: <span className="font-iran-yekan-bold">{ticketNumber}</span>
						</p>
					</div>
				</CardContent>
			</Card>

			{/* Ticket Details */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg font-iran-yekan-bold text-right">
						جزئیات بلیط
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-6">
						{/* Travel Information */}
						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="font-iran-yekan-bold mb-3 text-gray-800">
								اطلاعات سفر
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<div className="flex justify-between">
									<span className="text-gray-600">مبدا:</span>
									<span className="font-iran-yekan-bold">
										{seatPriceServiceDetail?.source || 'تهران'}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">مقصد:</span>
									<span className="font-iran-yekan-bold">
										{seatPriceServiceDetail?.destination || 'مشهد'}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">تاریخ:</span>
									<span className="font-iran-yekan-bold">
										{seatPriceServiceDetail?.date || 'امروز'}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">ساعت:</span>
									<span className="font-iran-yekan-bold">
										{seatPriceServiceDetail?.departureTime || '08:00'}
									</span>
								</div>
							</div>
						</div>

						{/* Seats and Passengers */}
						<div className="space-y-4">
							<h3 className="font-iran-yekan-bold text-gray-800">
								صندلی‌ها و مسافران
							</h3>
							{passengers.map((passenger, index) => (
								<div key={index} className="bg-blue-50 rounded-lg p-4">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div className="space-y-2">
											<div className="flex justify-between">
												<span className="text-gray-600">نام:</span>
												<span className="font-iran-yekan-bold">
													{passenger.name} {passenger.family}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-gray-600">کد ملی:</span>
												<span className="font-iran-yekan-bold">
													{toPersianDigits(passenger.nationalId || '')}
												</span>
											</div>
										</div>
										<div className="space-y-2">
											<div className="flex justify-between">
												<span className="text-gray-600">صندلی:</span>
												<span className="font-iran-yekan-bold text-blue-600">
													{toPersianDigits(selectedSeats[index]?.seatNo || 0)}
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

						{/* Price */}
						<div className="bg-green-50 rounded-lg p-4">
							<div className="flex justify-between items-center">
								<span className="text-lg font-iran-yekan-bold text-green-800">
									مبلغ پرداخت شده:
								</span>
								<span className="text-xl font-iran-yekan-bold text-green-800">
									{formatPrice(totalPrice)} تومان
								</span>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Action Buttons */}
			<Card>
				<CardContent className="pt-6">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<Button
							onClick={handleDownloadTicket}
							className="bg-blue-600 hover:bg-blue-700 font-iran-yekan"
						>
							دانلود بلیط
						</Button>
						<Button
							onClick={handlePrintTicket}
							variant="outline"
							className="font-iran-yekan"
						>
							چاپ بلیط
						</Button>
						<Button
							onClick={handleReturnToDashboard}
							variant="outline"
							className="font-iran-yekan"
						>
							بازگشت به داشبورد
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Important Notes */}
			<Card className="bg-yellow-50 border-yellow-200">
				<CardContent className="pt-6">
					<div className="space-y-2">
						<h3 className="font-iran-yekan-bold text-yellow-800">
							نکات مهم:
						</h3>
						<ul className="space-y-1 text-sm text-yellow-700">
							<li>• بلیط خود را حتماً چاپ کرده یا در موبایل ذخیره کنید</li>
							<li>• حداقل 30 دقیقه قبل از حرکت در ترمینال حاضر شوید</li>
							<li>• در صورت لغو سفر، تا 2 ساعت قبل از حرکت امکان کنسلی وجود دارد</li>
							<li>• شماره پیگیری را نزد خود نگه دارید</li>
						</ul>
					</div>
				</CardContent>
			</Card>
		</div>
	);
});

TicketIssueStep.displayName = 'TicketIssueStep';

export default TicketIssueStep;
