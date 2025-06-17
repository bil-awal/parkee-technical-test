"use client"

import React, { useState, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { apiClient } from "@/lib/api/client"
import { formatCurrency, validatePlateNumber } from "@/lib/utils"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  CreditCard,
  User,
  Mail,
  Phone,
  Car,
  Loader2,
  Users,
  Wallet,
  TrendingUp,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Crown,
  Star,
  Calendar,
  Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ========== TYPES & SCHEMAS ==========
const memberSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter").max(50, "Nama maksimal 50 karakter"),
  email: z.string().email("Email tidak valid"),
  phoneNumber: z
    .string()
    .regex(/^08\d{9,11}$/, "Format nomor HP tidak valid (08xxxxxxxxx)")
    .optional()
    .or(z.literal("")),
  vehiclePlateNumber: z.string().refine(validatePlateNumber, "Format nomor plat tidak valid (contoh: B 1234 ABC)"),
})

const topUpSchema = z.object({
  amount: z.number().min(10000, "Minimal top up Rp 10.000").max(10000000, "Maksimal top up Rp 10.000.000"),
})

type MemberForm = z.infer<typeof memberSchema>
type TopUpForm = z.infer<typeof topUpSchema>

interface Member {
  id: number
  memberCode: string
  name: string
  email: string
  phoneNumber?: string
  vehiclePlateNumber: string
  balance: number
  active: boolean
  registeredAt: string
  lastActivity?: string
  totalParkings: number
}

interface MemberFormState {
  isOpen: boolean
  mode: "create" | "edit"
  member: Member | null
}

// ========== SERVICES ==========
class MemberService {
  static async getMembers(params: { search?: string; page: number; size: number }) {
    return apiClient.getMembers(params)
  }

  static async createMember(data: MemberForm) {
    return apiClient.createMember(data)
  }

  static async updateMember(id: number, data: MemberForm) {
    return apiClient.updateMember(id, data)
  }

  static async deleteMember(id: number) {
    return apiClient.deleteMember(id)
  }

  static async topUpBalance(id: number, amount: number) {
    return apiClient.topUpBalance(id, amount)
  }
}

// ========== CUSTOM HOOKS ==========
const useMemberForm = () => {
  const form = useForm<MemberForm>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      vehiclePlateNumber: "",
    },
  })

  const resetForm = useCallback(() => {
    form.reset({
      name: "",
      email: "",
      phoneNumber: "",
      vehiclePlateNumber: "",
    })
  }, [form.reset])

  const setFormData = useCallback(
    (member: Member) => {
      form.reset({
        name: member.name,
        email: member.email,
        phoneNumber: member.phoneNumber || "",
        vehiclePlateNumber: member.vehiclePlateNumber || "",
      })
    },
    [form.reset],
  )

  return {
    ...form,
    resetForm,
    setFormData,
    isValid: form.formState.isValid,
    isDirty: form.formState.isDirty,
  }
}

const useMemberMutations = () => {
  const queryClient = useQueryClient()

  const invalidateMembers = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["members"] })
  }, [queryClient])

  const createMutation = useMutation({
    mutationFn: MemberService.createMember,
    onSuccess: () => {
      invalidateMembers()
      toast.success("Member berhasil didaftarkan")
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal mendaftarkan member")
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: MemberForm }) => MemberService.updateMember(id, data),
    onSuccess: () => {
      invalidateMembers()
      toast.success("Member berhasil diperbarui")
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal memperbarui member")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: MemberService.deleteMember,
    onSuccess: () => {
      invalidateMembers()
      toast.success("Member berhasil dinonaktifkan")
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus member")
    },
  })

  const topUpMutation = useMutation({
    mutationFn: ({ id, amount }: { id: number; amount: number }) => MemberService.topUpBalance(id, amount),
    onSuccess: () => {
      invalidateMembers()
      toast.success("Top up berhasil")
    },
    onError: (error: any) => {
      toast.error(error.message || "Top up gagal")
    },
  })

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    topUpMutation,
  }
}

