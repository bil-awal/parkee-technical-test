/**
 * Mock API Client for development
 * This simulates the backend API responses when the real API is not available
 */

import { ApiResponse, PaginatedResponse } from '@/types'
import { generateTicketNumber, generateInvoiceNumber, generateMemberCode, calculateDuration, calculateParkingFee } from '@/lib/utils'

// Mock data storage
const mockData = {
  parkingTransactions: new Map<string, any>(),
  members: new Map<number, any>(),
  vouchers: new Map<number, any>(),
  memberIdCounter: 1000,
  voucherIdCounter: 1,
}

// Initialize with some mock data
function initializeMockData() {
  // Add mock members
  mockData.members.set(1001, {
    memberId: 1001,
    memberCode: 'MBR-1001',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '081234567890',
    balance: 150000,
    memberType: 'GOLD',
    isActive: true,
    joinDate: '2025-01-15',
    plateNumbers: ['B1234ABC', 'B5678DEF'],
  })

  mockData.members.set(1002, {
    memberId: 1002,
    memberCode: 'MBR-1002',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '081234567891',
    balance: 50000,
    memberType: 'REGULAR',
    isActive: true,
    joinDate: '2025-06-20',
    plateNumbers: ['B9876ZYX'],
  })

  // Add mock vouchers
  mockData.vouchers.set(1, {
    voucherId: 1,
    voucherCode: 'DISC20',
    description: 'Diskon 20% untuk semua kendaraan',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    maxDiscount: 50000,
    minPurchase: 10000,
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    usageLimit: 100,
    usageCount: 15,
    remainingUsage: 85,
    isActive: true,
  })

  mockData.vouchers.set(2, {
    voucherId: 2,
    voucherCode: 'FLAT5K',
    description: 'Potongan Rp 5.000',
    discountType: 'FIXED_AMOUNT',
    discountValue: 5000,
    minPurchase: 15000,
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    usageLimit: 50,
    usageCount: 23,
    remainingUsage: 27,
    isActive: true,
  })

  // Add some active parking
  const now = new Date()
  mockData.parkingTransactions.set('B1111AAA', {
    ticketNumber: 'TKT-20250116-001',
    plateNumber: 'B1111AAA',
    vehicleType: 'CAR',
    checkInTime: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'ACTIVE',
  })

  mockData.parkingTransactions.set('B2222BBB', {
    ticketNumber: 'TKT-20250116-002',
    plateNumber: 'B2222BBB',
    vehicleType: 'MOTORCYCLE',
    checkInTime: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    status: 'ACTIVE',
  })
}

// Initialize on first import
initializeMockData()

class MockApiClient {
  private delay(ms: number = 500): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async checkIn(data: FormData): Promise<ApiResponse> {
    await this.delay()
    
    const jsonData = JSON.parse(data.get('data') as string)
    const { plateNumber, vehicleType, gate } = jsonData

    // Check if already parked
    if (mockData.parkingTransactions.has(plateNumber)) {
      throw new Error(`Kendaraan dengan plat nomor ${plateNumber} sedang parkir`)
    }

    const ticketNumber = generateTicketNumber()
    const checkInTime = new Date().toISOString()

    const transaction = {
      ticketNumber,
      plateNumber,
      vehicleType,
      checkInTime,
      gate,
      status: 'ACTIVE',
    }

    mockData.parkingTransactions.set(plateNumber, transaction)

    return {
      success: true,
      message: 'Check-in berhasil',
      data: {
        ticketNumber,
        plateNumber,
        vehicleType,
        checkInTime,
        location: gate,
      },
    }
  }

  async checkOut(data: FormData): Promise<ApiResponse> {
    await this.delay()
    
    const jsonData = JSON.parse(data.get('data') as string)
    const { plateNumber, paymentMethod, voucherCode } = jsonData

    const parking = mockData.parkingTransactions.get(plateNumber)
    if (!parking || parking.status !== 'ACTIVE') {
      throw new Error(`Kendaraan dengan plat nomor ${plateNumber} tidak sedang parkir`)
    }

    const checkOutTime = new Date()
    const duration = calculateDuration(new Date(parking.checkInTime), checkOutTime)
    const baseFee = calculateParkingFee(duration.totalMinutes)
    
    let discount = 0
    if (voucherCode) {
      const voucher = Array.from(mockData.vouchers.values()).find(
        (v) => v.voucherCode === voucherCode && v.isActive
      )
      if (voucher) {
        if (voucher.discountType === 'PERCENTAGE') {
          discount = Math.floor((baseFee * voucher.discountValue) / 100)
          if (voucher.maxDiscount) {
            discount = Math.min(discount, voucher.maxDiscount)
          }
        } else {
          discount = voucher.discountValue
        }
      }
    }

    const totalFee = baseFee - discount
    const invoiceNumber = generateInvoiceNumber()

    parking.status = 'COMPLETED'
    parking.checkOutTime = checkOutTime.toISOString()
    parking.totalFee = totalFee

    return {
      success: true,
      message: 'Check-out berhasil',
      data: {
        invoiceNumber,
        plateNumber,
        checkInTime: parking.checkInTime,
        checkOutTime: checkOutTime.toISOString(),
        duration: duration.formatted,
        totalFee,
        paymentMethod,
        paymentStatus: 'PAID',
      },
    }
  }

