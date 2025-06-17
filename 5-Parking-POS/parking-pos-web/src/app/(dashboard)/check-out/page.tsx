"use client"

import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader } from "@/components/ui/dialog"
import { CameraCapture } from "@/components/features/camera-capture"
import { apiClient } from "@/lib/api/client"
import { useAuthStore } from "@/store"
import { formatPlateNumber, formatCurrency, formatDateTime } from "@/lib/utils"
import {
  Search,
  Clock,
  CreditCard,
  Ticket,
  ArrowRight,
  AlertCircle,
  Camera,
  ImageIcon,
  Maximize2,
  CheckCircle,
  Car,
  Bike,
  Truck,
  Bus,
  MapPin,
  User,
  Calendar,
  Timer,
  Receipt,
  Zap,
  RefreshCw,
  X,
  Check,
  Loader2,
  Printer,
  Download,
  CheckCircle2,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

// Enhanced plate validation for Indonesian format
const validatePlateNumberEnhanced = (plateNumber: string): boolean => {
  if (!plateNumber || plateNumber.trim().length === 0) return false

  const cleaned = plateNumber.trim().toUpperCase().replace(/\s+/g, " ")
  const plateRegex = /^[A-Z]{1,2}\s*\d{1,4}(\s*[A-Z]{1,3})?$/

  return plateRegex.test(cleaned)
}

// Types
interface ParkingStatusData {
  id: number
  plateNumber: string
  vehicleType: string
  checkInTime: string
  checkOutTime: string | null
  checkInGate: string
  checkOutGate: string | null
  checkInOperator: string
  checkOutOperator: string | null
  status: string
  memberName: string | null
  parkingFee: number | null
  checkInPhotoPath: string
  checkOutPhotoPath: string | null
  checkInPhotoUrl: string
  checkOutPhotoUrl: string | null
  duration?: string
}

interface FeeCalculationData {
  ticketId: number
  plateNumber: string
  checkInTime: string
  checkOutTime: string
  duration: string
  hoursParked: number
  baseFee: number
  discount: number
  totalFee: number
  gracePeriod: boolean
  appliedVoucher: string | null
  member: boolean
}

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  timestamp?: string
}

interface ApiErrorResponse {
  errorCode?: string
  message?: string
}

interface CheckOutResponseData {
  invoiceNumber: string
  invoiceDate: string
  plateNumber: string
  checkInTime: string
  checkOutTime: string
  duration: string
  baseAmount: number
  discountAmount: number
  totalAmount: number
  paymentMethod: string
  paymentReference: string
  memberName: string | null
  voucherCode: string | null
  operatorName: string
  checkInGate: string
  checkOutGate: string
}

interface CheckOutResponse {
  invoiceNumber: string
}

const checkOutSchema = z.object({
  plateNumber: z
    .string()
    .min(1, "Nomor plat wajib diisi")
    .refine(validatePlateNumberEnhanced, "Format nomor plat tidak valid"),
  paymentMethod: z.enum(["CASH", "QRIS", "EMONEY", "FLAZZ", "BRIZZI", "MEMBER_BALANCE"]),
  voucherCode: z.string().optional(),
})

type CheckOutForm = z.infer<typeof checkOutSchema>

const VEHICLE_TYPES = {
  CAR: { icon: Car, label: "Mobil", color: "blue" },
  MOTORCYCLE: { icon: Bike, label: "Motor", color: "green" },
  TRUCK: { icon: Truck, label: "Truk", color: "orange" },
  BUS: { icon: Bus, label: "Bus", color: "purple" },
} as const

const PAYMENT_METHODS = {
  CASH: { label: "Tunai", icon: "💵", color: "green" },
  QRIS: { label: "QRIS", icon: "𝄃𝄃𝄂𝄂𝄀𝄁𝄃𝄂𝄂𝄃", color: "purple" },
  EMONEY: { label: "Kartu E-Money", icon: "💳", color: "blue" },
  FLAZZ: { label: "Kartu Flazz", icon: "💳", color: "indigo" },
  BRIZZI: { label: "Kartu Brizzi", icon: "💳", color: "red" },
  MEMBER_BALANCE: { label: "Saldo Member", icon: "🪪", color: "yellow" },
} as const

