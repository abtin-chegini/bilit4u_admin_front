"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Menu,
  X,
  BarChart3,
  Users,
  CreditCard,
  ShoppingBag,
  MessageSquare,
  Building,
  Building2,
  Settings,
  Bell,
  Search,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import MetricCards from "@/components/dashboard_main/metric-cards"
import DashboardChart from "@/components/dashboard_main/dashboard-chart"
import SearchComponent from "@/components/dashboard_admin_buy/plp/new/PLP/Search"
import { cn } from "@/lib/utils"

const menuItems = [
  { icon: BarChart3, label: "پیشخوان", id: "dashboard" },
  { icon: Users, label: "مدیریت کاربران", id: "users" },
  { icon: CreditCard, label: "پرداخت ها", id: "payments" },
  { icon: ShoppingBag, label: "سفرهای خریداری شده", id: "trips" },
  { icon: MessageSquare, label: "درخواست های پشتیبانی", id: "support" },
  { icon: Building, label: "ترمینال ها", id: "terminals" },
  { icon: Building2, label: "شرکت ها", id: "companies" },
  { icon: Settings, label: "تنظیمات", id: "settings" },
]

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeSection, setActiveSection] = useState("dashboard")
  const { signOut, user } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 " >
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm">
            <FileText className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm">
            <Bell className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0d5990] rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">B</span>
            </div>
            <span className="font-IranYekanBold text-[#0d5990]">Bilit4U</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 font-IranYekanBold"
            >
              خروج
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 font-IranYekanRegular">
            <span>نام ادمین پشتیبانی</span>
            <span>مدیر</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Main Content */}
        <main className={`flex-1 p-6 space-y-6 transition-all duration-300 ${sidebarOpen ? 'mr-[280px]' : 'mr-[80px]'}`}>
          <AnimatePresence mode="wait">
            {activeSection === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <MetricCards />
                <DashboardChart />
              </motion.div>
            )}

            {activeSection === "payments" && (
              <motion.div
                key="payments"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <SearchComponent
                  SourceCity="11320000"
                  DestinationCity="21310000"
                  TravelDate="14040710"
                />
              </motion.div>
            )}

            {activeSection === "users" && (
              <motion.div
                key="users"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center h-96"
              >
                <div className="text-center">
                  <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h2 className="text-2xl font-bold text-gray-600 mb-2">مدیریت کاربران</h2>
                  <p className="text-gray-500">این بخش در حال توسعه است</p>
                </div>
              </motion.div>
            )}

            {activeSection === "trips" && (
              <motion.div
                key="trips"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center h-96"
              >
                <div className="text-center">
                  <ShoppingBag className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h2 className="text-2xl font-bold text-gray-600 mb-2">سفرهای خریداری شده</h2>
                  <p className="text-gray-500">این بخش در حال توسعه است</p>
                </div>
              </motion.div>
            )}

            {activeSection === "support" && (
              <motion.div
                key="support"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center h-96"
              >
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h2 className="text-2xl font-bold text-gray-600 mb-2">درخواست های پشتیبانی</h2>
                  <p className="text-gray-500">این بخش در حال توسعه است</p>
                </div>
              </motion.div>
            )}

            {activeSection === "terminals" && (
              <motion.div
                key="terminals"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center h-96"
              >
                <div className="text-center">
                  <Building className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h2 className="text-2xl font-bold text-gray-600 mb-2">ترمینال ها</h2>
                  <p className="text-gray-500">این بخش در حال توسعه است</p>
                </div>
              </motion.div>
            )}

            {activeSection === "companies" && (
              <motion.div
                key="companies"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center h-96"
              >
                <div className="text-center">
                  <Building2 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h2 className="text-2xl font-bold text-gray-600 mb-2">شرکت ها</h2>
                  <p className="text-gray-500">این بخش در حال توسعه است</p>
                </div>
              </motion.div>
            )}

            {activeSection === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center h-96"
              >
                <div className="text-center">
                  <Settings className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h2 className="text-2xl font-bold text-gray-600 mb-2">تنظیمات</h2>
                  <p className="text-gray-500">این بخش در حال توسعه است</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Sidebar */}
        <AnimatePresence mode="wait">
          <motion.aside
            initial={{ width: sidebarOpen ? 280 : 80 }}
            animate={{ width: sidebarOpen ? 280 : 80 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-white border-r border-gray-200 h-[calc(100vh-73px)] overflow-hidden fixed right-0 top-[73px] z-40 shadow-lg"
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 bg-[#2caffe] rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg font-bold">B</span>
                </div>
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <h2 className="text-lg font-IranYekanBold text-gray-800">پنل مدیریت</h2>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <nav className="p-4 space-y-1 pb-24">
              {menuItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="relative group">
                    <Button
                      variant="ghost"
                      onClick={() => setActiveSection(item.id)}
                      className={cn(
                        "w-full justify-between gap-3 h-14 text-right px-4 py-3 rounded-lg transition-all duration-200 group",
                        "hover:bg-gray-50 hover:shadow-sm hover:scale-105",
                        activeSection === item.id
                          ? "bg-[#0d5990]/10 text-[#0d5990] border-r-4 border-[#0d5990] shadow-md"
                          : "text-gray-700 hover:text-gray-900"
                      )}
                    >
                      <AnimatePresence>
                        {sidebarOpen && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-sm font-IranYekanBold whitespace-nowrap overflow-hidden flex-1 text-right"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      <item.icon className={cn(
                        "h-5 w-5 flex-shrink-0 transition-colors duration-200",
                        activeSection === item.id
                          ? "text-[#0d5990]"
                          : "text-gray-500 group-hover:text-gray-700"
                      )} />
                    </Button>

                    {/* Hover Popover */}
                    {!sidebarOpen && (
                      <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 px-3 py-2 bg-gray-900 text-white text-sm font-IranYekanBold rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50">
                        {item.label}
                        <div className="absolute left-full top-1/2 -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-900 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </nav>

            {/* Sidebar Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-gray-50">
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-between gap-3 h-12 px-4 py-3 rounded-lg transition-all duration-200 group hover:bg-red-50 hover:text-red-600 text-gray-700"
              >
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm font-IranYekanBold whitespace-nowrap overflow-hidden flex-1 text-right"
                    >
                      خروج
                    </motion.span>
                  )}
                </AnimatePresence>
                <X className="h-5 w-5 flex-shrink-0 transition-colors duration-200 text-gray-500 group-hover:text-red-600" />
              </Button>
            </div>
          </motion.aside>
        </AnimatePresence>
      </div>
    </div>
  )
}
