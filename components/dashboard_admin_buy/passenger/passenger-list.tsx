"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Edit, Trash2, Plus } from "lucide-react"
import { AddPassengerDialog } from "./add-passenger-dialog"
import { Icon } from "@iconify/react/dist/iconify.js"
import { motion, HTMLMotionProps } from "framer-motion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import numberConvertor from "@/lib/numberConvertor"

const categories = [
  {
    name: "primary",
    displayName: "اتوبوس",
    accentColor: "#ECF4FC",
    icon: "solar:bus-linear",
  },
  {
    name: "train",
    displayName: "قطار",
    accentColor: "#ECF4FC",
    icon: "hugeicons:train-01",
  },
  {
    name: "airplane",
    displayName: "هواپیما",
    accentColor: "#ECF4FC",
    icon: "hugeicons:airplane-mode",
  },
  {
    name: "hotel",
    displayName: "هتل",
    accentColor: "#ECF4FC",
    icon: "solar:buildings-2-linear",
  },
  {
    name: "house",
    displayName: "اقامتگاه",
    accentColor: "#ECF4FC",
    icon: "solar:home-linear",
  },
  {
    name: "tour",
    displayName: "تور",
    accentColor: "#ECF4FC",
    icon: "solar:suitcase-tag-linear",
  },
]

// Format numeric date (e.g., "13720513") to Persian formatted date (e.g., "۱۳۷۲/۰۵/۱۳")
const formatDateOfBirth = (dateStr?: string): string => {
  if (!dateStr || dateStr.length !== 8) {
    return '-'
  }

  try {
    // Extract year, month, day from the 8-digit string (YYYYMMDD)
    const year = dateStr.substring(0, 4)
    const month = dateStr.substring(4, 6)
    const day = dateStr.substring(6, 8)

    // Format as YYYY/MM/DD and convert to Persian digits
    const formattedDate = `${year}/${month}/${day}`
    return numberConvertor(formattedDate)
  } catch (error) {
    console.error('Error formatting date of birth:', error)
    return '-'
  }
}

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

interface PassengerListProps {
  passengers: Passenger[]
  searchTerm: string
  genderFilter: string
  onOpenAddDialog: () => void
  onEditPassenger: (passenger: Passenger) => void
  onDeletePassenger: (passengerId: number) => void
  isProfileReady: boolean
}

