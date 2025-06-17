"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { CameraCapture } from "@/components/features/camera-capture"
import { apiClient } from "@/lib/api/client"
import { useAuthStore } from "@/store"
import { formatPlateNumber } from "@/lib/utils"
import {
  ArrowRight,
  Camera,
  Car,
  Bike,
  Truck,
  Bus,
  CheckCircle,
  AlertCircle,
  Clock,
  MapPin,
  Zap,
  RefreshCw,
  X,
  Check,
  Loader2,
  QrCode,
  Printer,
  Home,
  ImageIcon,
  Maximize2,
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
interface CheckInResponse {
  success: boolean
  message: string
  data: {
    id: number
    plateNumber: string
    vehicleType: string
    checkInTime: string
    checkInGate: string
    checkInOperator: string
    status: string
    memberName?: string
    parkingFee?: number
    checkInPhotoUrl: string
    ticketNumber?: string
  }
  timestamp: string
}

interface TicketData {
  id: number
  plateNumber: string
  vehicleType: string
  checkInTime: string
  checkInGate: string
  checkInOperator: string
  ticketNumber: string
}

const checkInSchema = z.object({
  plateNumber: z
    .string()
    .min(1, "Nomor plat wajib diisi")
    .refine(validatePlateNumberEnhanced, "Format nomor plat tidak valid"),
  vehicleType: z.enum(["CAR", "MOTORCYCLE", "TRUCK", "BUS"]),
})

type CheckInForm = z.infer<typeof checkInSchema>

const VEHICLE_TYPES = {
  CAR: { icon: Car, label: "Mobil", color: "blue" },
  MOTORCYCLE: { icon: Bike, label: "Motor", color: "green" },
  TRUCK: { icon: Truck, label: "Truk", color: "orange" },
  BUS: { icon: Bus, label: "Bus", color: "purple" },
} as const

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
          <DialogTitle>Foto Kendaraan</DialogTitle>
          <div className="relative aspect-video w-full">
            <img src={src || "/placeholder.svg"} alt={alt} className="w-full h-full object-contain rounded-lg" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return <ImageContent />
}