// Receipt Component
const ReceiptModal = ({ 
  isOpen, 
  onClose, 
  receiptData 
}: { 
  isOpen: boolean
  onClose: () => void
  receiptData: CheckOutResponseData | null 
}) => {
  const handlePrint = () => {
    const printContent = document.getElementById('receipt-content')
    if (!printContent) return

    const originalContent = document.body.innerHTML
    const printWindow = window.open('', '_blank')
    
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Struk Parkir - ${receiptData?.invoiceNumber}</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                margin: 0; 
                padding: 20px; 
                background: white;
                font-size: 12px;
                line-height: 1.4;
              }
              .receipt { 
                max-width: 300px; 
                margin: 0 auto; 
                background: white;
              }
              .header { 
                text-align: center; 
                border-bottom: 2px dashed #000; 
                padding-bottom: 10px; 
                margin-bottom: 15px; 
              }
              .title { 
                font-size: 18px; 
                font-weight: bold; 
                margin-bottom: 5px; 
              }
              .subtitle { 
                font-size: 12px; 
                color: #666; 
              }
              .row { 
                display: flex; 
                justify-content: space-between; 
                margin-bottom: 8px; 
                align-items: flex-start;
              }
              .row.total { 
                border-top: 1px dashed #000; 
                padding-top: 8px; 
                font-weight: bold; 
                font-size: 14px; 
              }
              .label { 
                flex: 1; 
                padding-right: 10px; 
              }
              .value { 
                text-align: right; 
                font-weight: 500; 
              }
              .footer { 
                text-align: center; 
                border-top: 2px dashed #000; 
                padding-top: 15px; 
                margin-top: 15px; 
                font-size: 11px; 
              }
              .barcode { 
                font-family: 'Libre Barcode 128', monospace; 
                font-size: 24px; 
                letter-spacing: 0; 
                margin: 10px 0; 
              }
              @media print {
                body { margin: 0; padding: 10px; }
                .no-print { display: none !important; }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
      printWindow.close()
    }
  }

  if (!receiptData) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Checkout Berhasil
          </DialogTitle>
        </DialogHeader>
        
        <div id="receipt-content" className="bg-white">
          <div className="receipt max-w-sm mx-auto bg-white p-6 font-mono text-sm">
            {/* Header */}
            <div className="header text-center border-b-2 border-dashed border-gray-800 pb-4 mb-4">
              <div className="title text-lg font-bold mb-1">PARKEE - SMART PARKING</div>
              <div className="subtitle text-xs text-gray-600">Sistem Parkir Otomatis</div>
              <div className="subtitle text-xs text-gray-600">Jl. Jenderal Sudirman. 123, Jakarta</div>
            </div>

            {/* Invoice Info */}
            <div className="space-y-2 mb-4">
              <div className="row flex justify-between">
                <span className="label">No. Invoice:</span>
                <span className="value font-semibold">{receiptData.invoiceNumber}</span>
              </div>
              <div className="row flex justify-between">
                <span className="label">Tanggal:</span>
                <span className="value">{formatDateTime(receiptData.invoiceDate)}</span>
              </div>
              <div className="row flex justify-between">
                <span className="label">Operator:</span>
                <span className="value">{receiptData.operatorName}</span>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="space-y-2 mb-4">
              <div className="row flex justify-between">
                <span className="label">No. Plat:</span>
                <span className="value font-bold text-lg">{receiptData.plateNumber}</span>
              </div>
              <div className="row flex justify-between">
                <span className="label">Gate Masuk:</span>
                <span className="value">{receiptData.checkInGate}</span>
              </div>
              <div className="row flex justify-between">
                <span className="label">Gate Keluar:</span>
                <span className="value">{receiptData.checkOutGate}</span>
              </div>
            </div>

            {/* Parking Info */}
            <div className="space-y-2 mb-4">
              <div className="row flex justify-between">
                <span className="label">Masuk:</span>
                <span className="value">{formatDateTime(receiptData.checkInTime)}</span>
              </div>
              <div className="row flex justify-between">
                <span className="label">Keluar:</span>
                <span className="value">{formatDateTime(receiptData.checkOutTime)}</span>
              </div>
              <div className="row flex justify-between">
                <span className="label">Durasi:</span>
                <span className="value font-semibold">{receiptData.duration}</span>
              </div>
            </div>

            {/* Payment Info */}
            <div className="space-y-2 mb-4">
              <div className="row flex justify-between">
                <span className="label">Biaya Parkir:</span>
                <span className="value">{formatCurrency(receiptData.baseAmount)}</span>
              </div>
              {receiptData.discountAmount > 0 && (
                <div className="row flex justify-between text-green-600">
                  <span className="label">Diskon:</span>
                  <span className="value">-{formatCurrency(receiptData.discountAmount)}</span>
                </div>
              )}
              <div className="row total flex justify-between border-t border-dashed border-gray-800 pt-2 font-bold text-base">
                <span className="label">TOTAL:</span>
                <span className="value">{formatCurrency(receiptData.totalAmount)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2 mb-4">
              <div className="row flex justify-between">
                <span className="label">Pembayaran:</span>
                <span className="value">{receiptData.paymentMethod}</span>
              </div>
              <div className="row flex justify-between">
                <span className="label">Ref:</span>
                <span className="value text-xs">{receiptData.paymentReference}</span>
              </div>
              {receiptData.voucherCode && (
                <div className="row flex justify-between text-green-600">
                  <span className="label">Voucher:</span>
                  <span className="value">{receiptData.voucherCode}</span>
                </div>
              )}
              {receiptData.memberName && (
                <div className="row flex justify-between">
                  <span className="label">Member:</span>
                  <span className="value">{receiptData.memberName}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="footer text-center border-t-2 border-dashed border-gray-800 pt-4 text-xs">
              <div className="barcode text-2xl mb-2" style={{ fontFamily: 'monospace' }}>
                ||||| |||| ||||| ||||
              </div>
              <div className="mb-2">Terima kasih atas kunjungan Anda</div>
              <div className="mb-1">Simpan struk ini sebagai bukti</div>
              <div className="text-gray-500">www.halobil.com</div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t no-print">
          <Button onClick={handlePrint} className="flex-1" size="lg">
            <Printer className="w-4 h-4 mr-2" />
            Cetak Struk
          </Button>
          <Button onClick={onClose} variant="outline" className="flex-1" size="lg">
            <Check className="w-4 h-4 mr-2" />
            Selesai
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Custom Hooks
const useParkingStatus = (plateNumber: string, enabled: boolean) => {
  return useQuery<ApiResponse<ParkingStatusData>, Error>({
    queryKey: ["parking-status", plateNumber],
    queryFn: async () => {
      try {
        return await apiClient.checkStatus(formatPlateNumber(plateNumber))
      } catch (error: unknown) {
        const apiError = error as { response?: { data?: ApiErrorResponse } }
        if (apiError.response?.data?.errorCode === "RESOURCE_NOT_FOUND") {
          throw new Error("Kendaraan tidak ditemukan dalam sistem parkir")
        }
        throw error
      }
    },
    enabled: enabled && !!plateNumber && validatePlateNumberEnhanced(plateNumber),
    retry: (failureCount, error: Error) => {
      const apiError = error as { response?: { data?: ApiErrorResponse } }
      if (apiError.response?.data?.errorCode === "RESOURCE_NOT_FOUND") {
        return false
      }
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 0,
    gcTime: 0,
  })
}

const useFeeCalculation = (plateNumber: string, voucherCode: string, enabled: boolean) => {
  return useQuery<ApiResponse<FeeCalculationData>, Error>({
    queryKey: ["calculate-fee", plateNumber, voucherCode],
    queryFn: async () => {
      try {
        return await apiClient.calculateFee(formatPlateNumber(plateNumber), voucherCode || undefined)
      } catch (error: unknown) {
        const apiError = error as { response?: { data?: ApiErrorResponse } }
        if (apiError.response?.data?.errorCode) {
          throw new Error(apiError.response.data.message || "Gagal menghitung biaya parkir")
        }
        throw error
      }
    },
    enabled: enabled && !!plateNumber && validatePlateNumberEnhanced(plateNumber),
    retry: (failureCount, error: Error) => {
      const apiError = error as { response?: { data?: ApiErrorResponse } }
      if (apiError.response?.data?.errorCode) {
        return false
      }
      return failureCount < 2
    },
    staleTime: 0,
    gcTime: 0,
  })
}

const useCheckOut = () => {
  return useMutation<
    ApiResponse<CheckOutResponseData>,
    Error,
    CheckOutForm & { photoData: string; gate: string; operatorName: string }
  >({
    mutationFn: async ({ photoData, gate, operatorName, ...data }) => {
      const formData = new FormData()

      const response = await fetch(photoData)
      const blob = await response.blob()

      formData.append("photo", blob, "vehicle.jpg")
      formData.append(
        "data",
        new Blob(
          [
            JSON.stringify({
              plateNumber: formatPlateNumber(data.plateNumber),
              paymentMethod: data.paymentMethod,
              voucherCode: data.voucherCode,
              gate,
              operatorName,
            }),
          ],
          { type: "application/json" },
        ),
      )

      try {
        return await apiClient.checkOut(formData)
      } catch (error: unknown) {
        const apiError = error as { response?: { data?: ApiErrorResponse } }
        if (apiError.response?.data?.errorCode) {
          throw new Error(apiError.response.data.message || "Check-out gagal")
        }
        throw error
      }
    },
  })
}

// Helper Functions
const getErrorMessage = (error: Error): string => {
  const apiError = error as { response?: { data?: ApiErrorResponse } }
  if (apiError?.response?.data?.message) {
    return apiError.response.data.message
  }
  if (error?.message) {
    return error.message
  }
  return "Terjadi kesalahan yang tidak diketahui"
}

// Enhanced Image Component
const ImageWithFallback = ({
  src,
  alt,
  className = "",
  fallbackClassName = "",
  showExpandButton = false,
}: {
  src: string
  alt: string
  className?: string
  fallbackClassName?: string
  showExpandButton?: boolean
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const ImageContent = () => (
    <div className="relative group">
      {isLoading && (
        <div
          className={cn(
            "absolute inset-0 bg-muted animate-pulse rounded-lg flex items-center justify-center",
            className,
          )}
        >
          <ImageIcon className="w-8 h-8 text-muted-foreground" />
        </div>
      )}

      {hasError ? (
        <div
          className={cn(
            "bg-muted rounded-lg flex flex-col items-center justify-center text-muted-foreground",
            fallbackClassName || className,
          )}
        >
          <AlertCircle className="w-8 h-8 mb-2" />
          <span className="text-sm">Gagal memuat foto</span>
        </div>
      ) : (
        <>
          <img
            src={src || "/placeholder.svg"}
            alt={alt}
            className={cn(
              "w-full h-full object-cover rounded-lg transition-all duration-300",
              isLoading ? "opacity-0" : "opacity-100 group-hover:scale-105",
              className,
            )}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false)
              setHasError(true)
            }}
          />
          {showExpandButton && !isLoading && !hasError && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 rounded-lg flex items-center justify-center">
              <Button
                size="sm"
                variant="secondary"
                className="opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <Maximize2 className="w-4 h-4 mr-2" />
                Perbesar
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )

  if (showExpandButton && !hasError) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <div className="cursor-pointer">
            <ImageContent />
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <DialogTitle>Foto Kendaraan Masuk</DialogTitle>
          <div className="relative aspect-video w-full">
            <img src={src || "/placeholder.svg"} alt={alt} className="w-full h-full object-contain rounded-lg" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return <ImageContent />
}

// Enhanced Search Section
const SearchSection = ({
  searchPlate,
  setSearchPlate,
  onSearch,
  isLoading,
  hasSearched,
  onReset,
}: {
  searchPlate: string
  setSearchPlate: (value: string) => void
  onSearch: () => void
  isLoading: boolean
  hasSearched: boolean
  onReset: () => void
}) => (
  <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
    <CardHeader className="text-center">
      <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
        <Search className="w-8 h-8 text-primary" />
      </div>
      <CardTitle className="text-2xl">Cari Kendaraan</CardTitle>
      <CardDescription className="text-lg">
        Masukkan nomor plat untuk mencari data parkir dan memulai proses check-out
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Input
            placeholder="Contoh: B 1234 ABC"
            className="text-xl font-bold tracking-wider h-14 text-center uppercase"
            value={searchPlate}
            onChange={(e) => setSearchPlate(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                onSearch()
              }
            }}
          />
          {searchPlate && validatePlateNumberEnhanced(searchPlate) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          )}
        </div>
        <Button
          onClick={onSearch}
          size="lg"
          className="h-14 px-8"
          disabled={!searchPlate || !validatePlateNumberEnhanced(searchPlate) || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Mencari...
            </>
          ) : (
            <>
              <Search className="w-5 h-5 mr-2" />
              Cari
            </>
          )}
        </Button>
        {hasSearched && (
          <Button onClick={onReset} size="lg" variant="outline" className="h-14 px-6">
            <RefreshCw className="w-5 h-5" />
          </Button>
        )}
      </div>

      {searchPlate && !validatePlateNumberEnhanced(searchPlate) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Format nomor plat tidak valid. Contoh yang benar: B 123, B 123 ABC, DK 1234 AB
          </AlertDescription>
        </Alert>
      )}
    </CardContent>
  </Card>
)

// Enhanced Loading Component
const LoadingCard = ({ message }: { message: string }) => (
  <Card className="border-primary/20">
    <CardContent className="py-12">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-primary/40 rounded-full animate-spin animation-delay-150"></div>
        </div>
        <div className="text-center">
          <p className="text-lg font-medium">{message}</p>
          <p className="text-sm text-muted-foreground mt-1">Mohon tunggu sebentar...</p>
        </div>
      </div>
    </CardContent>
  </Card>
)

// Enhanced Error Alert
const ErrorAlert = ({ error, onRetry }: { error: Error; onRetry?: () => void }) => (
  <Alert variant="destructive" className="border-red-200 bg-red-50">
    <AlertCircle className="h-5 w-5" />
    <div className="flex-1">
      <AlertDescription className="text-base font-medium mb-2">{getErrorMessage(error)}</AlertDescription>
      {onRetry && (
        <Button onClick={onRetry} size="sm" variant="outline" className="mt-2">
          <RefreshCw className="w-4 h-4 mr-2" />
          Coba Lagi
        </Button>
      )}
    </div>
  </Alert>
)

// Enhanced Parking Info Card
const ParkingInfoCard = ({
  statusData,
  feeData,
}: {
  statusData: ParkingStatusData
  feeData?: FeeCalculationData
}) => {
  const vehicleConfig = VEHICLE_TYPES[statusData.vehicleType as keyof typeof VEHICLE_TYPES]
  const VehicleIcon = vehicleConfig?.icon || Car

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Main Info Card */}
      <Card className="lg:col-span-2 border-green-200 bg-green-50/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Ticket className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Kendaraan Ditemukan</CardTitle>
                <CardDescription>Data parkir aktif</CardDescription>
              </div>
            </div>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
              Aktif
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Vehicle Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    `bg-${vehicleConfig?.color || "blue"}-100`,
                  )}
                >
                  <VehicleIcon className={cn("w-5 h-5", `text-${vehicleConfig?.color || "blue"}-600`)} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nomor Plat</p>
                  <p className="text-xl font-bold tracking-wider">{statusData.plateNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nomor Tiket</p>
                  <p className="text-lg font-semibold">#{statusData.id.toString().padStart(6, "0")}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Waktu Masuk</p>
                  <p className="text-lg font-semibold">{formatDateTime(statusData.checkInTime)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Timer className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Durasi Parkir</p>
                  <p className="text-lg font-semibold">{feeData?.duration || statusData.duration || "Menghitung..."}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-muted-foreground/20 my-4" />

          {/* Additional Info */}
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Gate:</span>
              <span className="font-medium">{statusData.checkInGate}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Operator:</span>
              <span className="font-medium">{statusData.checkInOperator}</span>
            </div>
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Jenis:</span>
              <span className="font-medium">{vehicleConfig?.label}</span>
            </div>
          </div>

          {/* Fee Display */}
          {feeData && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Biaya Parkir</p>
                  <p className="text-3xl font-bold text-blue-700">{formatCurrency(feeData.totalFee)}</p>
                </div>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Foto Masuk
          </CardTitle>
          <CardDescription>Dokumentasi kendaraan saat masuk</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative aspect-video w-full">
            <ImageWithFallback
              src={statusData.checkInPhotoUrl || "/placeholder.svg"}
              alt={`Foto check-in kendaraan ${statusData.plateNumber}`}
              className=""
              fallbackClassName="aspect-video w-full"
              showExpandButton={true}
            />
          </div>
          <div className="mt-4 text-sm text-muted-foreground space-y-1">
            <p className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              {formatDateTime(statusData.checkInTime)}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="w-3 h-3" />
              Gate {statusData.checkInGate}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Enhanced Payment Section
const PaymentSection = ({
  paymentMethod,
  setPaymentMethod,
  voucherCode,
  setVoucherCode,
  feeData,
  feeLoading,
  feeError,
}: {
  paymentMethod: string
  setPaymentMethod: (value: CheckOutForm["paymentMethod"]) => void
  voucherCode?: string
  setVoucherCode: (value: string) => void
  feeData?: ApiResponse<FeeCalculationData>
  feeLoading: boolean
  feeError: Error | null
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <CreditCard className="w-5 h-5" />
        Pembayaran
      </CardTitle>
      <CardDescription>Pilih metode pembayaran dan masukkan voucher jika ada</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      {/* Payment Method Selection */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Metode Pembayaran</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(PAYMENT_METHODS).map(([method, config]) => (
            <button
              key={method}
              type="button"
              onClick={() => setPaymentMethod(method as CheckOutForm["paymentMethod"])}
              className={cn(
                "relative p-4 rounded-lg border-2 transition-all duration-200 text-left cursor-pointer",
                "hover:shadow-md hover:scale-105",
                paymentMethod === method
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-muted hover:border-primary/50",
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{config.icon}</span>
                <div>
                  <p className="font-medium text-sm">{config.label}</p>
                </div>
              </div>
              {paymentMethod === method && (
                <div className="absolute top-2 right-2 pointer-events-none">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Voucher Code */}
      <div className="space-y-3">
        <Label htmlFor="voucherCode" className="text-base font-medium">
          Kode Voucher (Opsional)
        </Label>
        <div className="relative">
          <Input
            id="voucherCode"
            placeholder="Masukkan kode voucher"
            value={voucherCode || ""}
            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
            className="pr-12"
          />
          {voucherCode && (
            <button
              type="button"
              onClick={() => setVoucherCode("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Fee Calculation */}
      {feeLoading && (
        <div className="rounded-xl bg-muted/50 p-6">
          <div className="flex items-center justify-center space-x-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm font-medium">Menghitung biaya parkir...</span>
          </div>
        </div>
      )}

      {feeError && <ErrorAlert error={feeError} />}

      {feeData?.success && feeData.data && (
        <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-6 border">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Rincian Biaya
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Biaya Parkir</span>
              <span className="font-semibold">{formatCurrency(feeData.data.baseFee)}</span>
            </div>
            {feeData.data.discount > 0 && (
              <div className="flex justify-between items-center text-green-600">
                <span>Diskon ({feeData.data.appliedVoucher})</span>
                <span className="font-semibold">-{formatCurrency(feeData.data.discount)}</span>
              </div>
            )}
            {feeData.data.gracePeriod && (
              <div className="flex justify-between items-center text-blue-600">
                <span>Grace Period</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  Gratis
                </span>
              </div>
            )}
            <div className="border-t border-muted-foreground/20 my-4" />
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Pembayaran</span>
              <span className="text-2xl text-primary">{formatCurrency(feeData.data.totalFee)}</span>
            </div>
          </div>
        </div>
      )}
    </CardContent>
  </Card>
)

// Enhanced Camera Section
const CameraSection = ({
  showCamera,
  photoData,
  setShowCamera,
  setPhotoData,
}: {
  showCamera: boolean
  photoData: string | null
  setShowCamera: (value: boolean) => void
  setPhotoData: (value: string | null) => void
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Camera className="w-5 h-5" />
        Foto Kendaraan Keluar
      </CardTitle>
      <CardDescription>Ambil foto kendaraan untuk dokumentasi check-out</CardDescription>
    </CardHeader>
    <CardContent>
      {!showCamera && !photoData ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Ambil Foto Kendaraan</h3>
          <p className="text-muted-foreground mb-6">Dokumentasikan kendaraan sebelum keluar dari area parkir</p>
          <Button type="button" onClick={() => setShowCamera(true)} size="lg" className="w-full max-w-xs">
            <Camera className="w-5 h-5 mr-2" />
            Buka Kamera
          </Button>
        </div>
      ) : showCamera && !photoData ? (
        <div className="space-y-4">
          <CameraCapture
            onCapture={(imageSrc) => {
              setPhotoData(imageSrc)
              setShowCamera(false)
            }}
          />
        </div>
      ) : photoData ? (
        <div className="space-y-4">
          <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-green-200">
            <Image src={photoData || "/placeholder.svg"} alt="Vehicle check-out" fill className="object-cover" />
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                <Check className="w-3 h-3 mr-1" />
                Foto Tersimpan
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              onClick={() => {
                setPhotoData(null)
                setShowCamera(true)
              }}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Ganti Foto
            </Button>
            <Button type="button" onClick={() => setPhotoData(null)} variant="outline" size="icon">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </CardContent>
  </Card>
)

// Main Component
export default function CheckOutPage() {
  const { user, gate } = useAuthStore()
  const queryClient = useQueryClient()
  const [photoData, setPhotoData] = useState<string | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [searchPlate, setSearchPlate] = useState("")
  const [currentPlateNumber, setCurrentPlateNumber] = useState("")
  const [enableStatusQuery, setEnableStatusQuery] = useState(false)
  const [enableFeeQuery, setEnableFeeQuery] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptData, setReceiptData] = useState<CheckOutResponseData | null>(null)

  const { register, handleSubmit, setValue, watch, reset } = useForm<CheckOutForm>({
    resolver: zodResolver(checkOutSchema),
    defaultValues: {
      paymentMethod: "CASH",
    },
  })

  const plateNumber = watch("plateNumber")
  const paymentMethod = watch("paymentMethod")
  const voucherCode = watch("voucherCode") || ""

  // API Hooks
  const {
    data: parkingStatus,
    isLoading: statusLoading,
    error: statusError,
    isError: hasStatusError,
    isSuccess: statusSuccess,
  } = useParkingStatus(currentPlateNumber, enableStatusQuery)

  const {
    data: feeData,
    isLoading: feeLoading,
    error: feeError,
  } = useFeeCalculation(currentPlateNumber, voucherCode, enableFeeQuery)

  const checkOutMutation = useCheckOut()

  // Handlers
  const handleSearch = useCallback(() => {
    if (searchPlate && validatePlateNumberEnhanced(searchPlate)) {
      const formattedPlate = formatPlateNumber(searchPlate)

      setEnableStatusQuery(false)
      setEnableFeeQuery(false)
      setHasSearched(true)

      queryClient.removeQueries({ queryKey: ["parking-status"] })
      queryClient.removeQueries({ queryKey: ["calculate-fee"] })

      setCurrentPlateNumber(formattedPlate)
      setValue("plateNumber", formattedPlate)

      setTimeout(() => {
        setEnableStatusQuery(true)
      }, 100)
    }
  }, [searchPlate, queryClient, setValue])

  const handleReset = useCallback(() => {
    setSearchPlate("")
    setCurrentPlateNumber("")
    setEnableStatusQuery(false)
    setEnableFeeQuery(false)
    setHasSearched(false)
    setPhotoData(null)
    setShowCamera(false)
    setShowReceipt(false)
    setReceiptData(null)
    reset()
    queryClient.removeQueries({ queryKey: ["parking-status"] })
    queryClient.removeQueries({ queryKey: ["calculate-fee"] })
  }, [reset, queryClient])

  useEffect(() => {
    if (statusSuccess && parkingStatus?.success) {
      setEnableFeeQuery(true)
    } else {
      setEnableFeeQuery(false)
    }
  }, [statusSuccess, parkingStatus?.success])

  useEffect(() => {
    if (enableFeeQuery && statusSuccess) {
      const timeoutId = setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ["calculate-fee", currentPlateNumber, voucherCode],
        })
      }, 500)

      return () => clearTimeout(timeoutId)
    }
  }, [voucherCode, enableFeeQuery, statusSuccess, currentPlateNumber, queryClient])

  const onSubmit = (data: CheckOutForm) => {
    if (!photoData) {
      toast.error("Silakan ambil foto kendaraan terlebih dahulu")
      return
    }

    checkOutMutation.mutate(
      {
        ...data,
        photoData,
        gate: gate || "",
        operatorName: user?.name || "System",
      },
      {
        onSuccess: (response) => {
          toast.success("Check-out berhasil!")
          setReceiptData(response.data)
          setShowReceipt(true)
        },
        onError: (error: Error) => {
          toast.error(error.message || "Check-out gagal")
        },
      },
    )
  }

  const canSubmit = parkingStatus?.success && photoData && !checkOutMutation.isPending && !feeLoading && !feeError

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-4 lg:space-y-0">
          <div className="space-y-2">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              Check-Out Kendaraan
            </h1>
            <p className="text-foreground-secondary text-lg">
              Proses pembayaran struk kendaraan keluar dari area parkir.
            </p>
          </div>
          {/* Gate Info */}
          <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full border shadow-sm">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-muted-foreground">Gate Aktif:</span>
            <span className="font-semibold text-lg">{gate}</span>
          </div>
        </div>

        {/* Search Section */}
        <SearchSection
          searchPlate={searchPlate}
          setSearchPlate={setSearchPlate}
          onSearch={handleSearch}
          isLoading={statusLoading}
          hasSearched={hasSearched}
          onReset={handleReset}
        />

        {/* Loading State */}
        {statusLoading && currentPlateNumber && <LoadingCard message="Mencari data kendaraan di sistem parkir" />}

        {/* Error State */}
        {hasStatusError && currentPlateNumber && <ErrorAlert error={statusError} onRetry={handleSearch} />}

        {/* Success State - Show parking info and form */}
        {parkingStatus?.success && parkingStatus.data && (
          <div className="space-y-8">
            <ParkingInfoCard statusData={parkingStatus.data} feeData={feeData?.data} />

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid lg:grid-cols-2 gap-8">
                <PaymentSection
                  paymentMethod={paymentMethod}
                  setPaymentMethod={(value) => setValue("paymentMethod", value)}
                  voucherCode={voucherCode}
                  setVoucherCode={(value) => setValue("voucherCode", value)}
                  feeData={feeData}
                  feeLoading={feeLoading}
                  feeError={feeError}
                />

                <CameraSection
                  showCamera={showCamera}
                  photoData={photoData}
                  setShowCamera={setShowCamera}
                  setPhotoData={setPhotoData}
                />
              </div>

              {/* Submit Button */}
              <div className="sticky bottom-6 z-10">
                <Card className="border-2 border-primary/20 bg-white/95 backdrop-blur-sm shadow-xl">
                  <CardContent className="p-6">
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full h-16 text-xl font-semibold relative overflow-hidden"
                      disabled={!canSubmit}
                    >
                      {checkOutMutation.isPending ? (
                        <div className="flex items-center gap-3">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          Memproses Check-Out...
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <Zap className="w-6 h-6" />
                          Proses Pembayaran & Check-Out
                          <ArrowRight className="w-6 h-6" />
                        </div>
                      )}

                      {/* Progress indicator */}
                      <div className="absolute bottom-0 left-0 h-1 bg-white/30 w-full">
                        <div
                          className="h-full bg-white transition-all duration-500"
                          style={{
                            width: `${
                              plateNumber
                                ? 25
                                : 0 + (photoData ? 25 : 0) + (paymentMethod ? 25 : 0) + (feeData?.success ? 25 : 0)
                            }%`,
                          }}
                        />
                      </div>
                    </Button>

                    {!canSubmit && (
                      <div className="mt-3 text-center">
                        <p className="text-sm text-muted-foreground">
                          {!photoData
                            ? "Ambil foto kendaraan untuk melanjutkan"
                            : feeLoading
                              ? "Menghitung biaya parkir..."
                              : feeError
                                ? "Perbaiki error untuk melanjutkan"
                                : "Lengkapi semua data untuk check-out"}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </form>
          </div>
        )}

        {/* Receipt Modal */}
        <ReceiptModal 
          isOpen={showReceipt} 
          onClose={() => {
            setShowReceipt(false)
            handleReset()
          }} 
          receiptData={receiptData} 
        />
      </div>
    </div>
  )
}