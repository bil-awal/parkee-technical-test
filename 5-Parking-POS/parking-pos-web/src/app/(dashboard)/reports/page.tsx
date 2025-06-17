"use client"

import type React from "react"
import { useState, useCallback, useMemo } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { format, startOfMonth, endOfMonth, subMonths, subDays } from "date-fns"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api/client"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import {
  FileText,
  DollarSign,
  Car,
  Clock,
  Filter,
  Search,
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar,
  Activity,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Timer,
  Wallet,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart,
} from "recharts"
import { cn } from "@/lib/utils"

// Constants
const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"]
const PAGE_SIZE = 10

// Types
interface DashboardStats {
  totalVehiclesToday: number
  activeVehicles: number
  totalRevenueToday: number
  totalRevenuePeriod: number
  averageParkingDuration: string | null
  paymentMethodDistribution: Record<string, number> | null
  vehicleTypeDistribution: Record<string, number> | null
  dailyStatistics?: { date: string; totalVehicles: number; totalRevenue: number }[]
}

interface VehicleActivity {
  ticketId: number
  plateNumber: string
  vehicleType: string
  checkInTime: string
  checkOutTime?: string
  duration?: string
  fee?: number
  status: "ACTIVE" | "COMPLETED"
}

interface ActivitiesData {
  content: VehicleActivity[]
  totalPages: number
  totalElements: number
}

interface DateRange {
  startDate: string
  endDate: string
}

interface VehicleFilters {
  plateNumber: string
  status: "ALL" | "ACTIVE" | "COMPLETED"
  date: string
}

// Helper functions
const createDateRange = (start: Date, end: Date): DateRange => ({
  startDate: format(start, "yyyy-MM-dd"),
  endDate: format(end, "yyyy-MM-dd"),
})

const getQuickFilterRange = (filter: string): DateRange => {
  const today = new Date()

  switch (filter) {
    case "today":
      return createDateRange(today, today)
    case "week":
      return createDateRange(subDays(today, 6), today)
    case "month":
      return createDateRange(startOfMonth(today), endOfMonth(today))
    case "lastMonth": {
      const lastMonth = subMonths(today, 1)
      return createDateRange(startOfMonth(lastMonth), endOfMonth(lastMonth))
    }
    default:
      return createDateRange(startOfMonth(today), endOfMonth(today))
  }
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
                {trend.isPositive ? (
                  <ArrowUpRight className="w-4 h-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-600" />
                )}
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

const QuickFilters = ({ onSelect, activeFilter }: { onSelect: (filter: string) => void; activeFilter?: string }) => {
  const filters = [
    { label: "Hari Ini", value: "today", icon: Calendar },
    { label: "Minggu Ini", value: "week", icon: Calendar },
    { label: "Bulan Ini", value: "month", icon: Calendar },
    { label: "Bulan Lalu", value: "lastMonth", icon: Calendar },
  ]

  return (
    <div className="flex gap-2 flex-wrap">
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={activeFilter === filter.value ? "default" : "outline"}
          size="sm"
          onClick={() => onSelect(filter.value)}
          className="gap-2 transition-all duration-200"
        >
          <filter.icon className="w-4 h-4" />
          {filter.label}
        </Button>
      ))}
    </div>
  )
}

const ExportButtons = ({
  onExport,
  isLoading,
}: {
  onExport: (format: "PDF" | "EXCEL") => void
  isLoading: boolean
}) => (
  <div className="flex gap-3">
    <Button variant="outline" onClick={() => onExport("PDF")} disabled={isLoading} className="gap-2">
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
      Export PDF
    </Button>
    <Button variant="outline" onClick={() => onExport("EXCEL")} disabled={isLoading} className="gap-2">
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
      Export Excel
    </Button>
  </div>
)

const VehicleFiltersComponent = ({
  filters,
  onFiltersChange,
}: {
  filters: VehicleFilters
  onFiltersChange: (filters: VehicleFilters) => void
}) => (
  <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
    <CardHeader>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Filter className="w-5 h-5 text-primary" />
        </div>
        <div>
          <CardTitle className="text-xl">Filter Aktivitas</CardTitle>
          <CardDescription className="text-base">Filter data aktivitas kendaraan berdasarkan kriteria</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="plateNumber" className="text-base font-medium">
            Nomor Plat
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              id="plateNumber"
              placeholder="Cari nomor plat..."
              value={filters.plateNumber}
              onChange={(e) => onFiltersChange({ ...filters, plateNumber: e.target.value })}
              className="pl-10 h-12"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date" className="text-base font-medium">
            Tanggal
          </Label>
          <Input
            id="date"
            type="date"
            value={filters.date}
            onChange={(e) => onFiltersChange({ ...filters, date: e.target.value })}
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status" className="text-base font-medium">
            Status
          </Label>
          <Select
            value={filters.status}
            onValueChange={(val) => onFiltersChange({ ...filters, status: val as typeof filters.status })}
          >
            <SelectTrigger className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              <SelectItem value="ACTIVE">Aktif</SelectItem>
              <SelectItem value="COMPLETED">Selesai</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </CardContent>
  </Card>
)