// Vehicle Type Selector
const VehicleTypeSelector = ({
  selectedType,
  onTypeChange,
}: {
  selectedType: string
  onTypeChange: (type: string) => void
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Car className="w-5 h-5" />
        Jenis Kendaraan
      </CardTitle>
      <CardDescription>Pilih jenis kendaraan yang akan parkir</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(VEHICLE_TYPES).map(([type, config]) => (
          <button
            key={type}
            type="button"
            onClick={() => onTypeChange(type)}
            className={cn(
              "p-6 rounded-lg border-2 transition-all duration-200 text-center relative",
              "hover:shadow-md hover:scale-105",
              selectedType === type ? "border-primary bg-primary/5 shadow-md" : "border-muted hover:border-primary/50",
            )}
          >
            <div className="flex flex-col items-center gap-3">
              <div
                className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center",
                  selectedType === type ? "bg-primary/20" : "bg-muted/50",
                )}
              >
                <config.icon
                  className={cn("w-6 h-6", selectedType === type ? "text-primary" : "text-muted-foreground")}
                />
              </div>
              <span className="font-medium text-sm">{config.label}</span>
            </div>
            {selectedType === type && (
              <div className="absolute top-2 right-2">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
            )}
          </button>
        ))}
      </div>
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
        Foto Kendaraan
      </CardTitle>
      <CardDescription>Ambil foto kendaraan untuk dokumentasi check-in</CardDescription>
    </CardHeader>
    <CardContent>
      {!showCamera && !photoData ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Ambil Foto Kendaraan</h3>
          <p className="text-muted-foreground mb-6">Dokumentasikan kendaraan saat masuk area parkir</p>
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
            <Image src={photoData || "/placeholder.svg"} alt="Vehicle check-in" fill className="object-cover" />
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

// Success Modal Component
const SuccessModal = ({
  isOpen,
  onClose,
  ticket,
}: {
  isOpen: boolean
  onClose: () => void
  ticket: TicketData | null
}) => {
  const [isPrinting, setIsPrinting] = useState(false)

  if (!ticket) return null

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    }
  }

  const checkInDateTime = formatDateTime(ticket.checkInTime)
  const vehicleConfig = VEHICLE_TYPES[ticket.vehicleType as keyof typeof VEHICLE_TYPES]
  const VehicleIcon = vehicleConfig?.icon || Car

  const handlePrint = async () => {
    setIsPrinting(true)
    const printContent = document.getElementById('parking-ticket')
    if (printContent) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        const htmlContent = `
        <html>
          <head>
            <title>Tiket Parkir - ${ticket.ticketNumber}</title>
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif; 
                padding: 20px; 
                background: white;
                color: black;
                line-height: 1.5;
              }
              .ticket-card { 
                border: 2px solid #e5e5ea; 
                padding: 30px; 
                border-radius: 16px; 
                max-width: 400px;
                margin: 0 auto;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              }
              .font-bold { font-weight: bold; }
              .text-center { text-align: center; }
              .space-y-4 > * + * { margin-top: 1rem; }
              .space-y-3 > * + * { margin-top: 0.75rem; }
              .space-y-2 > * + * { margin-top: 0.5rem; }
              .grid { display: grid; }
              .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
              .gap-6 { gap: 1.5rem; }
              .border-b { border-bottom: 1px solid #e5e5ea; padding-bottom: 0.5rem; }
              .border-t { border-top: 1px solid #e5e5ea; padding-top: 0.75rem; margin-top: 0.75rem; }
              .text-lg { font-size: 1.125rem; }
              .text-xl { font-size: 1.25rem; }
              .text-2xl { font-size: 1.5rem; }
              .text-3xl { font-size: 1.875rem; }
              .text-xs { font-size: 0.75rem; }
              .text-sm { font-size: 0.875rem; }
              .font-mono { font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace; }
              @media print {
                body { margin: 0; padding: 10px; }
                .ticket-card { box-shadow: none; border: 1px solid #000; }
              }
            </style>
          </head>
          <body>
            ${printContent.outerHTML}
          </body>
        </html>
        `
        printWindow.document.write(htmlContent)
        printWindow.document.close()
        printWindow.print()
      }
    }
    setTimeout(() => setIsPrinting(false), 1000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Success Header */}
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center bg-green-100">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-600">Check-In Berhasil!</h2>
              <p className="text-muted-foreground">Kendaraan telah tercatat masuk ke area parkir</p>
            </div>
          </div>

          {/* Ticket */}
          <div id="parking-ticket" className="ticket-card bg-white border rounded-xl p-6">
            {/* Decorative Header */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-green-500 to-purple-500 rounded-t-xl"></div>
            
            {/* Header */}
            <div className="text-center space-y-4 mb-6 pt-2">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">TIKET PARKIR</h3>
                <p className="text-sm text-muted-foreground">Simpan sebagai bukti masuk</p>
              </div>
              
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
                <QrCode className="w-8 h-8 text-primary" />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-6">
              {/* Ticket Number */}
              <div className="text-center space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">No. Tiket</p>
                <p className="font-mono text-3xl font-bold tracking-wider">
                  #{ticket.id.toString().padStart(6, "0")}
                </p>
              </div>

              {/* License Plate */}
              <div className="text-center space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Plat Nomor</p>
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-muted/50 rounded-2xl border">
                  <VehicleIcon className="w-6 h-6 text-primary" />
                  <span className="font-mono text-2xl font-bold tracking-wider">{ticket.plateNumber}</span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="text-center space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Jenis</p>
                  <p className="font-medium">{vehicleConfig?.label}</p>
                </div>
                
                <div className="text-center space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Gate</p>
                  <div className="flex items-center justify-center gap-1">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <p className="font-medium">{ticket.checkInGate}</p>
                  </div>
                </div>
                
                <div className="text-center space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Tanggal</p>
                  <p className="font-medium text-sm">{checkInDateTime.date.split(',')[1]?.trim()}</p>
                </div>
                
                <div className="text-center space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Waktu</p>
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <p className="font-medium">{checkInDateTime.time}</p>
                  </div>
                </div>
              </div>
              
              <div className="pt-2 text-center">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Operator</p>
                  <p className="font-medium">{ticket.checkInOperator}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-6 text-center space-y-3 border-t">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tunjukkan tiket ini saat keluar area parkir
                </p>
                <p className="text-xs text-muted-foreground">
                  Terima kasih telah menggunakan layanan kami
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button onClick={handlePrint} disabled={isPrinting} variant="outline" className="flex-1">
              {isPrinting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mencetak...
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4 mr-2" />
                  Print Tiket
                </>
              )}
            </Button>
            <Button onClick={onClose} className="flex-1">
              <Home className="w-4 h-4 mr-2" />
              Check-In Baru
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Custom Hook for Check-In Logic
const useCheckIn = () => {
  const { user, gate } = useAuthStore()
  
  return useMutation({
    mutationFn: async ({ formData, photoData }: { formData: CheckInForm, photoData: string }) => {
      const apiFormData = new FormData()
      
      // Convert base64 to blob
      const response = await fetch(photoData)
      const blob = await response.blob()
      
      apiFormData.append('photo', blob, 'vehicle.jpg')
      apiFormData.append('data', new Blob([JSON.stringify({
        plateNumber: formatPlateNumber(formData.plateNumber),
        vehicleType: formData.vehicleType,
        gate,
        operatorName: user?.name || 'System',
      })], { type: 'application/json' }))

      return apiClient.checkIn(apiFormData) as Promise<CheckInResponse>
    },
  })
}