const useTopUpForm = () => {
  const form = useForm<TopUpForm>({
    resolver: zodResolver(topUpSchema),
    defaultValues: {
      amount: undefined,
    },
  })

  const resetForm = useCallback(() => {
    form.reset({ amount: undefined })
  }, [form.reset])

  return {
    ...form,
    resetForm,
    isValid: form.formState.isValid,
  }
}

// ========== ENHANCED COMPONENTS ==========
const StatsCard = ({
  title,
  value,
  icon: Icon,
  trend,
  color = "blue",
}: {
  title: string
  value: string | number
  icon: React.ElementType
  trend?: { value: number; label: string }
  color?: "blue" | "green" | "purple" | "orange"
}) => {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
  }

  const iconColorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
  }

  return (
    <Card className="hover:shadow-md transition-all duration-300 hover:scale-105">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-green-600 font-medium">+{trend.value}%</span>
                <span className="text-muted-foreground">{trend.label}</span>
              </div>
            )}
          </div>
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colorClasses[color])}>
            <Icon className={cn("w-6 h-6", iconColorClasses[color])} />
          </div>
        </div>
      </CardContent>
    </Card>
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
}: {
  label: string
  id: string
  type?: string
  placeholder: string
  icon: React.ElementType
  error?: string
  register: any
  required?: boolean
  description?: string
}) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="text-base font-medium">
      {label} {required && <span className="text-red-500">*</span>}
    </Label>
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        className={cn(
          "pl-10 h-12 transition-all duration-200",
          error
            ? "border-red-500 focus:border-red-500 bg-red-50/50"
            : "focus:border-primary focus:ring-2 focus:ring-primary/20",
        )}
        {...register}
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

