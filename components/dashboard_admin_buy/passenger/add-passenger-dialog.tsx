"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { User, Phone, CreditCard, Users, CheckCircle2, AlertCircle, Calendar, ChevronDown } from "lucide-react"
import { z } from "zod"

// Helper functions from passenger_form
export function toPersianDigits(num: number | string): string {
	return num.toString().replace(/\d/g, (digit) =>
		"۰۱۲۳۴۵۶۷۸۹"[parseInt(digit, 10)]
	);
}

const isPersianKeyboardInput = (input: string): boolean => {
	const persianCharRegex = /[\u0600-\u06FF]/;
	return persianCharRegex.test(input);
};

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

// Zod validation schemas - exact same as passenger_form
const nationalCodeSchema = z
	.string()
	.trim()
	.refine((val) => !isPersianKeyboardInput(val), {
		message: "زبان کیبورد شما فارسی است. لطفا آن را تغییر دهید"
	})
	.refine((val) => /^\d{10}$/.test(val), {
		message: "کد ملی باید دقیقا ۱۰ رقم باشد و فقط شامل اعداد باشد"
	})
	.refine((val) => {
		if (/^(\d)\1{9}$/.test(val)) return false;
		return checkCodeMeli(val);
	}, {
		message: "کد ملی وارد شده معتبر نیست"
	});

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

const phoneSchema = z
	.string()
	.trim()
	.min(11, "شماره موبایل باید ۱۱ رقم باشد")
	.max(11, "شماره موبایل باید ۱۱ رقم باشد")
	.refine((val) => /^09\d{9}$/.test(val), {
		message: "شماره موبایل معتبر نیست (باید با ۰۹ شروع شود)"
	});

interface Passenger {
	id: number
	name: string
	family: string
	nationalId: string
	phone: string
	status: string
	gender: string
	dateOfBirth?: string
}

interface AddPassengerDialogProps {
	isOpen: boolean
	onClose: () => void
	onAddPassenger: (passenger: Omit<Passenger, 'id'>) => void
	editPassenger?: Passenger | null
	onEditPassenger?: (passenger: Passenger) => void
}

interface FormData {
	name: string
	family: string
	nationalId: string
	phone: string
	gender: string
	birthYear: string
	birthMonth: string
	birthDay: string
}

