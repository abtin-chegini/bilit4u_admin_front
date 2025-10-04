"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DemoTicketPage() {
	const router = useRouter();

	const handleTestTicketFlow = () => {
		// Navigate to a test ticket route
		router.push('/ticket/demo-token-123/demo-service-456');
	};

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
			<Card className="w-full max-w-2xl">
				<CardHeader>
					<CardTitle className="text-center text-xl font-iran-yekan-bold">
						تست سیستم رزرو بلیط با استپر
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="text-center space-y-4">
						<p className="text-gray-600">
							این صفحه برای تست اتصال دکمه "خرید بلیط" از PLP به سیستم جدید استپر است.
						</p>

						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<h3 className="font-iran-yekan-bold text-blue-800 mb-2">
								نحوه کارکرد:
							</h3>
							<ol className="text-sm text-blue-700 space-y-1 text-right">
								<li>1. کاربر در صفحه PLP روی دکمه "خرید بلیط" کلیک می‌کند</li>
								<li>2. سیستم به مسیر `/ticket/[token]/[ticketId]` هدایت می‌شود</li>
								<li>3. سیستم جدید استپر با 5 مرحله بارگذاری می‌شود</li>
								<li>4. کاربر مراحل رزرو را تکمیل می‌کند</li>
							</ol>
						</div>

						<div className="bg-green-50 border border-green-200 rounded-lg p-4">
							<h3 className="font-iran-yekan-bold text-green-800 mb-2">
								مراحل استپر:
							</h3>
							<ol className="text-sm text-green-700 space-y-1 text-right">
								<li>1. انتخاب صندلی</li>
								<li>2. مشخصات مسافران</li>
								<li>3. تأیید اطلاعات</li>
								<li>4. پرداخت</li>
								<li>5. صدور بلیط</li>
							</ol>
						</div>

						<Button
							onClick={handleTestTicketFlow}
							className="w-full bg-blue-600 hover:bg-blue-700 font-iran-yekan-bold"
						>
							تست سیستم رزرو بلیط
						</Button>

						<p className="text-xs text-gray-500 text-center">
							این دکمه شما را به سیستم جدید استپر هدایت می‌کند
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