const MemberFormDialog = ({
  formState,
  onClose,
  onSubmit,
  isLoading,
}: {
  formState: MemberFormState
  onClose: () => void
  onSubmit: (data: MemberForm) => void
  isLoading: boolean
}) => {
  const memberForm = useMemberForm()

  React.useEffect(() => {
    if (formState.member && formState.mode === "edit") {
      memberForm.setFormData(formState.member)
    } else if (formState.isOpen && formState.mode === "create") {
      memberForm.resetForm()
    }
  }, [formState.member, formState.mode, formState.isOpen, memberForm.setFormData, memberForm.resetForm])

  const handleFormSubmit = (data: MemberForm) => {
    onSubmit(data)
  }

  const handleClose = () => {
    memberForm.resetForm()
    onClose()
  }

  const { errors } = memberForm.formState

  return (
    <Dialog open={formState.isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl">
                {formState.mode === "edit" ? "Edit Member" : "Tambah Member Baru"}
              </DialogTitle>
              <DialogDescription className="text-base">
                {formState.mode === "edit"
                  ? "Perbarui informasi member yang sudah terdaftar"
                  : "Daftarkan member baru untuk mendapatkan benefit khusus"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={memberForm.handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid gap-6">
            <FormField
              label="Nama Lengkap"
              id="name"
              placeholder="Masukkan nama lengkap"
              icon={User}
              error={errors.name?.message}
              register={memberForm.register("name")}
              required
              description="Nama akan digunakan untuk identifikasi member"
            />

            <FormField
              label="Email"
              id="email"
              type="email"
              placeholder="nama@email.com"
              icon={Mail}
              error={errors.email?.message}
              register={memberForm.register("email")}
              required
              description="Email untuk notifikasi dan komunikasi"
            />

            <FormField
              label="Nomor HP"
              id="phoneNumber"
              placeholder="081234567890"
              icon={Phone}
              error={errors.phoneNumber?.message}
              register={memberForm.register("phoneNumber")}
              description="Nomor HP untuk verifikasi dan notifikasi"
            />

            <FormField
              label="Nomor Plat Kendaraan"
              id="vehiclePlateNumber"
              placeholder="B 1234 ABC"
              icon={Car}
              error={errors.vehiclePlateNumber?.message}
              register={memberForm.register("vehiclePlateNumber")}
              required
              description="Format: [Kode Wilayah] [Nomor] [Kode Huruf]"
            />
          </div>

          <DialogFooter className="gap-3 pt-6">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Batal
            </Button>
            <Button type="submit" disabled={isLoading || !memberForm.isValid} className="flex-1">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isLoading ? "Menyimpan..." : formState.mode === "edit" ? "Perbarui Member" : "Daftarkan Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const TopUpDialog = ({
  member,
  onClose,
  onSubmit,
  isLoading,
}: {
  member: Member | null
  onClose: () => void
  onSubmit: (data: TopUpForm) => void
  isLoading: boolean
}) => {
  const topUpForm = useTopUpForm()
  const isOpen = member !== null

  const handleFormSubmit = (data: TopUpForm) => {
    onSubmit(data)
    topUpForm.resetForm()
  }

  const handleClose = () => {
    topUpForm.resetForm()
    onClose()
  }

  if (!member) return null

  const { errors } = topUpForm.formState
  const watchedAmount = topUpForm.watch("amount")
  const newBalance = member.balance + (watchedAmount || 0)

  const quickAmounts = [50000, 100000, 200000, 500000]

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Top Up Saldo</DialogTitle>
              <DialogDescription className="text-base">Tambah saldo untuk {member.name}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={topUpForm.handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Current Balance */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Saldo Saat Ini</p>
                <p className="text-3xl font-bold text-green-700">{formatCurrency(member.balance)}</p>
              </div>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Pilih Nominal Cepat</Label>
            <div className="grid grid-cols-2 gap-3">
              {quickAmounts.map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant="outline"
                  className="h-12 text-base font-semibold hover:bg-primary hover:text-white transition-colors"
                  onClick={() => topUpForm.setValue("amount", amount)}
                >
                  {formatCurrency(amount)}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Amount Input */}
          <div className="space-y-3">
            <Label htmlFor="amount" className="text-base font-medium">
              Atau Masukkan Nominal <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">Rp</span>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                className={cn(
                  "pl-12 h-12 text-lg font-semibold",
                  errors.amount ? "border-red-500 bg-red-50/50" : "focus:border-primary",
                )}
                {...topUpForm.register("amount", { valueAsNumber: true })}
              />
            </div>
            {errors.amount && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.amount.message}</AlertDescription>
              </Alert>
            )}
            <p className="text-xs text-muted-foreground">Minimal Rp 10.000 - Maksimal Rp 10.000.000</p>
          </div>

          {/* New Balance Preview */}
          {watchedAmount && watchedAmount > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-blue-600 font-medium">Saldo Setelah Top Up:</span>
                <span className="text-xl font-bold text-blue-700">{formatCurrency(newBalance)}</span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-3 pt-6">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Batal
            </Button>
            <Button type="submit" disabled={isLoading || !topUpForm.isValid} className="flex-1">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isLoading ? "Memproses..." : "Konfirmasi Top Up"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const MemberTypeBadge = ({ isActive, isPremium = false }: { isActive: boolean; isPremium?: boolean }) => {
  if (!isActive) {
    return (
      <Badge variant="secondary" className="gap-1">
        <UserX className="w-3 h-3" />
        INACTIVE
      </Badge>
    )
  }

  if (isPremium) {
    return (
      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white gap-1">
        <Crown className="w-3 h-3" />
        PREMIUM
      </Badge>
    )
  }

  return (
    <Badge variant="default" className="gap-1">
      <UserCheck className="w-3 h-3" />
      REGULAR
    </Badge>
  )
}

const MemberActions = ({
  member,
  onEdit,
  onTopUp,
  onDelete,
}: {
  member: Member
  onEdit: (member: Member) => void
  onTopUp: (member: Member) => void
  onDelete: (memberId: number) => void
}) => {
  const handleDelete = () => {
    if (confirm(`Apakah Anda yakin ingin menonaktifkan member ${member.name}?`)) {
      onDelete(member.id)
    }
  }

  return (
    <div className="flex justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onTopUp(member)}
        title="Top Up Saldo"
        className="hover:bg-green-50"
      >
        <CreditCard className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onEdit(member)}
        title="Edit Member"
        className="hover:bg-blue-50"
      >
        <Edit className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDelete}
        title="Nonaktifkan Member"
        className="hover:bg-red-50 hover:border-red-200 hover:text-red-600"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  )
}

