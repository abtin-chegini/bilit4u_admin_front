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
import { cn } from "@/lib/utils"

const menuItems = [
  { icon: BarChart3, label: "پیشخوان", href: "/" },
  { icon: Users, label: "مدیریت کاربران", href: "/users" },
  { icon: CreditCard, label: "پرداخت ها", href: "/payments" },
  { icon: ShoppingBag, label: "سفرهای خریداری شده", href: "/trips" },
  { icon: MessageSquare, label: "درخواست های پشتیبانی", href: "/support" },
  { icon: Building, label: "ترمینال ها", href: "/terminals" },
  { icon: Building2, label: "شرکت ها", href: "/companies" },
  { icon: Settings, label: "تنظیمات", href: "/settings" },
]

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { signOut, user } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 rtl" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>نام ادمین پشتیبانی</span>
            <span>مدیر</span>
          </div>
        </div>

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
            <div className="w-8 h-8 bg-[#2caffe] rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">B</span>
            </div>
            <span className="font-bold text-[#2caffe]">Bilit4U</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              خروج
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <AnimatePresence mode="wait">
          <motion.aside
            initial={{ width: sidebarOpen ? 280 : 80 }}
            animate={{ width: sidebarOpen ? 280 : 80 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-white border-l border-gray-200 h-[calc(100vh-73px)] overflow-hidden"
          >
            <nav className="p-4 space-y-2">
              {menuItems.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 h-12 text-right",
                      index === 0 && "bg-[#2caffe]/10 text-[#2caffe] border-r-2 border-[#2caffe]",
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <AnimatePresence>
                      {sidebarOpen && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-sm font-medium whitespace-nowrap overflow-hidden"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>
                </motion.div>
              ))}
            </nav>
          </motion.aside>
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 p-6 space-y-6">
          <MetricCards />
          <DashboardChart />
        </main>
      </div>
    </div>
  )
}
