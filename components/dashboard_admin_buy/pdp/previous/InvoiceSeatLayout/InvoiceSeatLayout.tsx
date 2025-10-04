import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface InvoiceSeatLayoutProps {
	imageUrl?: string;
	selectedSeats?: Array<{ seatNo: string | number, state: string }>;
	className?: string;
	showTitle?: boolean;
}

const InvoiceSeatLayout: React.FC<InvoiceSeatLayoutProps> = ({
	imageUrl,
	selectedSeats = [],
	className = "",
	showTitle = true
}) => {
	// If we have an image URL, display it
	if (imageUrl) {
		return (
			<Card className={`${className}`}>
				{showTitle && (
					<CardHeader className="pb-3">
						<CardTitle className="text-lg font-IranYekanBold text-[#0D5990]">
							نقشه صندلی‌های رزرو شده
						</CardTitle>
					</CardHeader>
				)}
				<CardContent>
					<div className="flex justify-center">
						<Image
							src={imageUrl}
							alt="Seat Layout"
							width={400}
							height={300}
							className="object-contain rounded-md border border-gray-200"
							priority={false}
							loading="lazy"
						/>
					</div>
				</CardContent>
			</Card>
		);
	}

	// Fallback: Create a visual representation of selected seats
	if (selectedSeats.length > 0) {
		return (
			<Card className={`${className}`}>
				{showTitle && (
					<CardHeader className="pb-3">
						<CardTitle className="text-lg font-IranYekanBold text-[#0D5990]">
							صندلی‌های رزرو شده
						</CardTitle>
					</CardHeader>
				)}
				<CardContent>
					<div className="flex flex-col items-center">
						{/* Bus representation */}
						<div className="w-full max-w-md bg-gray-100 rounded-lg p-4 mb-4">
							<div className="text-center mb-3">
								<div className="w-8 h-8 mx-auto mb-2">
									<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M4 16V4C4 2.89543 4.89543 2 6 2H18C19.1046 2 20 2.89543 20 4V16C20 17.1046 19.1046 18 18 18H6C4.89543 18 4 17.1046 4 16Z" fill="#CCD6E1" />
										<path d="M2 20H22" stroke="#4B5259" strokeWidth="2" />
									</svg>
								</div>
								<span className="text-xs text-gray-600 font-IranYekanRegular">اتوبوس</span>
							</div>

							{/* Seat grid */}
							<div className="grid grid-cols-4 gap-2">
								{selectedSeats.map((seat, index) => (
									<div
										key={index}
										className="w-8 h-8 bg-[#0D5990] text-white rounded flex items-center justify-center text-xs font-IranYekanBold"
									>
										{String(seat.seatNo)}
									</div>
								))}
							</div>
						</div>

						{/* Seat list */}
						<div className="w-full">
							<h4 className="text-sm font-IranYekanBold text-gray-700 mb-2">لیست صندلی‌ها:</h4>
							<div className="flex flex-wrap gap-2">
								{selectedSeats.map((seat, index) => (
									<span
										key={index}
										className="px-3 py-1 bg-[#0D5990] text-white rounded-full text-xs font-IranYekanBold"
									>
										صندلی {seat.seatNo}
									</span>
								))}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	// No data available
	return (
		<Card className={`${className}`}>
			{showTitle && (
				<CardHeader className="pb-3">
					<CardTitle className="text-lg font-IranYekanBold text-[#0D5990]">
						نقشه صندلی
					</CardTitle>
				</CardHeader>
			)}
			<CardContent>
				<div className="flex flex-col items-center justify-center py-8 text-gray-500">
					<svg className="w-12 h-12 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16V4C4 2.89543 4.89543 2 6 2H18C19.1046 2 20 2.89543 20 4V16C20 17.1046 19.1046 18 18 18H6C4.89543 18 4 17.1046 4 16Z" />
					</svg>
					<p className="text-sm font-IranYekanRegular">اطلاعات صندلی در دسترس نیست</p>
				</div>
			</CardContent>
		</Card>
	);
};

export default InvoiceSeatLayout; 