const CheckInPage = () => {
  const { gate, user } = useAuthStore()
  const [photoData, setPhotoData] = useState<string | null>(null)
  const [ticketData, setTicketData] = useState<TicketData | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showCamera, setShowCamera] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<CheckInForm>({
    resolver: zodResolver(checkInSchema),
    defaultValues: {
      vehicleType: "CAR",
    },
  })

  const vehicleType = watch("vehicleType")
  const plateNumber = watch("plateNumber")
  const checkInMutation = useCheckIn()

  const handleCheckInSuccess = (response: CheckInResponse) => {
    const ticket: TicketData = {
      id: response.data.id,
      plateNumber: response.data.plateNumber,
      vehicleType: response.data.vehicleType,
      checkInTime: response.data.checkInTime,
      checkInGate: response.data.checkInGate,
      checkInOperator: response.data.checkInOperator,
      ticketNumber: response.data.ticketNumber || `#${response.data.id.toString().padStart(6, "0")}`,
    }
    
    setTicketData(ticket)
    setShowSuccessModal(true)
    toast.success(`Check-in berhasil! Tiket: ${ticket.ticketNumber}`)
  }

  const handleCheckInError = (error: unknown) => {
    toast.error(error instanceof Error ? error.message : "Check-in gagal")
  }

  const onSubmit = async (data: CheckInForm) => {
    if (!photoData) {
      toast.error("Silakan ambil foto kendaraan terlebih dahulu")
      return
    }

    try {
      const response = await checkInMutation.mutateAsync({ formData: data, photoData })
      handleCheckInSuccess(response)
    } catch (error) {
      handleCheckInError(error)
    }
  }

  const handleCloseModal = () => {
    setShowSuccessModal(false)
    setTicketData(null)
    setPhotoData(null)
    setShowCamera(false)
    reset()
  }

  const canSubmit = plateNumber && vehicleType && photoData && !checkInMutation.isPending

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <ArrowRight className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Check-In Kendaraan</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Catat kendaraan masuk ke area parkir dan dapatkan tiket parkir
          </p>

          {/* Gate Info */}
          <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full border shadow-sm">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-muted-foreground">Gate Aktif:</span>
            <span className="font-semibold text-lg">{gate}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Vehicle Information */}
          <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Car className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Informasi Kendaraan</CardTitle>
              <CardDescription className="text-lg">
                Masukkan detail kendaraan yang akan parkir
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* License Plate Input */}
              <div className="space-y-3">
                <Label htmlFor="plateNumber" className="text-base font-medium">
                  Nomor Plat Kendaraan
                </Label>
                <div className="relative">
                  <Input
                    id="plateNumber"
                    placeholder="Contoh: B 1234 ABC"
                    className="text-xl font-bold tracking-wider h-14 text-center uppercase"
                    {...register("plateNumber")}
                    onChange={(e) => {
                      const formatted = e.target.value.toUpperCase()
                      setValue("plateNumber", formatted)
                    }}
                  />
                  {plateNumber && !errors.plateNumber && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  )}
                  {errors.plateNumber && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    </div>
                  )}
                </div>
                {errors.plateNumber && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.plateNumber.message}</AlertDescription>
                  </Alert>
                )}
                <p className="text-xs text-muted-foreground">
                  Format: [Kode Wilayah] [Nomor] [Kode Huruf] (contoh: B 1234 ABC)
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Vehicle Type Selector */}
            <VehicleTypeSelector
              selectedType={vehicleType}
              onTypeChange={(type) => setValue("vehicleType", type as CheckInForm["vehicleType"])}
            />

            {/* Camera Section */}
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
                  {checkInMutation.isPending ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Memproses Check-In...
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Zap className="w-6 h-6" />
                      Proses Check-In
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
                            ? 33
                            : 0 + (vehicleType ? 33 : 0) + (photoData ? 34 : 0)
                        }%`,
                      }}
                    />
                  </div>
                </Button>

                {!canSubmit && (
                  <div className="mt-3 text-center">
                    <p className="text-sm text-muted-foreground">
                      {!plateNumber
                        ? "Masukkan nomor plat kendaraan"
                        : !photoData
                          ? "Ambil foto kendaraan untuk melanjutkan"
                          : "Lengkapi semua data untuk check-in"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </form>

        {/* Success Modal */}
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={handleCloseModal}
          ticket={ticketData}
        />
      </div>
    </div>
  )
}

export default CheckInPage