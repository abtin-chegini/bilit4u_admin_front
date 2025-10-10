"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import {
  CreditCard,
  FileText,
  LogOut,
  Users,
  Wallet,
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
import SearchComponent from "@/components/dashboard_admin_buy/plp/new/PLP/Search"
import MyTripsComponent from "@/components/dashboard_admin_buy/trips/MyTripsComponent"
import { PassengerMain } from "@/components/dashboard_admin_buy/passenger/passenger-main"
import { TransactionMain } from "@/components/dashboard_admin_buy/transactions/transaction-main"
import { DashboardHeader } from "./dashboard-header"

const menuItems = [
  { icon: CreditCard, label: "خرید آژانسی", id: "payments" },
  { icon: FileText, label: "خریدهای من", id: "my-purchases" },
  { icon: Users, label: "مسافران", id: "passengers" },
  { icon: Wallet, label: "تراکنش‌ها", id: "transactions" },
]

export default function DashboardLayout() {
  const [activeSection, setActiveSection] = useState("payments")
  const { signOut } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
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
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveSection(item.id)}
                        isActive={activeSection === item.id}
                        tooltip={item.label}
                        className={
                          activeSection === item.id
                            ? "bg-gradient-to-r from-[#0d5990] to-[#0b4875] text-white hover:from-[#0b4875] hover:to-[#094060] shadow-lg border-r-4 border-white [&>svg]:text-white data-[active=true]:group-data-[collapsible=icon]:border-r-0"
                            : "hover:bg-blue-50 hover:text-[#0d5990] hover:shadow-md transition-all duration-200"
                        }
                      >
                        <item.icon className={activeSection === item.id ? "h-5 w-5 text-white" : "h-5 w-5"} />
                        <span className={activeSection === item.id ? "font-IranYekanBold text-white" : "font-IranYekanBold"}>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
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
          <DashboardHeader />

          {/* Main Content */}
          <main className="flex-1 p-6">
            {/* Payments Section */}
            {activeSection === "payments" && (
              <div className="w-full">
                <SearchComponent
                  SourceCity="11320000"
                  DestinationCity="21310000"
                  TravelDate="14040710"
                />
              </div>
            )}

            {/* My Purchases Section */}
            {activeSection === "my-purchases" && (
              <div className="w-full">
                <MyTripsComponent />
              </div>
            )}

            {/* Passengers Section */}
            {activeSection === "passengers" && (
              <div className="w-full">
                <PassengerMain />
              </div>
            )}

            {/* Transactions Section */}
            {activeSection === "transactions" && (
              <div className="w-full">
                <TransactionMain />
              </div>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
