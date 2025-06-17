"use client"

import type React from "react"
import { useState, useMemo, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { apiClient } from "@/lib/api/client"
import { formatCurrency } from "@/lib/utils"
import {
  Plus,
  Percent,
  DollarSign,
  XCircle,
  CheckCircle,
  Loader2,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Ticket,
  Calendar,
  Users,
  TrendingUp,
  AlertCircle,
  Eye,
  Trash2,
  Copy,
  Gift,
  Target,
  Clock,
  Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Types & Interfaces
interface Voucher {
  id: number
  code: string
  description: string
  discountType: "PERCENTAGE" | "FIXED_AMOUNT"
  discountValue: number
  minimumAmount: number
  validFrom: string
  validUntil: string
  active: boolean
  usageLimit: number | null
  usageCount: number
  isValid: boolean
}

interface VouchersResponse {
  content: Voucher[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  timestamp: string
}

interface VoucherFilters {
  activeOnly: boolean
  discountType: string
  searchQuery: string
  validityStatus: string
}

// Validation Schema
const voucherSchema = z.object({
  code: z
    .string()
    .min(4, "Kode minimal 4 karakter")
    .max(20, "Kode maksimal 20 karakter")
    .regex(/^[A-Z0-9]+$/, "Kode hanya boleh huruf kapital dan angka"),
  description: z.string().min(5, "Deskripsi minimal 5 karakter"),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  discountValue: z.number().positive("Nilai diskon harus positif"),
  minimumAmount: z.number().min(0, "Minimal amount tidak boleh negatif"),
  validFrom: z.string(),
  validUntil: z.string(),
  usageLimit: z.number().int().positive("Usage limit harus positif").optional(),
})

type VoucherFormData = z.infer<typeof voucherSchema>

// Constants
const DISCOUNT_TYPES = [
  { value: "PERCENTAGE", label: "Persentase", icon: Percent, color: "blue" },
  { value: "FIXED_AMOUNT", label: "Nominal", icon: DollarSign, color: "green" },
] as const

const VALIDITY_STATUS_OPTIONS = [
  { value: "all", label: "Semua Status" },
  { value: "active", label: "Masih Berlaku" },
  { value: "expired", label: "Kadaluarsa" },
] as const

const DISCOUNT_TYPE_OPTIONS = [
  { value: "all", label: "Semua Tipe" },
  { value: "PERCENTAGE", label: "Persentase" },
  { value: "FIXED_AMOUNT", label: "Nominal" },
] as const

const DEFAULT_PAGE_SIZE = 10

// Helper Functions
const formatDiscountValue = (voucher: Voucher): string => {
  return voucher.discountType === "PERCENTAGE" ? `${voucher.discountValue}%` : formatCurrency(voucher.discountValue)
}

const calculateRemainingUsage = (voucher: Voucher): string => {
  if (!voucher.usageLimit) return "∞"
  const remaining = voucher.usageLimit - voucher.usageCount
  return `${remaining} / ${voucher.usageLimit}`
}

const getDefaultFormValues = (): Partial<VoucherFormData> => ({
  discountType: "PERCENTAGE",
  minimumAmount: 0,
  validFrom: format(new Date(), "yyyy-MM-dd"),
  validUntil: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
})

const isVoucherExpired = (voucher: Voucher): boolean => {
  return new Date(voucher.validUntil) < new Date()
}

// Custom Hooks
const useVouchers = (activeOnly: boolean, page: number) => {
  return useQuery<ApiResponse<VouchersResponse>>({
    queryKey: ["vouchers", activeOnly, page],
    queryFn: () =>
      apiClient.getVouchers({
        activeOnly,
        page,
        size: DEFAULT_PAGE_SIZE,
      }),
    select: (data) => data,
  })
}

const useVoucherMutations = () => {
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: apiClient.createVoucher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] })
      toast.success("Voucher berhasil dibuat")
    },
    onError: (error: any) => {
      toast.error(error?.message || "Gagal membuat voucher")
    },
  })

  const terminateMutation = useMutation({
    mutationFn: apiClient.terminateVoucher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] })
      toast.success("Voucher berhasil diterminasi")
    },
    onError: (error: any) => {
      toast.error(error?.message || "Gagal terminasi voucher")
    },
  })

  return { createMutation, terminateMutation }
}