const ChartSection = ({ stats }: { stats: DashboardStats | undefined }) => {
  const revenueData = useMemo(
    () =>
      stats?.dailyStatistics?.map((item) => ({
        date: format(new Date(item.date), "dd/MM"),
        revenue: item.totalRevenue,
        vehicles: item.totalVehicles,
      })) || [],
    [stats?.dailyStatistics],
  )

  const paymentMethodData = useMemo(() => {
    if (!stats?.paymentMethodDistribution) return []

    const nameMap: Record<string, string> = {
      CASH: "Tunai",
      QRIS: "QRIS",
      EMONEY: "E-Money",
      FLAZZ: "Flazz",
      BRIZZI: "BRIZZI",
      MEMBER_BALANCE: "Saldo Member",
    }

    return Object.entries(stats.paymentMethodDistribution).map(([key, value]) => ({
      name: nameMap[key] ?? key,
      value,
    }))
  }, [stats?.paymentMethodDistribution])

  const vehicleTypeData = useMemo(() => {
    if (!stats?.vehicleTypeDistribution) return []

    const typeMap: Record<string, string> = {
      CAR: "Mobil",
      MOTORCYCLE: "Motor",
      TRUCK: "Truk",
      BUS: "Bus",
    }

    return Object.entries(stats.vehicleTypeDistribution).map(([type, count]) => ({
      type: typeMap[type] ?? type,
      count,
    }))
  }, [stats?.vehicleTypeDistribution])

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-blue-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Analisis Data</CardTitle>
            <CardDescription className="text-base">Visualisasi data parkir dalam berbagai perspektif</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="revenue" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Pendapatan
            </TabsTrigger>
            <TabsTrigger value="paymentMethod" className="gap-2">
              <Wallet className="w-4 h-4" />
              Pembayaran
            </TabsTrigger>
            <TabsTrigger value="vehicleType" className="gap-2">
              <Car className="w-4 h-4" />
              Kendaraan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Tren Pendapatan Harian
                </CardTitle>
                <CardDescription>Analisis pendapatan dan volume kendaraan per hari</CardDescription>
              </CardHeader>
              <CardContent>
                {revenueData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="colorVehicles" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" stroke="#6b7280" />
                      <YAxis yAxisId="left" orientation="left" stroke="#6b7280" />
                      <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
                      <Tooltip
                        formatter={(value, name) => [
                          name === "revenue" ? formatCurrency(Number(value)) : value,
                          name === "revenue" ? "Pendapatan" : "Kendaraan",
                        ]}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Legend />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3B82F6"
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        name="Pendapatan"
                      />
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="vehicles"
                        stroke="#10B981"
                        fillOpacity={1}
                        fill="url(#colorVehicles)"
                        name="Kendaraan"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                    <BarChart3 className="w-16 h-16 mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Tidak Ada Data</h3>
                    <p className="text-center max-w-sm">
                      Belum ada data pendapatan untuk periode yang dipilih. Silakan pilih rentang tanggal yang berbeda.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paymentMethod">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-purple-600" />
                  Distribusi Metode Pembayaran
                </CardTitle>
                <CardDescription>Persentase penggunaan setiap metode pembayaran</CardDescription>
              </CardHeader>
              <CardContent>
                {paymentMethodData.length > 0 ? (
                  <div className="grid lg:grid-cols-2 gap-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={paymentMethodData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ value }) => formatCurrency(Number(value))}
                        >
                          {paymentMethodData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="space-y-4">
                      <h4 className="font-semibold text-lg">Detail Pembayaran</h4>
                      <div className="space-y-3">
                        {paymentMethodData.map((item, index) => (
                          <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <span className="font-medium">{item.name}</span>
                            </div>
                            <span className="font-bold text-green-600">{formatCurrency(item.value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <PieChart className="w-16 h-16 mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Tidak Ada Data</h3>
                    <p className="text-center max-w-sm">Belum ada data metode pembayaran untuk periode ini.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vehicleType">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-600" />
                  Distribusi Jenis Kendaraan
                </CardTitle>
                <CardDescription>Jumlah kendaraan berdasarkan jenisnya</CardDescription>
              </CardHeader>
              <CardContent>
                {vehicleTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={vehicleTypeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="type" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground">
                    <Car className="w-16 h-16 mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Tidak Ada Data</h3>
                    <p className="text-center max-w-sm">Belum ada data jenis kendaraan untuk periode ini.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

const VehicleActivitiesTable = ({
  activities,
  page,
  onPageChange,
  isLoading,
}: {
  activities: ActivitiesData | undefined
  page: number
  onPageChange: (page: number) => void
  isLoading: boolean
}) => (
  <Card className="shadow-lg">
    <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-blue-50/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Aktivitas Kendaraan</CardTitle>
            <CardDescription className="text-base">
              {activities ? `Riwayat parkir (${activities.totalElements} total aktivitas)` : "Memuat data aktivitas..."}
            </CardDescription>
          </div>
        </div>
        <Badge variant="outline" className="gap-2">
          <Eye className="w-4 h-4" />
          Live Data
        </Badge>
      </div>
    </CardHeader>
    <CardContent className="p-0">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <div>
              <p className="text-lg font-medium">Memuat aktivitas kendaraan...</p>
              <p className="text-sm text-muted-foreground">Mohon tunggu sebentar</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">ID Tiket</TableHead>
                <TableHead className="font-semibold">Plat Nomor</TableHead>
                <TableHead className="font-semibold">Jenis</TableHead>
                <TableHead className="font-semibold">Check-in</TableHead>
                <TableHead className="font-semibold">Check-out</TableHead>
                <TableHead className="font-semibold">Durasi</TableHead>
                <TableHead className="font-semibold">Biaya</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities?.content.length ? (
                activities.content.map((activity) => (
                  <TableRow key={activity.ticketId} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="font-mono text-sm font-semibold bg-muted/50 px-2 py-1 rounded">
                        #{activity.ticketId}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono font-semibold">{activity.plateNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {activity.vehicleType === "CAR" && <Car className="w-3 h-3" />}
                        {activity.vehicleType === "MOTORCYCLE" && <Car className="w-3 h-3" />}
                        {activity.vehicleType === "CAR"
                          ? "Mobil"
                          : activity.vehicleType === "MOTORCYCLE"
                            ? "Motor"
                            : activity.vehicleType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{formatDateTime(activity.checkInTime)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {activity.checkOutTime ? (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-red-600" />
                          <span className="text-sm">{formatDateTime(activity.checkOutTime)}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {activity.duration ? (
                        <div className="flex items-center gap-2">
                          <Timer className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">{activity.duration}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {activity.fee != null ? (
                        <span className="font-bold text-green-600">{formatCurrency(activity.fee)}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={activity.status === "ACTIVE" ? "default" : "secondary"}
                        className={cn(
                          "gap-1",
                          activity.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700",
                        )}
                      >
                        {activity.status === "ACTIVE" ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {activity.status === "ACTIVE" ? "Aktif" : "Selesai"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center space-y-4">
                      <Activity className="w-16 h-16 text-muted-foreground opacity-50" />
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Tidak Ada Aktivitas</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto">
                          Tidak ada data aktivitas kendaraan untuk filter yang dipilih. Coba ubah kriteria pencarian.
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {activities && activities.totalPages > 1 && (
            <div className="flex items-center justify-between p-6 border-t">
              <div className="text-sm text-muted-foreground">
                Menampilkan {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, activities.totalElements)} dari{" "}
                {activities.totalElements} aktivitas
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => onPageChange(Math.max(0, page - 1))}
                  className="gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Sebelumnya
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, activities.totalPages) }, (_, i) => {
                    const pageNum = page < 3 ? i : page - 2 + i
                    if (pageNum >= activities.totalPages) return null
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? "default" : "outline"}
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
                  disabled={page + 1 >= activities.totalPages}
                  onClick={() => onPageChange(page + 1)}
                  className="gap-2"
                >
                  Selanjutnya
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </CardContent>
  </Card>
)

export default function ReportsPage() {
  // State
  const [dateRange, setDateRange] = useState<DateRange>(() => getQuickFilterRange("month"))
  const [activeQuickFilter, setActiveQuickFilter] = useState("month")

  const [vehicleFilters, setVehicleFilters] = useState<VehicleFilters>({
    plateNumber: "",
    status: "ALL",
    date: format(new Date(), "yyyy-MM-dd"),
  })

  const [page, setPage] = useState(0)

  // Queries
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["dashboard-stats", dateRange],
    queryFn: async (): Promise<DashboardStats> => {
      const res = await apiClient.getDashboardStats(dateRange.startDate, dateRange.endDate)
      return res.data as DashboardStats
    },
  })

  const {
    data: activities,
    isLoading: activitiesLoading,
    refetch: refetchActivities,
  } = useQuery({
    queryKey: ["vehicle-activities", vehicleFilters, page],
    queryFn: async (): Promise<ActivitiesData> => {
      const params = {
        plateNumber: vehicleFilters.plateNumber || undefined,
        date: vehicleFilters.date,
        status: vehicleFilters.status === "ALL" ? undefined : vehicleFilters.status,
        page,
        size: PAGE_SIZE,
      }

      const res = await apiClient.getVehicleActivities(params)
      return res.data as ActivitiesData
    },
  })

  // Mutations
  const exportMutation = useMutation({
    mutationFn: ({ format }: { format: "PDF" | "EXCEL" }) =>
      apiClient.exportReport(dateRange.startDate, dateRange.endDate, format),
    onSuccess: (blob, { format }) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `laporan-parkir-${dateRange.startDate}-${dateRange.endDate}.${format === "PDF" ? "pdf" : "xlsx"}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success("Laporan berhasil diunduh")
    },
    onError: () => toast.error("Gagal mengunduh laporan"),
  })

  // Handlers
  const handleQuickFilter = useCallback((filter: string) => {
    setDateRange(getQuickFilterRange(filter))
    setActiveQuickFilter(filter)
  }, [])

  const handleExport = useCallback(
    (format: "PDF" | "EXCEL") => {
      exportMutation.mutate({ format })
    },
    [exportMutation],
  )

  const handleFiltersChange = useCallback((newFilters: VehicleFilters) => {
    setVehicleFilters(newFilters)
    setPage(0)
  }, [])

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  const handleRefresh = useCallback(() => {
    refetchStats()
    refetchActivities()
    toast.success("Data berhasil diperbarui")
  }, [refetchStats, refetchActivities])

  // Mock calculations for trends
  const mockTrends = {
    vehiclesToday: { value: 12, isPositive: true, label: "vs kemarin" },
    activeVehicles: { value: 8, isPositive: true, label: "vs rata-rata" },
    revenueToday: { value: 15, isPositive: true, label: "vs kemarin" },
    revenuePeriod: { value: 23, isPositive: true, label: "vs periode lalu" },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-4 lg:space-y-0">
          <div className="space-y-2">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              Laporan & Analisis
            </h1>
            <p className="text-foreground-secondary text-lg">
               Dashboard komprehensif untuk analisis data parkir dan laporan keuangan.
            </p>
          </div>
          
        </div>

        {/* Date Range Filter */}
        <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Filter Periode Laporan</CardTitle>
                  <CardDescription className="text-base">
                    Pilih rentang tanggal untuk analisis data parkir
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
                <ExportButtons onExport={handleExport} isLoading={exportMutation.isPending} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-base font-medium">
                  Tanggal Mulai
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={dateRange.startDate}
                  max={dateRange.endDate}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date" className="text-base font-medium">
                  Tanggal Selesai
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={dateRange.endDate}
                  min={dateRange.startDate}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="h-12"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="text-base font-medium">Filter Cepat</Label>
                <QuickFilters onSelect={handleQuickFilter} activeFilter={activeQuickFilter} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Kendaraan Hari Ini"
            value={statsLoading ? "-" : (stats?.totalVehiclesToday ?? 0)}
            icon={Car}
            color="blue"
            trend={mockTrends.vehiclesToday}
            subtitle="Total kendaraan masuk"
          />
          <StatsCard
            title="Kendaraan Aktif"
            value={statsLoading ? "-" : (stats?.activeVehicles ?? 0)}
            icon={Target}
            color="green"
            trend={mockTrends.activeVehicles}
            subtitle="Sedang parkir"
          />
          <StatsCard
            title="Pendapatan Hari Ini"
            value={statsLoading ? "-" : formatCurrency(stats?.totalRevenueToday ?? 0)}
            icon={DollarSign}
            color="orange"
            trend={mockTrends.revenueToday}
            subtitle="Revenue harian"
          />
          <StatsCard
            title="Pendapatan Periode"
            value={statsLoading ? "-" : formatCurrency(stats?.totalRevenuePeriod ?? 0)}
            icon={Wallet}
            color="purple"
            trend={mockTrends.revenuePeriod}
            subtitle="Total periode"
          />
        </div>

        {/* Charts */}
        <ChartSection stats={stats} />

        {/* Vehicle Activities */}
        <div className="space-y-6">
          <VehicleFiltersComponent filters={vehicleFilters} onFiltersChange={handleFiltersChange} />

          <VehicleActivitiesTable
            activities={activities}
            page={page}
            onPageChange={handlePageChange}
            isLoading={activitiesLoading}
          />
        </div>
      </div>
    </div>
  )
}