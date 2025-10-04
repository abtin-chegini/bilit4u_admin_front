import React from 'react';
import Image from 'next/image';

interface SeatLayoutImageProps {
	imageUrl: string;
	alt?: string;
	className?: string;
	width?: number;
	height?: number;
	showBorder?: boolean;
	showCaption?: boolean;
}

const SeatLayoutImage: React.FC<SeatLayoutImageProps> = ({
	imageUrl,
	alt = "Seat Layout",
	className = "",
	width = 400,
	height = 300,
	showBorder = true,
	showCaption = true
}) => {
	return (
		<div className={`flex flex-col items-center ${className}`}>
			<div className={`relative ${showBorder ? 'border border-gray-300 rounded-lg p-2' : ''}`}>
				<Image
					src={imageUrl}
					alt={alt}
					width={width}
					height={height}
					className="object-contain rounded-md"
					priority={false}
					loading="lazy"
				/>
			</div>
			{showCaption && (
				<p className="text-xs text-gray-600 mt-2 font-IranYekanRegular text-center">
					نقشه صندلی‌های رزرو شده
				</p>
			)}
		</div>
	);
};

export default SeatLayoutImage; 