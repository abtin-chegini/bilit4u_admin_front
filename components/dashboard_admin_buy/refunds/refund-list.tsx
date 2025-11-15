"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Eye } from "lucide-react"
import { Icon } from "@iconify/react/dist/iconify.js"
import { motion, HTMLMotionProps } from "framer-motion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefundedRecord } from "@/services/refundService"
import numberConvertor from "@/lib/numberConvertor"
import moment from "jalali-moment"
import { useRouter } from "next/navigation"

const categories = [
  {
    name: "primary",
    displayName: "همه استردادها",
    accentColor: "#ECF4FC",
    icon: "solar:refresh-circle-bold",
  },
  {
    name: "verified",
    displayName: "تایید شده",
    accentColor: "#ECF4FC",
    icon: "solar:check-circle-bold",
  },
  {
    name: "pending",
    displayName: "در انتظار",
    accentColor: "#ECF4FC",
    icon: "solar:clock-circle-bold",
  },
]

// Convert ISO date to Persian date
const formatCreationDate = (dateStr?: string): string => {
  if (!dateStr) return "-"
  try {
    const date = moment(dateStr)
    if (!date.isValid()) {
      return dateStr
    }
    return numberConvertor(date.format("jYYYY/jMM/jDD HH:mm"))
  } catch (error) {
    return dateStr
  }
}

// Convert Persian date string to display format
const toPersianDigits = (input: string | number | undefined | null): string => {
  if (input === undefined || input === null) return "-"
  return String(input).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(digit, 10)] || digit)
}

interface RefundListProps {
  refunds: RefundedRecord[]
  searchTerm: string
}

