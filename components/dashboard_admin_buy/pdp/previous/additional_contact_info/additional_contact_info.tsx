import { useState, useCallback } from 'react';
import { z } from 'zod';

interface AdditionalContactInfoProps {
	email: string;
	phone: string;
	onEmailChange: (email: string) => void;
	onPhoneChange: (phone: string) => void;
	// Add validation state controlled by parent
	onValidationChange?: (isValid: boolean) => void;
}

// Define Zod schemas outside component
const emailSchema = z.string().trim()
	.refine(email => !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), {
		message: "لطفا یک ایمیل معتبر وارد کنید"
	});

const phoneSchema = z.string().trim()
	.refine(phone => !phone || phone.length === 11, {
		message: "شماره موبایل باید ۱۱ رقم باشد"
	});

export const AdditionalContactInfo: React.FC<AdditionalContactInfoProps> = ({
	email,
	phone,
	onEmailChange,
	onPhoneChange,
	onValidationChange
}) => {
	const [emailError, setEmailError] = useState<string | null>(null);
	const [phoneError, setPhoneError] = useState<string | null>(null);

	// Memoized validation function to prevent recreation on every render
	const validateInput = useCallback(() => {
		let isValid = true;
		let newEmailError: string | null = null;
		let newPhoneError: string | null = null;

		try {
			emailSchema.parse(email);
		} catch (error) {
			if (error instanceof z.ZodError) {
				newEmailError = error.errors[0].message;
				isValid = false;
			}
		}

		try {
			phoneSchema.parse(phone);
		} catch (error) {
			if (error instanceof z.ZodError) {
				newPhoneError = error.errors[0].message;
				isValid = false;
			}
		}

		// Set errors locally
		setEmailError(newEmailError);
		setPhoneError(newPhoneError);

		// Report validation state to parent without causing endless updates
		return isValid;
	}, [email, phone]);

	// Handler for email change
	const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newEmail = e.target.value;
		onEmailChange(newEmail);

		// Don't call validateInput directly here - parent will handle it
	};

	// Handler for phone change
	const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const numericValue = e.target.value.replace(/[^0-9]/g, '');
		onPhoneChange(numericValue);

		// Don't call validateInput directly here - parent will handle it
	};

	// Validate all inputs on blur - this is safe since it only happens on user interaction
	const handleBlur = () => {
		const isValid = validateInput();
		if (onValidationChange) {
			onValidationChange(isValid);
		}
	};

	return (
		<div className="mt-6 p-3 border-t border-gray-300 pt-6">
			<h3 className="text-[15px] font-IranYekanBold text-[#4B5259] mb-4">اطلاعات تماس تکمیلی</h3>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Email Field */}
				<div className="flex flex-col">
					<label className="text-[13px] font-IranYekanRegular text-[#4B5259] mb-2">
						ایمیل
					</label>
					<input
						type="email"
						placeholder="example@domain.com"
						className={`border ${emailError ? 'border-red-500' : 'border-[#D9D9D9]'} px-3 py-2 rounded-md w-full font-IranYekanRegular`}
						value={email}
						onChange={handleEmailChange}
						onBlur={handleBlur}
					/>
					{emailError && (
						<span className="text-red-500 text-[11px] mt-1 font-IranYekanRegular">
							{emailError}
						</span>
					)}
				</div>

				{/* Phone Field */}
				<div className="flex flex-col">
					<label className="text-[13px] font-IranYekanRegular text-[#4B5259] mb-2">
						شماره موبایل
					</label>
					<input
						type="text"
						placeholder="09123456789"
						className={`border ${phoneError ? 'border-red-500' : 'border-[#D9D9D9]'} px-3 py-2 rounded-md w-full font-IranYekanRegular`}
						value={phone}
						onChange={handlePhoneChange}
						maxLength={11}
						inputMode="numeric"
						onBlur={handleBlur}
					/>
					{phoneError && (
						<span className="text-red-500 text-[11px] mt-1 font-IranYekanRegular">
							{phoneError}
						</span>
					)}
				</div>
			</div>

			<p className="text-[12px] text-gray-500 mt-3 font-IranYekanRegular">
				جزئیات بلیط به این شماره موبایل و ایمیل ارسال خواهد شد.
			</p>
		</div>
	);
};