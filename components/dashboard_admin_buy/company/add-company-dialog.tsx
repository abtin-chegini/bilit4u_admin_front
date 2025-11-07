"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Building2, CheckCircle2, AlertCircle, Image as ImageIcon, Mail, Phone, MapPin, Globe } from "lucide-react"
import { z } from "zod"

// Validation schemas
const nameSchema = z
  .string()
  .trim()
  .min(1, "نام شرکت الزامی است")
  .max(100, "نام شرکت نمی‌تواند بیش از ۱۰۰ کاراکتر باشد")

const optionalStringSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))

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

const companyFormSchema = z.object({
  name: nameSchema,
  description: optionalStringSchema,
  address: optionalStringSchema,
  phone: optionalStringSchema,
  email: emailSchema,
  webSite: urlSchema,
  logo: urlSchema,
})

interface Company {
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

interface AddCompanyDialogProps {
  isOpen: boolean
  onClose: () => void
  onAddCompany: (company: Omit<Company, 'id'>) => void
  editCompany?: Company | null
  onEditCompany?: (company: Company) => void
}

interface FormData {
  name: string
  description: string
  address: string
  phone: string
  email: string
  webSite: string
  logo: string
}

export function AddCompanyDialog({ isOpen, onClose, onAddCompany, editCompany, onEditCompany }: AddCompanyDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    webSite: '',
    logo: ''
  })

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Determine if we're in edit mode
  const isEditMode = !!editCompany

  // Clear errors when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFieldErrors({})
    }
  }, [isOpen])

  // Populate form when editing
  useEffect(() => {
    if (isOpen && editCompany) {
      setFormData({
        name: editCompany.name || '',
        description: editCompany.description || '',
        address: editCompany.address || '',
        phone: editCompany.phone || '',
        email: editCompany.email || '',
        webSite: editCompany.webSite || '',
        logo: editCompany.logo || ''
      })
    } else if (isOpen && !editCompany) {
      // Reset form for new company
      setFormData({
        name: '',
        description: '',
        address: '',
        phone: '',
        email: '',
        webSite: '',
        logo: ''
      })
    }
  }, [isOpen, editCompany])

  // Real-time validation for each field
  const validateField = (field: keyof FormData, value: string) => {
    try {
      switch (field) {
        case 'name':
          nameSchema.parse(value)
          break
        case 'logo':
        case 'webSite':
          urlSchema.parse(value)
          break
        case 'email':
          emailSchema.parse(value)
          break
        case 'phone':
        case 'address':
        case 'description':
          optionalStringSchema.parse(value)
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
    const result = companyFormSchema.safeParse(formData)

    if (!result.success) {
      const errors: Record<string, string> = {}

      result.error.issues.forEach(issue => {
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
      const companyPayload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        webSite: formData.webSite.trim(),
        logo: formData.logo.trim(),
        cityID: editCompany?.cityID ?? 1,
        countryID: editCompany?.countryID ?? 1,
        latitude: editCompany?.latitude ?? 0,
        longitude: editCompany?.longitude ?? 0,
        companyID: editCompany?.companyID,
        terminalID: editCompany?.terminalID
      }

      if (isEditMode && editCompany && onEditCompany) {
        // Edit existing company
        await onEditCompany({
          ...editCompany,
          ...companyPayload,
          id: editCompany.id
        } as Company)
      } else {
        // Add new company
        await onAddCompany(companyPayload)
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        address: '',
        phone: '',
        email: '',
        webSite: '',
        logo: ''
      })
      setFieldErrors({})
      onClose()
    } catch (error) {
      console.error('Error adding/editing company:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Real-time validation
    if (value.trim()) {
      validateField(field, value)
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
        description: '',
        address: '',
        phone: '',
        email: '',
        webSite: '',
        logo: ''
      })
      setFieldErrors({})
      onClose()
    }
  }

  const getFieldIcon = (field: string, hasError: boolean, hasValue: boolean) => {
    if (hasError) return <AlertCircle className="h-4 w-4 text-red-500" />
    if (hasValue && !hasError) return <CheckCircle2 className="h-4 w-4 text-green-500" />

    switch (field) {
      case 'name':
        return <Building2 className="h-4 w-4 text-[#767676]" />
      case 'logo':
        return <ImageIcon className="h-4 w-4 text-[#767676]" />
      case 'email':
        return <Mail className="h-4 w-4 text-[#767676]" />
      case 'phone':
        return <Phone className="h-4 w-4 text-[#767676]" />
      case 'address':
        return <MapPin className="h-4 w-4 text-[#767676]" />
      case 'webSite':
        return <Globe className="h-4 w-4 text-[#767676]" />
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
                {isEditMode ? 'ویرایش شرکت' : 'افزودن شرکت جدید'}
              </h2>
              <p className="text-sm text-[#767676] font-IranYekanRegular mt-1 text-right">
                {isEditMode ? 'اطلاعات شرکت را ویرایش کنید' : 'اطلاعات شرکت را با دقت وارد کنید'}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6" dir="rtl">
          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="text-base font-IranYekanMedium text-[#323232] flex items-center gap-2 flex-row">
              <div className="w-1 h-4 bg-[#0D5990] rounded"></div>
              اطلاعات شرکت
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#323232] font-IranYekanMedium text-right block">
                  نام شرکت *
                </Label>
                <div className="relative">
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="نام شرکت به فارسی"
                    maxLength={100}
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

              {/* Logo URL */}
              <div className="space-y-2">
                <Label htmlFor="logo" className="text-[#323232] font-IranYekanMedium text-right block">
                  آدرس لوگو (اختیاری)
                </Label>
                <div className="relative">
                  <Input
                    id="logo"
                    type="url"
                    value={formData.logo}
                    onChange={(e) => handleInputChange('logo', e.target.value)}
                    placeholder="https://example.com/logo.svg"
                    className={`text-right pr-4 pl-10 border-[#ccd6e1] focus:border-[#0d5990] ${fieldErrors.logo ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    {getFieldIcon('logo', !!fieldErrors.logo, !!formData.logo)}
                  </div>
                </div>
                {fieldErrors.logo && (
                  <p className="text-red-500 text-xs text-right font-IranYekanRegular flex items-center gap-1 flex-row-reverse">
                    {fieldErrors.logo}
                    <AlertCircle className="h-3 w-3" />
                  </p>
                )}
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address" className="text-[#323232] font-IranYekanMedium text-right block">
                  آدرس (اختیاری)
                </Label>
                <div className="relative">
                  <Input
                    id="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="آدرس شرکت"
                    className="text-right pr-4 pl-10 border-[#ccd6e1] focus:border-[#0d5990]"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    {getFieldIcon('address', false, !!formData.address)}
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[#323232] font-IranYekanMedium text-right block">
                  تلفن (اختیاری)
                </Label>
                <div className="relative">
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="شماره تلفن"
                    className="text-right pr-4 pl-10 border-[#ccd6e1] focus:border-[#0d5990]"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    {getFieldIcon('phone', false, !!formData.phone)}
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#323232] font-IranYekanMedium text-right block">
                  ایمیل (اختیاری)
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="example@company.com"
                    className={`text-right pr-4 pl-10 border-[#ccd6e1] focus:border-[#0d5990] ${fieldErrors.email ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    {getFieldIcon('email', !!fieldErrors.email, !!formData.email)}
                  </div>
                </div>
                {fieldErrors.email && (
                  <p className="text-red-500 text-xs text-right font-IranYekanRegular flex items-center gap-1 flex-row-reverse">
                    {fieldErrors.email}
                    <AlertCircle className="h-3 w-3" />
                  </p>
                )}
              </div>

              {/* Website */}
              <div className="space-y-2">
                <Label htmlFor="webSite" className="text-[#323232] font-IranYekanMedium text-right block">
                  وب‌سایت (اختیاری)
                </Label>
                <div className="relative">
                  <Input
                    id="webSite"
                    type="url"
                    value={formData.webSite}
                    onChange={(e) => handleInputChange('webSite', e.target.value)}
                    placeholder="https://example.com"
                    className={`text-right pr-4 pl-10 border-[#ccd6e1] focus:border-[#0d5990] ${fieldErrors.webSite ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    {getFieldIcon('webSite', !!fieldErrors.webSite, !!formData.webSite)}
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

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-[#323232] font-IranYekanMedium text-right block">
                توضیحات (اختیاری)
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="توضیحات شرکت..."
                rows={3}
                className="text-right pr-4 border-[#ccd6e1] focus:border-[#0d5990] font-IranYekanRegular"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-between items-center gap-3 p-6 pt-0 border-t border-[#e6f0fa]" dir="rtl">
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
                {isEditMode ? 'ویرایش شرکت' : 'افزودن شرکت'}
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

