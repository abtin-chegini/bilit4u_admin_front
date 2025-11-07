"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter, usePathname } from "next/navigation"
import {
  CreditCard,
  FileText,
  LogOut,
  Users,
  Wallet,
  MessageSquare,
  Building2,
} from "lucide-react"
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarInset,
} from "@/components/ui/sidebar"
import { DashboardHeader } from "@/components/dashboard_main/dashboard-header"
import ProtectedRoute from "@/components/ProtectedRoute"

const menuItems = [
  { icon: CreditCard, label: "خرید آژانسی", id: "payments", path: "/dashboard" },
  { icon: FileText, label: "خریدهای من", id: "my-purchases", path: "/dashboard/my-purchases" },
  { icon: Users, label: "مسافران", id: "passengers", path: "/dashboard/passengers" },
  { icon: Building2, label: "افزودن شرکت", id: "companies", path: "/dashboard/companies" },
  { icon: Wallet, label: "تراکنش‌ها", id: "transactions", path: "/dashboard/transactions" },
  { icon: MessageSquare, label: "درخواست های پشتیبانی", id: "support", path: "/dashboard/support" },
]

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Determine active section based on pathname
  const getActiveSection = () => {
    if (!pathname) return 'payments'
    
    if (pathname.startsWith('/dashboard/support')) {
      return 'support'
    }
    if (pathname.startsWith('/dashboard/my-purchases')) {
      return 'my-purchases'
    }
    if (pathname.startsWith('/dashboard/passengers')) {
      return 'passengers'
    }
    if (pathname.startsWith('/dashboard/companies')) {
      return 'companies'
    }
    if (pathname.startsWith('/dashboard/transactions')) {
      return 'transactions'
    }
    return 'payments'
  }

  const [activeSection, setActiveSection] = useState(() => getActiveSection())

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  // Update active section when pathname changes
  useEffect(() => {
    const newActiveSection = getActiveSection()
    setActiveSection(newActiveSection)
  }, [pathname])

  const handleMenuClick = (item: typeof menuItems[0]) => {
    router.push(item.path)
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-gray-50" dir="rtl">
        {/* Sidebar - Right Side */}
        <Sidebar side="right" collapsible="icon" className="border-l">
          <SidebarHeader className="border-b border-gray-200 p-4">
            <div className="flex items-center justify-center relative">
              {/* Full logo - visible when expanded */}
              <img
                src="https://cdn.bilit4u.com/logo/logob4u320.jpg"
                alt="بلیط فور یو"
                className="h-8 w-auto object-contain group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:invisible transition-all duration-200"
              />
              {/* Collapsed logo - visible when collapsed */}
              <img
                src="https://cdn.bilit4u.com/logo/Bilit4u_Admin_logo.svg"
                alt="Admin"
                className="h-14 w-14 object-contain opacity-0 invisible absolute group-data-[collapsible=icon]:opacity-100 group-data-[collapsible=icon]:visible transition-all duration-200"
              />
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => {
                    const isActive = activeSection === item.id || 
                      (item.id === 'support' && pathname?.startsWith('/dashboard/support'))
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          onClick={() => handleMenuClick(item)}
                          isActive={isActive}
                          tooltip={item.label}
                          className={
                            isActive
                              ? "bg-gradient-to-r from-[#0d5990] to-[#0b4875] text-white hover:from-[#0b4875] hover:to-[#094060] shadow-lg border-r-4 border-white [&>svg]:text-white data-[active=true]:group-data-[collapsible=icon]:border-r-0"
                              : "hover:bg-blue-50 hover:text-[#0d5990] hover:shadow-md transition-all duration-200"
                          }
                        >
                          <item.icon className={isActive ? "h-5 w-5 text-white" : "h-5 w-5"} />
                          <span className={isActive ? "font-IranYekanBold text-white" : "font-IranYekanBold"}>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-200 p-3">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  className="hover:bg-red-50 hover:text-red-600 text-gray-700 hover:shadow-md hover:border-r-4 hover:border-red-400 transition-all duration-200"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-IranYekanBold">خروج از حساب</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content Area */}
        <SidebarInset className="flex-1 flex flex-col">
          {/* Header */}
          <DashboardHeader showSidebarTrigger={true} showBackButton={pathname !== '/dashboard'} />

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardLayoutContent>
        {children}
      </DashboardLayoutContent>
    </ProtectedRoute>
  )
}

