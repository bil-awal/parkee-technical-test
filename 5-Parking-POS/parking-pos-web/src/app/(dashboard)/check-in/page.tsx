'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { CameraCapture } from '@/components/features/camera-capture'
import { apiClient } from '@/lib/api/client'
import { useAuthStore } from '@/store'
import { cn, formatPlateNumber, validatePlateNumber } from '@/lib/utils'
import { 
  Car, 
  Bike, 
  Truck, 
  Bus, 
  ArrowRight, 
  Camera, 
  Printer, 
  Home, 
  QrCode,
  Check,
  X,
  ChevronLeft,
  Clock,
  MapPin,
  Zap,
  AlertCircle,
  RotateCcw,
  Eye,
  EyeOff
} from 'lucide-react'

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

// Schema
const checkInSchema = z.object({
  plateNumber: z.string()
    .min(1, 'Nomor plat wajib diisi')
    .refine(validatePlateNumber, 'Format nomor plat tidak valid'),
  vehicleType: z.enum(['CAR', 'MOTORCYCLE', 'TRUCK', 'BUS']),
})

type CheckInForm = z.infer<typeof checkInSchema>

// Constants
const VEHICLE_TYPES = {
  CAR: { icon: Car, label: 'Mobil', color: 'blue' },
  MOTORCYCLE: { icon: Bike, label: 'Motor', color: 'green' },
  TRUCK: { icon: Truck, label: 'Truk', color: 'orange' },
  BUS: { icon: Bus, label: 'Bus', color: 'purple' },
} as const

// Animation Components
const AnimatedContainer: React.FC<{
  children: React.ReactNode
  className?: string
  delay?: number
}> = ({ children, className = '', delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)
    
    return () => clearTimeout(timer)
  }, [delay])
  
  return (
    <div
      className={cn(
        'transition-all duration-500 ease-out',
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-8',
        className
      )}
    >
      {children}
    </div>
  )
}

// Progress Indicator
const ProgressIndicator: React.FC<{
  currentStep: number
  totalSteps: number
}> = ({ currentStep, totalSteps }) => {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'h-2 rounded-full transition-all duration-300',
            index < currentStep 
              ? 'bg-blue flex-1' 
              : index === currentStep 
              ? 'bg-blue/50 flex-1' 
              : 'bg-fill/20 flex-1'
          )}
        />
      ))}
    </div>
  )
}