  async checkStatus(plateNumber: string): Promise<ApiResponse> {
    await this.delay(300)
    
    const parking = mockData.parkingTransactions.get(plateNumber)
    if (!parking || parking.status !== 'ACTIVE') {
      throw new Error(`Kendaraan dengan plat nomor ${plateNumber} tidak sedang parkir`)
    }

    const now = new Date()
    const duration = calculateDuration(new Date(parking.checkInTime), now)
    const currentFee = calculateParkingFee(duration.totalMinutes)

    return {
      success: true,
      message: 'Data parkir ditemukan',
      data: {
        ticketNumber: parking.ticketNumber,
        plateNumber: parking.plateNumber,
        vehicleType: parking.vehicleType,
        checkInTime: parking.checkInTime,
        duration: duration.formatted,
        currentFee,
      },
    }
  }

  async calculateFee(plateNumber: string, voucherCode?: string): Promise<ApiResponse> {
    await this.delay(300)
    
    const parking = mockData.parkingTransactions.get(plateNumber)
    if (!parking || parking.status !== 'ACTIVE') {
      throw new Error('Data parkir tidak ditemukan')
    }

    const now = new Date()
    const duration = calculateDuration(new Date(parking.checkInTime), now)
    const baseFee = calculateParkingFee(duration.totalMinutes)
    
    let voucherDiscount = 0
    if (voucherCode) {
      const voucher = Array.from(mockData.vouchers.values()).find(
        (v) => v.voucherCode === voucherCode && v.isActive
      )
      if (voucher) {
        if (voucher.discountType === 'PERCENTAGE') {
          voucherDiscount = Math.floor((baseFee * voucher.discountValue) / 100)
          if (voucher.maxDiscount) {
            voucherDiscount = Math.min(voucherDiscount, voucher.maxDiscount)
          }
        } else {
          voucherDiscount = voucher.discountValue
        }
      }
    }

    const totalFee = baseFee - voucherDiscount

    return {
      success: true,
      message: 'Kalkulasi biaya berhasil',
      data: {
        plateNumber,
        checkInTime: parking.checkInTime,
        checkOutTime: now.toISOString(),
        duration: duration.formatted,
        baseFee,
        voucherCode,
        voucherDiscount,
        totalFee,
      },
    }
  }

  async getMembers(params: {
    search?: string
    page?: number
    size?: number
  }): Promise<ApiResponse<PaginatedResponse<any>>> {
    await this.delay()
    
    const { search = '', page = 0, size = 10 } = params
    let members = Array.from(mockData.members.values())

    if (search) {
      members = members.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.email.toLowerCase().includes(search.toLowerCase()) ||
          m.plateNumbers.some((p: string) =>
            p.toLowerCase().includes(search.toLowerCase())
          )
      )
    }

    const start = page * size
    const end = start + size
    const paginatedMembers = members.slice(start, end)

