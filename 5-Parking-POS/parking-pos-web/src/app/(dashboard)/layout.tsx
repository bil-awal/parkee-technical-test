"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store"
import { apiClient } from "@/lib/api/client"
import { toast } from "sonner"
import {
  LogIn,
  LogOut,
  Car,
  BarChart3,
  Menu,
  X,
  ChevronRight,
  Bell,
  Search,
  Ticket,
  BadgeIcon as IdCard,
  Shield,
  Clock,
  MapPin,
  Activity,
  TrendingUp,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

// Type definitions
interface ValidateTokenResponse {
  success: boolean;
  data: {
    userId: string;
    email: string;
    role: string;
  };
}

const navigationItems = [
  { name: "Dashboard", href: "/reports", icon: BarChart3, color: "indigo", description: "Analisis & Laporan" },
  { name: "Check-In", href: "/check-in", icon: LogIn, color: "green", description: "Kendaraan Masuk" },
  { name: "Check-Out", href: "/check-out", icon: LogOut, color: "red", description: "Kendaraan Keluar" },
  { name: "Member", href: "/members", icon: IdCard, color: "blue", description: "Manajemen Member" },
  { name: "Voucher", href: "/vouchers", icon: Ticket, color: "orange", description: "Kelola Voucher" },
]

const DashboardNavigation: React.FC<{
  isOpen: boolean
  onClose: () => void
}> = ({ isOpen, onClose }) => {
  const pathname = usePathname()
  const router = useRouter()
  const { user, gate, logout } = useAuthStore()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleNavigation = (href: string) => {
    router.push(href)
    onClose()
  }

  const handleLogout = async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    
    try {
      // Call REST API logout
      await apiClient.logout()
      
      // Clear store and redirect
      logout()
      toast.success("Logout berhasil. Sampai jumpa!")
      router.push("/login")
    } catch (error: any) {
      console.error("Logout error:", error)
      
      // Even if API call fails, still logout locally
      logout()
      toast.warning("Logout berhasil (koneksi API bermasalah)")
      router.push("/login")
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden animate-fade-in" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-white/95 backdrop-blur-xl border-r border-gray-200/50 z-50",
          "w-80 flex flex-col transition-all duration-300 ease-out shadow-2xl",
          "lg:translate-x-0 lg:shadow-none lg:bg-white lg:backdrop-blur-none",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Car className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
              </div>
              <div>
                <h1 className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Parkee
                </h1>
                <p className="text-xs text-gray-500 font-medium">Smart Parking System</p>
              </div>
            </div>

            <button onClick={onClose} className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors group">
              <X className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-gray-200/50">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
                  <span className="font-bold text-xl text-blue-600">{user?.name?.charAt(0) || "U"}</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{user?.name || "User"}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    {user?.role || "Operator"}
                  </Badge>
                </div>
              </div>
            </div>

            {gate && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-2xl border border-green-200/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-800">Gate {gate}</p>
                      <p className="text-xs text-green-600">Status Aktif</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-green-700">Online</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">Menu Utama</p>
          </div>
          {navigationItems.map((item, index) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 text-left group relative overflow-hidden",
                  "hover:scale-105 hover:shadow-lg",
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl transform scale-105"
                    : "text-gray-700 hover:bg-gray-50",
                )}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <div
                  className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300",
                    isActive ? "bg-white/20 shadow-lg" : "bg-gray-100 group-hover:bg-white group-hover:shadow-md",
                  )}
                >
                  <Icon
                    className={cn("w-5 h-5 transition-all duration-300", isActive ? "text-white" : "text-gray-600")}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("font-semibold", isActive ? "text-white" : "text-gray-900")}>{item.name}</p>
                  <p className={cn("text-xs", isActive ? "text-white/80" : "text-gray-500")}>{item.description}</p>
                </div>
                {isActive && (
                  <div className="flex items-center">
                    <ChevronRight className="w-5 h-5 text-white" />
                  </div>
                )}

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Quick Stats */}
        <div className="p-4 border-t border-gray-200/50">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700">Hari Ini</p>
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <p className="text-lg font-bold text-blue-600">24</p>
                <p className="text-xs text-gray-600">Check-in</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-600">18</p>
                <p className="text-xs text-gray-600">Check-out</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200/50 space-y-3">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group",
              isLoggingOut 
                ? "bg-gray-50 cursor-not-allowed" 
                : "hover:bg-red-50 hover:scale-105"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
              isLoggingOut 
                ? "bg-gray-200" 
                : "bg-red-100 group-hover:bg-red-200"
            )}>
              {isLoggingOut ? (
                <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
              ) : (
                <LogOut className="w-5 h-5 text-red-600" />
              )}
            </div>
            <span className={cn(
              "font-semibold",
              isLoggingOut ? "text-gray-500" : "text-red-600"
            )}>
              {isLoggingOut ? "Logging out..." : "Logout"}
            </span>
          </button>

          <div className="text-center pt-2">
            <p className="text-xs text-gray-400">Parkee v1.0.0</p>
            <p className="text-xs text-gray-400">© 2025 Bil Awal</p>
          </div>
        </div>
      </aside>
    </>
  )
}