export function RefundList({ refunds, searchTerm }: RefundListProps) {
  const [activeCategory, setActiveCategory] = useState("primary")
  const router = useRouter()

  // Filter refunds based on search term and category
  const filteredRefunds = refunds.filter((refund) => {
    const matchesSearch = searchTerm === '' ||
      refund.Description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.phoneNumber?.includes(searchTerm) ||
      refund.AddedPhone?.includes(searchTerm)

    const matchesCategory = activeCategory === "primary" ||
      (activeCategory === "verified" && refund.IsVerify) ||
      (activeCategory === "pending" && !refund.IsVerify)

    return matchesSearch && matchesCategory
  })

  // Sort by CreationDate in descending order (newest first)
  const sortedRefunds = [...filteredRefunds].sort((a, b) => {
    if (!a.CreationDate || !b.CreationDate) return 0
    const dateA = new Date(a.CreationDate).getTime()
    const dateB = new Date(b.CreationDate).getTime()
    return dateB - dateA // Descending order (newest first)
  })

  const handleViewRefund = (refundId: number) => {
    router.push(`/dashboard/refunds/${refundId}`)
  }

  return (
    <motion.div
      dir="rtl"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="bg-white shadow-sm">
        <div className="p-6">
          <div className="mb-6">
            <motion.h2
              className="text-xl font-IranYekanBold text-[#323232] mb-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              لیست استردادها
            </motion.h2>

            {/* Category tabs container with responsive design */}
            <div dir="rtl" className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-2 gap-4 md:gap-0">
              {/* Mobile Dropdown */}
              <motion.div
                className="block md:hidden"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Select
                  value={categories.find(c => c.name === activeCategory)?.displayName || "همه استردادها"}
                  onValueChange={(displayName) => {
                    const category = categories.find(c => c.displayName === displayName);
                    if (category) setActiveCategory(category.name);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[200px] text-right border-[#ccd6e1] focus:border-[#0d5990] font-IranYekanRegular bg-white shadow-sm">
                    <SelectValue placeholder="انتخاب دسته" />
                  </SelectTrigger>
                  <SelectContent className="text-right font-IranYekanRegular max-w-[250px]" dir="rtl">
                    {categories.map((category) => (
                      <SelectItem
                        key={category.name}
                        value={category.displayName}
                        className="text-right cursor-pointer hover:bg-[#f0f7ff] focus:bg-[#f0f7ff] py-2"
                      >
                        <div className="flex items-center gap-2 flex-row-reverse w-full">
                          <Icon
                            icon={category.icon}
                            width="16"
                            height="16"
                            className="text-[#0d5990]"
                          />
                          <span className="font-IranYekanRegular">{category.displayName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>

              {/* Desktop Badges */}
              <motion.div className="hidden md:flex gap-3 flex-row items-center" layout>
                {categories.map((category) => (
                  <CategoryBadge
                    id={category.name}
                    key={category.name}
                    isActive={activeCategory === category.name}
                    onClick={() => setActiveCategory(category.name)}
                  >
                    <Icon icon={category.icon} width="18" height="18" />
                    <span className="font-IranYekanMedium">{category.displayName}</span>
                  </CategoryBadge>
                ))}
              </motion.div>
            </div>
          </div>

          {/* Content based on active category */}
          {activeCategory === "primary" && (
            <motion.div
              className="overflow-x-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="min-w-full">
                {/* Table Header */}
                <motion.div
                  className="grid grid-cols-3 md:grid-cols-6 gap-4 p-4 bg-[#e6f0fa] rounded-t-lg text-sm font-IranYekanMedium text-[#323232]"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <div className="text-center">توضیحات</div>
                  <div className="text-center hidden md:block">تاریخ حرکت</div>
                  <div className="text-center hidden md:block">تاریخ رسیدن</div>
                  <div className="text-center">شماره تماس</div>
                  <div className="text-center">تاریخ ایجاد</div>
                  <div className="text-center">عملیات</div>
                </motion.div>

                {/* Table Body */}
                <div className="space-y-1">
                  {sortedRefunds.length > 0 ? (
                    sortedRefunds.map((refund, index) => (
                      <motion.div
                        key={refund.Id}
                        className={`grid grid-cols-3 md:grid-cols-6 gap-4 p-4 text-sm font-IranYekanRegular ${index % 2 === 0 ? "bg-white" : "bg-[#f6f9ff]"
                          } hover:bg-[#e8f2fc] transition-colors`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.5 + (index * 0.1) }}
                      >
                        <div className="text-center text-[#323232] text-xs md:text-sm">
                          {refund.Description || "-"}
                        </div>
                        <div className="text-center text-[#767676] hidden md:block">
                          {toPersianDigits(refund.DepartureDate || "-")}
                        </div>
                        <div className="text-center text-[#767676] hidden md:block">
                          {toPersianDigits(refund.ArrivalDate || "-")}
                        </div>
                        <div className="text-center text-[#767676]">
                          {toPersianDigits(refund.phoneNumber || refund.AddedPhone || "-")}
                        </div>
                        <div className="text-center text-[#767676]">
                          {formatCreationDate(refund.CreationDate)}
                        </div>
                        <div className="flex justify-center gap-1 md:gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewRefund(refund.Id)}
                            className="h-8 w-8 md:h-8 md:w-8 p-0 text-[#0d5990] hover:bg-[#0d5990] hover:text-white"
                          >
                            <Eye className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      className="text-center py-8 text-[#767676]"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                    >
                      <Users className="h-12 w-12 mx-auto mb-4 text-[#ccd6e1]" />
                      <p className="text-lg font-IranYekanMedium mb-2">هیچ استردادی یافت نشد</p>
                      <p className="text-sm font-IranYekanRegular">فیلترها را تغییر دهید</p>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Verified category view */}
          {activeCategory === "verified" && (
            <motion.div
              className="overflow-x-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="min-w-full">
                <motion.div
                  className="grid grid-cols-3 md:grid-cols-6 gap-4 p-4 bg-[#e6f0fa] rounded-t-lg text-sm font-IranYekanMedium text-[#323232]"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <div className="text-center">توضیحات</div>
                  <div className="text-center hidden md:block">تاریخ حرکت</div>
                  <div className="text-center hidden md:block">تاریخ رسیدن</div>
                  <div className="text-center">شماره تماس</div>
                  <div className="text-center">تاریخ ایجاد</div>
                  <div className="text-center">عملیات</div>
                </motion.div>
                <div className="space-y-1">
                  {sortedRefunds.filter(r => r.IsVerify).length > 0 ? (
                    sortedRefunds.filter(r => r.IsVerify).map((refund, index) => (
                      <motion.div
                        key={refund.Id}
                        className={`grid grid-cols-3 md:grid-cols-6 gap-4 p-4 text-sm font-IranYekanRegular ${index % 2 === 0 ? "bg-white" : "bg-[#f6f9ff]"
                          } hover:bg-[#e8f2fc] transition-colors`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.5 + (index * 0.1) }}
                      >
                        <div className="text-center text-[#323232] text-xs md:text-sm">
                          {refund.Description || "-"}
                        </div>
                        <div className="text-center text-[#767676] hidden md:block">
                          {toPersianDigits(refund.DepartureDate || "-")}
                        </div>
                        <div className="text-center text-[#767676] hidden md:block">
                          {toPersianDigits(refund.ArrivalDate || "-")}
                        </div>
                        <div className="text-center text-[#767676]">
                          {toPersianDigits(refund.phoneNumber || refund.AddedPhone || "-")}
                        </div>
                        <div className="text-center text-[#767676]">
                          {formatCreationDate(refund.CreationDate)}
                        </div>
                        <div className="flex justify-center gap-1 md:gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewRefund(refund.Id)}
                            className="h-8 w-8 md:h-8 md:w-8 p-0 text-[#0d5990] hover:bg-[#0d5990] hover:text-white"
                          >
                            <Eye className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      className="text-center py-8 text-[#767676]"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                    >
                      <Users className="h-12 w-12 mx-auto mb-4 text-[#ccd6e1]" />
                      <p className="text-lg font-IranYekanMedium mb-2">هیچ استرداد تایید شده‌ای یافت نشد</p>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Pending category view */}
          {activeCategory === "pending" && (
            <motion.div
              className="overflow-x-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="min-w-full">
                <motion.div
                  className="grid grid-cols-3 md:grid-cols-6 gap-4 p-4 bg-[#e6f0fa] rounded-t-lg text-sm font-IranYekanMedium text-[#323232]"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <div className="text-center">توضیحات</div>
                  <div className="text-center hidden md:block">تاریخ حرکت</div>
                  <div className="text-center hidden md:block">تاریخ رسیدن</div>
                  <div className="text-center">شماره تماس</div>
                  <div className="text-center">تاریخ ایجاد</div>
                  <div className="text-center">عملیات</div>
                </motion.div>
                <div className="space-y-1">
                  {sortedRefunds.filter(r => !r.IsVerify).length > 0 ? (
                    sortedRefunds.filter(r => !r.IsVerify).map((refund, index) => (
                      <motion.div
                        key={refund.Id}
                        className={`grid grid-cols-3 md:grid-cols-6 gap-4 p-4 text-sm font-IranYekanRegular ${index % 2 === 0 ? "bg-white" : "bg-[#f6f9ff]"
                          } hover:bg-[#e8f2fc] transition-colors`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.5 + (index * 0.1) }}
                      >
                        <div className="text-center text-[#323232] text-xs md:text-sm">
                          {refund.Description || "-"}
                        </div>
                        <div className="text-center text-[#767676] hidden md:block">
                          {toPersianDigits(refund.DepartureDate || "-")}
                        </div>
                        <div className="text-center text-[#767676] hidden md:block">
                          {toPersianDigits(refund.ArrivalDate || "-")}
                        </div>
                        <div className="text-center text-[#767676]">
                          {toPersianDigits(refund.phoneNumber || refund.AddedPhone || "-")}
                        </div>
                        <div className="text-center text-[#767676]">
                          {formatCreationDate(refund.CreationDate)}
                        </div>
                        <div className="flex justify-center gap-1 md:gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewRefund(refund.Id)}
                            className="h-8 w-8 md:h-8 md:w-8 p-0 text-[#0d5990] hover:bg-[#0d5990] hover:text-white"
                          >
                            <Eye className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      className="text-center py-8 text-[#767676]"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                    >
                      <Users className="h-12 w-12 mx-auto mb-4 text-[#ccd6e1]" />
                      <p className="text-lg font-IranYekanMedium mb-2">هیچ استرداد در انتظاری یافت نشد</p>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

const CategoryBadge = ({
  isActive = false,
  children,
  id,
  ...props
}: {
  isActive?: boolean;
} & HTMLMotionProps<"div">) => {
  return (
    <motion.div
      className={`
        flex items-center justify-center gap-1.5 
        px-3 py-2 rounded-lg cursor-pointer
        shadow-sm hover:shadow-md transition-all duration-200
        border-2 font-medium text-sm
        ${isActive
          ? "border-[#c4deff] bg-gradient-to-r from-[#f0f7ff] to-[#f8fbff] text-[#1a74b4] shadow-md"
          : "border-gray-200 bg-white text-gray-600 hover:border-[#c4deff] hover:bg-gray-50"
        }
      `}
      layoutId={id}
      {...props}
    >
      {children}
    </motion.div>
  );
};