    return {
      success: true,
      message: 'Data member berhasil diambil',
      data: {
        content: paginatedMembers,
        totalElements: members.length,
        totalPages: Math.ceil(members.length / size),
        number: page,
        size,
      },
    }
  }

  async getMember(id: number): Promise<ApiResponse> {
    await this.delay(300)
    
    const member = mockData.members.get(id)
    if (!member) {
      throw new Error(`Member dengan ID ${id} tidak ditemukan`)
    }

    return {
      success: true,
      message: 'Data member ditemukan',
      data: member,
    }
  }

  async createMember(data: any): Promise<ApiResponse> {
    await this.delay()
    
    // Check if email already exists
    const existingMember = Array.from(mockData.members.values()).find(
      (m) => m.email === data.email
    )
    if (existingMember) {
      throw new Error('Email sudah terdaftar')
    }

    const memberId = ++mockData.memberIdCounter
    const member = {
      memberId,
      memberCode: generateMemberCode(memberId),
      name: data.name,
      email: data.email,
      phone: data.phoneNumber || null,
      balance: 0,
      memberType: 'REGULAR',
      isActive: true,
      joinDate: new Date().toISOString().split('T')[0],
      plateNumbers: [data.vehiclePlateNumber],
    }

    mockData.members.set(memberId, member)

    return {
      success: true,
      message: 'Registrasi member berhasil',
      data: member,
    }
  }

  async updateMember(id: number, data: any): Promise<ApiResponse> {
    await this.delay()
    
    const member = mockData.members.get(id)
    if (!member) {
      throw new Error(`Member dengan ID ${id} tidak ditemukan`)
    }

    Object.assign(member, data)

    return {
      success: true,
      message: 'Update member berhasil',
      data: member,
    }
  }

  async deleteMember(id: number): Promise<ApiResponse> {
    await this.delay()
    
    const member = mockData.members.get(id)
    if (!member) {
      throw new Error(`Member dengan ID ${id} tidak ditemukan`)
    }

    member.isActive = false

    return {
      success: true,
      message: 'Member berhasil dinonaktifkan',
    }
  }

  async topUpBalance(id: number, amount: number): Promise<ApiResponse> {
    await this.delay()
    
    const member = mockData.members.get(id)
    if (!member) {
      throw new Error(`Member dengan ID ${id} tidak ditemukan`)
    }

    const previousBalance = member.balance
    member.balance += amount

    return {
      success: true,
      message: 'Top up berhasil',
      data: {
        memberId: id,
        memberCode: member.memberCode,
        name: member.name,
        previousBalance,
        topUpAmount: amount,
        currentBalance: member.balance,
        transactionDate: new Date().toISOString(),
      },
    }
  }

  async getVouchers(params: {
    activeOnly?: boolean
    page?: number
    size?: number
  }): Promise<ApiResponse<PaginatedResponse<any>>> {
    await this.delay()
    
    const { activeOnly = false, page = 0, size = 10 } = params
    let vouchers = Array.from(mockData.vouchers.values())

    if (activeOnly) {
      vouchers = vouchers.filter((v) => v.isActive)
    }

    const start = page * size
    const end = start + size
    const paginatedVouchers = vouchers.slice(start, end)

    return {
      success: true,
      message: 'Data voucher berhasil diambil',
      data: {
        content: paginatedVouchers,
        totalElements: vouchers.length,
        totalPages: Math.ceil(vouchers.length / size),
        number: page,
        size,
      },
    }
  }

  async createVoucher(data: any): Promise<ApiResponse> {
    await this.delay()
    
    // Check if code already exists
    const existingVoucher = Array.from(mockData.vouchers.values()).find(
      (v) => v.voucherCode === data.code
    )
    if (existingVoucher) {
      throw new Error(`Kode voucher ${data.code} sudah digunakan`)
    }

    const voucherId = ++mockData.voucherIdCounter
    const voucher = {
      voucherId,
      voucherCode: data.code,
      description: data.description,
      discountType: data.discountType,
      discountValue: data.discountValue,
      maxDiscount: data.discountType === 'PERCENTAGE' ? 50000 : null,
      minPurchase: data.minimumAmount,
      validFrom: data.validFrom,
      validUntil: data.validUntil,
      usageLimit: data.usageLimit,
      usageCount: 0,
      remainingUsage: data.usageLimit,
      isActive: true,
    }

    mockData.vouchers.set(voucherId, voucher)

    return {
      success: true,
      message: 'Voucher berhasil dibuat',
      data: voucher,
    }
  }

  async terminateVoucher(id: number): Promise<ApiResponse> {
    await this.delay()
    
    const voucher = mockData.vouchers.get(id)
    if (!voucher) {
      throw new Error('Voucher tidak ditemukan')
    }

    if (!voucher.isActive) {
      throw new Error('Voucher sudah tidak aktif')
    }

    voucher.isActive = false
    voucher.terminatedAt = new Date().toISOString()
    voucher.terminatedBy = 'admin'

    return {
      success: true,
      message: 'Voucher berhasil diterminasi',
      data: {
        voucherId: voucher.voucherId,
        voucherCode: voucher.voucherCode,
        isActive: voucher.isActive,
        terminatedAt: voucher.terminatedAt,
        terminatedBy: voucher.terminatedBy,
      },
    }
  }

  async getDashboardStats(startDate?: string, endDate?: string): Promise<ApiResponse> {
    await this.delay()
    
    const activeParking = Array.from(mockData.parkingTransactions.values()).filter(
      (t) => t.status === 'ACTIVE'
    ).length

    return {
      success: true,
      message: 'Statistik berhasil diambil',
      data: {
        period: {
          startDate: startDate || new Date().toISOString().split('T')[0],
          endDate: endDate || new Date().toISOString().split('T')[0],
        },
        totalVehicles: 125,
        totalRevenue: 1875000,
        averageDuration: '2.5 jam',
        activeParking,
        peakHours: ['08:00-10:00', '17:00-19:00'],
        vehicleTypeBreakdown: {
          MOBIL: 85,
          MOTOR: 40,
        },
        paymentMethodBreakdown: {
          CASH: 60,
          MEMBER_BALANCE: 25,
          DEBIT_CARD: 10,
          CREDIT_CARD: 3,
          QRIS: 2,
        },
      },
    }
  }

  async getVehicleActivities(params: any): Promise<ApiResponse<PaginatedResponse<any>>> {
    await this.delay()
    
    const activities = [
      {
        ticketNumber: 'TKT-20250116-001',
        plateNumber: 'B1234ABC',
        vehicleType: 'MOBIL',
        checkInTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        checkOutTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        duration: '2 jam',
        totalFee: 6000,
        status: 'COMPLETED',
      },
      {
        ticketNumber: 'TKT-20250116-002',
        plateNumber: 'B5678DEF',
        vehicleType: 'MOTOR',
        checkInTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        checkOutTime: null,
        duration: null,
        totalFee: null,
        status: 'ACTIVE',
      },
    ]

    return {
      success: true,
      message: 'Data kendaraan berhasil diambil',
      data: {
        content: activities,
        totalElements: activities.length,
        totalPages: 1,
        number: 0,
        size: 10,
      },
    }
  }

  async exportReport(startDate: string, endDate: string, format: 'PDF' | 'EXCEL'): Promise<Blob> {
    await this.delay(1000)
    
    // Simulate file download
    const content = format === 'PDF' 
      ? 'PDF Report Content' 
      : 'Excel Report Content'
    
    return new Blob([content], {
      type: format === 'PDF' ? 'application/pdf' : 'application/vnd.ms-excel',
    })
  }

  async getPaymentMethods(): Promise<ApiResponse> {
    await this.delay(300)
    
    return {
      success: true,
      message: 'Metode pembayaran tersedia',
      data: [
        {
          code: 'CASH',
          name: 'Tunai',
          description: 'Pembayaran tunai',
          isActive: true,
        },
        {
          code: 'MEMBER_BALANCE',
          name: 'Saldo Member',
          description: 'Pembayaran menggunakan saldo member',
          isActive: true,
        },
        {
          code: 'DEBIT_CARD',
          name: 'Kartu Debit',
          description: 'Pembayaran dengan kartu debit',
          isActive: true,
        },
        {
          code: 'CREDIT_CARD',
          name: 'Kartu Kredit',
          description: 'Pembayaran dengan kartu kredit',
          isActive: true,
        },
        {
          code: 'QRIS',
          name: 'QRIS',
          description: 'Pembayaran dengan dompet digital',
          isActive: true,
        },
      ],
    }
  }

  async healthCheck(): Promise<ApiResponse> {
    await this.delay(100)
    
    return {
      success: true,
      message: 'OK',
      data: {
        status: 'UP',
        service: 'Parking POS API (Mock)',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: '5 days 3 hours',
      },
    }
  }

  async getInvoice(invoiceNumber: string): Promise<ApiResponse> {
    await this.delay(300)
    
    return {
      success: true,
      message: 'Invoice ditemukan',
      data: {
        invoiceNumber,
        ticketNumber: 'TKT-20250116-001',
        plateNumber: 'B1234ABC',
        vehicleType: 'MOBIL',
        checkInTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        checkOutTime: new Date().toISOString(),
        duration: '3 jam',
        baseFee: 9000,
        discount: 0,
        totalFee: 9000,
        paymentMethod: 'CASH',
        paymentTime: new Date().toISOString(),
        cashierName: 'Admin POS 1',
      },
    }
  }
}

// Export the mock client for development
export const mockApiClient = new MockApiClient()

// Use mock client in development, real client in production
export const apiClient = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true' 
  ? mockApiClient 
  : mockApiClient // For now, always use mock since backend is not available