// Enhanced Components
const StatsCard = ({
  title,
  value,
  icon: Icon,
  color = "blue",
  trend,
  subtitle,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  color?: "blue" | "green" | "purple" | "orange" | "red"
  trend?: { value: number; isPositive: boolean; label: string }
  subtitle?: string
}) => {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
    red: "bg-red-50 border-red-200 text-red-700",
  }

  const iconColorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
    red: "text-red-600",
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-primary">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="space-y-1">
              <p className="text-3xl font-bold">{value}</p>
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
            {trend && (
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className={cn("w-4 h-4", trend.isPositive ? "text-green-600" : "text-red-600")} />
                <span className={cn("font-medium", trend.isPositive ? "text-green-600" : "text-red-600")}>
                  {trend.isPositive ? "+" : ""}
                  {trend.value}%
                </span>
                <span className="text-muted-foreground">{trend.label}</span>
              </div>
            )}
          </div>
          <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center", colorClasses[color])}>
            <Icon className={cn("w-7 h-7", iconColorClasses[color])} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const VoucherStatusBadge: React.FC<{ voucher: Voucher }> = ({ voucher }) => {
  const isExpired = isVoucherExpired(voucher)
  const isActive = voucher.active && !isExpired

  if (isExpired) {
    return (
      <Badge variant="secondary" className="gap-1 bg-red-100 text-red-700 border-red-200">
        <Clock className="w-3 h-3" />
        Kadaluarsa
      </Badge>
    )
  }

  return (
    <Badge
      variant={isActive ? "default" : "secondary"}
      className={cn(
        "gap-1",
        isActive ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-700 border-gray-200",
      )}
    >
      {isActive ? (
        <>
          <CheckCircle className="w-3 h-3" />
          Aktif
        </>
      ) : (
        <>
          <XCircle className="w-3 h-3" />
          Nonaktif
        </>
      )}
    </Badge>
  )
}

const DiscountDisplay: React.FC<{ voucher: Voucher }> = ({ voucher }) => {
  const discountConfig = DISCOUNT_TYPES.find((type) => type.value === voucher.discountType)
  const Icon = discountConfig?.icon || Percent

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          voucher.discountType === "PERCENTAGE" ? "bg-blue-100" : "bg-green-100",
        )}
      >
        <Icon className={cn("w-4 h-4", voucher.discountType === "PERCENTAGE" ? "text-blue-600" : "text-green-600")} />
      </div>
      <div>
        <p className="font-semibold">{formatDiscountValue(voucher)}</p>
        <p className="text-xs text-muted-foreground">Min. {formatCurrency(voucher.minimumAmount)}</p>
      </div>
    </div>
  )
}

const FormField = ({
  label,
  id,
  type = "text",
  placeholder,
  icon: Icon,
  error,
  register,
  required = false,
  description,
  ...props
}: {
  label: string
  id: string
  type?: string
  placeholder: string
  icon?: React.ElementType
  error?: string
  register: any
  required?: boolean
  description?: string
  [key: string]: any
}) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="text-base font-medium">
      {label} {required && <span className="text-red-500">*</span>}
    </Label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        className={cn(
          Icon ? "pl-10" : "",
          "h-12 transition-all duration-200",
          error
            ? "border-red-500 focus:border-red-500 bg-red-50/50"
            : "focus:border-primary focus:ring-2 focus:ring-primary/20",
        )}
        {...register}
        {...props}
      />
      {!error && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <CheckCircle className="w-4 h-4 text-green-500 opacity-0 transition-opacity duration-200" />
        </div>
      )}
    </div>
    {description && <p className="text-xs text-muted-foreground">{description}</p>}
    {error && (
      <Alert variant="destructive" className="py-2">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">{error}</AlertDescription>
      </Alert>
    )}
  </div>
)

