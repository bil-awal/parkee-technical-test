"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuthStore } from "@/store"
import { apiClient } from "@/lib/api/client"
import {
  Car,
  Mail,
  Lock,
  MapPin,
  Loader2,
  Eye,
  EyeOff,
  Shield,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  BarChart3,
  Zap,
  ArrowRight,
  Sparkles,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  gate: z.string().min(1, "Gate wajib dipilih"),
  rememberMe: z.boolean(),
})

type LoginForm = z.infer<typeof loginSchema>

interface Gate {
  value: string
  label: string
  status: "active" | "maintenance"
  vehicles: number
}

interface Feature {
  icon: React.ElementType
  title: string
  description: string
}

interface MockUser {
  email: string
  password: string
  name: string
  role: string
}

interface FormFieldProps {
  label: string
  id: string
  type?: string
  placeholder: string
  icon: React.ElementType
  error?: string
  register: any
  className?: string
  [key: string]: unknown
}

interface GateSelectorProps {
  value: string
  onValueChange: (value: string) => void
  error?: string
}

interface FeatureCardProps {
  feature: Feature
  index: number
}

const gates: Gate[] = [
  { value: "GATE_A", label: "Gate A - Masuk Utama", status: "active", vehicles: 12 },
  { value: "GATE_B", label: "Gate B - Masuk Selatan", status: "active", vehicles: 8 },
  { value: "GATE_C", label: "Gate C - Keluar Utama", status: "active", vehicles: 15 },
  { value: "GATE_D", label: "Gate D - Keluar Selatan", status: "maintenance", vehicles: 0 },
]

const features: Feature[] = [
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Monitor parkir secara real-time",
  },
  {
    icon: Shield,
    title: "Secure System",
    description: "Keamanan data terjamin",
  },
  {
    icon: Zap,
    title: "Fast Processing",
    description: "Proses check-in/out cepat",
  },
]

const FormField = ({
  label,
  id,
  type = "text",
  placeholder,
  icon: Icon,
  error,
  register,
  className,
  ...props
}: FormFieldProps) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="text-base font-medium text-gray-700">
      {label}
    </Label>
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        className={cn(
          "pl-12 h-14 text-base transition-all duration-200 border-gray-200",
          "focus:border-blue-500 focus:ring-4 focus:ring-blue-100",
          "hover:border-gray-300",
          error ? "border-red-500 bg-red-50/50" : "",
          className,
        )}
        {...register}
        {...props}
      />
      {!error && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <CheckCircle className="w-5 h-5 text-green-500 opacity-0 transition-opacity duration-200" />
        </div>
      )}
    </div>
    {error && (
      <Alert variant="destructive" className="py-2">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">{error}</AlertDescription>
      </Alert>
    )}
  </div>
)