const SearchAndFilterCard = ({
  search,
  onSearchChange,
  onSearch,
  onRefresh,
  isLoading,
}: {
  search: string
  onSearchChange: (value: string) => void
  onSearch: () => void
  onRefresh: () => void
  isLoading: boolean
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearch()
    }
  }

  return (
    <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Search className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Cari & Filter Member</CardTitle>
            <CardDescription className="text-base">
              Cari berdasarkan nama, email, kode member, atau nomor plat
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ketik untuk mencari member..."
              className="pl-10 h-12 text-base"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <Button onClick={onSearch} size="lg" className="px-8">
            <Search className="w-4 h-4 mr-2" />
            Cari
          </Button>
          <Button onClick={onRefresh} variant="outline" size="lg" disabled={isLoading}>
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filter Status
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export Data
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems: number
}) => {
  if (totalPages <= 1) return null

  const startItem = currentPage * 10 + 1
  const endItem = Math.min((currentPage + 1) * 10, totalItems)

  return (
    <div className="flex items-center justify-between pt-6 border-t">
      <p className="text-sm text-muted-foreground">
        Menampilkan {startItem}-{endItem} dari {totalItems} member
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

const EmptyState = ({ onAddMember }: { onAddMember: () => void }) => (
  <div className="text-center py-12">
    <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
      <Users className="w-10 h-10 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold mb-2">Belum Ada Member</h3>
    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
      Mulai daftarkan member pertama untuk memberikan layanan parkir yang lebih baik
    </p>
    <Button onClick={onAddMember} className="gap-2">
      <Plus className="w-4 h-4" />
      Tambah Member Pertama
    </Button>
  </div>
)

// ========== MAIN COMPONENT ==========
export default function MembersPage() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [memberFormState, setMemberFormState] = useState<MemberFormState>({
    isOpen: false,
    mode: "create",
    member: null,
  })
  const [topUpMember, setTopUpMember] = useState<Member | null>(null)

  const {
    data: members,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["members", search, page],
    queryFn: () => MemberService.getMembers({ search, page, size: 10 }),
  })

  const { createMutation, updateMutation, deleteMutation, topUpMutation } = useMemberMutations()

  // Mock stats - replace with real data
  const stats = {
    totalMembers: members?.data?.totalElements || 0,
    activeMembers: members?.data?.content?.filter((m: Member) => m.active).length || 0,
    totalBalance: members?.data?.content?.reduce((sum: number, m: Member) => sum + m.balance, 0) || 0,
    newThisMonth: 12, // Mock data
  }

  // Event Handlers
  const handleAddMember = useCallback(() => {
    setMemberFormState({
      isOpen: true,
      mode: "create",
      member: null,
    })
  }, [])

  const handleEditMember = useCallback((member: Member) => {
    setMemberFormState({
      isOpen: true,
      mode: "edit",
      member,
    })
  }, [])

  const handleCloseDialog = useCallback(() => {
    setMemberFormState({
      isOpen: false,
      mode: "create",
      member: null,
    })
  }, [])

  const handleMemberSubmit = useCallback(
    (data: MemberForm) => {
      if (memberFormState.mode === "edit" && memberFormState.member) {
        updateMutation.mutate({ id: memberFormState.member.id, data }, { onSuccess: handleCloseDialog })
      } else {
        createMutation.mutate(data, { onSuccess: handleCloseDialog })
      }
    },
    [memberFormState, updateMutation, createMutation, handleCloseDialog],
  )

  const handleTopUpSubmit = useCallback(
    (data: TopUpForm) => {
      if (topUpMember) {
        topUpMutation.mutate({ id: topUpMember.id, amount: data.amount }, { onSuccess: () => setTopUpMember(null) })
      }
    },
    [topUpMember, topUpMutation],
  )

  const handleSearch = useCallback(() => {
    setPage(0)
  }, [])

  const handleDeleteMember = useCallback(
    (memberId: number) => {
      deleteMutation.mutate(memberId)
    },
    [deleteMutation],
  )

  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  const isFormLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-4 lg:space-y-0">
          <div className="space-y-2">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              Manajemen Member
            </h1>
            <p className="text-foreground-secondary text-lg">
               Kelola data member parkir dan berikan layanan terbaik untuk pelanggan setia.
            </p>
          </div>
          
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Member"
            value={stats.totalMembers}
            icon={Users}
            trend={{ value: 12, label: "bulan ini" }}
            color="blue"
          />
          <StatsCard
            title="Member Aktif"
            value={stats.activeMembers}
            icon={UserCheck}
            trend={{ value: 8, label: "bulan ini" }}
            color="green"
          />
          <StatsCard
            title="Total Saldo"
            value={formatCurrency(stats.totalBalance)}
            icon={Wallet}
            trend={{ value: 15, label: "bulan ini" }}
            color="purple"
          />
          <StatsCard
            title="Member Baru"
            value={stats.newThisMonth}
            icon={Star}
            trend={{ value: 25, label: "vs bulan lalu" }}
            color="orange"
          />
        </div>

        {/* Search and Filter */}
        <SearchAndFilterCard
          search={search}
          onSearchChange={setSearch}
          onSearch={handleSearch}
          onRefresh={handleRefresh}
          isLoading={isLoading}
        />

        {/* Members Table */}
        <Card className="shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-blue-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Activity className="w-6 h-6 text-primary" />
                  Daftar Member
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  {stats.totalMembers > 0
                    ? `Mengelola ${stats.totalMembers} member terdaftar`
                    : "Belum ada member yang terdaftar"}
                </CardDescription>
              </div>
              <Button onClick={handleAddMember} size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                Tambah Member
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                  <div>
                    <p className="text-lg font-medium">Memuat data member...</p>
                    <p className="text-sm text-muted-foreground">Mohon tunggu sebentar</p>
                  </div>
                </div>
              </div>
            ) : members?.data?.content?.length === 0 ? (
              <EmptyState onAddMember={handleAddMember} />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Kode Member</TableHead>
                      <TableHead className="font-semibold">Informasi Member</TableHead>
                      <TableHead className="font-semibold">Kontak</TableHead>
                      <TableHead className="font-semibold">Kendaraan</TableHead>
                      <TableHead className="font-semibold">Saldo</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Aktivitas</TableHead>
                      <TableHead className="text-right font-semibold">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members?.data?.content.map((member: Member) => (
                      <TableRow key={member.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="font-mono text-sm font-semibold bg-muted/50 px-2 py-1 rounded">
                            {member.memberCode}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-semibold">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{member.phoneNumber || "-"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Car className="w-4 h-4 text-muted-foreground" />
                            <span className="font-mono text-sm font-semibold">{member.vehiclePlateNumber || "-"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-right">
                            <p className="font-bold text-green-600">{formatCurrency(member.balance)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <MemberTypeBadge isActive={member.active} />
                            <Badge variant={member.active ? "default" : "secondary"} className="text-xs">
                              {member.active ? "Aktif" : "Nonaktif"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {new Date(member.registeredAt).toLocaleDateString("id-ID")}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Activity className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{member.totalParkings} parkir</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <MemberActions
                            member={member}
                            onEdit={handleEditMember}
                            onTopUp={setTopUpMember}
                            onDelete={handleDeleteMember}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Pagination
                  currentPage={page}
                  totalPages={members?.data?.totalPages || 1}
                  totalItems={members?.data?.totalElements || 0}
                  onPageChange={setPage}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialogs */}
        <MemberFormDialog
          formState={memberFormState}
          onClose={handleCloseDialog}
          onSubmit={handleMemberSubmit}
          isLoading={isFormLoading}
        />

        <TopUpDialog
          member={topUpMember}
          onClose={() => setTopUpMember(null)}
          onSubmit={handleTopUpSubmit}
          isLoading={topUpMutation.isPending}
        />
      </div>
    </div>
  )
}
