"use client"

import { useState, useEffect } from "react"
import {
  Car,
  Shield,
  BarChart3,
  Clock,
  Users,
  MapPin,
  Zap,
  CheckCircle,
  ArrowRight,
  Building2,
  Globe,
  Award,
  TrendingUp,
  Phone,
  Mail,
  ExternalLink,
  Sparkles,
  Target,
  Heart,
} from "lucide-react"

function Button({ children, className = "", variant = "default", onClick, ...props }) {
  const baseClasses = "inline-flex items-center justify-center px-4 py-2 rounded-md font-medium transition-all duration-200"
  const variants = {
    default: "bg-blue-600 hover:bg-blue-700 text-white",
    outline: "border border-gray-300 hover:border-blue-500 bg-white hover:bg-blue-50"
  }
  
  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}

function Card({ children, className = "", ...props }) {
  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 ${className}`} {...props}>
      {children}
    </div>
  )
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const features = [
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Monitor operasional parkir secara real-time dengan dashboard komprehensif",
      color: "blue",
    },
    {
      icon: Shield,
      title: "Keamanan Terjamin",
      description: "Sistem keamanan enterprise dengan enkripsi end-to-end",
      color: "green",
    },
    {
      icon: Zap,
      title: "Proses Cepat",
      description: "Check-in dan check-out dalam hitungan detik",
      color: "purple",
    },
    {
      icon: Users,
      title: "Manajemen Member",
      description: "Kelola member dan voucher dengan mudah",
      color: "orange",
    },
    {
      icon: Clock,
      title: "24/7 Operasional",
      description: "Sistem berjalan 24 jam tanpa henti",
      color: "red",
    },
    {
      icon: Target,
      title: "Efisiensi Tinggi",
      description: "Tingkatkan efisiensi operasional hingga 300%",
      color: "indigo",
    },
  ]

  const stats = [
    { value: "500+", label: "Fasilitas Parkir", icon: Building2 },
    { value: "1M+", label: "Kendaraan Diproses", icon: Car },
    { value: "99.9%", label: "Uptime System", icon: CheckCircle },
    { value: "24/7", label: "Support", icon: Clock },
  ]

  const achievements = [
    { title: "Best Parking Solution 2024", org: "Smart City Awards" },
    { title: "Innovation Excellence", org: "Tech Innovation Summit" },
    { title: "Customer Choice Award", org: "Industry Leaders Forum" },
  ]

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrollY > 20
            ? "backdrop-blur-xl bg-white/80 border-b border-gray-200/50 shadow-lg"
            : "bg-transparent"
        )}
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <a href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <Car className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
              </div>
              <div>
                <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Parkee
                </span>
                <p className="text-xs text-gray-500 font-medium">Smart Parking Solutions</p>
              </div>
            </a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#about"
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium hover:scale-105 transform duration-200"
              >
                Tentang Kami
              </a>
              <a
                href="#features"
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium hover:scale-105 transform duration-200"
              >
                Fitur
              </a>
              <a
                href="#contact"
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium hover:scale-105 transform duration-200"
              >
                Kontak
              </a>
            </div>

            {/* Login Button */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-full border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-green-700">System Online</span>
              </div>
              <Button 
                onClick={() => window.location.href = '/login'}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Shield className="w-4 h-4 mr-2" />
                Login Sistem
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={cn(
            "md:hidden transition-all duration-300 overflow-hidden",
            isMenuOpen ? "max-h-96 border-t border-gray-200/50" : "max-h-0"
          )}
        >
          <div className="backdrop-blur-xl bg-white/95 px-6 py-6 space-y-4">
            <a href="#about" className="block text-gray-600 hover:text-gray-900 font-medium py-2">
              Tentang Kami
            </a>
            <a href="#features" className="block text-gray-600 hover:text-gray-900 font-medium py-2">
              Fitur
            </a>
            <a href="#contact" className="block text-gray-600 hover:text-gray-900 font-medium py-2">
              Kontak
            </a>
            <div className="pt-4">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold">
                <Shield className="w-4 h-4 mr-2" />
                Login Sistem
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden min-h-screen flex items-center">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto max-w-7xl relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-200">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Solusi Parkir Terdepan</span>
                </div>

                <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-tight">
                  <span className="block text-gray-900">Parkir Cerdas</span>
                  <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Masa Depan
                  </span>
                </h1>

                <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed max-w-2xl">
                  Sistem manajemen parkir terdepan yang mengintegrasikan teknologi AI, IoT, dan analytics untuk
                  operasional yang efisien dan pengalaman pengguna yang superior.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => window.location.href = '/login'}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  Akses Sistem
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <a href="#about">
                  <Button
                    variant="outline"
                    className="border-2 border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105"
                  >
                    Pelajari Lebih Lanjut
                  </Button>
                </a>
              </div>

              {/* Live Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-8">
                {stats.slice(0, 4).map((stat, index) => (
                  <div
                    key={stat.label}
                    className="text-center p-4 bg-white/50 rounded-2xl border border-gray-200/50 hover:bg-white/80 transition-all duration-300"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <stat.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content - System Preview */}
            <div className="relative">
              <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden">
                {/* Mock Dashboard Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Car className="w-8 h-8" />
                      <div>
                        <h3 className="font-bold text-lg">Parkee Dashboard</h3>
                        <p className="text-blue-100 text-sm">Real-time Monitoring</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {currentTime.toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="text-blue-100 text-sm">
                        {currentTime.toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mock Dashboard Content */}
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-800">Kendaraan Aktif</span>
                      </div>
                      <div className="text-2xl font-bold text-green-700">247</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-blue-800">Pendapatan</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-700">Rp 2.4M</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Aktivitas Terkini</h4>
                    {[
                      { plate: "B 1234 ABC", action: "Check-in", time: "2 menit lalu", gate: "Gate A" },
                      { plate: "D 5678 XYZ", action: "Check-out", time: "5 menit lalu", gate: "Gate C" },
                      { plate: "F 9012 DEF", action: "Check-in", time: "8 menit lalu", gate: "Gate B" },
                    ].map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Car className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{activity.plate}</div>
                            <div className="text-sm text-gray-600">{activity.gate}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={cn(
                              "text-sm font-medium",
                              activity.action === "Check-in" ? "text-green-600" : "text-red-600"
                            )}
                          >
                            {activity.action}
                          </div>
                          <div className="text-xs text-gray-500">{activity.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-6 -right-6 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-6 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900">
              Tentang <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Parkee</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Kami adalah perusahaan teknologi terdepan yang mengkhususkan diri dalam solusi manajemen parkir cerdas.
              Dengan pengalaman lebih dari 10 tahun, kami telah melayani ratusan klien di seluruh Indonesia.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 bg-white">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Misi Kami</h3>
              <p className="text-gray-600 leading-relaxed">
                Menghadirkan solusi parkir yang efisien, aman, dan ramah lingkungan untuk menciptakan kota yang lebih
                cerdas dan berkelanjutan.
              </p>
            </Card>

            <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 bg-white">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Nilai Kami</h3>
              <p className="text-gray-600 leading-relaxed">
                Inovasi berkelanjutan, kepuasan pelanggan, dan komitmen terhadap kualitas adalah fondasi dari setiap
                solusi yang kami tawarkan.
              </p>
            </Card>

            <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 bg-white">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Globe className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Visi Kami</h3>
              <p className="text-gray-600 leading-relaxed">
                Menjadi pemimpin global dalam teknologi parkir cerdas dan berkontribusi pada pembangunan infrastruktur
                kota masa depan.
              </p>
            </Card>
          </div>

          {/* Achievements */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200/50">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold mb-4 text-gray-900">Penghargaan & Sertifikasi</h3>
              <p className="text-gray-600">Pengakuan atas dedikasi kami dalam inovasi teknologi parkir</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {achievements.map((achievement, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200/50"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
                    <p className="text-sm text-gray-600">{achievement.org}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900">
              Fitur <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Unggulan</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Teknologi terdepan yang dirancang untuk mengoptimalkan operasional parkir dan meningkatkan pengalaman
              pengguna
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const colorClasses = {
                blue: "bg-blue-50 border-blue-200 text-blue-600",
                green: "bg-green-50 border-green-200 text-green-600",
                purple: "bg-purple-50 border-purple-200 text-purple-600",
                orange: "bg-orange-50 border-orange-200 text-orange-600",
                red: "bg-red-50 border-red-200 text-red-600",
                indigo: "bg-indigo-50 border-indigo-200 text-indigo-600",
              }

              return (
                <Card
                  key={index}
                  className="p-8 hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 bg-white group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border-2 transition-all duration-300 group-hover:scale-110",
                      colorClasses[feature.color]
                    )}
                  >
                    <feature.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-6 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900">
              Hubungi <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Kami</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Tim ahli kami siap membantu Anda mengoptimalkan sistem parkir dengan solusi yang tepat
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-200/50">
                <h3 className="text-2xl font-bold mb-6 text-gray-900">Informasi Kontak</h3>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Phone className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Telepon</h4>
                      <p className="text-gray-600">+62 21 1234 5678</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Mail className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Email</h4>
                      <p className="text-gray-600">info@parkee.co.id</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Alamat</h4>
                      <p className="text-gray-600">
                        Jl. Sudirman No. 123
                        <br />
                        Jakarta Pusat 10220
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 rounded-3xl text-white">
                <h3 className="text-2xl font-bold mb-4">Jam Operasional</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Senin - Jumat</span>
                    <span>08:00 - 17:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sabtu</span>
                    <span>09:00 - 15:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Minggu</span>
                    <span>Tutup</span>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-white/20">
                  <p className="text-blue-100">Support 24/7 tersedia untuk klien enterprise</p>
                </div>
              </div>
            </div>

            {/* Quick Access */}
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-200/50">
                <h3 className="text-2xl font-bold mb-6 text-gray-900">Akses Cepat</h3>
                <div className="space-y-4">
                  <Button 
                    onClick={() => window.location.href = '/login'}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <Shield className="w-5 h-5 mr-2" />
                    Login ke Sistem
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="py-3 rounded-xl font-semibold border-2 hover:scale-105 transition-all duration-300"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Dokumentasi
                    </Button>
                    <Button
                      variant="outline"
                      className="py-3 rounded-xl font-semibold border-2 hover:scale-105 transition-all duration-300"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Support
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-200/50">
                <h3 className="text-2xl font-bold mb-6 text-gray-900">Status Sistem</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      <span className="font-semibold text-green-800">Sistem Operasional</span>
                    </div>
                    <span className="text-green-600 font-bold">99.9%</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-blue-800">Response Time</span>
                    </div>
                    <span className="text-blue-600 font-bold">{"< 100ms"}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-purple-600" />
                      <span className="font-semibold text-purple-800">Active Users</span>
                    </div>
                    <span className="text-purple-600 font-bold">1,247</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Car className="w-7 h-7 text-white" />
                </div>
                <div>
                  <span className="font-bold text-2xl">Parkee</span>
                  <p className="text-gray-400 text-sm">Smart Parking Solutions</p>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed max-w-md">
                Solusi parkir cerdas untuk masa depan yang lebih efisien. Bergabunglah dengan ratusan klien yang telah
                mempercayai teknologi kami.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Perusahaan</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#about" className="text-gray-400 hover:text-white transition-colors">
                    Tentang Kami
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Karir
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Press Kit
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#contact" className="text-gray-400 hover:text-white transition-colors">
                    Kontak
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Status
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Dokumentasi
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">© 2024 Parkee. All rights reserved.</p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}