const TopHeader: React.FC<{
  onSidebarToggle: () => void
  pageTitle: string
}> = ({ onSidebarToggle, pageTitle }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const { user } = useAuthStore()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
      <div className="flex items-center justify-between px-4 lg:px-6 py-4">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button
            onClick={onSidebarToggle}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors group"
          >
            <Menu className="w-6 h-6 text-gray-600 group-hover:text-gray-900" />
          </button>

          <div className="flex items-center gap-4">
            <div>
              <h1 className="font-bold text-2xl lg:text-3xl text-gray-900">{pageTitle}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-500 font-medium">
                  {currentTime.toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
                <span className="text-sm text-gray-400">•</span>
                <span className="text-sm text-gray-500">
                  {currentTime.toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Quick Stats */}
          <div className="hidden lg:flex items-center gap-4 mr-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-xl">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-green-700">6 Aktif</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">+12%</span>
            </div>
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative p-3 hover:bg-gray-100 rounded-xl">
            <Bell className="w-5 h-5 text-gray-600" />
            <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
              3
            </Badge>
          </Button>

          {/* User Menu */}
          <div className="hidden md:flex items-center gap-3 ml-2 p-2 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
              <span className="font-bold text-blue-600">{user?.name?.charAt(0) || "U"}</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">{user?.name || "User"}</p>
              <p className="text-xs text-gray-500">{user?.role || "Operator"}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    </header>
  )
}

const DashboardLayout: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const { user, setUser } = useAuthStore()

  const currentPage = navigationItems.find((item) => item.href === pathname)
  const pageTitle = currentPage?.name || "Dashboard"

  // Auth protection
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if token exists
        if (!apiClient.isAuthenticated()) {
          router.push("/login")
          return
        }

        // If no user in store but token exists, validate token
        if (!user) {
          try {
            const response = await apiClient.validateToken() as ValidateTokenResponse
            if (response.success && response.data) {
              // Token valid but no user in store - restore user info
              setUser({
                id: response.data.userId,
                email: response.data.email,
                name: response.data.email.split("@")[0],
                role: response.data.role,
              })
            }
          } catch (error) {
            // Token invalid, redirect to login
            router.push("/login")
            return
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/login")
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [user, router, setUser])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
            <Car className="w-9 h-9 text-white" />
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-medium">Memverifikasi autentikasi...</span>
          </div>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!user || !apiClient.isAuthenticated()) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Navigation */}
      <DashboardNavigation isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="lg:pl-80 min-h-screen flex flex-col">
        {/* Top Header */}
        <TopHeader onSidebarToggle={() => setSidebarOpen(true)} pageTitle={pageTitle} />

        {/* Page Content */}
        <main className="flex-1 relative overflow-hidden">
          <div className="h-full">{children}</div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout