"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Eye } from "lucide-react"
import { Icon } from "@iconify/react/dist/iconify.js"
import { motion, HTMLMotionProps } from "framer-motion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { ApiUser } from "@/services/userService"
import numberConvertor from "@/lib/numberConvertor"

const categories = [
  {
    name: "primary",
    displayName: "همه کاربران",
    accentColor: "#ECF4FC",
    icon: "solar:users-group-rounded-bold",
  },
  {
    name: "active",
    displayName: "کاربران فعال",
    accentColor: "#ECF4FC",
    icon: "solar:user-check-rounded-bold",
  },
  {
    name: "inactive",
    displayName: "کاربران غیرفعال",
    accentColor: "#ECF4FC",
    icon: "solar:user-block-rounded-bold",
  },
]

interface UserListProps {
  users: ApiUser[]
  searchTerm: string
  statusFilter: string
  onViewUser: (userId: number) => void
}

export function UserList({ users, searchTerm, statusFilter, onViewUser }: UserListProps) {
  const [activeCategory, setActiveCategory] = useState("primary")
  const router = useRouter()

  // Filter users based on search term and status filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phoneNumber?.includes(searchTerm) ||
      user.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive)

    return matchesSearch && matchesStatus
  })

  const handleRowClick = (userId: number) => {
    router.push(`/dashboard/users/${userId}`)
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
              لیست کاربران
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
                  value={categories.find(c => c.name === activeCategory)?.displayName || "همه کاربران"}
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
                  <div className="text-center">نام</div>
                  <div className="text-center hidden md:block">ایمیل</div>
                  <div className="text-center hidden md:block">شماره تماس</div>
                  <div className="text-center hidden md:block">نقش</div>
                  <div className="text-center hidden md:block">وضعیت</div>
                  <div className="text-center">عملیات</div>
                </motion.div>

                {/* Table Body */}
                <div className="space-y-1">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user, index) => (
                      <motion.div
                        key={user.id}
                        className={`grid grid-cols-3 md:grid-cols-6 gap-4 p-4 text-sm font-IranYekanRegular cursor-pointer ${index % 2 === 0 ? "bg-white" : "bg-[#f6f9ff]"
                          } hover:bg-[#e8f2fc] transition-colors`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.5 + (index * 0.1) }}
                        onClick={() => handleRowClick(user.id)}
                      >
                        <div className="text-center text-[#323232]">{user.name || "-"}</div>
                        <div className="text-center text-[#767676] hidden md:block">{user.email || "-"}</div>
                        <div className="text-center text-[#767676] hidden md:block">{numberConvertor(user.phoneNumber || "-")}</div>
                        <div className="text-center hidden md:block">
                          <Badge
                            variant="secondary"
                            className="text-xs bg-[#e1f0ff] text-[#0d5990] border border-[#b8d4f0]"
                          >
                            {user.roleName || "-"}
                          </Badge>
                        </div>
                        <div className="text-center hidden md:block">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${user.isActive
                              ? 'bg-[#e1f0ff] text-[#0d5990] border border-[#b8d4f0]'
                              : 'bg-[#f0f7ff] text-[#767676] border border-[#ccd6e1]'
                              }`}
                          >
                            {user.isActive ? "فعال" : "غیرفعال"}
                          </Badge>
                        </div>
                        <div className="flex justify-center gap-1 md:gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRowClick(user.id)
                            }}
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
                      <p className="text-lg font-IranYekanMedium mb-2">هیچ کاربری یافت نشد</p>
                      <p className="text-sm font-IranYekanRegular">فیلترها را تغییر دهید</p>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Other category views */}
          {activeCategory === "active" && (
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
                  <div className="text-center">نام</div>
                  <div className="text-center hidden md:block">ایمیل</div>
                  <div className="text-center hidden md:block">شماره تماس</div>
                  <div className="text-center hidden md:block">نقش</div>
                  <div className="text-center hidden md:block">وضعیت</div>
                  <div className="text-center">عملیات</div>
                </motion.div>
                <div className="space-y-1">
                  {filteredUsers.filter(u => u.isActive).length > 0 ? (
                    filteredUsers.filter(u => u.isActive).map((user, index) => (
                      <motion.div
                        key={user.id}
                        className={`grid grid-cols-3 md:grid-cols-6 gap-4 p-4 text-sm font-IranYekanRegular cursor-pointer ${index % 2 === 0 ? "bg-white" : "bg-[#f6f9ff]"
                          } hover:bg-[#e8f2fc] transition-colors`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.5 + (index * 0.1) }}
                        onClick={() => handleRowClick(user.id)}
                      >
                        <div className="text-center text-[#323232]">{user.name || "-"}</div>
                        <div className="text-center text-[#767676] hidden md:block">{user.email || "-"}</div>
                        <div className="text-center text-[#767676] hidden md:block">{numberConvertor(user.phoneNumber || "-")}</div>
                        <div className="text-center hidden md:block">
                          <Badge
                            variant="secondary"
                            className="text-xs bg-[#e1f0ff] text-[#0d5990] border border-[#b8d4f0]"
                          >
                            {user.roleName || "-"}
                          </Badge>
                        </div>
                        <div className="text-center hidden md:block">
                          <Badge
                            variant="secondary"
                            className="text-xs bg-[#e1f0ff] text-[#0d5990] border border-[#b8d4f0]"
                          >
                            فعال
                          </Badge>
                        </div>
                        <div className="flex justify-center gap-1 md:gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRowClick(user.id)
                            }}
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
                      <p className="text-lg font-IranYekanMedium mb-2">هیچ کاربر فعالی یافت نشد</p>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeCategory === "inactive" && (
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
                  <div className="text-center">نام</div>
                  <div className="text-center hidden md:block">ایمیل</div>
                  <div className="text-center hidden md:block">شماره تماس</div>
                  <div className="text-center hidden md:block">نقش</div>
                  <div className="text-center hidden md:block">وضعیت</div>
                  <div className="text-center">عملیات</div>
                </motion.div>
                <div className="space-y-1">
                  {filteredUsers.filter(u => !u.isActive).length > 0 ? (
                    filteredUsers.filter(u => !u.isActive).map((user, index) => (
                      <motion.div
                        key={user.id}
                        className={`grid grid-cols-3 md:grid-cols-6 gap-4 p-4 text-sm font-IranYekanRegular cursor-pointer ${index % 2 === 0 ? "bg-white" : "bg-[#f6f9ff]"
                          } hover:bg-[#e8f2fc] transition-colors`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.5 + (index * 0.1) }}
                        onClick={() => handleRowClick(user.id)}
                      >
                        <div className="text-center text-[#323232]">{user.name || "-"}</div>
                        <div className="text-center text-[#767676] hidden md:block">{user.email || "-"}</div>
                        <div className="text-center text-[#767676] hidden md:block">{numberConvertor(user.phoneNumber || "-")}</div>
                        <div className="text-center hidden md:block">
                          <Badge
                            variant="secondary"
                            className="text-xs bg-[#e1f0ff] text-[#0d5990] border border-[#b8d4f0]"
                          >
                            {user.roleName || "-"}
                          </Badge>
                        </div>
                        <div className="text-center hidden md:block">
                          <Badge
                            variant="secondary"
                            className="text-xs bg-[#f0f7ff] text-[#767676] border border-[#ccd6e1]"
                          >
                            غیرفعال
                          </Badge>
                        </div>
                        <div className="flex justify-center gap-1 md:gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRowClick(user.id)
                            }}
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
                      <p className="text-lg font-IranYekanMedium mb-2">هیچ کاربر غیرفعالی یافت نشد</p>
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

