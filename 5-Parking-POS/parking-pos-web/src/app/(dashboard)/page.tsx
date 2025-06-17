'use client'

import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiClient } from '@/lib/api/client'
import { formatCurrency } from '@/lib/utils'
import {
  Car,
  TrendingUp,
  Clock,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Zap,
  DollarSign,
  MapPin,
  Eye,
  MoreHorizontal
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts'

// Type definition for dashboard stats
interface DashboardStats {
  totalVehicles: number
  totalRevenue: number
  averageDuration: string
  activeParking: number
  vehicleTypeBreakdown: Record<string, number>
  paymentMethodBreakdown: Record<string, number>
}

const COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#5AC8FA']

// Loading Skeleton Component
const StatCardSkeleton = () => (
  <Card className="animate-fade-in">
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-fill/20 rounded w-24 loading-shimmer"></div>
        <div className="h-4 w-4 bg-fill/20 rounded loading-shimmer"></div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="h-8 bg-fill/20 rounded w-20 mb-2 loading-shimmer"></div>
      <div className="h-3 bg-fill/20 rounded w-16 loading-shimmer"></div>
    </CardContent>
  </Card>
)

// Animated Counter Component
const AnimatedCounter: React.FC<{
  value: number
  duration?: number
  formatter?: (value: number) => string
}> = ({ value, duration = 1000, formatter = (v) => v.toString() }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime = Date.now()
    const startValue = 0
    const endValue = value

    const updateCount = () => {
      const now = Date.now()
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentValue = startValue + (endValue - startValue) * easeOutQuart
      
      setCount(currentValue)
      
      if (progress < 1) {
        requestAnimationFrame(updateCount)
      }
    }
    
    requestAnimationFrame(updateCount)
  }, [value, duration])

  return <span>{formatter(Math.round(count))}</span>
}