export function PassengerList({ passengers, searchTerm, genderFilter, onOpenAddDialog, onEditPassenger, onDeletePassenger, isProfileReady }: PassengerListProps) {
  const [activeCategory, setActiveCategory] = useState("primary")
  const [passengerToDelete, setPassengerToDelete] = useState<Passenger | null>(null)

  // Handle delete confirmation
  const handleDeleteClick = (passenger: Passenger) => {
    setPassengerToDelete(passenger)
  }

  const confirmDelete = () => {
    if (passengerToDelete) {
      onDeletePassenger(passengerToDelete.id)
      setPassengerToDelete(null)
    }
  }

  const cancelDelete = () => {
    setPassengerToDelete(null)
  }

  // Filter passengers based on search term and gender filter
  const filteredPassengers = passengers.filter(passenger => {
    const matchesSearch = searchTerm === '' ||
      passenger.name.includes(searchTerm) ||
      passenger.family.includes(searchTerm) ||
      passenger.nationalId.includes(searchTerm) ||
      (passenger.dateOfBirth && passenger.dateOfBirth.includes(searchTerm))

    const matchesGender = genderFilter === 'all' || passenger.gender === genderFilter

    return matchesSearch && matchesGender
  })

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
              لیست مسافران
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
                  value={categories.find(c => c.name === activeCategory)?.displayName || "اتوبوس"}
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

              <motion.div
                className="w-full md:w-auto"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Button
                  onClick={onOpenAddDialog}
                  disabled={!isProfileReady}
                  className={`w-full md:w-auto flex items-center justify-center gap-2 font-IranYekanMedium ${
                    isProfileReady 
                      ? 'bg-gradient-to-r from-[#0D5990] to-[#1A74B4] hover:from-[#0b4d7a] hover:to-[#155a8a] text-white' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {isProfileReady ? 'افزودن مسافر جدید' : 'در حال بارگذاری...'}
                  </span>
                  <span className="sm:hidden">
                    {isProfileReady ? 'افزودن مسافر' : 'بارگذاری...'}
                  </span>
                </Button>
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
                  <div className="text-center">نام</div>
                  <div className="text-center">نام خانوادگی</div>
                  <div className="text-center hidden md:block">کد ملی</div>
                  <div className="text-center hidden md:block"> تاریخ تولد </div>
                  <div className="text-center hidden md:block">جنسیت</div>
                  <div className="text-center">عملیات</div>
                </motion.div>

                {/* Table Body */}
                <div className="space-y-1">
                  {filteredPassengers.length > 0 ? (
                    filteredPassengers.map((passenger, index) => (
                      <motion.div
                        key={passenger.id}
                        className={`grid grid-cols-3 md:grid-cols-6 gap-4 p-4 text-sm font-IranYekanRegular ${index % 2 === 0 ? "bg-white" : "bg-[#f6f9ff]"
                          } hover:bg-[#e8f2fc] transition-colors`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.5 + (index * 0.1) }}
                      >
                        <div className="text-center text-[#323232]">{passenger.name}</div>
                        <div className="text-center text-[#323232]">{passenger.family}</div>
                        <div className="text-center text-[#767676] hidden md:block">{passenger.nationalId}</div>
                        <div className="text-center text-[#767676] hidden md:block">{formatDateOfBirth(passenger.dateOfBirth)}</div>
                        <div className="text-center hidden md:block">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${passenger.gender === 'مرد'
                              ? 'bg-[#e1f0ff] text-[#0d5990] border border-[#b8d4f0]'
                              : 'bg-[#f0f7ff] text-[#1a74b4] border border-[#c4deff]'
                              }`}
                          >
                            {passenger.gender}
                          </Badge>
                        </div>
                        <div className="flex justify-center gap-1 md:gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEditPassenger(passenger)}
                            className="h-8 w-8 md:h-8 md:w-8 p-0 text-[#0d5990] hover:bg-[#0d5990] hover:text-white"
                          >
                            <Edit className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteClick(passenger)}
                            className="h-8 w-8 md:h-8 md:w-8 p-0 text-[#ae3232] hover:bg-[#ae3232] hover:text-white"
                          >
                            <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
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
                      <p className="text-lg font-IranYekanMedium mb-2">هیچ مسافری یافت نشد</p>
                      <p className="text-sm font-IranYekanRegular">فیلترها را تغییر دهید یا مسافر جدیدی اضافه کنید</p>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Other category views */}
          {activeCategory === "train" && (
            <motion.div
              className="text-center py-12 text-[#767676]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Icon icon="hugeicons:train-01" className="h-16 w-16 mx-auto mb-4 text-[#ccd6e1]" />
              <p className="text-lg font-IranYekanMedium mb-2">مسافران قطار</p>
              <p className="text-sm font-IranYekanRegular">به زودی...</p>
            </motion.div>
          )}

          {activeCategory === "airplane" && (
            <motion.div
              className="text-center py-12 text-[#767676]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Icon icon="hugeicons:airplane-mode" className="h-16 w-16 mx-auto mb-4 text-[#ccd6e1]" />
              <p className="text-lg font-IranYekanMedium mb-2">مسافران هواپیما</p>
              <p className="text-sm font-IranYekanRegular">به زودی...</p>
            </motion.div>
          )}

          {activeCategory === "hotel" && (
            <motion.div
              className="text-center py-12 text-[#767676]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Icon icon="solar:buildings-2-linear" className="h-16 w-16 mx-auto mb-4 text-[#ccd6e1]" />
              <p className="text-lg font-IranYekanMedium mb-2">مهمانان هتل</p>
              <p className="text-sm font-IranYekanRegular">به زودی...</p>
            </motion.div>
          )}

          {activeCategory === "house" && (
            <motion.div
              className="text-center py-12 text-[#767676]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Icon icon="solar:home-linear" className="h-16 w-16 mx-auto mb-4 text-[#ccd6e1]" />
              <p className="text-lg font-IranYekanMedium mb-2">مهمانان اقامتگاه</p>
              <p className="text-sm font-IranYekanRegular">به زودی...</p>
            </motion.div>
          )}

          {activeCategory === "tour" && (
            <motion.div
              className="text-center py-12 text-[#767676]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Icon icon="solar:suitcase-tag-linear" className="h-16 w-16 mx-auto mb-4 text-[#ccd6e1]" />
              <p className="text-lg font-IranYekanMedium mb-2">مسافران تور</p>
              <p className="text-sm font-IranYekanRegular">به زودی...</p>
            </motion.div>
          )}
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      {passengerToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-IranYekanBold text-gray-900 mb-2">
                حذف مسافر
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                آیا مطمئن هستید که می‌خواهید مسافر{' '}
                <span className="font-IranYekanMedium text-gray-900">
                  {passengerToDelete.name} {passengerToDelete.family}
                </span>{' '}
                را حذف کنید؟
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-sm font-IranYekanMedium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-IranYekanMedium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  حذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