const GateSelector = ({
  value,
  onValueChange,
  error,
}: GateSelectorProps) => (
  <div className="space-y-2">
    <Label className="text-base font-medium text-gray-700">Gate Operasional</Label>
    <div className="relative">
      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none z-10" />
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          className={cn(
            "pl-12 h-14 text-base transition-all duration-200 border-gray-200",
            "focus:border-blue-500 focus:ring-4 focus:ring-blue-100",
            "hover:border-gray-300",
            error ? "border-red-500 bg-red-50/50" : "",
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {gates.map((gate) => (
            <SelectItem key={gate.value} value={gate.value} disabled={gate.status === "maintenance"}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div
                    className={cn("w-3 h-3 rounded-full", gate.status === "active" ? "bg-green-500" : "bg-red-500")}
                  />
                  <span>{gate.label}</span>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">{gate.vehicles}</span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    {error && (
      <Alert variant="destructive" className="py-2">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">{error}</AlertDescription>
      </Alert>
    )}
  </div>
)

const FeatureCard = ({ feature, index }: FeatureCardProps) => (
  <div
    className="flex items-center gap-4 p-4 bg-white/50 rounded-2xl border border-gray-200/50 hover:bg-white/80 transition-all duration-300"
    style={{ animationDelay: `${index * 100}ms` }}
  >
    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
      <feature.icon className="w-6 h-6 text-blue-600" />
    </div>
    <div>
      <h3 className="font-semibold text-gray-900">{feature.title}</h3>
      <p className="text-sm text-gray-600">{feature.description}</p>
    </div>
  </div>
)

const LoadingSpinner = () => (
  <div className="flex items-center gap-3">
    <Loader2 className="w-5 h-5 animate-spin" />
    <span>Memproses login...</span>
  </div>
)

export default function LoginPage() {
  const router = useRouter()
  const { setUser, setGate } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [mockUsers, setMockUsers] = useState<MockUser[]>([])
  const [loadingMockUsers, setLoadingMockUsers] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      gate: "GATE_A",
      rememberMe: false,
    },
    mode: "onChange",
  })

  const selectedGate = watch("gate")

  useEffect(() => {
    // Set initial time when component mounts on client
    setCurrentTime(new Date())
    
    // Update time every second
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // Check if already authenticated
    if (apiClient.isAuthenticated()) {
      router.push("/check-in")
    }

    // Load mock users for demo
    loadMockUsers()
  }, [router])

  const loadMockUsers = async () => {
    setLoadingMockUsers(true)
    try {
      const response = await apiClient.getMockUsers()
      setMockUsers(response.data || [])
    } catch (error) {
      console.error("Failed to load mock users:", error)
    } finally {
      setLoadingMockUsers(false)
    }
  }

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)

    try {
      // Call real API login
      const response = await apiClient.login(data.email, data.password, data.rememberMe)
      
      if (response.success && response.data) {
        // Set user data in store
        setUser({
          id: response.data.user.id,
          email: response.data.user.email,
          name: response.data.user.name,
          role: response.data.user.role,
        })
        
        // Set selected gate
        setGate(data.gate)

        toast.success(`Login berhasil! Selamat datang, ${response.data.user.name}.`)
        
        // Redirect to check-in page
        router.push("/check-in")
      } else {
        throw new Error(response.message || "Login gagal")
      }
    } catch (error: unknown) {
      console.error("Login error:", error)
      const errorMessage = error instanceof Error ? error.message : "Login gagal. Periksa email dan password Anda."
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const fillMockUser = (user: MockUser) => {
    setValue("email", user.email)
    setValue("password", user.password)
    toast.info(`Form diisi dengan data: ${user.name}`)
  }

  const selectedGateInfo = gates.find((gate) => gate.value === selectedGate)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Branding & Features */}
        <div className="hidden lg:flex lg:w-1/2 justify-center p-12">
          <div className="max-w-lg">
            {/* Logo & Branding */}
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
                    <Car className="w-9 h-9 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    PARKEE
                  </h1>
                  <p className="text-gray-600 font-medium">Smart Parking Management</p>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-gray-900 leading-tight">
                  Kelola Parkir dengan
                  <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Teknologi Modern
                  </span>
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Sistem manajemen parkir yang efisien, aman, dan mudah digunakan untuk meningkatkan produktivitas
                  operasional Anda.
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Fitur Unggulan</h3>
              {features.map((feature, index) => (
                <FeatureCard key={feature.title} feature={feature} index={index} />
              ))}
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">99.9%</div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">24/7</div>
                <div className="text-sm text-gray-600">Support</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">1000+</div>
                <div className="text-sm text-gray-600">Pengguna</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <Car className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    PARKEE
                  </h1>
                  <p className="text-gray-600 text-sm">Smart Parking System</p>
                </div>
              </div>
            </div>

            {/* Time Display - FIX: Only render when currentTime is available */}
            {currentTime && (
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 rounded-full border border-gray-200/50 shadow-sm">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {currentTime.toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-600">
                    {currentTime.toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            )}

            {/* Login Card */}
            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-xl">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900">Selamat Datang</CardTitle>
                <CardDescription className="text-base text-gray-600">
                  Masuk ke sistem untuk memulai operasional parkir
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Email Field */}
                  <FormField
                    label="Email"
                    id="email"
                    type="email"
                    placeholder="admin@parkee.com"
                    icon={Mail}
                    error={errors.email?.message}
                    register={register("email")}
                  />

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-base font-medium text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className={cn(
                          "pl-12 pr-12 h-14 text-base transition-all duration-200 border-gray-200",
                          "focus:border-blue-500 focus:ring-4 focus:ring-blue-100",
                          "hover:border-gray-300",
                          errors.password ? "border-red-500 bg-red-50/50" : "",
                        )}
                        {...register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <Alert variant="destructive" className="py-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">{errors.password.message}</AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Gate Selector */}
                  <GateSelector
                    value={selectedGate}
                    onValueChange={(value) => setValue("gate", value)}
                    error={errors.gate?.message}
                  />

                  {/* Remember Me */}
                  <div className="flex items-center space-x-2">
                    <input
                      id="rememberMe"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      {...register("rememberMe")}
                    />
                    <Label htmlFor="rememberMe" className="text-sm text-gray-700">
                      Ingat saya selama 30 hari
                    </Label>
                  </div>

                  {/* Selected Gate Info */}
                  {selectedGateInfo && (
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-3 h-3 rounded-full",
                              selectedGateInfo.status === "active" ? "bg-green-500" : "bg-red-500",
                            )}
                          />
                          <div>
                            <p className="font-medium text-blue-900">{selectedGateInfo.label}</p>
                            <p className="text-sm text-blue-700">
                              Status: {selectedGateInfo.status === "active" ? "Aktif" : "Maintenance"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-blue-700">Kendaraan Aktif</p>
                          <p className="font-bold text-blue-900">{selectedGateInfo.vehicles}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-14 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                    disabled={isLoading || !isValid}
                  >
                    {isLoading ? (
                      <LoadingSpinner />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Masuk ke Sistem
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    )}
                  </Button>
                </form>

                {/* Mock Users Demo */}
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-green-900">Demo Users</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={loadMockUsers}
                          disabled={loadingMockUsers}
                          className="h-6 px-2 text-green-700 hover:text-green-800"
                        >
                          <RefreshCw className={cn("w-3 h-3", loadingMockUsers && "animate-spin")} />
                        </Button>
                      </div>
                      <p className="text-sm text-green-800 mb-3">
                        Klik salah satu user di bawah untuk mengisi form otomatis:
                      </p>
                      {mockUsers.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                          {mockUsers.map((user, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => fillMockUser(user)}
                              className="text-left p-2 bg-white rounded-lg border border-green-200 hover:border-green-300 transition-colors text-sm"
                            >
                              <div className="font-medium text-green-900">{user.name}</div>
                              <div className="text-green-700">{user.email} • Role: {user.role}</div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-green-700">
                          {loadingMockUsers ? "Memuat data mock users..." : "Tidak ada data mock users"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* API Info */}
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-amber-900 mb-1">Live API Connection</p>
                      <p className="text-sm text-amber-800">
                        Login menggunakan authentication API dengan JWT token management.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="text-center pt-6">
                <div className="w-full space-y-3">
                  <div className="flex items-center gap-2 justify-center text-sm text-gray-500">
                    <Shield className="w-4 h-4" />
                    <span>Sistem dilindungi dengan enkripsi end-to-end</span>
                  </div>
                  <p className="text-xs text-gray-400">© 2025 Bil Awal. All rights reserved.</p>
                </div>
              </CardFooter>
            </Card>

            {/* Additional Info */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Butuh bantuan?{" "}
                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                  Hubungi Support
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}