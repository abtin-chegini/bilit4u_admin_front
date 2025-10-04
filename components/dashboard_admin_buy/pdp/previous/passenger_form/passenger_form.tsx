import { useEffect, useState } from 'react';
import { z } from 'zod';
import { UserIcon } from 'lucide-react';

export function toPersianDigits(num: number | string): string {
	return num.toString().replace(/\d/g, (digit) =>
		"۰۱۲۳۴۵۶۷۸۹"[parseInt(digit, 10)]
	);
}

const isPersianKeyboardInput = (input: string): boolean => {
	// Persian characters range from U+0600 to U+06FF
	const persianCharRegex = /[\u0600-\u06FF]/;
	return persianCharRegex.test(input);
};

const formatBirthDateParts = (storedDate: string): { year: string, month: string, day: string } => {
	if (!storedDate || storedDate.length !== 8) {
		return { year: '', month: '', day: '' };
	}

	try {
		// Extract from YYYYMMDD format
		return {
			year: storedDate.substring(0, 4),
			month: storedDate.substring(4, 6),
			day: storedDate.substring(6, 8)
		};
	} catch (error) {
		console.error("Error parsing birth date:", error, storedDate);
		return { year: '', month: '', day: '' };
	}
};

// Format date parts into YYYYMMDD format
const formatDateForStorage = (year: string, month: string, day: string): string => {
	if (!year && !month && !day) return '';

	// Default empty values to ensure valid format
	const formattedYear = year || '';
	const formattedMonth = month || '';
	const formattedDay = day || '';

	// Only return a value if at least one part is specified
	if (formattedYear || formattedMonth || formattedDay) {
		return `${formattedYear}${formattedMonth}${formattedDay}`;
	}

	return '';
};

// Zod validation schemas
const nationalCodeSchema = z
	.string()
	.trim()
	// First check if there's Persian characters
	.refine((val) => !isPersianKeyboardInput(val), {
		message: "زبان کیبورد شما فارسی است. لطفا آن را تغییر دهید"
	})
	// Check if it's exactly 10 digits
	.refine((val) => /^\d{10}$/.test(val), {
		message: "کد ملی باید دقیقا ۱۰ رقم باشد و فقط شامل اعداد باشد"
	})
	// Apply the Iranian national ID validation algorithm
	.refine((val) => {
		// Check if all digits are the same (not valid)
		if (/^(\d)\1{9}$/.test(val)) return false;

		// Use the provided checkCodeMeli function for validation
		return checkCodeMeli(val);
	}, {
		message: "کد ملی وارد شده معتبر نیست"
	});

// Helper function to validate Iranian national ID
function checkCodeMeli(code: string): boolean {
	var L = code.length;

	if (L < 8 || parseInt(code, 10) == 0) return false;
	code = ('0000' + code).substr(L + 4 - 10);
	if (parseInt(code.substr(3, 6), 10) == 0) return false;
	var c = parseInt(code.substr(9, 1), 10);
	var s = 0;
	for (var i = 0; i < 9; i++)
		s += parseInt(code.substr(i, 1), 10) * (10 - i);
	s = s % 11;
	return (s < 2 && c == s) || (s >= 2 && c == (11 - s));
}

const nameSchema = z
	.string()
	.trim()
	.min(1, "نام نمی‌تواند خالی باشد")
	.max(14, "نام نمی‌تواند بیش از ۱۴ کاراکتر باشد")
	.refine((val) => /^[\u0600-\u06FF\s]+$/.test(val), {
		message: "نام باید به فارسی باشد"
	});

const familyNameSchema = z
	.string()
	.trim()
	.min(1, "نام خانوادگی نمی‌تواند خالی باشد")
	.max(14, "نام خانوادگی نمی‌تواند بیش از ۱۴ کاراکتر باشد")
	.refine((val) => /^[\u0600-\u06FF\s]+$/.test(val), {
		message: "نام خانوادگی باید به فارسی باشد"
	});

