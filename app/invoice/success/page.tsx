"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

// Helper function to convert to Persian digits
function toPersianDigits(num: number | string): string {
	return String(num).replace(/\d/g, (digit) =>
		['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'][parseInt(digit, 10)]
	);
}

export default function InvoiceSuccessPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { toast } = useToast();
	const [paymentData, setPaymentData] = useState<any>(null);

	useEffect(() => {
		// Get payment data from sessionStorage or localStorage
		const storedData = sessionStorage.getItem('paymentData') || localStorage.getItem('lastPaymentData');
		if (storedData) {
			try {
				const data = JSON.parse(storedData);
				setPaymentData(data);
				console.log('✅ Payment data loaded:', data);
			} catch (error) {
				console.error('Error parsing payment data:', error);
			}
		}
	}, []);

	const formatPrice = (price: number | undefined) => {
		const safePrice = price || 0;
		return toPersianDigits(new Intl.NumberFormat('fa-IR').format(safePrice));
	};

	const handlePrintTicket = () => {
		window.print();
		toast({
			title: "چاپ بلیت",
			description: "صفحه چاپ باز شد",
			variant: "default",
		});
	};

	return (
		<div className="min-h-screen py-10 px-4 bg-[#F5F8FB]" dir="rtl">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="max-w-3xl mx-auto"
			>
				{/* Success Message with Animation */}
				<motion.div
					initial={{ scale: 0.9, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ delay: 0.2, duration: 0.5 }}
					className="mb-8"
				>
					<Card className="shadow-lg border-0 rounded-xl overflow-hidden bg-gradient-to-br from-green-50 to-white">
						<CardContent className="pt-8 pb-8">
							<div className="flex flex-col items-center text-center">
								<motion.div
									initial={{ scale: 0, rotate: -180 }}
									animate={{ scale: 1, rotate: 0 }}
									transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
									className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-md"
								>
									<svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
									</svg>
								</motion.div>
								<h3 className="text-2xl font-IranYekanBold text-green-600 mb-3">پرداخت با موفقیت انجام شد</h3>
								<p className="text-gray-600 text-base font-IranYekanRegular max-w-md">
									بلیت شما با موفقیت صادر شد. میتوانید از طریق ایمیل یا پیامک بلیت خود را دریافت کنید.
								</p>
							</div>
						</CardContent>
					</Card>
				</motion.div>

				{/* Order Details */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3, duration: 0.5 }}
					className="mb-6"
				>
					<Card className="shadow-lg border-0 rounded-xl overflow-hidden">
						<div className="bg-gradient-to-l from-[#0D5990] to-[#0A436F] py-5 px-6">
							<div className="flex justify-between items-center">
								<div>
									<h3 className="text-xl font-IranYekanBold text-white">بلیت اتوبوس</h3>
									<p className="text-sm font-IranYekanRegular text-blue-100 mt-1">
										شماره سفارش: {paymentData?.refNum || 'در حال بارگذاری...'}
									</p>
								</div>
								<Badge className="bg-green-500 hover:bg-green-600 px-3 py-1.5 text-sm font-IranYekanBold">
									پرداخت موفق
								</Badge>
							</div>
						</div>

						<CardContent className="p-6">
							{/* Trip Route Visualization */}
							<div className="bg-white p-6 border-b border-gray-100 mb-6">
								<div className="flex justify-between items-center">
									<div className="text-center">
										<div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-2">
											<svg className="w-8 h-8 text-[#0D5990]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
											</svg>
										</div>
										<p className="text-lg font-IranYekanBold text-gray-800">
											{paymentData?.ticketData?.SrcCityName || 'مبدا'}
										</p>
										<p className="text-sm font-IranYekanRegular text-gray-500 mt-1">
											{toPersianDigits(paymentData?.ticketData?.DepartTime || '')}
										</p>
									</div>

									<div className="flex-1 mx-4">
										<div className="relative">
											<div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-[#0D5990] to-[#0D5990] transform -translate-y-1/2"></div>
											<div className="relative flex justify-center">
												<div className="bg-white px-4 py-2 rounded-full border border-[#0D5990] text-[#0D5990] font-IranYekanBold shadow-md">
													<div className="flex items-center space-x-1 space-x-reverse">
														<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
														</svg>
														<span>{paymentData?.ticketData?.BusType || 'اتوبوس'}</span>
													</div>
												</div>
											</div>
										</div>
									</div>

									<div className="text-center">
										<div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-2">
											<svg className="w-8 h-8 text-[#0D5990]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
											</svg>
										</div>
										<p className="text-lg font-IranYekanBold text-gray-800">
											{paymentData?.ticketData?.DesCityName || 'مقصد'}
										</p>
										<p className="text-sm font-IranYekanRegular text-gray-500 mt-1">زمان تخمینی رسیدن</p>
									</div>
								</div>
							</div>

							{/* Trip Details */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
								<div className="space-y-4">
									<div className="flex items-center space-x-3 space-x-reverse">
										<div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
											<svg className="w-5 h-5 text-[#0D5990]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
											</svg>
										</div>
										<div>
											<p className="text-sm font-IranYekanRegular text-gray-500">تاریخ حرکت</p>
											<p className="text-base font-IranYekanBold text-gray-800 mt-0.5">
												{toPersianDigits(paymentData?.ticketData?.DepartDate || '')}
											</p>
										</div>
									</div>

									<div className="flex items-center space-x-3 space-x-reverse">
										<div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
											<svg className="w-5 h-5 text-[#0D5990]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
										</div>
										<div>
											<p className="text-sm font-IranYekanRegular text-gray-500">ساعت حرکت</p>
											<p className="text-base font-IranYekanBold text-gray-800 mt-0.5">
												{toPersianDigits(paymentData?.ticketData?.DepartTime || '')}
											</p>
										</div>
									</div>
								</div>

								<div className="space-y-4">
									<div className="flex items-center space-x-3 space-x-reverse">
										<div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
											<svg className="w-5 h-5 text-[#0D5990]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
											</svg>
										</div>
										<div>
											<p className="text-sm font-IranYekanRegular text-gray-500">شرکت اتوبوسرانی</p>
											<p className="text-base font-IranYekanBold text-gray-800 mt-0.5">
												{paymentData?.ticketData?.CoName || ''}
											</p>
										</div>
									</div>

									<div className="flex items-center space-x-3 space-x-reverse">
										<div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
											<svg className="w-5 h-5 text-[#0D5990]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
											</svg>
										</div>
										<div>
											<p className="text-sm font-IranYekanRegular text-gray-500">مبلغ پرداخت شده</p>
											<p className="text-base font-IranYekanBold text-green-600 mt-0.5">
												{formatPrice(paymentData?.totalPrice || 0)} تومان
											</p>
										</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</motion.div>

				{/* Passenger Details */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4, duration: 0.5 }}
					className="mb-6"
				>
					<Card className="shadow-lg border-0 rounded-xl overflow-hidden">
						<div className="bg-gradient-to-l from-[#0D5990] to-[#0A436F] py-4 px-6">
							<h3 className="text-lg font-IranYekanBold text-white">اطلاعات مسافران</h3>
							<p className="text-sm font-IranYekanRegular text-blue-100 mt-1">
								تعداد مسافران: {toPersianDigits(paymentData?.passengers?.length || 0)} نفر
							</p>
						</div>

						<CardContent className="p-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{paymentData?.passengers?.map((passenger: any, index: number) => (
									<div key={index} className="bg-white p-4 rounded-xl shadow border border-gray-100 hover:shadow-md transition-shadow">
										<div className="flex items-center mb-3">
											<div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 ml-3">
												<svg className="w-5 h-5 text-[#0D5990]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
												</svg>
											</div>
											<div>
												<p className="text-base font-IranYekanBold text-gray-800">
													{passenger.name} {passenger.family}
												</p>
												<p className="text-xs font-IranYekanRegular text-gray-500">
													مسافر {toPersianDigits(index + 1)}
												</p>
											</div>
											<div className="mr-auto">
												<div className="bg-blue-50 px-3 py-1 rounded-full">
													<p className="text-xs font-IranYekanBold text-[#0D5990]">
														صندلی {toPersianDigits(passenger.seatNo)}
													</p>
												</div>
											</div>
										</div>

										<div className="space-y-2">
											<div className="bg-gray-50 rounded-lg p-3">
												<div className="flex justify-between items-center">
													<span className="text-xs font-IranYekanRegular text-gray-500">کد ملی:</span>
													<span className="text-sm font-IranYekanBold text-gray-700 font-mono">
														{toPersianDigits(passenger.nationalId)}
													</span>
												</div>
											</div>
											<div className="bg-gray-50 rounded-lg p-3">
												<div className="flex justify-between items-center">
													<span className="text-xs font-IranYekanRegular text-gray-500">تاریخ تولد:</span>
													<span className="text-sm font-IranYekanBold text-gray-700">
														{toPersianDigits(passenger.birthDate || '-')}
													</span>
												</div>
											</div>
											<div className="bg-gray-50 rounded-lg p-3">
												<div className="flex justify-between items-center">
													<span className="text-xs font-IranYekanRegular text-gray-500">جنسیت:</span>
													<span className={`text-sm font-IranYekanBold ${passenger.gender === 2 ? 'text-blue-600' : 'text-pink-600'}`}>
														{passenger.gender === 2 ? 'مرد' : 'زن'}
													</span>
												</div>
											</div>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</motion.div>

				{/* Payment Details */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.5, duration: 0.5 }}
					className="mb-6"
				>
					<Card className="shadow-lg border-0 rounded-xl overflow-hidden">
						<div className="bg-gradient-to-l from-[#0D5990] to-[#0A436F] py-4 px-6">
							<h3 className="text-lg font-IranYekanBold text-white">جزئیات پرداخت</h3>
							<p className="text-sm font-IranYekanRegular text-blue-100 mt-1">
								اطلاعات تراکنش
							</p>
						</div>

						<CardContent className="p-6">
							<div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-6">
								<div className="flex items-center">
									<div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 ml-3">
										<svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
									</div>
									<div>
										<p className="text-base font-IranYekanBold text-green-700">تراکنش موفق</p>
										<p className="text-sm font-IranYekanRegular text-green-600">
											{paymentData?.message || 'پرداخت شما با موفقیت انجام شد'}
										</p>
									</div>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="bg-white p-4 rounded-lg border border-gray-100">
									<p className="text-xs font-IranYekanRegular text-gray-500 mb-1">شماره پیگیری</p>
									<p className="text-base font-IranYekanBold text-gray-800">
										{paymentData?.refNum || '-'}
									</p>
								</div>

								<div className="bg-white p-4 rounded-lg border border-gray-100">
									<p className="text-xs font-IranYekanRegular text-gray-500 mb-1">تعداد مسافران</p>
									<p className="text-base font-IranYekanBold text-gray-800">
										{toPersianDigits(paymentData?.passengers?.length || 0)} نفر
									</p>
								</div>

								<div className="bg-white p-4 rounded-lg border border-gray-100">
									<p className="text-xs font-IranYekanRegular text-gray-500 mb-1">مبلغ کل</p>
									<p className="text-base font-IranYekanBold text-green-600">
										{formatPrice(paymentData?.totalPrice || 0)} تومان
									</p>
								</div>

								<div className="bg-white p-4 rounded-lg border border-gray-100">
									<p className="text-xs font-IranYekanRegular text-gray-500 mb-1">روش پرداخت</p>
									<p className="text-base font-IranYekanBold text-gray-800">کیف پول</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</motion.div>

				{/* Action Buttons */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.6, duration: 0.5 }}
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
						onClick={handlePrintTicket}
						className="bg-gradient-to-l from-[#0D5990] to-[#0A436F] hover:from-[#0A436F] hover:to-[#083253] text-white flex-1 flex items-center justify-center px-5 py-3 text-base font-IranYekanBold rounded-xl shadow-md hover:shadow-lg transition-all"
					>
						<svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
						</svg>
						<span>چاپ بلیت</span>
					</Button>
				</motion.div>

				{/* Footer Information */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.7, duration: 0.5 }}
					className="mt-8 text-center"
				>
					<p className="text-xs font-IranYekanRegular text-gray-500">
						این بلیت توسط سامانه <span className="font-IranYekanBold text-[#0D5990]">بلیط فور یو</span> صادر شده است
					</p>
					<p className="text-xs font-IranYekanRegular text-gray-400 mt-1">
						شماره پشتیبانی: {toPersianDigits("021-12345678")}
					</p>
				</motion.div>
			</motion.div>
		</div>
	);
}