const VoucherFormDialog: React.FC<{
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: VoucherFormData) => void
  isLoading: boolean
}> = ({ open, onOpenChange, onSubmit, isLoading }) => {
  const form = useForm<VoucherFormData>({
    resolver: zodResolver(voucherSchema),
    defaultValues: getDefaultFormValues(),
  })

  const discountType = form.watch("discountType")
  const { errors } = form.formState

  const handleSubmit = (data: VoucherFormData) => {
    const payload = {
      ...data,
      validFrom: new Date(data.validFrom).toISOString(),
      validUntil: new Date(data.validUntil).toISOString(),
    }
    onSubmit(payload)
  }

  const handleClose = () => {
    onOpenChange(false)
    form.reset(getDefaultFormValues())
  }

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    form.setValue("code", result)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Plus className="w-5 h-5" />
          Buat Voucher
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Gift className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Buat Voucher Baru</DialogTitle>
              <DialogDescription className="text-base">
                Buat voucher diskon untuk promosi parkir dan tingkatkan kepuasan pelanggan
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Informasi Dasar</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-base font-medium">
                  Kode Voucher <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    placeholder="DISC20"
                    className="h-12 font-mono"
                    {...form.register("code")}
                    onChange={(e) => form.setValue("code", e.target.value.toUpperCase())}
                  />
                  <Button type="button" variant="outline" onClick={generateRandomCode} className="h-12 px-3">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
                {errors.code && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">{errors.code.message}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountType" className="text-base font-medium">
                  Tipe Diskon <span className="text-red-500">*</span>
                </Label>
                <Select value={discountType} onValueChange={(value) => form.setValue("discountType", value as any)}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DISCOUNT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-base font-medium">
                Deskripsi <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Diskon 20% untuk semua kendaraan selama periode promosi"
                rows={3}
                className="resize-none"
                {...form.register("description")}
              />
              {errors.description && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{errors.description.message}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Discount Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Konfigurasi Diskon</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Nilai Diskon"
                id="discountValue"
                type="number"
                placeholder={discountType === "PERCENTAGE" ? "20" : "5000"}
                icon={discountType === "PERCENTAGE" ? Percent : DollarSign}
                error={errors.discountValue?.message}
                register={form.register("discountValue", { valueAsNumber: true })}
                required
                description={`Masukkan nilai ${discountType === "PERCENTAGE" ? "persentase (1-100)" : "nominal dalam Rupiah"}`}
              />

              <FormField
                label="Minimal Pembelian"
                id="minimumAmount"
                type="number"
                placeholder="10000"
                icon={DollarSign}
                error={errors.minimumAmount?.message}
                register={form.register("minimumAmount", { valueAsNumber: true })}
                description="Minimal biaya parkir untuk menggunakan voucher"
              />
            </div>
          </div>

          {/* Validity Period */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Periode Berlaku</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Berlaku Dari"
                id="validFrom"
                type="date"
                placeholder=""
                icon={Calendar}
                error={errors.validFrom?.message}
                register={form.register("validFrom")}
                required
              />

              <FormField
                label="Berlaku Sampai"
                id="validUntil"
                type="date"
                placeholder=""
                icon={Calendar}
                error={errors.validUntil?.message}
                register={form.register("validUntil")}
                required
              />
            </div>
          </div>

          {/* Usage Limit */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Batasan Penggunaan</h3>
            <FormField
              label="Limit Penggunaan"
              id="usageLimit"
              type="number"
              placeholder="100"
              icon={Users}
              error={errors.usageLimit?.message}
              register={form.register("usageLimit", { valueAsNumber: true })}
              description="Kosongkan untuk penggunaan tanpa batas"
            />
          </div>

          <DialogFooter className="gap-3 pt-6">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Batal
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Membuat...
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4 mr-2" />
                  Buat Voucher
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const VoucherActions = ({
  voucher,
  onTerminate,
  isTerminating,
}: {
  voucher: Voucher
  onTerminate: (id: number) => void
  isTerminating: boolean
}) => {
  const copyVoucherCode = () => {
    navigator.clipboard.writeText(voucher.code)
    toast.success("Kode voucher berhasil disalin")
  }

  const handleTerminate = () => {
    if (confirm(`Apakah Anda yakin ingin menonaktifkan voucher ${voucher.code}?`)) {
      onTerminate(voucher.id)
    }
  }

  return (
    <div className="flex justify-end gap-2">
      <Button variant="outline" size="sm" onClick={copyVoucherCode} title="Salin Kode" className="hover:bg-blue-50">
        <Copy className="w-4 h-4" />
      </Button>
      <Button variant="outline" size="sm" title="Lihat Detail" className="hover:bg-green-50">
        <Eye className="w-4 h-4" />
      </Button>
      {voucher.active && !isVoucherExpired(voucher) && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleTerminate}
          disabled={isTerminating}
          title="Terminasi Voucher"
          className="hover:bg-red-50 hover:border-red-200 hover:text-red-600"
        >
          {isTerminating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </Button>
      )}
    </div>
  )
}

const VouchersTable: React.FC<{
  vouchers: Voucher[]
  onTerminate: (id: number) => void
  isTerminating: boolean
}> = ({ vouchers, onTerminate, isTerminating }) => {
  if (vouchers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Ticket className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Tidak Ada Voucher</h3>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
          Belum ada voucher yang dibuat. Mulai buat voucher pertama untuk memberikan diskon kepada pelanggan.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Kode Voucher</TableHead>
            <TableHead className="font-semibold">Deskripsi</TableHead>
            <TableHead className="font-semibold">Diskon</TableHead>
            <TableHead className="font-semibold">Periode</TableHead>
            <TableHead className="font-semibold">Penggunaan</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="text-right font-semibold">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vouchers.map((voucher) => (
            <TableRow key={voucher.id} className="hover:bg-muted/30 transition-colors">
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Ticket className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-mono font-bold text-lg">{voucher.code}</p>
                    <p className="text-xs text-muted-foreground">ID: #{voucher.id}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-[250px]">
                  <p className="font-medium truncate">{voucher.description}</p>
                  <p className="text-xs text-muted-foreground">
                    Min. pembelian: {formatCurrency(voucher.minimumAmount)}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <DiscountDisplay voucher={voucher} />
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span>{format(new Date(voucher.validFrom), "dd/MM/yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span>{format(new Date(voucher.validUntil), "dd/MM/yyyy")}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{calculateRemainingUsage(voucher)}</p>
                    <p className="text-xs text-muted-foreground">Tersisa</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <VoucherStatusBadge voucher={voucher} />
              </TableCell>
              <TableCell className="text-right">
                <VoucherActions voucher={voucher} onTerminate={onTerminate} isTerminating={isTerminating} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

const SearchAndFilterCard = ({
  filters,
  onFiltersChange,
  onReset,
}: {
  filters: VoucherFilters
  onFiltersChange: (filters: Partial<VoucherFilters>) => void
  onReset: () => void
}) => (
  <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
    <CardHeader>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Filter className="w-5 h-5 text-primary" />
        </div>
        <div>
          <CardTitle className="text-xl">Filter & Pencarian</CardTitle>
          <CardDescription className="text-base">Cari dan filter voucher berdasarkan kriteria tertentu</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="search" className="text-base font-medium">
            Cari Voucher
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              id="search"
              placeholder="Cari kode atau deskripsi..."
              value={filters.searchQuery}
              onChange={(e) => onFiltersChange({ searchQuery: e.target.value })}
              className="pl-10 h-12"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="discountType" className="text-base font-medium">
            Tipe Diskon
          </Label>
          <Select value={filters.discountType} onValueChange={(value) => onFiltersChange({ discountType: value })}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Pilih tipe diskon" />
            </SelectTrigger>
            <SelectContent>
              {DISCOUNT_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="validityStatus" className="text-base font-medium">
            Status Berlaku
          </Label>
          <Select value={filters.validityStatus} onValueChange={(value) => onFiltersChange({ validityStatus: value })}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Pilih status" />
            </SelectTrigger>
            <SelectContent>
              {VALIDITY_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-base font-medium">Opsi Tambahan</Label>
          <div className="flex flex-col gap-3 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.activeOnly}
                onChange={(e) => onFiltersChange({ activeOnly: e.target.checked })}
                className="rounded border-border"
              />
              <span className="text-sm">Hanya voucher aktif</span>
            </label>
            <Button variant="outline" size="sm" onClick={onReset} className="w-fit gap-2">
              <RefreshCw className="w-4 h-4" />
              Reset Filter
            </Button>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
)

const Pagination: React.FC<{
  currentPage: number
  totalPages: number
  totalElements: number
  onPageChange: (page: number) => void
}> = ({ currentPage, totalPages, totalElements, onPageChange }) => {
  if (totalPages <= 1) return null

  const startItem = currentPage * DEFAULT_PAGE_SIZE + 1
  const endItem = Math.min((currentPage + 1) * DEFAULT_PAGE_SIZE, totalElements)

  return (
    <div className="flex items-center justify-between pt-6 border-t">
      <p className="text-sm text-muted-foreground">
        Menampilkan {startItem}-{endItem} dari {totalElements} voucher
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Sebelumnya
        </Button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = currentPage < 3 ? i : currentPage - 2 + i
            if (pageNum >= totalPages) return null
            return (
              <Button
                key={pageNum}
                variant={pageNum === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                className="w-10 h-10"
              >
                {pageNum + 1}
              </Button>
            )
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages - 1}
          className="gap-2"
        >
          Selanjutnya
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

// Main Component
export default function VouchersPage() {
  const [page, setPage] = useState(0)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [filters, setFilters] = useState<VoucherFilters>({
    activeOnly: true,
    discountType: "all",
    searchQuery: "",
    validityStatus: "all",
  })

  const { data: vouchersResponse, isLoading } = useVouchers(filters.activeOnly, page)
  const { createMutation, terminateMutation } = useVoucherMutations()

  const filteredVouchers = useMemo(() => {
    let filtered = vouchersResponse?.data?.content || []

    // Search by code or description
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(
        (voucher) => voucher.code.toLowerCase().includes(query) || voucher.description.toLowerCase().includes(query),
      )
    }

    // Filter by discount type
    if (filters.discountType !== "all") {
      filtered = filtered.filter((voucher) => voucher.discountType === filters.discountType)
    }

    // Filter by validity status
    if (filters.validityStatus !== "all") {
      const now = new Date()
      filtered = filtered.filter((voucher) => {
        const validUntil = new Date(voucher.validUntil)
        const isExpired = validUntil < now

        if (filters.validityStatus === "active") return !isExpired
        if (filters.validityStatus === "expired") return isExpired
        return true
      })
    }

    return filtered
  }, [vouchersResponse, filters])

  const pagination = useMemo(() => {
    const data = vouchersResponse?.data
    return {
      totalElements: data?.totalElements || 0,
      totalPages: data?.totalPages || 0,
      currentPage: data?.number || 0,
    }
  }, [vouchersResponse])

  const updateFilter = useCallback((newFilters: Partial<VoucherFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
    setPage(0)
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({
      activeOnly: true,
      discountType: "all",
      searchQuery: "",
      validityStatus: "all",
    })
    setPage(0)
  }, [])

  const handleCreateVoucher = useCallback(
    (data: VoucherFormData) => {
      createMutation.mutate(data, {
        onSuccess: () => {
          setShowAddDialog(false)
        },
      })
    },
    [createMutation],
  )

  const handleTerminateVoucher = useCallback(
    (id: number) => {
      terminateMutation.mutate(id)
    },
    [terminateMutation],
  )

  // Mock stats - replace with real data
  const stats = {
    totalVouchers: pagination.totalElements,
    activeVouchers: filteredVouchers.filter((v) => v.active && !isVoucherExpired(v)).length,
    totalUsage: filteredVouchers.reduce((sum, v) => sum + v.usageCount, 0),
    expiringSoon: filteredVouchers.filter((v) => {
      const daysUntilExpiry = Math.ceil(
        (new Date(v.validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
      )
      return daysUntilExpiry <= 7 && daysUntilExpiry > 0
    }).length,
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <div>
                <p className="text-lg font-medium">Memuat data voucher...</p>
                <p className="text-sm text-muted-foreground">Mohon tunggu sebentar</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-4 lg:space-y-0">
          <div className="space-y-2">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              Manajemen Voucher
            </h1>
            <p className="text-foreground-secondary text-lg">
               Kelola voucher diskon parkir untuk meningkatkan kepuasan dan loyalitas pelanggan.
            </p>
          </div>
          
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Voucher"
            value={stats.totalVouchers}
            icon={Ticket}
            color="blue"
            subtitle="Voucher terdaftar"
          />
          <StatsCard
            title="Voucher Aktif"
            value={stats.activeVouchers}
            icon={CheckCircle}
            color="green"
            subtitle="Dapat digunakan"
          />
          <StatsCard
            title="Total Penggunaan"
            value={stats.totalUsage}
            icon={Activity}
            color="purple"
            subtitle="Kali digunakan"
          />
          <StatsCard
            title="Segera Berakhir"
            value={stats.expiringSoon}
            icon={Clock}
            color="orange"
            subtitle="Dalam 7 hari"
          />
        </div>

        {/* Action Bar */}
        <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Kelola Voucher</h3>
                <p className="text-muted-foreground">Buat voucher baru atau kelola voucher yang sudah ada</p>
              </div>
              <VoucherFormDialog
                open={showAddDialog}
                onOpenChange={setShowAddDialog}
                onSubmit={handleCreateVoucher}
                isLoading={createMutation.isPending}
              />
            </div>
          </CardContent>
        </Card>

        {/* Search and Filter */}
        <SearchAndFilterCard filters={filters} onFiltersChange={updateFilter} onReset={resetFilters} />

        {/* Vouchers Table */}
        <Card className="shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-blue-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Daftar Voucher</CardTitle>
                <CardDescription className="text-base">
                  {pagination.totalElements > 0
                    ? `Mengelola ${pagination.totalElements} voucher`
                    : "Belum ada voucher yang dibuat"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-6">
              <VouchersTable
                vouchers={filteredVouchers}
                onTerminate={handleTerminateVoucher}
                isTerminating={terminateMutation.isPending}
              />
            </div>
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalElements={pagination.totalElements}
              onPageChange={setPage}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