// This is the updated interface to add to your passenger_form.tsx
interface PassengerFormProps {
	seatId: number;
	seatNo?: string | number;
	gender: "female" | "male";
	name: string;
	family: string;
	nationalId: string;
	phone: string;
	onRemove: (seatId: number) => void;
	onChange: (seatId: number, field: string, value: string) => void;
	isLastPassenger: boolean;
	onCheckboxChange: (checked: boolean) => void;
	showAdditionalContact: boolean;
	onGenderChange: (seatId: number, gender: "male" | "female") => void;
	// New prop to handle individual seat's previous passenger selection
	onPrevPassengerClick?: () => void;
	validationErrors?: {
		name?: string;
		family?: string;
		nationalId?: string;
		phone?: string;
	};
}

export const PassengerForm: React.FC<PassengerFormProps> = ({
	seatId,
	seatNo,
	gender,
	name,
	family,
	nationalId,
	phone,
	onRemove,
	onChange,
	onCheckboxChange,
	showAdditionalContact,
	isLastPassenger,
	onGenderChange,
	onPrevPassengerClick,
	validationErrors,
}) => {
	// Local state to track gender selection for UI consistency
	const [localGender, setLocalGender] = useState<"male" | "female">(gender);

	// Validation error states
	const [nameError, setNameError] = useState<string | null>(null);
	const [familyError, setFamilyError] = useState<string | null>(null);
	const [nationalIdError, setNationalIdError] = useState<string | null>(null);

	// Log date parts for debugging
	useEffect(() => {
		// Wait for next render cycle to ensure DOM elements exist
		const timer = setTimeout(() => {
			try {
				const daySelect = document.getElementById(`day-${seatId}`) as HTMLSelectElement;
				const monthSelect = document.getElementById(`month-${seatId}`) as HTMLSelectElement;
				const yearSelect = document.getElementById(`year-${seatId}`) as HTMLSelectElement;

				if (phone && phone.trim()) {
					// Extract date parts
					const parts = formatBirthDateParts(phone);

					// Set values directly on the DOM elements
					if (daySelect && parts.day) daySelect.value = parts.day;
					if (monthSelect && parts.month) monthSelect.value = parts.month;
					if (yearSelect && parts.year) yearSelect.value = parts.year;
				} else {
					// Reset dropdown values for new passengers
					if (daySelect) daySelect.value = '';
					if (monthSelect) monthSelect.value = '';
					if (yearSelect) yearSelect.value = '';
				}
			} catch (err) {
				console.error("Error setting date values:", err);
			}
		}, 0);

		return () => clearTimeout(timer);
	}, [phone, seatId]);
	// Keep local state in sync with props
	useEffect(() => {
		setLocalGender(gender);
	}, [gender]);


	// Handle passenger removal
	const handleRemove = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		console.log('PassengerForm: Removing passenger for seat', seatId);
		onRemove(seatId);
	};

	// Handle previous passenger selection
	const handlePrevPassengerClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (onPrevPassengerClick) {
			onPrevPassengerClick();
		}
	};

	// Handle date changes with better error handling
	// Update your handleDateChange function to be more robust
	const handleDateChange = (part: 'year' | 'month' | 'day', value: string) => {
		console.log(`Changing ${part} for seat ${seatId} to ${value}`);

		// Use empty strings as defaults (not undefined) for missing parts
		let currentParts = { day: '', month: '', year: '' };

		// Only try to parse existing phone if it's a valid string
		if (phone && phone.trim()) {
			try {
				currentParts = formatBirthDateParts(phone);
			} catch (e) {
				console.error("Error parsing existing date:", e);
				// Keep default empty strings if parsing fails
			}
		}

		// Update the specific part with the new value
		if (part === 'day') currentParts.day = value.padStart(2, '0');
		if (part === 'month') currentParts.month = value.padStart(2, '0');
		if (part === 'year') currentParts.year = value;

		// Form the new date string
		const formattedDate = formatDateForStorage(
			currentParts.year,
			currentParts.month,
			currentParts.day
		);

		console.log(`New formatted date: ${formattedDate}`);

		// Always update the parent component, even if empty
		onChange(seatId, "phone", formattedDate);
	};

	// Handle gender change
	const handleGenderChange = (newGender: "male" | "female") => {
		// Update local state immediately for visual feedback
		setLocalGender(newGender);
		// Notify parent component
		onGenderChange(seatId, newGender);
	};

	// Validate and update name
	const handleNameChange = (value: string) => {
		try {
			nameSchema.parse(value);
			setNameError(null);
		} catch (error) {
			if (error instanceof z.ZodError) {
				setNameError(error.errors[0].message);
			}
		}
		onChange(seatId, "name", value);
	};

	// Validate and update family name
	const handleFamilyChange = (value: string) => {
		try {
			familyNameSchema.parse(value);
			setFamilyError(null);
		} catch (error) {
			if (error instanceof z.ZodError) {
				setFamilyError(error.errors[0].message);
			}
		}
		onChange(seatId, "family", value);
	};

	// Validate and update national ID
	const handleNationalIdChange = (value: string) => {
		// Filter out non-numeric characters if keyboard is not Persian
		const processedValue = isPersianKeyboardInput(value) ? value : value.replace(/[^0-9]/g, '');

		try {
			// This will check for Persian first, then numeric pattern
			nationalCodeSchema.parse(processedValue);
			setNationalIdError(null);
		} catch (error) {
			if (error instanceof z.ZodError) {
				setNationalIdError(error.errors[0].message);
			}
		}

		// Only update the value with numeric filter if not Persian
		if (!isPersianKeyboardInput(value)) {
			onChange(seatId, "nationalId", processedValue);
		}
	};

	// Display seatNo if available, otherwise fall back to seatId
	const displaySeatNumber = seatNo !== undefined ? seatNo : seatId;

	return (
		<div>
			<div className="p-3">
				{/* Mobile Layout Only */}
				<div className="block md:hidden mb-6">
					{/* First row: Seat number and delete button */}
					<div className="flex items-center justify-between w-full">
						<div className="text-[15px] font-IranYekanRegular text-[#4B5259]">
							صندلی شماره {toPersianDigits(displaySeatNumber)}
						</div>

						<div
							className="flex cursor-pointer"
							onClick={handleRemove}
						>
							<span>
								<svg width="14" height="18" viewBox="0 0 14 18" fill="none">
									<path
										fillRule="evenodd"
										clipRule="evenodd"
										d="M1 16C1 17.1 1.9 18 3 18H11C12.1 18 13 17.1 13 16V4H1V16ZM11 6H3V16H11V6Z"
										fill="#4B5259"
									/>
									<path
										d="M10.5 1L9.5 0H4.5L3.5 1H0V3H14V1H10.5Z"
										fill="#4B5259"
									/>
								</svg>
							</span>
							<span className="mr-1 text-[11px] text-[#4B5259] font-IranYekanBold">
								حذف مسافر
							</span>
						</div>
					</div>

					{/* Add Previous Passenger Button for Mobile */}
					{onPrevPassengerClick && (
						<div
							className="flex items-center justify-center w-full mt-3 cursor-pointer bg-[#F0F7FF] text-[#0D5990] py-2 px-3 rounded-md border border-[#DEE9F6]"
							onClick={handlePrevPassengerClick}
						>
							<UserIcon className="h-4 w-4 ml-1" />
							<span className="text-[12px] font-IranYekanRegular">انتخاب از مسافران قبلی</span>
						</div>
					)}

					{/* Second row: Mobile-optimized gender selection */}
					<div className="flex gap-4 mt-3">
						{/* Female option - Large touch-friendly button */}
						<div className="flex-1">
							<input
								id={`female-${seatId}`}
								type="radio"
								name={`gender-${seatId}`}
								checked={localGender === "female"}
								onChange={() => handleGenderChange("female")}
								className="sr-only" // Hide actual radio but keep accessible
							/>
							<label
								htmlFor={`female-${seatId}`}
								className={`flex items-center justify-center gap-2 cursor-pointer py-2 px-3 rounded-md w-full ${localGender === "female"
									? 'bg-[#F0F7FF] border border-[#0D5990] text-[#0D5990]'
									: 'bg-white border border-gray-300'
									}`}
							>
								<div className={`w-4 h-4 rounded-full border flex items-center justify-center ${localGender === "female" ? 'border-[#0D5990]' : 'border-gray-400'
									}`}>
									{localGender === "female" && (
										<div className="w-2 h-2 rounded-full bg-[#0D5990]"></div>
									)}
								</div>
								<span className="font-IranYekanRegular text-[13px]">خانم</span>
							</label>
						</div>

						{/* Male option - Large touch-friendly button */}
						<div className="flex-1">
							<input
								id={`male-${seatId}`}
								type="radio"
								name={`gender-${seatId}`}
								checked={localGender === "male"}
								onChange={() => handleGenderChange("male")}
								className="sr-only" // Hide actual radio but keep accessible
							/>
							<label
								htmlFor={`male-${seatId}`}
								className={`flex items-center justify-center gap-2 cursor-pointer py-2 px-3 rounded-md w-full ${localGender === "male"
									? 'bg-[#F0F7FF] border border-[#0D5990] text-[#0D5990]'
									: 'bg-white border border-gray-300'
									}`}
							>
								<div className={`w-4 h-4 rounded-full border flex items-center justify-center ${localGender === "male" ? 'border-[#0D5990]' : 'border-gray-400'
									}`}>
									{localGender === "male" && (
										<div className="w-2 h-2 rounded-full bg-[#0D5990]"></div>
									)}
								</div>
								<span className="font-IranYekanBold text-[13px]">آقا</span>
							</label>
						</div>
					</div>
				</div>

				{/* Desktop Layout Only */}
				<div className="hidden md:block mb-6">
					<div className="flex justify-between items-center">
						<div className="flex items-center gap-12">
							<div className="text-[15px] font-IranYekanRegular text-[#4B5259]">
								صندلی شماره {toPersianDigits(displaySeatNumber)}
							</div>

							{/* Desktop gender selection */}
							<div className="flex gap-8">
								<label className="flex items-center gap-2 cursor-pointer">
									<input
										type="radio"
										name={`gender-${seatId}`}
										checked={localGender === "female"}
										onChange={() => handleGenderChange("female")}
										className="w-4 h-4 accent-[#0D5990] cursor-pointer"
									/>
									<span className="font-IranYekanRegular text-[12px]">خانم</span>
								</label>

								<label className="flex items-center gap-2 cursor-pointer">
									<input
										type="radio"
										name={`gender-${seatId}`}
										checked={localGender === "male"}
										onChange={() => handleGenderChange("male")}
										className="w-4 h-4 accent-[#0D5990] cursor-pointer"
									/>
									<span className="font-IranYekanBold text-[12px]">آقا</span>
								</label>
							</div>
						</div>

						<div className="flex items-center gap-3">
							{/* Previous Passengers Button - Desktop */}
							{onPrevPassengerClick && (
								<div
									className="flex items-center cursor-pointer bg-[#F0F7FF] text-[#0D5990] py-1.5 px-3 rounded-md border border-[#DEE9F6] hover:bg-[#E1EFFF] transition-colors"
									onClick={handlePrevPassengerClick}
								>
									<UserIcon className="h-3.5 w-3.5 ml-1" />
									<span className="text-[11px] lg:text-[12px] font-IranYekanRegular">انتخاب از مسافران قبلی</span>
								</div>
							)}

							{/* Delete Button */}
							<div
								className="flex items-center cursor-pointer"
								onClick={handleRemove}
							>
								<span>
									<svg width="14" height="18" viewBox="0 0 14 18" fill="none">
										<path
											fillRule="evenodd"
											clipRule="evenodd"
											d="M1 16C1 17.1 1.9 18 3 18H11C12.1 18 13 17.1 13 16V4H1V16ZM11 6H3V16H11V6Z"
											fill="#4B5259"
										/>
										<path
											d="M10.5 1L9.5 0H4.5L3.5 1H0V3H14V1H10.5Z"
											fill="#4B5259"
										/>
									</svg>
								</span>
								<span className="mr-1 text-[11px] lg:text-[13px] text-[#4B5259] font-IranYekanBold">
									حذف مسافر
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Form inputs with labels above */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-8">
					{/* Name field with improved error design */}
					<div className="flex flex-col">
						<label className="text-[13px] font-IranYekanRegular text-[#4B5259] mb-2">
							نام
						</label>
						<input
							type="text"
							placeholder="نام"
							className={`border ${nameError ? 'border-red-500' : 'border-[#D9D9D9]'} px-3 py-2 rounded-md w-full font-IranYekanRegular`}
							value={name}
							onChange={(e) => handleNameChange(e.target.value)}
							maxLength={14}
							autoComplete="name"
							name={`passenger-${seatId}-name`}
							id={`passenger-${seatId}-name`}
						/>
						{nameError && (
							<div className="mt-1 rounded-md">
								<div className="flex items-start gap-1.5 bg-red-50 p-1.5 border border-red-200 rounded-md">
									<svg className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
										<path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
										<path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
									</svg>
									<span className="text-[11px] text-red-800 font-IranYekanRegular">
										{nameError}
									</span>
								</div>
							</div>
						)}
					</div>

					{/* Family field with improved error design */}
					<div className="flex flex-col">
						<label className="text-[13px] font-IranYekanRegular text-[#4B5259] mb-2">
							نام خانوادگی
						</label>
						<input
							type="text"
							placeholder="نام خانوادگی"
							className={`border ${familyError ? 'border-red-500' : 'border-[#D9D9D9]'} px-3 py-2 rounded-md w-full font-IranYekanRegular`}
							value={family}
							onChange={(e) => handleFamilyChange(e.target.value)}
							maxLength={14}
							autoComplete="family-name"
							name={`passenger-${seatId}-family`}
							id={`passenger-${seatId}-family`}
						/>
						{familyError && (
							<div className="mt-1 rounded-md">
								<div className="flex items-start gap-1.5 bg-red-50 p-1.5 border border-red-200 rounded-md">
									<svg className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
										<path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
										<path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
									</svg>
									<span className="text-[11px] text-red-800 font-IranYekanRegular">
										{familyError}
									</span>
								</div>
							</div>
						)}
					</div>

					{/* National ID field */}
					<div className="flex flex-col">
						<label className="text-[13px] font-IranYekanRegular text-[#4B5259] mb-2">
							کد ملی
						</label>
						<input
							type="text"
							placeholder="کد ملی"
							className={`border ${nationalIdError || validationErrors?.nationalId ? 'border-red-500' : 'border-[#D9D9D9]'} px-3 py-2 rounded-md w-full font-IranYekanRegular`}
							value={nationalId}
							onChange={(e) => handleNationalIdChange(e.target.value)}
							maxLength={10}
							inputMode="numeric"
							autoComplete="off"
							name={`passenger-${seatId}-nationalId`}
							id={`passenger-${seatId}-nationalId`}
						/>
						{/* Display Zod validation errors */}
						{nationalIdError && (
							<div className="mt-1 rounded-md">
								{nationalIdError.includes("زبان کیبورد") ? (
									<div className="flex items-start gap-1.5 bg-amber-50 p-1.5 border border-amber-200 rounded-md">
										<svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M12 9V11M12 15H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0378 2.66667 10.268 4L3.33978 16C2.56998 17.3333 3.53219 19 5.07183 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
										</svg>
										<span className="text-[11px] text-amber-800 font-IranYekanRegular">
											{nationalIdError}
										</span>
									</div>
								) : (
									<div className="flex items-start gap-1.5 bg-red-50 p-1.5 border border-red-200 rounded-md">
										<svg className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
											<path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
											<path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
										</svg>
										<span className="text-[11px] text-red-800 font-IranYekanRegular">
											{nationalIdError}
										</span>
									</div>
								)}
							</div>
						)}

						{/* Display duplicate national ID error from validation errors prop */}
						{!nationalIdError && validationErrors?.nationalId && (
							<div className="mt-1 rounded-md">
								<div className="flex items-start gap-1.5 bg-amber-50 p-1.5 border border-amber-200 rounded-md">
									<svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M12 9V11M12 15H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0378 2.66667 10.268 4L3.33978 16C2.56998 17.3333 3.53219 19 5.07183 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
									</svg>
									<span className="text-[11px] text-amber-800 font-IranYekanRegular">
										{validationErrors.nationalId}
									</span>
								</div>
							</div>
						)}
					</div>
					{/* Date of Birth fields */}
					<div className="flex flex-col">
						<label className="text-[13px] font-IranYekanRegular text-[#4B5259] mb-2">
							تاریخ تولد
						</label>
						<div className="flex gap-2">
							{/* Day - UNCONTROLLED */}
							<select
								className="border border-[#D9D9D9] px-2 py-2 rounded-md w-1/4 font-IranYekanRegular"
								defaultValue=""
								onChange={(e) => {
									// Direct manipulation without state
									const selectedDay = e.target.value;
									console.log(`Selected day: ${selectedDay}`);
									const currentMonth = (document.getElementById(`month-${seatId}`) as HTMLSelectElement)?.value || '';
									const currentYear = (document.getElementById(`year-${seatId}`) as HTMLSelectElement)?.value || '';
									const newDate = `${currentYear}${currentMonth}${selectedDay.padStart(2, '0')}`;
									if (currentYear || currentMonth || selectedDay) {
										onChange(seatId, "phone", newDate);
									}
								}}
								id={`day-${seatId}`}
							>
								<option value="">روز</option>
								{Array.from({ length: 31 }, (_, i) => {
									const day = (i + 1).toString().padStart(2, '0');
									return (
										<option key={i} value={day}>
											{toPersianDigits(i + 1)}
										</option>
									);
								})}
							</select>

							{/* Month - UNCONTROLLED */}
							<select
								className="border border-[#D9D9D9] px-2 py-2 rounded-md w-2/5 font-IranYekanRegular"
								defaultValue=""
								onChange={(e) => {
									// Direct manipulation without state
									const selectedMonth = e.target.value;
									console.log(`Selected month: ${selectedMonth}`);
									const currentDay = (document.getElementById(`day-${seatId}`) as HTMLSelectElement)?.value || '';
									const currentYear = (document.getElementById(`year-${seatId}`) as HTMLSelectElement)?.value || '';
									const newDate = `${currentYear}${selectedMonth}${currentDay}`;
									if (currentYear || selectedMonth || currentDay) {
										onChange(seatId, "phone", newDate);
									}
								}}
								id={`month-${seatId}`}
							>
								<option value="">ماه</option>
								<option value="01">فروردین</option>
								<option value="02">اردیبهشت</option>
								<option value="03">خرداد</option>
								<option value="04">تیر</option>
								<option value="05">مرداد</option>
								<option value="06">شهریور</option>
								<option value="07">مهر</option>
								<option value="08">آبان</option>
								<option value="09">آذر</option>
								<option value="10">دی</option>
								<option value="11">بهمن</option>
								<option value="12">اسفند</option>
							</select>

							{/* Year - UNCONTROLLED */}
							<select
								className="border border-[#D9D9D9] px-2 py-2 rounded-md w-1/3 font-IranYekanRegular"
								defaultValue=""
								onChange={(e) => {
									// Direct manipulation without state
									const selectedYear = e.target.value;
									console.log(`Selected year: ${selectedYear}`);
									const currentDay = (document.getElementById(`day-${seatId}`) as HTMLSelectElement)?.value || '';
									const currentMonth = (document.getElementById(`month-${seatId}`) as HTMLSelectElement)?.value || '';
									const newDate = `${selectedYear}${currentMonth}${currentDay}`;
									if (selectedYear || currentMonth || currentDay) {
										onChange(seatId, "phone", newDate);
									}
								}}
								id={`year-${seatId}`}
							>
								<option value="">سال</option>
								{Array.from({ length: 105 }, (_, i) => {
									const year = (1404 - i).toString();
									return (
										<option key={i} value={year}>
											{toPersianDigits(year)}
										</option>
									);
								})}
							</select>
						</div>
					</div>
				</div>
			</div>

			{/* Additional contact info checkbox for last passenger */}
			{isLastPassenger && (
				<div className="mt-6 mb-2 px-0 md:px-3">
					<label className="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							checked={showAdditionalContact}
							onChange={(e) => onCheckboxChange(e.target.checked)}
							className="w-4 h-4 accent-[#0D5990] cursor-pointer"
						/>
						<span className="text-sm text-[#494949] font-IranYekanRegular">
							مایل هستم بلیط برای ایمیل یا شماره تلفن دیگری ارسال شود
						</span>
					</label>
				</div>
			)}
		</div>
		
	);
}