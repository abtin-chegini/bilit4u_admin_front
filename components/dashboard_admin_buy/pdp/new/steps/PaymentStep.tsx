"use client";

import React, { forwardRef, useImperativeHandle, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTicketStore } from '@/store/TicketStore';
import { formatPrice } from '../BusReservationWithStepper';

interface PaymentStepProps {
	seatPriceServiceDetail?: any;
	onPaymentSuccess?: () => void;
}

const PaymentStep = forwardRef<any, PaymentStepProps>(({
	seatPriceServiceDetail,
	onPaymentSuccess
}, ref) => {
	const { selectedSeats } = useTicketStore();
	const [isProcessing, setIsProcessing] = useState(false);
	const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');

	// Expose methods to parent component
	useImperativeHandle(ref, () => ({
		validate: () => {
			return selectedPaymentMethod !== '';
		},
		processPayment: async () => {
			setIsProcessing(true);
			// Simulate payment processing
			await new Promise(resolve => setTimeout(resolve, 2000));
			setIsProcessing(false);
			onPaymentSuccess?.();
			return { success: true };
		}
	}));

	const totalPrice = selectedSeats.length * (seatPriceServiceDetail?.price || 0);

	const paymentMethods = [
		{
			id: 'zibal',
			name: 'درگاه پرداخت زیبال',
			icon: '💳',
			description: 'پرداخت امن با کارت‌های شتاب'
		},
		{
			id: 'bank',
			name: 'انتقال بانکی',
			icon: '🏦',
			description: 'انتقال مستقیم به حساب بانکی'
		},
		{
			id: 'wallet',
			name: 'کیف پول دیجیتال',
			icon: '💰',
			description: 'پرداخت از طریق کیف پول'
		}
	];

	const handlePayment = async () => {
		if (!selectedPaymentMethod) {
			return;
		}

		setIsProcessing(true);
		// Simulate payment processing
		await new Promise(resolve => setTimeout(resolve, 3000));
		setIsProcessing(false);
		onPaymentSuccess?.();
	};

	return (
		<div className="space-y-6">
			{/* Price Summary */}
			<Card className="bg-green-50 border-green-200">
				<CardHeader>
					<CardTitle className="text-lg font-iran-yekan-bold text-right text-green-800">
						خلاصه پرداخت
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						<div className="flex justify-between items-center">
							<span className="text-green-700">تعداد صندلی:</span>
							<span className="font-iran-yekan-bold text-green-800">
								{selectedSeats.length}
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
									مبلغ قابل پرداخت:
								</span>
								<span className="text-xl font-iran-yekan-bold text-green-800">
									{formatPrice(totalPrice)} تومان
								</span>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Payment Methods */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg font-iran-yekan-bold text-right">
						انتخاب روش پرداخت
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{paymentMethods.map((method) => (
							<div
								key={method.id}
								className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedPaymentMethod === method.id
									? 'border-blue-500 bg-blue-50'
									: 'border-gray-200 hover:border-gray-300'
									}`}
								onClick={() => setSelectedPaymentMethod(method.id)}
							>
								<div className="flex items-center space-x-3 space-x-reverse">
									<div className="text-2xl">{method.icon}</div>
									<div className="flex-1">
										<h3 className="font-iran-yekan-bold text-gray-800">
											{method.name}
										</h3>
										<p className="text-sm text-gray-600">
											{method.description}
										</p>
									</div>
									<div className={`w-5 h-5 rounded-full border-2 ${selectedPaymentMethod === method.id
										? 'border-blue-500 bg-blue-500'
										: 'border-gray-300'
										}`}>
										{selectedPaymentMethod === method.id && (
											<div className="w-full h-full rounded-full bg-white scale-50"></div>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Payment Button */}
			<Card>
				<CardContent className="pt-6">
					<div className="text-center space-y-4">
						<Button
							onClick={handlePayment}
							disabled={!selectedPaymentMethod || isProcessing}
							className={`w-full h-12 text-lg font-iran-yekan-bold ${isProcessing
								? 'bg-gray-400 cursor-not-allowed'
								: 'bg-green-600 hover:bg-green-700'
								}`}
						>
							{isProcessing ? (
								<div className="flex items-center justify-center space-x-2 space-x-reverse">
									<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
									<span>در حال پردازش...</span>
								</div>
							) : (
								`پرداخت ${formatPrice(totalPrice)} تومان`
							)}
						</Button>

						{selectedPaymentMethod && (
							<p className="text-sm text-gray-600">
								با کلیک بر روی دکمه پرداخت، به درگاه پرداخت امن هدایت می‌شوید
							</p>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Security Notice */}
			<Card className="bg-blue-50 border-blue-200">
				<CardContent className="pt-6">
					<div className="text-center space-y-2">
						<div className="text-2xl">🔒</div>
						<h3 className="font-iran-yekan-bold text-blue-800">
							پرداخت امن
						</h3>
						<p className="text-sm text-blue-700">
							تمام تراکنش‌ها با بالاترین استانداردهای امنیتی انجام می‌شود
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
});

PaymentStep.displayName = 'PaymentStep';

export default PaymentStep;