// Ticket Receipt Component
const TicketReceipt: React.FC<{
  ticket: TicketData
  onPrint: () => void
  onNewCheckIn: () => void
}> = ({ ticket, onPrint, onNewCheckIn }) => {
  const [isPrinting, setIsPrinting] = useState(false)
  
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }
  }

  const { date, time } = formatDateTime(ticket.checkInTime)
  const vehicleConfig = VEHICLE_TYPES[ticket.vehicleType as keyof typeof VEHICLE_TYPES]
  const VehicleIcon = vehicleConfig?.icon || Car

  const handlePrint = async () => {
    setIsPrinting(true)
    await onPrint()
    setTimeout(() => setIsPrinting(false), 1000)
  }

  return (
    <div className="animate-slide-in-right">
      <div className="max-w-md mx-auto">
        {/* Success Animation */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-green rounded-full flex items-center justify-center animate-scale-in shadow-lg">
              <Check className="w-12 h-12 text-white" strokeWidth={3} />
            </div>
            <div className="absolute inset-0 w-24 h-24 bg-green rounded-full animate-ping opacity-20"></div>
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center mb-8 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <h2 className="text-2xl font-bold text-green mb-2">Check-In Berhasil!</h2>
          <p className="text-foreground-secondary">Kendaraan telah tercatat masuk ke area parkir</p>
        </div>

        {/* Ticket Card */}
        <div className="card relative overflow-hidden bg-white shadow-xl" id="parking-ticket">
          {/* Decorative Header */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue via-green to-purple"></div>
          
          {/* Header Section */}
          <div className="text-center space-y-4 pb-6 pt-4">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground tracking-tight">TIKET PARKIR</h3>
              <p className="text-sm text-foreground-secondary font-medium">Simpan sebagai bukti</p>
            </div>
            
            <div className="w-16 h-16 mx-auto bg-blue/10 rounded-2xl flex items-center justify-center">
              <QrCode className="w-8 h-8 text-blue" />
            </div>
          </div>

          {/* Ticket Information */}
          <div className="space-y-6 py-6 border-y border-separator/30">
            {/* Ticket Number */}
            <div className="text-center space-y-2">
              <p className="text-xs text-foreground-secondary uppercase tracking-wide font-semibold">No. Tiket</p>
              <p className="font-mono text-3xl font-bold text-foreground tracking-wider">
                #{ticket.id.toString().padStart(6, '0')}
              </p>
            </div>
            
            {/* License Plate */}
            <div className="text-center space-y-2">
              <p className="text-xs text-foreground-secondary uppercase tracking-wide font-semibold">Plat Nomor</p>
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-background-secondary rounded-2xl border border-separator/20">
                <VehicleIcon className={`w-6 h-6 text-${vehicleConfig?.color || 'blue'}`} />
                <span className="font-mono text-2xl font-bold text-foreground tracking-wider">
                  {ticket.plateNumber}
                </span>
              </div>
            </div>
            
            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="text-center space-y-1">
                <p className="text-xs text-foreground-secondary uppercase tracking-wide font-semibold">Jenis</p>
                <p className="font-medium text-foreground">{vehicleConfig?.label}</p>
              </div>
              
              <div className="text-center space-y-1">
                <p className="text-xs text-foreground-secondary uppercase tracking-wide font-semibold">Gate</p>
                <div className="flex items-center justify-center gap-1">
                  <MapPin className="w-3 h-3 text-foreground-secondary" />
                  <p className="font-medium text-foreground">{ticket.checkInGate}</p>
                </div>
              </div>
              
              <div className="text-center space-y-1">
                <p className="text-xs text-foreground-secondary uppercase tracking-wide font-semibold">Tanggal</p>
                <p className="font-medium text-foreground text-sm">{date.split(',')[1]?.trim()}</p>
              </div>
              
              <div className="text-center space-y-1">
                <p className="text-xs text-foreground-secondary uppercase tracking-wide font-semibold">Waktu</p>
                <div className="flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3 text-foreground-secondary" />
                  <p className="font-medium text-foreground">{time}</p>
                </div>
              </div>
            </div>
            
            <div className="pt-2 text-center">
              <div className="space-y-1">
                <p className="text-xs text-foreground-secondary uppercase tracking-wide font-semibold">Operator</p>
                <p className="font-medium text-foreground">{ticket.checkInOperator}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-6 text-center space-y-3">
            <p className="text-xs text-foreground-tertiary leading-relaxed">
              Tunjukkan tiket ini saat keluar area parkir
            </p>
            <p className="text-xs text-foreground-tertiary">
              Terima kasih telah menggunakan layanan kami
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className="flex-1 btn btn-secondary btn-large interactive relative overflow-hidden"
          >
            {isPrinting ? (
              <>
                <div className="w-5 h-5 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                Mencetak...
              </>
            ) : (
              <>
                <Printer className="w-5 h-5" />
                Print Tiket
              </>
            )}
          </button>
          <button
            onClick={onNewCheckIn}
            className="flex-1 btn btn-large interactive"
          >
            <Home className="w-5 h-5" />
            Check-In Baru
          </button>
        </div>
      </div>
    </div>
  )
}

// Vehicle Type Selector
const VehicleTypeSelector: React.FC<{
  selectedType: string
  onTypeChange: (type: string) => void
}> = ({ selectedType, onTypeChange }) => {
  return (
    <AnimatedContainer delay={200}>
      <div className="space-y-4">
        <label className="block text-lg font-semibold text-foreground">
          Jenis Kendaraan
        </label>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(VEHICLE_TYPES).map(([type, { icon: Icon, label, color }], index) => (
            <button
              key={type}
              type="button"
              onClick={() => onTypeChange(type)}
              className={cn(
                'group relative p-6 rounded-2xl border-2 transition-all duration-300 interactive',
                'flex flex-col items-center gap-4',
                'hover:shadow-lg hover:scale-102',
                selectedType === type
                  ? `border-${color} bg-${color}/10 text-${color} shadow-md scale-102`
                  : 'border-separator/30 hover:border-separator bg-background-secondary text-foreground hover:bg-background-tertiary'
              )}
              style={{
                animationDelay: `${index * 100}ms`
              }}
            >
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300',
                selectedType === type
                  ? `bg-${color}/20`
                  : 'bg-fill/10 group-hover:bg-fill/20'
              )}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-base font-medium">{label}</span>
              
              {/* Selection Indicator */}
              {selectedType === type && (
                <div className={`absolute -top-2 -right-2 w-8 h-8 bg-${color} rounded-full flex items-center justify-center animate-scale-in shadow-lg`}>
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
              )}
              
              {/* Hover Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          ))}
        </div>
      </div>
    </AnimatedContainer>
  )
}

// Photo Capture Component
const PhotoCapture: React.FC<{
  photoData: string | null
  onPhotoCapture: (photo: string) => void
  onPhotoRemove: () => void
}> = ({ photoData, onPhotoCapture, onPhotoRemove }) => {
  const [showCamera, setShowCamera] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)

  const handleCapture = (imageSrc: string) => {
    setIsCapturing(true)
    setTimeout(() => {
      onPhotoCapture(imageSrc)
      setShowCamera(false)
      setIsCapturing(false)
    }, 500)
  }

  const handleRetake = () => {
    onPhotoRemove()
    setShowCamera(true)
  }

  return (
    <AnimatedContainer delay={400}>
      <div className="card">
        <div className="flex items-center justify-between pb-4 border-b border-separator/30">
          <div>
            <h3 className="text-xl font-semibold text-foreground">Foto Kendaraan</h3>
            <p className="text-sm text-foreground-secondary mt-1">
              Ambil foto sebagai bukti kendaraan masuk
            </p>
          </div>
          
          {photoData && (
            <div className="w-10 h-10 bg-green/10 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-green" />
            </div>
          )}
        </div>
        
        <div className="pt-6">
          {!showCamera && !photoData ? (
            <button
              type="button"
              onClick={() => setShowCamera(true)}
              className="w-full h-48 rounded-2xl border-2 border-dashed border-separator/30 hover:border-blue/50 bg-background-secondary transition-all duration-300 flex flex-col items-center justify-center gap-4 text-foreground-secondary hover:text-blue interactive group"
            >
              <div className="w-16 h-16 rounded-2xl bg-blue/10 group-hover:bg-blue/20 flex items-center justify-center transition-all duration-300">
                <Camera className="w-8 h-8 text-blue" />
              </div>
              <div className="text-center">
                <p className="font-medium text-lg">Buka Kamera</p>
                <p className="text-sm mt-1">Tap untuk mengambil foto kendaraan</p>
              </div>
            </button>
          ) : showCamera && !photoData ? (
            <div className="animate-fade-in">
              <div className="relative">
                <CameraCapture onCapture={handleCapture} />
                {isCapturing && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-blue/30 border-t-blue rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-blue font-medium">Memproses foto...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : photoData ? (
            <div className="space-y-4 animate-fade-in">
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-background-secondary group">
                <img
                  src={photoData}
                  alt="Vehicle"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
                
                {/* Photo Actions Overlay */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    type="button"
                    onClick={() => {/* Preview functionality */}}
                    className="p-2 bg-black/50 backdrop-blur-sm rounded-lg text-white hover:bg-black/70 transition-colors interactive"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleRetake}
                className="w-full btn btn-secondary interactive"
              >
                <RotateCcw className="w-4 h-4" />
                Ganti Foto
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </AnimatedContainer>
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

// Main Component
export default function CheckInPage() {
  const router = useRouter()
  const { gate, user } = useAuthStore()
  const [photoData, setPhotoData] = useState<string | null>(null)
  const [ticketData, setTicketData] = useState<TicketData | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

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
      vehicleType: 'CAR',
    },
  })

  const vehicleType = watch('vehicleType')
  const plateNumber = watch('plateNumber')
  const checkInMutation = useCheckIn()

  // Calculate current step
  useEffect(() => {
    if (plateNumber && vehicleType && photoData) {
      setCurrentStep(3)
    } else if (plateNumber && vehicleType) {
      setCurrentStep(2)
    } else if (plateNumber) {
      setCurrentStep(1)
    } else {
      setCurrentStep(1)
    }
  }, [plateNumber, vehicleType, photoData])

  const handleCheckInSuccess = (response: CheckInResponse) => {
    const ticket: TicketData = {
      id: response.data.id,
      plateNumber: response.data.plateNumber,
      vehicleType: response.data.vehicleType,
      checkInTime: response.data.checkInTime,
      checkInGate: response.data.checkInGate,
      checkInOperator: response.data.checkInOperator,
      ticketNumber: response.data.ticketNumber || `#${response.data.id.toString().padStart(6, '0')}`,
    }
    
    setIsTransitioning(true)
    setTimeout(() => {
      setTicketData(ticket)
      setIsTransitioning(false)
      toast.success(`Check-in berhasil! Tiket: ${ticket.ticketNumber}`)
    }, 300)
  }

  const handleCheckInError = (error: unknown) => {
    toast.error(error instanceof Error ? error.message : 'Check-in gagal')
  }

  const onSubmit = async (data: CheckInForm) => {
    if (!photoData) {
      toast.error('Silakan ambil foto kendaraan terlebih dahulu')
      return
    }

    try {
      const response = await checkInMutation.mutateAsync({ formData: data, photoData })
      handleCheckInSuccess(response)
    } catch (error) {
      handleCheckInError(error)
    }
  }

  const handlePrintTicket = () => {
    const printContent = document.getElementById('parking-ticket')
    if (printContent) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Tiket Parkir</title>
              <style>
                body { 
                  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif; 
                  padding: 20px; 
                  background: white;
                  color: black;
                }
                .card { 
                  border: 1px solid #e5e5ea; 
                  padding: 20px; 
                  border-radius: 16px; 
                  max-width: 400px;
                  margin: 0 auto;
                }
                @media print {
                  body { margin: 0; padding: 0; }
                  .card { box-shadow: none; }
                }
              </style>
            </head>
            <body>
              ${printContent.outerHTML}
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  const handleNewCheckIn = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      setTicketData(null)
      setPhotoData(null)
      reset()
      setCurrentStep(1)
      setIsTransitioning(false)
    }, 300)
  }

  const isFormValid = plateNumber && vehicleType && photoData && !checkInMutation.isPending

  if (ticketData) {
    return (
      <div className={cn(
        "min-h-screen bg-background transition-all duration-500",
        isTransitioning && "opacity-0"
      )}>
        <div className="container mx-auto py-8 px-4">
          <TicketReceipt
            ticket={ticketData}
            onPrint={handlePrintTicket}
            onNewCheckIn={handleNewCheckIn}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "min-h-screen bg-background transition-all duration-500",
      isTransitioning && "opacity-0"
    )}>
      <div className="container mx-auto py-6 lg:py-8 max-w-4xl">
        {/* Header */}
        <AnimatedContainer>
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-4 lg:space-y-0">
            <div className="space-y-2">
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                Check-In Kendaraan
              </h1>
              <p className="text-foreground-secondary text-lg">
                Proses pengambilan tiket kendaraan masuk ke area parkir.
              </p>
            </div>
            {/* Gate Info */}
            <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full border shadow-sm">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-muted-foreground">Gate Aktif:</span>
              <span className="font-semibold text-lg">{gate}</span>
            </div>
          </div>
        </AnimatedContainer>

        {/* Progress Indicator */}
        <AnimatedContainer delay={100}>
          <ProgressIndicator currentStep={currentStep} totalSteps={3} />
        </AnimatedContainer>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Vehicle Information */}
          <AnimatedContainer delay={200}>
            <div className="card">
              <div className="flex items-center justify-between pb-4 border-b border-separator/30">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Informasi Kendaraan</h2>
                  <p className="text-sm text-foreground-secondary mt-1">
                    Masukkan detail kendaraan yang akan parkir
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue rounded-full" />
                  <span className="text-foreground-secondary">Langkah 1-2</span>
                </div>
              </div>
              
              <div className="space-y-8 pt-6">
                {/* License Plate Input */}
                <div className="space-y-3">
                  <label htmlFor="plateNumber" className="block text-lg font-semibold text-foreground">
                    Nomor Plat Kendaraan
                  </label>
                  <div className="relative">
                    <input
                      id="plateNumber"
                      placeholder="Contoh: B 1234 ABC"
                      className={cn(
                        "w-full text-xl lg:text-2xl font-bold text-center tracking-wider h-16 lg:h-20 rounded-2xl focus-ring transition-all duration-300",
                        errors.plateNumber 
                          ? "border-red bg-red/5 focus:border-red focus:ring-red/20" 
                          : "border-separator/30 focus:border-blue focus:ring-blue/20"
                      )}
                      {...register('plateNumber')}
                      onChange={(e) => {
                        const formatted = e.target.value.toUpperCase()
                        setValue('plateNumber', formatted)
                      }}
                    />
                    {plateNumber && !errors.plateNumber && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="w-8 h-8 bg-green/10 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-green" />
                        </div>
                      </div>
                    )}
                    {errors.plateNumber && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="w-8 h-8 bg-red/10 rounded-full flex items-center justify-center">
                          <AlertCircle className="w-4 h-4 text-red" />
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.plateNumber && (
                    <p className="text-sm text-red font-medium flex items-center gap-2 animate-fade-in">
                      <X className="w-4 h-4" />
                      {errors.plateNumber.message}
                    </p>
                  )}
                  <p className="text-xs text-foreground-secondary">
                    Format: [Kode Wilayah] [Nomor] [Kode Huruf] (contoh: B 1234 ABC)
                  </p>
                </div>

                {/* Vehicle Type Selector */}
                <VehicleTypeSelector
                  selectedType={vehicleType}
                  onTypeChange={(type) => setValue('vehicleType', type as CheckInForm['vehicleType'])}
                />
              </div>
            </div>
          </AnimatedContainer>

          {/* Photo Capture */}
          <PhotoCapture
            photoData={photoData}
            onPhotoCapture={setPhotoData}
            onPhotoRemove={() => setPhotoData(null)}
          />

          {/* Submit Button */}
          <AnimatedContainer delay={600}>
            <div className="sticky bottom-4 pt-4">
              <button
                type="submit"
                className={cn(
                  "w-full btn btn-large text-lg font-semibold h-16 lg:h-20 interactive relative overflow-hidden shadow-lg",
                  !isFormValid && "opacity-50 cursor-not-allowed",
                  checkInMutation.isPending && "animate-pulse"
                )}
                disabled={!isFormValid}
              >
                {checkInMutation.isPending ? (
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memproses Check-In...
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Zap className="w-6 h-6" />
                    Proses Check-In
                    <ArrowRight className="w-6 h-6 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                )}
                
                {/* Progress Indicator */}
                {isFormValid && (
                  <div className="absolute bottom-0 left-0 h-1 bg-white/30 w-full">
                    <div 
                      className="h-full bg-white transition-all duration-500"
                      style={{ 
                        width: `${plateNumber && vehicleType && photoData ? 100 : (plateNumber ? 33 : 0) + (vehicleType ? 33 : 0) + (photoData ? 34 : 0)}%` 
                      }}
                    />
                  </div>
                )}
              </button>
            </div>
          </AnimatedContainer>
        </form>
      </div>
    </div>
  )
}