// Stat Card Component
const StatCard: React.FC<{
  title: string
  value: string | number
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  trend?: {
    value: number
    isPositive: boolean
  }
  color: string
  delay?: number
}> = ({ title, value, subtitle, icon: Icon, trend, color, delay = 0 }) => {
  return (
    <Card 
      className="interactive animate-fade-in hover:shadow-lg transition-all duration-300"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-foreground-secondary">
          {title}
        </CardTitle>
        <div className={`w-8 h-8 rounded-lg bg-${color}/10 flex items-center justify-center`}>
          <Icon className={`h-4 w-4 text-${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-foreground">
            {typeof value === 'number' ? (
              <AnimatedCounter value={value} formatter={(v) => v.toLocaleString()} />
            ) : (
              value
            )}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-foreground-secondary">
              {subtitle}
            </p>
            {trend && (
              <div className={`flex items-center gap-1 text-xs font-medium ${
                trend.isPositive ? 'text-green' : 'text-red'
              }`}>
                {trend.isPositive ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {Math.abs(trend.value)}%
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Quick Actions Component
const QuickActions = () => {
  const actions = [
    { name: 'Check-In Baru', href: '/dashboard/checkin', icon: Car, color: 'green' },
    { name: 'Check-Out', href: '/dashboard/checkout', icon: Activity, color: 'orange' },
    { name: 'Laporan', href: '/dashboard/reports', icon: TrendingUp, color: 'blue' },
    { name: 'Member Baru', href: '/dashboard/members', icon: Users, color: 'purple' },
  ]

  return (
    <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <button
                key={action.name}
                className={`p-4 rounded-xl border border-separator/30 hover:bg-${action.color}/5 hover:border-${action.color}/30 transition-all duration-200 interactive group`}
                style={{ animationDelay: `${300 + index * 100}ms` }}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-lg bg-${action.color}/10 flex items-center justify-center group-hover:bg-${action.color}/20 transition-colors duration-200`}>
                    <Icon className={`w-5 h-5 text-${action.color}`} />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {action.name}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Recent Activity Component
const RecentActivity = () => {
  const activities = [
    { id: 1, type: 'checkin', vehicle: 'B 1234 ABC', time: '2 menit lalu', gate: 'Gate A' },
    { id: 2, type: 'checkout', vehicle: 'D 5678 XYZ', time: '5 menit lalu', gate: 'Gate B' },
    { id: 3, type: 'checkin', vehicle: 'F 9012 DEF', time: '8 menit lalu', gate: 'Gate A' },
    { id: 4, type: 'checkout', vehicle: 'B 3456 GHI', time: '12 menit lalu', gate: 'Gate C' },
    { id: 5, type: 'checkin', vehicle: 'D 7890 JKL', time: '15 menit lalu', gate: 'Gate B' },
  ]

  return (
    <Card className="animate-fade-in" style={{ animationDelay: '400ms' }}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Aktivitas Terkini</CardTitle>
        <button className="p-1 hover:bg-fill/10 rounded-lg transition-colors interactive">
          <Eye className="w-4 h-4 text-foreground-secondary" />
        </button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div 
              key={activity.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-background-tertiary transition-colors duration-200 animate-fade-in"
              style={{ animationDelay: `${500 + index * 100}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  activity.type === 'checkin' 
                    ? 'bg-green/10 text-green' 
                    : 'bg-orange/10 text-orange'
                }`}>
                  {activity.type === 'checkin' ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {activity.vehicle}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-foreground-secondary">
                    <MapPin className="w-3 h-3" />
                    {activity.gate}
                  </div>
                </div>
              </div>
              <div className="text-xs text-foreground-secondary">
                {activity.time}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiClient.getDashboardStats(),
  })

  // Helper function to check if data is DashboardStats
  const isDashboardStats = (data: any): data is DashboardStats => {
    return data && typeof data === 'object' && 'vehicleTypeBreakdown' in data;
  }

  // Mock data for better visualization with proper type checking
  const vehicleData = isDashboardStats(stats?.data)
    ? Object.entries(stats.data.vehicleTypeBreakdown).map(([name, value]) => ({
        name: name === 'MOBIL' ? 'Mobil' : 'Motor',
        value,
      }))
    : [
        { name: 'Mobil', value: 145 },
        { name: 'Motor', value: 89 }
      ]

  const paymentData = isDashboardStats(stats?.data)
    ? Object.entries(stats.data.paymentMethodBreakdown).map(([name, value]) => ({
        name,
        value,
      }))
    : [
        { name: 'Tunai', value: 120 },
        { name: 'QRIS', value: 85 },
        { name: 'E-Wallet', value: 29 }
      ]

  const hourlyData = [
    { hour: '06:00', checkins: 12, checkouts: 8 },
    { hour: '08:00', checkins: 25, checkouts: 15 },
    { hour: '10:00', checkins: 18, checkouts: 22 },
    { hour: '12:00', checkins: 30, checkouts: 28 },
    { hour: '14:00', checkins: 22, checkouts: 25 },
    { hour: '16:00', checkins: 35, checkouts: 30 },
    { hour: '18:00', checkins: 28, checkouts: 40 },
    { hour: '20:00', checkins: 15, checkouts: 25 },
  ]

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-foreground-secondary mt-2">
            Overview sistem parkir hari ini
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  const dashboardData = stats?.data as DashboardStats | undefined

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-foreground-secondary mt-2">
          Overview sistem parkir hari ini
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Kendaraan"
          value={dashboardData?.totalVehicles || 234}
          subtitle="Kendaraan hari ini"
          icon={Car}
          trend={{ value: 12, isPositive: true }}
          color="blue"
          delay={100}
        />
        
        <StatCard
          title="Pendapatan"
          value={formatCurrency(dashboardData?.totalRevenue || 2450000)}
          subtitle="Total pendapatan"
          icon={DollarSign}
          trend={{ value: 8, isPositive: true }}
          color="green"
          delay={200}
        />
        
        <StatCard
          title="Durasi Rata-rata"
          value={dashboardData?.averageDuration || '2.5 jam'}
          subtitle="Waktu parkir"
          icon={Clock}
          trend={{ value: 5, isPositive: false }}
          color="orange"
          delay={300}
        />
        
        <StatCard
          title="Parkir Aktif"
          value={dashboardData?.activeParking || 89}
          subtitle="Sedang parkir"
          icon={Activity}
          color="purple"
          delay={400}
        />
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <QuickActions />
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Vehicle Types */}
        <Card className="animate-fade-in" style={{ animationDelay: '600ms' }}>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Jenis Kendaraan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={vehicleData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {vehicleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgb(var(--color-background-secondary))',
                    border: '1px solid rgb(var(--color-separator) / 0.2)',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-lg)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="animate-fade-in" style={{ animationDelay: '700ms' }}>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Metode Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={paymentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-separator) / 0.2)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgb(var(--color-foreground-secondary) / 0.6)' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgb(var(--color-foreground-secondary) / 0.6)' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgb(var(--color-background-secondary))',
                    border: '1px solid rgb(var(--color-separator) / 0.2)',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-lg)'
                  }}
                />
                <Bar 
                  dataKey="value" 
                  fill="rgb(var(--color-blue))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Traffic */}
      <Card className="animate-fade-in" style={{ animationDelay: '800ms' }}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Traffic Harian</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="checkinGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(var(--color-green))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="rgb(var(--color-green))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="checkoutGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(var(--color-orange))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="rgb(var(--color-orange))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-separator) / 0.2)" />
              <XAxis 
                dataKey="hour" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgb(var(--color-foreground-secondary) / 0.6)' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgb(var(--color-foreground-secondary) / 0.6)' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgb(var(--color-background-secondary))',
                  border: '1px solid rgb(var(--color-separator) / 0.2)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-lg)'
                }}
              />
              <Area
                type="monotone"
                dataKey="checkins"
                stroke="rgb(var(--color-green))"
                fillOpacity={1}
                fill="url(#checkinGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="checkouts"
                stroke="rgb(var(--color-orange))"
                fillOpacity={1}
                fill="url(#checkoutGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}