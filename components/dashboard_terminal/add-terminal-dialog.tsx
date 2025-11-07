"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
	Building2,
	CheckCircle2,
	AlertCircle,
	Image as ImageIcon,
	Mail,
	Phone,
	MapPin,
	Globe,
	Map,
	Hash,
} from "lucide-react"
import { z } from "zod"

const nameSchema = z
	.string()
	.trim()
	.min(1, "نام ترمینال الزامی است")
	.max(100, "نام ترمینال نمی‌تواند بیش از ۱۰۰ کاراکتر باشد")

const optionalStringSchema = z.string().trim().optional().or(z.literal(""))

const urlSchema = z
	.string()
	.trim()
	.url("آدرس URL معتبر نیست")
	.optional()
	.or(z.literal(""))

const emailSchema = z
	.string()
	.trim()
	.email("ایمیل معتبر نیست")
	.optional()
	.or(z.literal(""))

const optionalNumberStringSchema = z
	.string()
	.trim()
	.optional()
	.or(z.literal(""))
	.refine((value) => value === "" || !isNaN(Number(value)), {
		message: "فرمت عددی معتبر نیست",
	})

const terminalFormSchema = z.object({
	name: nameSchema,
	description: optionalStringSchema,
	address: optionalStringSchema,
	phone: optionalStringSchema,
	email: emailSchema,
	webSite: urlSchema,
	logo: urlSchema,
	cityID: optionalNumberStringSchema,
	countryID: optionalNumberStringSchema,
	latitude: optionalNumberStringSchema,
	longitude: optionalNumberStringSchema,
	companyID: optionalNumberStringSchema,
	terminalCode: optionalNumberStringSchema,
})

interface Terminal {
	id: number
	name: string
	description: string
	address: string
	phone: string
	email: string
	webSite: string
	logo: string
	cityID: number
	countryID: number
	latitude: number
	longitude: number
	companyID?: number
	terminalID?: number
}

interface AddTerminalDialogProps {
	isOpen: boolean
	onClose: () => void
	onAddTerminal: (terminal: Omit<Terminal, "id">) => Promise<void>
	editTerminal?: Terminal | null
	onEditTerminal?: (terminal: Terminal) => Promise<void>
}

interface FormData {
	name: string
	description: string
	address: string
	phone: string
	email: string
	webSite: string
	logo: string
	cityID: string
	countryID: string
	latitude: string
	longitude: string
	companyID: string
	terminalCode: string
}

const parseIntegerField = (value: string, fallback: number) =>
	value.trim() ? Number(value) : fallback

const parseFloatField = (value: string, fallback: number) =>
	value.trim() ? Number(value) : fallback