export function AddPassengerDialog({ isOpen, onClose, onAddPassenger, editPassenger, onEditPassenger }: AddPassengerDialogProps) {
	const [formData, setFormData] = useState<FormData>({
		name: '',
		family: '',
		nationalId: '',
		phone: '',
		gender: '',
		birthYear: '',
		birthMonth: '',
		birthDay: ''
	})

	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [yearOpen, setYearOpen] = useState(false)
	const [monthOpen, setMonthOpen] = useState(false)
	const [dayOpen, setDayOpen] = useState(false)

	// Determine if we're in edit mode
	const isEditMode = !!editPassenger

	// Clear errors when dialog opens
	useEffect(() => {
		if (isOpen) {
			setFieldErrors({})
		}
	}, [isOpen])

	// Populate form when editing
	useEffect(() => {
		if (isOpen && editPassenger) {
			// Parse date of birth if available
			let year = '', month = '', day = ''
			if (editPassenger.dateOfBirth && editPassenger.dateOfBirth.length === 8) {
				year = editPassenger.dateOfBirth.substring(0, 4)
				const monthNum = editPassenger.dateOfBirth.substring(4, 6)
				const dayNum = editPassenger.dateOfBirth.substring(6, 8)

				// Convert month from "05" to "5" to match dropdown values
				month = parseInt(monthNum, 10).toString()
				// Convert day from "13" to "13" (remove leading zero if any)
				day = parseInt(dayNum, 10).toString()
			}

			setFormData({
				name: editPassenger.name || '',
				family: editPassenger.family || '',
				nationalId: editPassenger.nationalId || '',
				phone: editPassenger.phone || '',
				gender: editPassenger.gender || '',
				birthYear: year,
				birthMonth: month,
				birthDay: day
			})
		} else if (isOpen && !editPassenger) {
			// Reset form for new passenger
			setFormData({
				name: '',
				family: '',
				nationalId: '',
				phone: '',
				gender: '',
				birthYear: '',
				birthMonth: '',
				birthDay: ''
			})
		}
	}, [isOpen, editPassenger])

	// Real-time validation for each field
	const validateField = (field: keyof FormData, value: string) => {
		try {
			switch (field) {
				case 'name':
					nameSchema.parse(value)
					break
				case 'family':
					familyNameSchema.parse(value)
					break
				case 'nationalId':
					const processedValue = isPersianKeyboardInput(value) ? value : value.replace(/[^0-9]/g, '')
					nationalCodeSchema.parse(processedValue)
					break
				case 'phone':
					phoneSchema.parse(value)
					break
			}

			// Clear error if validation passes
			setFieldErrors(prev => {
				const newErrors = { ...prev }
				delete newErrors[field]
				return newErrors
			})

			return true
		} catch (error) {
			if (error instanceof z.ZodError) {
				setFieldErrors(prev => ({
					...prev,
					[field]: error.errors[0].message
				}))
			}
			return false
		}
	}

	const validateForm = (): boolean => {
		const errors: Record<string, string> = {}

		// Validate all required fields
		if (!formData.name.trim()) {
			errors.name = 'نام الزامی است'
		} else {
			try {
				nameSchema.parse(formData.name)
			} catch (error) {
				if (error instanceof z.ZodError) {
					errors.name = error.errors[0].message
				}
			}
		}

		if (!formData.family.trim()) {
			errors.family = 'نام خانوادگی الزامی است'
		} else {
			try {
				familyNameSchema.parse(formData.family)
			} catch (error) {
				if (error instanceof z.ZodError) {
					errors.family = error.errors[0].message
				}
			}
		}

		if (!formData.nationalId.trim()) {
			errors.nationalId = 'کد ملی الزامی است'
		} else {
			try {
				const processedValue = formData.nationalId.replace(/[^0-9]/g, '')
				nationalCodeSchema.parse(processedValue)
			} catch (error) {
				if (error instanceof z.ZodError) {
					errors.nationalId = error.errors[0].message
				}
			}
		}

		if (!formData.phone.trim()) {
			errors.phone = 'شماره تلفن الزامی است'
		} else {
			try {
				phoneSchema.parse(formData.phone)
			} catch (error) {
				if (error instanceof z.ZodError) {
					errors.phone = error.errors[0].message
				}
			}
		}

		if (!formData.gender) {
			errors.gender = 'انتخاب جنسیت الزامی است'
		}

		// Birth date validation (optional but if provided should be valid)
		if (formData.birthYear || formData.birthMonth || formData.birthDay) {
			if (!formData.birthYear || !formData.birthMonth || !formData.birthDay) {
				errors.birthDate = 'لطفا تاریخ تولد را کامل وارد کنید'
			}
		}

		setFieldErrors(errors)
		return Object.keys(errors).length === 0
	}

	const handleSubmit = async () => {
		if (!validateForm()) return

		setIsSubmitting(true)

		try {
			// Format birth date as YYYYMMDD if provided
			let birthDate = ''
			if (formData.birthYear && formData.birthMonth && formData.birthDay) {
				birthDate = `${formData.birthYear}${formData.birthMonth.padStart(2, '0')}${formData.birthDay.padStart(2, '0')}`
			}

			const passengerPayload = {
				name: formData.name.trim(),
				family: formData.family.trim(),
				nationalId: formData.nationalId.replace(/[^0-9]/g, ''),
				phone: formData.phone.trim(),
				gender: formData.gender,
				status: 'حاضر',
				dateOfBirth: birthDate
			}

			if (isEditMode && editPassenger && onEditPassenger) {
				// Edit existing passenger
				await onEditPassenger({
					...passengerPayload,
					id: editPassenger.id
				} as any)
			} else {
				// Add new passenger
				await onAddPassenger(passengerPayload as any)
			}

			// Reset form
			setFormData({
				name: '',
				family: '',
				nationalId: '',
				phone: '',
				gender: '',
				birthYear: '',
				birthMonth: '',
				birthDay: ''
			})
			setFieldErrors({})
			setYearOpen(false)
			setMonthOpen(false)
			setDayOpen(false)
			onClose()
		} catch (error) {
			console.error('Error adding passenger:', error)
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleInputChange = (field: keyof FormData, value: string) => {
		let processedValue = value

		// Special processing for national ID
		if (field === 'nationalId') {
			if (isPersianKeyboardInput(value)) {
				return // Don't update if Persian keyboard detected
			}
			processedValue = value.replace(/[^0-9]/g, '')
		}

		// Special processing for phone
		if (field === 'phone') {
			processedValue = value.replace(/[^0-9]/g, '')
		}

		setFormData(prev => ({ ...prev, [field]: processedValue }))

		// Real-time validation
		if (processedValue.trim()) {
			validateField(field, processedValue)
		} else {
			// Clear error if field is empty
			setFieldErrors(prev => {
				const newErrors = { ...prev }
				delete newErrors[field]
				return newErrors
			})
		}
	}

	const handleClose = () => {
		if (!isSubmitting) {
			setFormData({
				name: '',
				family: '',
				nationalId: '',
				phone: '',
				gender: '',
				birthYear: '',
				birthMonth: '',
				birthDay: ''
			})
			setFieldErrors({})
			setYearOpen(false)
			setMonthOpen(false)
			setDayOpen(false)
			onClose()
		}
	}

	// Generate years (1300-1403 Shamsi)
	const years = Array.from({ length: 104 }, (_, i) => 1403 - i)
	const months = [
		{ value: '1', label: 'فروردین' },    // ۱
		{ value: '2', label: 'اردیبهشت' },   // ۲
		{ value: '3', label: 'خرداد' },      // ۳
		{ value: '4', label: 'تیر' },        // ۴
		{ value: '5', label: 'مرداد' },      // ۵
		{ value: '6', label: 'شهریور' },     // ۶
		{ value: '7', label: 'مهر' },        // ۷
		{ value: '8', label: 'آبان' },       // ۸
		{ value: '9', label: 'آذر' },        // ۹
		{ value: '10', label: 'دی' },        // ۱۰
		{ value: '11', label: 'بهمن' },      // ۱۱
		{ value: '12', label: 'اسفند' }      // ۱۲
	]

	// Generate days based on selected month
	const getDaysInMonth = (month: string) => {
		if (!month) return Array.from({ length: 31 }, (_, i) => i + 1)
		const monthNum = parseInt(month)
		if (monthNum <= 6) return Array.from({ length: 31 }, (_, i) => i + 1)
		if (monthNum <= 11) return Array.from({ length: 30 }, (_, i) => i + 1)
		return Array.from({ length: 29 }, (_, i) => i + 1) // Esfand
	}

	const getFieldIcon = (field: string, hasError: boolean, hasValue: boolean) => {
		if (hasError) return <AlertCircle className="h-4 w-4 text-red-500" />
		if (hasValue && !hasError) return <CheckCircle2 className="h-4 w-4 text-green-500" />

		switch (field) {
			case 'name':
			case 'family':
				return <User className="h-4 w-4 text-[#767676]" />
			case 'nationalId':
				return <CreditCard className="h-4 w-4 text-[#767676]" />
			case 'phone':
				return <Phone className="h-4 w-4 text-[#767676]" />
			case 'gender':
				return <Users className="h-4 w-4 text-[#767676]" />
			default:
				return <User className="h-4 w-4 text-[#767676]" />
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto [&>button]:hidden">
				<DialogHeader className="border-b border-[#e6f0fa] pb-4" dir="rtl">
					<DialogTitle className="text-xl font-IranYekanBold text-[#323232] flex items-center gap-3 flex-row">
						<div className="w-10 h-10 bg-gradient-to-r from-[#0D5990] to-[#1A74B4] rounded-lg flex items-center justify-center">
							<User className="h-5 w-5 text-white" />
						</div>
						<div>
							<h2 className="text-lg font-IranYekanBold text-right">
								{isEditMode ? 'ویرایش مسافر' : 'افزودن مسافر جدید'}
							</h2>
							<p className="text-sm text-[#767676] font-IranYekanRegular mt-1 text-right">
								{isEditMode ? 'اطلاعات مسافر را ویرایش کنید' : 'اطلاعات مسافر را با دقت وارد کنید'}
							</p>
						</div>

					</DialogTitle>
				</DialogHeader>

				<div className="p-6 space-y-6" dir="rtl">
					{/* Personal Information */}
					<div className="space-y-4">
						<h3 className="text-base font-IranYekanMedium text-[#323232] flex items-center gap-2 flex-row">
							<div className="w-1 h-4 bg-[#0D5990] rounded"></div>
							اطلاعات شخصی

						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{/* Name */}
							<div className="space-y-2">
								<Label htmlFor="name" className="text-[#323232] font-IranYekanMedium text-right block">
									نام *
								</Label>
								<div className="relative">
									<Input
										id="name"
										type="text"
										value={formData.name}
										onChange={(e) => handleInputChange('name', e.target.value)}
										placeholder="نام به فارسی"
										className={`text-right pr-4 pl-10 border-[#ccd6e1] focus:border-[#0d5990] ${fieldErrors.name ? 'border-red-500 focus:border-red-500' : ''
											}`}
									/>
									<div className="absolute left-3 top-1/2 transform -translate-y-1/2">
										{getFieldIcon('name', !!fieldErrors.name, !!formData.name)}
									</div>
								</div>
								{fieldErrors.name && (
									<p className="text-red-500 text-xs text-right font-IranYekanRegular flex items-center gap-1 flex-row-reverse">
										{fieldErrors.name}
										<AlertCircle className="h-3 w-3" />
									</p>
								)}
							</div>

							{/* Family Name */}
							<div className="space-y-2">
								<Label htmlFor="family" className="text-[#323232] font-IranYekanMedium text-right block">
									نام خانوادگی *
								</Label>
								<div className="relative">
									<Input
										id="family"
										type="text"
										value={formData.family}
										onChange={(e) => handleInputChange('family', e.target.value)}
										placeholder="نام خانوادگی به فارسی"
										className={`text-right pr-4 pl-10 border-[#ccd6e1] focus:border-[#0d5990] ${fieldErrors.family ? 'border-red-500 focus:border-red-500' : ''
											}`}
									/>
									<div className="absolute left-3 top-1/2 transform -translate-y-1/2">
										{getFieldIcon('family', !!fieldErrors.family, !!formData.family)}
									</div>
								</div>
								{fieldErrors.family && (
									<p className="text-red-500 text-xs text-right font-IranYekanRegular flex items-center gap-1 flex-row-reverse">
										{fieldErrors.family}
										<AlertCircle className="h-3 w-3" />
									</p>
								)}
							</div>

							{/* National ID */}
							<div className="space-y-2">
								<Label htmlFor="nationalId" className="text-[#323232] font-IranYekanMedium text-right block">
									کد ملی *
								</Label>
								<div className="relative">
									<Input
										id="nationalId"
										type="text"
										value={formData.nationalId}
										onChange={(e) => handleInputChange('nationalId', e.target.value)}
										placeholder="کد ملی ۱۰ رقمی"
										maxLength={10}
										className={`text-right pr-4 pl-10 border-[#ccd6e1] focus:border-[#0d5990] ${fieldErrors.nationalId ? 'border-red-500 focus:border-red-500' : ''
											}`}
									/>
									<div className="absolute left-3 top-1/2 transform -translate-y-1/2">
										{getFieldIcon('nationalId', !!fieldErrors.nationalId, !!formData.nationalId)}
									</div>
								</div>
								{fieldErrors.nationalId && (
									<p className="text-red-500 text-xs text-right font-IranYekanRegular flex items-center gap-1 flex-row-reverse">
										{fieldErrors.nationalId}
										<AlertCircle className="h-3 w-3" />
									</p>
								)}
							</div>

							{/* Phone */}
							<div className="space-y-2">
								<Label htmlFor="phone" className="text-[#323232] font-IranYekanMedium text-right block">
									شماره موبایل *
								</Label>
								<div className="relative">
									<Input
										id="phone"
										type="tel"
										value={formData.phone}
										onChange={(e) => handleInputChange('phone', e.target.value)}
										placeholder="09123456789"
										maxLength={11}
										className={`text-right pr-4 pl-10 border-[#ccd6e1] focus:border-[#0d5990] ${fieldErrors.phone ? 'border-red-500 focus:border-red-500' : ''
											}`}
									/>
									<div className="absolute left-3 top-1/2 transform -translate-y-1/2">
										{getFieldIcon('phone', !!fieldErrors.phone, !!formData.phone)}
									</div>
								</div>
								{fieldErrors.phone && (
									<p className="text-red-500 text-xs text-right font-IranYekanRegular flex items-center gap-1 flex-row-reverse">
										{fieldErrors.phone}
										<AlertCircle className="h-3 w-3" />
									</p>
								)}
							</div>
						</div>
					</div>

					{/* Gender Selection */}
					<div className="space-y-4">
						<h3 className="text-base font-IranYekanMedium text-[#323232] flex items-center gap-2 flex-row ">
							<div className="w-1 h-4 bg-[#0D5990] rounded"></div>

							جنسیت
						</h3>

						<div className="space-y-2">
							<Label className="text-[#323232] font-IranYekanMedium text-right block">

							</Label>
							<div className="flex gap-4 flex-row-reverse justify-end">
								<label className="flex items-center gap-2 cursor-pointer flex-row-reverse">
									<span className="text-sm font-IranYekanRegular text-[#323232]">مرد</span>
									<input
										type="radio"
										name="gender"
										value="مرد"
										checked={formData.gender === 'مرد'}
										onChange={(e) => handleInputChange('gender', e.target.value)}
										className="w-4 h-4 text-[#0d5990] border-[#ccd6e1] focus:ring-[#0d5990]"
									/>
								</label>
								<label className="flex items-center gap-2 cursor-pointer flex-row-reverse">
									<span className="text-sm font-IranYekanRegular text-[#323232]">زن</span>
									<input
										type="radio"
										name="gender"
										value="زن"
										checked={formData.gender === 'زن'}
										onChange={(e) => handleInputChange('gender', e.target.value)}
										className="w-4 h-4 text-[#0d5990] border-[#ccd6e1] focus:ring-[#0d5990]"
									/>
								</label>
							</div>
							{fieldErrors.gender && (
								<p className="text-red-500 text-xs text-right font-IranYekanRegular flex items-center gap-1 flex-row-reverse">
									{fieldErrors.gender}
									<AlertCircle className="h-3 w-3" />
								</p>
							)}
						</div>
					</div>

					{/* Birth Date (Optional) */}
					<div className="space-y-4">
						<h3 className="text-base font-IranYekanMedium text-[#323232] flex items-center gap-2 flex-row">
							<div className="w-1 h-4 bg-[#0D5990] rounded"></div>

							تاریخ تولد (اختیاری)
						</h3>

						<div className="flex gap-3 justify-start items-start flex-wrap">
							{/* Day */}
							<div className="space-y-2">
								{/* <Label className="text-[#323232] font-IranYekanMedium text-right block text-sm">
									روز
								</Label> */}
								<Popover open={dayOpen} onOpenChange={setDayOpen}>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											role="combobox"
											aria-expanded={dayOpen}
											className="w-[120px] justify-between text-center border-[#ccd6e1] focus:border-[#0d5990] h-9"
										>
											{formData.birthDay ? toPersianDigits(formData.birthDay) : "روز"}
											<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-[120px] p-0" align="center" side="bottom" sideOffset={4}>
										<Command>
											<CommandInput placeholder="جستجوی روز..." className="h-8 text-sm" />
											<CommandList className="max-h-48">
												<CommandEmpty>روزی یافت نشد.</CommandEmpty>
												<CommandGroup>
													{getDaysInMonth(formData.birthMonth).map(day => (
														<CommandItem
															key={day}
															value={day.toString()}
															onSelect={(currentValue) => {
																handleInputChange('birthDay', currentValue)
																setDayOpen(false)
															}}
															className="text-center justify-center text-sm py-1.5"
														>
															{toPersianDigits(day)}
														</CommandItem>
													))}
												</CommandGroup>
											</CommandList>
										</Command>
									</PopoverContent>
								</Popover>
							</div>

							{/* Month */}
							<div className="space-y-2">
								{/* <Label className="text-[#323232] font-IranYekanMedium text-right block text-sm">
									ماه
								</Label> */}
								<Popover open={monthOpen} onOpenChange={setMonthOpen}>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											role="combobox"
											aria-expanded={monthOpen}
											className="w-[150px] justify-between text-center border-[#ccd6e1] focus:border-[#0d5990] h-9"
										>
											{formData.birthMonth ? months.find(m => m.value === formData.birthMonth)?.label : "ماه"}
											<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-[150px] p-0" align="center" side="bottom" sideOffset={4}>
										<Command>
											<CommandInput placeholder="جستجوی ماه..." className="h-8 text-sm" />
											<CommandList className="max-h-48">
												<CommandEmpty>ماهی یافت نشد.</CommandEmpty>
												<CommandGroup>
													{months.map(month => (
														<CommandItem
															key={month.value}
															value={month.label}
															onSelect={() => {
																handleInputChange('birthMonth', month.value)
																setMonthOpen(false)
															}}
															className="text-center justify-center text-sm py-1.5"
														>
															{month.label}
														</CommandItem>
													))}
												</CommandGroup>
											</CommandList>
										</Command>
									</PopoverContent>
								</Popover>
							</div>

							{/* Year */}
							<div className="space-y-2">
								{/* <Label className="text-[#323232] font-IranYekanMedium text-right block text-sm">
									سال
								</Label> */}
								<Popover open={yearOpen} onOpenChange={setYearOpen}>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											role="combobox"
											aria-expanded={yearOpen}
											className="w-[150px] justify-between text-center border-[#ccd6e1] focus:border-[#0d5990] h-9"
										>
											{formData.birthYear ? toPersianDigits(formData.birthYear) : "سال"}
											<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-[150px] p-0" align="center" side="bottom" sideOffset={4}>
										<Command>
											<CommandInput placeholder="جستجوی سال..." className="h-8 text-sm" />
											<CommandList className="max-h-48">
												<CommandEmpty>سالی یافت نشد.</CommandEmpty>
												<CommandGroup>
													{years.map(year => (
														<CommandItem
															key={year}
															value={year.toString()}
															onSelect={(currentValue) => {
																handleInputChange('birthYear', currentValue)
																setYearOpen(false)
															}}
															className="text-center justify-center text-sm py-1.5"
														>
															{toPersianDigits(year)}
														</CommandItem>
													))}
												</CommandGroup>
											</CommandList>
										</Command>
									</PopoverContent>
								</Popover>
							</div>
						</div>
						{fieldErrors.birthDate && (
							<p className="text-red-500 text-xs text-right font-IranYekanRegular flex items-center gap-1 flex-row-reverse">
								{fieldErrors.birthDate}
								<AlertCircle className="h-3 w-3" />
							</p>
						)}
					</div>
				</div>

				{/* Form Actions */}
				<div className="flex justify-between items-center gap-3 p-6 pt-0 border-t border-[#e6f0fa] " dir="rtl">
					<Button
						type="button"
						onClick={handleSubmit}
						disabled={isSubmitting}
						className="px-8 py-2.5 mt-2 bg-gradient-to-r from-[#0D5990] to-[#1A74B4] hover:from-[#0b4d7a] hover:to-[#155a8a] text-white font-IranYekanMedium flex items-center gap-2 disabled:opacity-50 flex-row-reverse"
					>
						{isSubmitting ? (
							<>
								{isEditMode ? 'در حال ویرایش...' : 'در حال افزودن...'}
								<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
							</>
						) : (
							<>
								{isEditMode ? 'ویرایش مسافر' : 'افزودن مسافر'}
								<CheckCircle2 className="h-4 w-4" />
							</>
						)}
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={handleClose}
						disabled={isSubmitting}
						className="px-6 py-2.5 mt-2 border-[#ccd6e1] text-[#767676] hover:bg-[#f6f9ff] font-IranYekanRegular"
					>
						انصراف
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}