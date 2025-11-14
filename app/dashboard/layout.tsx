"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter, usePathname } from "next/navigation"
import {
  LogOut,
  Ticket,
  List,
  Users,
  RefreshCw,
  Plus,
  FileText,
  MessageSquare,
  User,
  Building2,
  MapPin,
  ChevronDown,
  ChevronRight,
  BarChart3,
  CreditCard,
  ShoppingBag,
  Wallet,
  MessageCircle,
  Settings,
  Layout,
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
  SidebarInset,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { DashboardHeader } from "@/components/dashboard_main/dashboard-header"
import ProtectedRoute from "@/components/ProtectedRoute"
import { menuService, MenuItem } from "@/services/menuService"

// Icon mapping function
const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    TicketIcon: Ticket,
    ListIcon: List,
    UsersIcon: Users,
    RefundIcon: RefreshCw,
    AddIcon: Plus,
    ReportIcon: BarChart3,
    ChartIcon: BarChart3,
    RefundReportIcon: FileText,
    MessageIcon: MessageCircle,
    UserIcon: User,
    TerminalIcon: MapPin,
    CompanyIcon: Building2,
    ContentIcon: Layout,
    CreditCardIcon: CreditCard,
    FileTextIcon: FileText,
    WalletIcon: Wallet,
    MessageSquareIcon: MessageSquare,
    ShoppingBagIcon: ShoppingBag,
    SettingsIcon: Settings,
  }
  return iconMap[iconName] || FileText
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { signOut, session } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set())

  // Fetch menus from API
  useEffect(() => {
    const fetchMenus = async () => {
      if (!session?.access_token) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await menuService.getMenuAndRole(session.access_token)
        // Sort menus by order
        const sortedMenus = [...response.menus].sort((a, b) => a.order - b.order)
        setMenus(sortedMenus)
      } catch (error: any) {
        console.error("Error fetching menus:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMenus()
  }, [session?.access_token])

  // Convert API path to dashboard path for comparison
  const getDashboardPath = (apiPath: string): string => {
    const pathMap: Record<string, string> = {
      "/support/my-tickets": "/dashboard/my-purchases",
      "/support/passengers": "/dashboard/passengers",
      "/support/buy-tickets": "/dashboard",
      "/support/buy-tickets/new": "/dashboard",
      "/support/refunds": "/dashboard/refunds",
      "/support/tickets": "/dashboard/support",
      "/support/tickets/view": "/dashboard/support",
      "/support/tickets/answer": "/dashboard/support",
      "/reports/sales": "/dashboard/sales",
      "/reports/refunds": "/dashboard/refunds",
      "/admin/usermanagement": "/dashboard/users",
      "/content/terminals": "/dashboard/terminals",
      "/content/companies": "/dashboard/companies",
    }

    if (pathMap[apiPath]) {
      return pathMap[apiPath]
    } else if (apiPath.startsWith("/support/")) {
      return `/dashboard${apiPath.replace("/support", "")}`
    } else if (apiPath.startsWith("/reports/")) {
      return `/dashboard${apiPath.replace("/reports", "")}`
    } else if (apiPath.startsWith("/admin/")) {
      return `/dashboard${apiPath.replace("/admin", "")}`
    } else if (apiPath.startsWith("/content/")) {
      return `/dashboard${apiPath.replace("/content", "")}`
    } else if (!apiPath.startsWith("/dashboard")) {
      return `/dashboard${apiPath}`
    }
    return apiPath
  }

  // Get all menu items (including nested children) as a flat list
  const getAllMenuItems = (menuList: MenuItem[]): MenuItem[] => {
    const allItems: MenuItem[] = []
    menuList.forEach((menu) => {
      if (menu.children && menu.children.length > 0) {
        allItems.push(...getAllMenuItems(menu.children))
      } else {
        allItems.push(menu)
      }
    })
    return allItems
  }

  // Find the most specific active menu item
  const getActiveMenuPath = (): string | null => {
    if (!pathname || menus.length === 0) return null

    const allMenuItems = getAllMenuItems(menus)
    let mostSpecificPath: string | null = null
    let mostSpecificLength = 0

    for (const item of allMenuItems) {
      if (item.children && item.children.length > 0) continue // Skip parents
      const itemPath = getDashboardPath(item.path)

      // Check for exact match first (highest priority)
      if (pathname === itemPath) {
        return itemPath // Exact match wins immediately
      }

      // Check for prefix match
      if (pathname.startsWith(itemPath + "/")) {
        if (itemPath.length > mostSpecificLength) {
          mostSpecificPath = itemPath
          mostSpecificLength = itemPath.length
        }
      }
    }

    return mostSpecificPath
  }

  // Check if a menu item is directly active
  // Only the most specific (longest path) match should be active
  const isMenuDirectlyActive = (menu: MenuItem): boolean => {
    if (!pathname) return false

    // Parent menus with children are never selectable/active
    if (menu.children && menu.children.length > 0) {
      return false
    }

    const dashboardPath = getDashboardPath(menu.path)
    const activePath = getActiveMenuPath()

    // Only active if this is the most specific match
    return activePath === dashboardPath
  }

  // Check if any child of a menu is active
  const hasActiveChild = (menu: MenuItem): boolean => {
    if (!menu.children) return false
    return menu.children.some((child) => isMenuDirectlyActive(child))
  }

  // Toggle menu open/close
  const toggleMenu = (menuKey: string) => {
    setOpenMenus((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(menuKey)) {
        newSet.delete(menuKey)
      } else {
        newSet.add(menuKey)
      }
      return newSet
    })
  }

  // Auto-open menus that contain active child
  useEffect(() => {
    if (!pathname || menus.length === 0) return

    const activeMenuKeys = new Set<string>()
    menus.forEach((menu) => {
      if (hasActiveChild(menu)) {
        activeMenuKeys.add(menu.key)
      }
    })

    setOpenMenus((prev) => {
      const newSet = new Set(prev)
      activeMenuKeys.forEach((key) => newSet.add(key))
      return newSet
    })
  }, [pathname, menus])

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  const handleMenuClick = (path: string) => {
    const dashboardPath = getDashboardPath(path)
    router.push(dashboardPath)
  }

  const renderMenuItem = (menu: MenuItem) => {
    const IconComponent = getIconComponent(menu.icon)
    const hasChildren = menu.children && menu.children.length > 0
    const isOpen = openMenus.has(menu.key)

    if (hasChildren) {
      // Parent menu with children - use Collapsible (not selectable, only expandable)
      return (
        <Collapsible key={menu.key} open={isOpen} onOpenChange={() => toggleMenu(menu.key)}>
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                isActive={false}
                tooltip={menu.label}
                className="hover:bg-blue-50 hover:text-[#0d5990] hover:shadow-md transition-all duration-200"
              >
                <IconComponent className="h-5 w-5" />
                <span className="font-IranYekanBold">
                  {menu.label}
                </span>
                {isOpen ? (
                  <ChevronDown className="mr-auto h-4 w-4" />
                ) : (
                  <ChevronRight className="mr-auto h-4 w-4" />
                )}
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {menu.children
                  ?.sort((a, b) => a.order - b.order)
                  .map((child) => {
                    const ChildIcon = getIconComponent(child.icon)
                    const isChildActive = isMenuDirectlyActive(child)
                    return (
                      <SidebarMenuSubItem key={child.key}>
                        <SidebarMenuSubButton
                          isActive={isChildActive}
                          onClick={() => handleMenuClick(child.path)}
                          className={
                            isChildActive
                              ? "bg-[#0d5990] text-white hover:bg-[#0b4875]"
                              : "hover:bg-blue-50 hover:text-[#0d5990]"
                          }
                        >
                          <ChildIcon className="h-4 w-4" />
                          <span className="font-IranYekanRegular">{child.label}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    )
                  })}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      )
    } else {
      // Single menu item without children - can be selected
      const isActive = isMenuDirectlyActive(menu)
      return (
        <SidebarMenuItem key={menu.key}>
          <SidebarMenuButton
            onClick={() => handleMenuClick(menu.path)}
            isActive={isActive}
            tooltip={menu.label}
            className={
              isActive
                ? "bg-gradient-to-r from-[#0d5990] to-[#0b4875] text-white hover:from-[#0b4875] hover:to-[#094060] shadow-lg border-r-4 border-white [&>svg]:text-white data-[active=true]:group-data-[collapsible=icon]:border-r-0"
                : "hover:bg-blue-50 hover:text-[#0d5990] hover:shadow-md transition-all duration-200"
            }
          >
            <IconComponent className={isActive ? "h-5 w-5 text-white" : "h-5 w-5"} />
            <span className={isActive ? "font-IranYekanBold text-white" : "font-IranYekanBold"}>
              {menu.label}
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )
    }
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
                {loading ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0D5990]"></div>
                  </div>
                ) : (
                  <SidebarMenu>
                    {menus.map((menu) => renderMenuItem(menu))}
                  </SidebarMenu>
                )}
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