export function AddTerminalDialog({
	isOpen,
	onClose,
	onAddTerminal,
	editTerminal,
	onEditTerminal,
}: AddTerminalDialogProps) {
	const [formData, setFormData] = useState<FormData>({
		name: "",
		description: "",
		address: "",
		phone: "",
		email: "",
		webSite: "",
		logo: "",
		cityID: "1",
		countryID: "1",
		latitude: "0",
		longitude: "0",
		companyID: "",
		terminalCode: "",
	})

	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
	const [isSubmitting, setIsSubmitting] = useState(false)

	const isEditMode = !!editTerminal

	useEffect(() => {
		if (isOpen) {
			setFieldErrors({})
		}
	}, [isOpen])

	useEffect(() => {
		if (isOpen && editTerminal) {
			setFormData({
				name: editTerminal.name || "",
				description: editTerminal.description || "",
				address: editTerminal.address || "",
				phone: editTerminal.phone || "",
				email: editTerminal.email || "",
				webSite: editTerminal.webSite || "",
				logo: editTerminal.logo || "",
				cityID: editTerminal.cityID?.toString() ?? "1",
				countryID: editTerminal.countryID?.toString() ?? "1",
				latitude: editTerminal.latitude?.toString() ?? "0",
				longitude: editTerminal.longitude?.toString() ?? "0",
				companyID: editTerminal.companyID?.toString() ?? "",
				terminalCode: editTerminal.terminalID?.toString() ?? "",
			})
		} else if (isOpen && !editTerminal) {
			setFormData({
				name: "",
				description: "",
				address: "",
				phone: "",
				email: "",
				webSite: "",
				logo: "",
				cityID: "1",
				countryID: "1",
				latitude: "0",
				longitude: "0",
				companyID: "",
				terminalCode: "",
			})
		}
	}, [isOpen, editTerminal])

	const validateField = (field: keyof FormData, value: string) => {
		try {
			switch (field) {
				case "name":
					nameSchema.parse(value)
					break
				case "logo":
				case "webSite":
					urlSchema.parse(value)
					break
				case "email":
					emailSchema.parse(value)
					break
				case "phone":
				case "address":
				case "description":
					optionalStringSchema.parse(value)
					break
				case "cityID":
				case "countryID":
				case "latitude":
				case "longitude":
				case "companyID":
				case "terminalCode":
					optionalNumberStringSchema.parse(value)
					break
			}

			setFieldErrors((prev) => {
				const newErrors = { ...prev }
				delete newErrors[field]
				return newErrors
			})

			return true
		} catch (error) {
			if (error instanceof z.ZodError) {
				setFieldErrors((prev) => ({
					...prev,
					[field]: error.errors[0]?.message ?? "مقدار نامعتبر",
				}))
			}
			return false
		}
	}

	const validateForm = (): boolean => {
		const result = terminalFormSchema.safeParse(formData)

		if (!result.success) {
			const errors: Record<string, string> = {}
			result.error.issues.forEach((issue) => {
				const fieldName = issue.path[0] as keyof FormData
				if (fieldName) {
					errors[fieldName] = issue.message
				}
			})
			setFieldErrors(errors)
			return false
		}

		setFieldErrors({})
		return true
	}

	const handleSubmit = async () => {
		if (!validateForm()) return

		setIsSubmitting(true)

		try {
			const terminalPayload = {
				name: formData.name.trim(),
				description: formData.description.trim(),
				address: formData.address.trim(),
				phone: formData.phone.trim(),
				email: formData.email.trim(),
				webSite: formData.webSite.trim(),
				logo: formData.logo.trim(),
				cityID: parseIntegerField(formData.cityID, editTerminal?.cityID ?? 1),
				countryID: parseIntegerField(formData.countryID, editTerminal?.countryID ?? 1),
				latitude: parseFloatField(formData.latitude, editTerminal?.latitude ?? 0),
				longitude: parseFloatField(formData.longitude, editTerminal?.longitude ?? 0),
				companyID: formData.companyID.trim() ? Number(formData.companyID) : editTerminal?.companyID,
				terminalID: formData.terminalCode.trim() ? Number(formData.terminalCode) : editTerminal?.terminalID,
			}

			if (isEditMode && editTerminal && onEditTerminal) {
				await onEditTerminal({
					...editTerminal,
					...terminalPayload,
					id: editTerminal.id,
				} as Terminal)
			} else {
				await onAddTerminal(terminalPayload)
			}

			setFormData({
				name: "",
				description: "",
				address: "",
				phone: "",
				email: "",
				webSite: "",
				logo: "",
				cityID: "1",
				countryID: "1",
				latitude: "0",
				longitude: "0",
				companyID: "",
				terminalCode: "",
			})
			setFieldErrors({})
			onClose()
		} catch (error) {
			console.error("Error adding/editing terminal:", error)
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleInputChange = (field: keyof FormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }))

		if (value.trim()) {
			validateField(field, value)
		} else {
			setFieldErrors((prev) => {
				const newErrors = { ...prev }
				delete newErrors[field]
				return newErrors
			})
		}
	}

	const handleClose = () => {
		if (!isSubmitting) {
			setFormData({
				name: "",
				description: "",
				address: "",
				phone: "",
				email: "",
				webSite: "",
				logo: "",
				cityID: "1",
				countryID: "1",
				latitude: "0",
				longitude: "0",
				companyID: "",
				terminalCode: "",
			})
			setFieldErrors({})
			onClose()
		}
	}

	const getFieldIcon = (field: keyof FormData, hasError: boolean, hasValue: boolean) => {
		if (hasError) return <AlertCircle className="h-4 w-4 text-red-500" />
		if (hasValue && !hasError) return <CheckCircle2 className="h-4 w-4 text-green-500" />

		switch (field) {
			case "name":
				return <Building2 className="h-4 w-4 text-[#767676]" />
			case "logo":
				return <ImageIcon className="h-4 w-4 text-[#767676]" />
			case "email":
				return <Mail className="h-4 w-4 text-[#767676]" />
			case "phone":
				return <Phone className="h-4 w-4 text-[#767676]" />
			case "address":
				return <MapPin className="h-4 w-4 text-[#767676]" />
			case "webSite":
				return <Globe className="h-4 w-4 text-[#767676]" />
			case "cityID":
			case "countryID":
			case "terminalCode":
				return <Hash className="h-4 w-4 text-[#767676]" />
			case "latitude":
			case "longitude":
				return <Map className="h-4 w-4 text-[#767676]" />
			case "companyID":
				return <Building2 className="h-4 w-4 text-[#767676]" />
			default:
				return <Building2 className="h-4 w-4 text-[#767676]" />
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto [&>button]:hidden">
				<DialogHeader className="border-b border-[#e6f0fa] pb-4" dir="rtl">
					<DialogTitle className="text-xl font-IranYekanBold text-[#323232] flex items-center gap-3 flex-row">
						<div className="w-10 h-10 bg-gradient-to-r from-[#0D5990] to-[#1A74B4] rounded-lg flex items-center justify-center">
							<Building2 className="h-5 w-5 text-white" />
						</div>
						<div>
							<h2 className="text-lg font-IranYekanBold text-right">
								{isEditMode ? "ویرایش ترمینال" : "افزودن ترمینال جدید"}
							</h2>
							<p className="text-sm text-[#767676] font-IranYekanRegular mt-1 text-right">
								{isEditMode ? "اطلاعات ترمینال را ویرایش کنید" : "اطلاعات ترمینال را با دقت وارد کنید"}
							</p>
						</div>
					</DialogTitle>
				</DialogHeader>

				<div className="p-6 space-y-6" dir="rtl">
					<div className="space-y-4">
						<h3 className="text-base font-IranYekanMedium text-[#323232] flex items-center gap-2 flex-row">
							<div className="w-1 h-4 bg-[#0D5990] rounded"></div>
							اطلاعات ترمینال
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="name" className="text-[#323232] font-IranYekanMedium text-right block">
									نام ترمینال *
								</Label>
								<div className="relative">
									<Input
										id="name"
										type="text"
										value={formData.name}
										onChange={(e) => handleInputChange("name", e.target.value)}
										placeholder="نام ترمینال"
										maxLength={100}
										className={`text-right pr-4 pl-10 border-[#ccd6e1] focus:border-[#0d5990] ${fieldErrors.name ? "border-red-500 focus:border-red-500" : ""}`}
									/>
									<div className="absolute left-3 top-1/2 transform -translate-y-1/2">
										{getFieldIcon("name", !!fieldErrors.name, !!formData.name)}
									</div>
								</div>
								{fieldErrors.name && (
									<p className="text-red-500 text-xs text-right font-IranYekanRegular flex items-center gap-1 flex-row-reverse">
										{fieldErrors.name}
										<AlertCircle className="h-3 w-3" />
									</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="logo" className="text-[#323232] font-IranYekanMedium text-right block">
									آدرس لوگو (اختیاری)
								</Label>
								<div className="relative">
									<Input
										id="logo"
										type="url"
										value={formData.logo}
										onChange={(e) => handleInputChange("logo", e.target.value)}
										placeholder="https://example.com/logo.svg"
										className={`text-right pr-4 pl-10 border-[#ccd6e1] focus:border-[#0d5990] ${fieldErrors.logo ? "border-red-500 focus:border-red-500" : ""}`}
									/>
									<div className="absolute left-3 top-1/2 transform -translate-y-1/2">
										{getFieldIcon("logo", !!fieldErrors.logo, !!formData.logo)}
									</div>
								</div>
								{fieldErrors.logo && (
									<p className="text-red-500 text-xs text-right font-IranYekanRegular flex items-center gap-1 flex-row-reverse">
										{fieldErrors.logo}
										<AlertCircle className="h-3 w-3" />
									</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="address" className="text-[#323232] font-IranYekanMedium text-right block">
									آدرس (اختیاری)
								</Label>
								<div className="relative">
									<Input
										id="address"
										type="text"
										value={formData.address}
										onChange={(e) => handleInputChange("address", e.target.value)}
										placeholder="آدرس ترمینال"
										className="text-right pr-4 pl-10 border-[#ccd6e1] focus:border-[#0d5990]"
									/>
									<div className="absolute left-3 top-1/2 transform -translate-y-1/2">
										{getFieldIcon("address", !!fieldErrors.address, !!formData.address)}
									</div>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="phone" className="text-[#323232] font-IranYekanMedium text-right block">
									تلفن (اختیاری)
								</Label>
								<div className="relative">
									<Input
										id="phone"
										type="tel"
										value={formData.phone}
										onChange={(e) => handleInputChange("phone", e.target.value)}
										placeholder="شماره تماس"
										className="text-right pr-4 pl-10 border-[#ccd6e1] focus:border-[#0d5990]"
									/>
									<div className="absolute left-3 top-1/2 transform -translate-y-1/2">
										{getFieldIcon("phone", !!fieldErrors.phone, !!formData.phone)}
									</div>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="email" className="text-[#323232] font-IranYekanMedium text-right block">
									ایمیل (اختیاری)
								</Label>
								<div className="relative">
									<Input
										id="email"
										type="email"
										value={formData.email}
										onChange={(e) => handleInputChange("email", e.target.value)}
										placeholder="example@terminal.com"
										className={`text-right pr-4 pl-10 border-[#ccd6e1] focus:border-[#0d5990] ${fieldErrors.email ? "border-red-500 focus:border-red-500" : ""}`}
									/>
									<div className="absolute left-3 top-1/2 transform -translate-y-1/2">
										{getFieldIcon("email", !!fieldErrors.email, !!formData.email)}
									</div>
								</div>
								{fieldErrors.email && (
									<p className="text-red-500 text-xs text-right font-IranYekanRegular flex items-center gap-1 flex-row-reverse">
										{fieldErrors.email}
										<AlertCircle className="h-3 w-3" />
									</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="webSite" className="text-[#323232] font-IranYekanMedium text-right block">
									وب‌سایت (اختیاری)
								</Label>
								<div className="relative">
									<Input
										id="webSite"
										type="url"
										value={formData.webSite}
										onChange={(e) => handleInputChange("webSite", e.target.value)}
										placeholder="https://example.com"
										className={`text-right pr-4 pl-10 border-[#ccd6e1] focus:border-[#0d5990] ${fieldErrors.webSite ? "border-red-500 focus:border-red-500" : ""}`}
									/>
									<div className="absolute left-3 top-1/2 transform -translate-y-1/2">
										{getFieldIcon("webSite", !!fieldErrors.webSite, !!formData.webSite)}
									</div>
								</div>
								{fieldErrors.webSite && (
									<p className="text-red-500 text-xs text-right font-IranYekanRegular flex items-center gap-1 flex-row-reverse">
										{fieldErrors.webSite}
										<AlertCircle className="h-3 w-3" />
									</p>
								)}
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="description" className="text-[#323232] font-IranYekanMedium text-right block">
								توضیحات (اختیاری)
							</Label>
							<Textarea
								id="description"
								value={formData.description}
								onChange={(e) => handleInputChange("description", e.target.value)}
								placeholder="توضیحات ترمینال..."
								rows={3}
								className="text-right pr-4 border-[#ccd6e1] focus:border-[#0d5990] font-IranYekanRegular"
							/>
						</div>
					</div>

					<div className="space-y-4">
						<h3 className="text-base font-IranYekanMedium text-[#323232] flex items-center gap-2 flex-row">
							<div className="w-1 h-4 bg-[#0D5990] rounded"></div>
							اطلاعات موقعیت و شناسه‌ها
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							{([
								{ id: "cityID", label: "شناسه شهر", placeholder: "مثال: 1" },
								{ id: "countryID", label: "شناسه کشور", placeholder: "مثال: 1" },
								{ id: "companyID", label: "شناسه شرکت مرتبط", placeholder: "مثال: 3" },
								{ id: "terminalCode", label: "شناسه ترمینال", placeholder: "مثال: 2" },
								{ id: "latitude", label: "عرض جغرافیایی", placeholder: "مثال: 2.4" },
								{ id: "longitude", label: "طول جغرافیایی", placeholder: "مثال: 3.6" },
							] as const).map((field) => (
								<div className="space-y-2" key={field.id}>
									<Label htmlFor={field.id} className="text-[#323232] font-IranYekanMedium text-right block">
										{field.label} (اختیاری)
									</Label>
									<div className="relative">
										<Input
											id={field.id}
											type="text"
											value={formData[field.id] as string}
											onChange={(e) => handleInputChange(field.id, e.target.value)}
											placeholder={field.placeholder}
											className={`text-right pr-4 pl-10 border-[#ccd6e1] focus:border-[#0d5990] ${
												fieldErrors[field.id]
													? "border-red-500 focus:border-red-500"
												: ""
											}`}
										/>
										<div className="absolute left-3 top-1/2 transform -translate-y-1/2">
											{getFieldIcon(field.id, !!fieldErrors[field.id], !!formData[field.id])}
										</div>
									</div>
									{fieldErrors[field.id] && (
										<p className="text-red-500 text-xs text-right font-IranYekanRegular flex items-center gap-1 flex-row-reverse">
											{fieldErrors[field.id]}
											<AlertCircle className="h-3 w-3" />
										</p>
									)}
								</div>
							))}
						</div>
					</div>
				</div>

				<div className="flex justify-between items-center gap-3 p-6 pt-0 border-t border-[#e6f0fa]" dir="rtl">
					<Button
						type="button"
						onClick={handleSubmit}
						disabled={isSubmitting}
						className="px-8 py-2.5 mt-2 bg-gradient-to-r from-[#0D5990] to-[#1A74B4] hover:from-[#0b4d7a] hover:to-[#155a8a] text-white font-IranYekanMedium flex items-center gap-2 disabled:opacity-50 flex-row-reverse"
					>
						{isSubmitting ? (
							<>
								{isEditMode ? "در حال ویرایش..." : "در حال افزودن..."}
								<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
							</>
						) : (
							<>
								{isEditMode ? "ویرایش ترمینال" : "افزودن ترمینال"}
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

