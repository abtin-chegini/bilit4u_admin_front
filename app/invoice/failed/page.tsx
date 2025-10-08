"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Helper function to convert to Persian digits
function toPersianDigits(num: number | string): string {
	return String(num).replace(/\d/g, (digit) =>
		['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'][parseInt(digit, 10)]
	);
}

export default function InvoiceFailedPage() {
	const router = useRouter();
	const [paymentData, setPaymentData] = useState<any>(null);

	useEffect(() => {
		// Get payment data from sessionStorage
		const storedData = sessionStorage.getItem('paymentData');
		if (storedData) {
			try {
				const data = JSON.parse(storedData);
				setPaymentData(data);
				console.log('❌ Payment data (failed):', data);
			} catch (error) {
				console.error('Error parsing payment data:', error);
			}
		}
	}, []);

	const formatPrice = (price: number | undefined) => {
		const safePrice = price || 0;
		return toPersianDigits(new Intl.NumberFormat('fa-IR').format(safePrice));
	};

	return (
		<div className="min-h-screen py-10 px-4 bg-[#F5F8FB]" dir="rtl">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="max-w-3xl mx-auto"
			>
				{/* Failed Message with Animation */}
				<motion.div
					initial={{ scale: 0.9, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ delay: 0.2, duration: 0.5 }}
					className="mb-8"
				>
					<Card className="shadow-lg border-0 rounded-xl overflow-hidden bg-gradient-to-br from-red-50 to-white">
						<CardContent className="pt-8 pb-8">
							<div className="flex flex-col items-center text-center">
								<motion.div
									initial={{ scale: 0, rotate: -180 }}
									animate={{ scale: 1, rotate: 0 }}
									transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
									className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-md"
								>
									<svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
									</svg>
								</motion.div>
								<h3 className="text-2xl font-IranYekanBold text-red-600 mb-3">پرداخت ناموفق</h3>
								<p className="text-gray-600 text-base font-IranYekanRegular max-w-md">
									متأسفانه پرداخت شما با موفقیت انجام نشد. لطفاً مجدداً تلاش کنید یا با پشتیبانی تماس بگیرید.
								</p>
							</div>
						</CardContent>
					</Card>
				</motion.div>

				{/* Error Details */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3, duration: 0.5 }}
					className="mb-6"
				>
					<Card className="shadow-lg border-0 rounded-xl overflow-hidden">
						<div className="bg-gradient-to-l from-[#D32F2F] to-[#B71C1C] py-5 px-6">
							<div className="flex justify-between items-center">
								<div>
									<h3 className="text-xl font-IranYekanBold text-white">جزئیات خطا</h3>
									<p className="text-sm font-IranYekanRegular text-red-100 mt-1">
										شماره مرجع: {paymentData?.refNum || 'نامشخص'}
									</p>
								</div>
								<Badge className="bg-red-500 hover:bg-red-600 px-3 py-1.5 text-sm font-IranYekanBold">
									پرداخت ناموفق
								</Badge>
							</div>
						</div>

						<CardContent className="p-6">
							<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
								<div className="flex items-start">
									<div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 ml-3 mt-0.5">
										<svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
									</div>
									<div>
										<p className="text-base font-IranYekanBold text-red-700">تراکنش ناموفق</p>
										<p className="text-sm font-IranYekanRegular text-red-600 mt-1">
											{paymentData?.message || 'پرداخت شما با موفقیت انجام نشد. لطفاً مجدداً تلاش کنید.'}
										</p>
									</div>
								</div>
							</div>

							<p className="text-sm font-IranYekanRegular text-gray-600 mb-4">
								چند دلیل احتمالی برای عدم موفقیت پرداخت:
							</p>

							<ul className="list-disc list-inside text-sm font-IranYekanRegular text-gray-600 space-y-2 mr-4">
								<li>موجودی کافی در کیف پول شما وجود ندارد</li>
								<li>صندلی‌های انتخابی توسط کاربر دیگری رزرو شده است</li>
								<li>زمان رزرو منقضی شده است</li>
								<li>مشکل موقتی در سرور وجود دارد</li>
							</ul>
						</CardContent>
					</Card>
				</motion.div>

				{/* Order Summary (if available) */}
				{paymentData?.passengers && paymentData.passengers.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.4, duration: 0.5 }}
						className="mb-6"
					>
						<Card className="shadow-lg border-0 rounded-xl overflow-hidden">
							<div className="bg-gradient-to-l from-gray-600 to-gray-700 py-4 px-6">
								<h3 className="text-lg font-IranYekanBold text-white">خلاصه سفارش</h3>
								<p className="text-sm font-IranYekanRegular text-gray-200 mt-1">
									اطلاعاتی که قصد رزرو داشتید
								</p>
							</div>

							<CardContent className="p-6">
								<div className="space-y-3">
									<div className="flex justify-between py-2 border-b border-gray-200">
										<span className="text-gray-600 font-IranYekanRegular">مسیر:</span>
										<span className="font-IranYekanBold text-gray-800">
											{paymentData?.ticketData?.SrcCityName} به {paymentData?.ticketData?.DesCityName}
										</span>
									</div>
									<div className="flex justify-between py-2 border-b border-gray-200">
										<span className="text-gray-600 font-IranYekanRegular">تعداد مسافران:</span>
										<span className="font-IranYekanBold text-gray-800">
											{toPersianDigits(paymentData.passengers.length)} نفر
										</span>
									</div>
									<div className="flex justify-between py-2 border-b border-gray-200">
										<span className="text-gray-600 font-IranYekanRegular">تاریخ حرکت:</span>
										<span className="font-IranYekanBold text-gray-800">
											{toPersianDigits(paymentData?.ticketData?.DepartDate || '')}
										</span>
									</div>
									<div className="flex justify-between py-2">
										<span className="text-gray-600 font-IranYekanRegular">مبلغ:</span>
										<span className="font-IranYekanBold text-gray-800">
											{formatPrice(paymentData?.totalPrice || 0)} تومان
										</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</motion.div>
				)}

				{/* Action Buttons */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.5, duration: 0.5 }}
					className="flex flex-col-reverse sm:flex-row justify-between gap-4 mt-8"
				>
					<Button
						variant="outline"
						onClick={() => router.push('/dashboard')}
						className="border-[#0D5990] text-[#0D5990] hover:bg-[#E6F0F9] transition-colors flex-1 flex items-center justify-center whitespace-nowrap px-5 py-3 text-base font-IranYekanBold rounded-xl"
					>
						<svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
						</svg>
						<span className="truncate">بازگشت به داشبورد</span>
					</Button>

					<Button
						onClick={() => router.push('/dashboard')}
						className="bg-gradient-to-l from-[#0D5990] to-[#0A436F] hover:from-[#0A436F] hover:to-[#083253] text-white flex-1 flex items-center justify-center px-5 py-3 text-base font-IranYekanBold rounded-xl shadow-md hover:shadow-lg transition-all"
					>
						<svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
						</svg>
						<span>تلاش مجدد</span>
					</Button>
				</motion.div>

				{/* Support Information */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.6, duration: 0.5 }}
					className="mt-8 text-center"
				>
					<p className="text-sm font-IranYekanRegular text-gray-500">
						در صورت بروز مشکل با پشتیبانی تماس بگیرید
					</p>
					<p className="text-sm font-IranYekanBold text-[#0D5990] mt-1">
						شماره پشتیبانی: {toPersianDigits("021-12345678")}
					</p>
				</motion.div>

				{/* Footer Information */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.7, duration: 0.5 }}
					className="mt-8 text-center"
				>
					<p className="text-xs font-IranYekanRegular text-gray-500">
						سامانه <span className="font-IranYekanBold text-[#0D5990]">بلیط فور یو</span>
					</p>
				</motion.div>
			</motion.div>
		</div>
	);
}

