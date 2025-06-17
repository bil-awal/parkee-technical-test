import { ApiResponse, PaginatedResponse } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api'

// Token management
const TOKEN_KEY = 'parkee_access_token'
const REFRESH_TOKEN_KEY = 'parkee_refresh_token'

class ApiClient {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  // Token management methods
  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(TOKEN_KEY)
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  }

  private setTokens(accessToken: string, refreshToken?: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(TOKEN_KEY, accessToken)
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    }
  }

  private clearTokens(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    const token = this.getAccessToken()
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
      })

      const data = await response.json()

      // Handle 401 - try to refresh token
      if (response.status === 401 && token && endpoint !== '/auth/refresh-token') {
        const refreshed = await this.tryRefreshToken()
        if (refreshed) {
          // Retry original request with new token
          return this.request(endpoint, options)
        } else {
          // Refresh failed, clear tokens and redirect to login
          this.clearTokens()
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
          throw new Error('Session expired')
        }
      }

      if (!response.ok) {
        throw new Error(data.message || 'API request failed')
      }

      return data
    } catch (error) {
      throw error
    }
  }

  private async requestWithFormData<T>(
    endpoint: string,
    formData: FormData,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    const token = this.getAccessToken()
    
    try {
      const response = await fetch(url, {
        ...options,
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'API request failed')
      }

      return data
    } catch (error) {
      throw error
    }
  }

  private async tryRefreshToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) return false

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      if (response.ok) {
        const data = await response.json()
        this.setTokens(data.data.accessToken, data.data.refreshToken)
        return true
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
    }

    return false
  }

  // Authentication endpoints
  async login(email: string, password: string, rememberMe: boolean = false) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, rememberMe }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Login failed')
    }

    // Store tokens
    this.setTokens(data.data.accessToken, data.data.refreshToken)

    return data
  }

  async logout() {
    const accessToken = this.getAccessToken()
    const refreshToken = this.getRefreshToken()

    if (!accessToken) return

    try {
      await fetch(`${this.baseURL}/auth/logout`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ accessToken, refreshToken }),
      })
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      this.clearTokens()
    }
  }

  async refreshToken() {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) throw new Error('No refresh token available')

    const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Token refresh failed')
    }

    this.setTokens(data.data.accessToken, data.data.refreshToken)
    return data
  }

  async validateToken(token?: string) {
    const tokenToValidate = token || this.getAccessToken()
    if (!tokenToValidate) throw new Error('No token to validate')

    return this.request(`/auth/validate?token=${encodeURIComponent(tokenToValidate)}`)
  }

  async getMockUsers() {
    const response = await fetch(`${this.baseURL}/auth/mock-users`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get mock users')
    }

    return data
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getAccessToken()
  }

  // Parking endpoints
  async checkIn(data: FormData) {
    return this.requestWithFormData('/parking/check-in', data)
  }

  async checkOut(data: FormData) {
    return this.requestWithFormData('/parking/check-out', data)
  }

  async checkStatus(plateNumber: string) {
    return this.request(`/parking/status/${encodeURIComponent(plateNumber)}`)
  }

  async calculateFee(plateNumber: string, voucherCode?: string) {
    const params = new URLSearchParams()
    if (voucherCode) params.append('voucherCode', voucherCode)
    
    return this.request(
      `/parking/calculate/${encodeURIComponent(plateNumber)}${params.toString() ? `?${params}` : ''}`
    )
  }

  async getInvoice(invoiceNumber: string) {
    return this.request(`/parking/invoices/${encodeURIComponent(invoiceNumber)}`)
  }

  // Member endpoints
  async getMembers(params: { search?: string; page?: number; size?: number }) {
    const searchParams = new URLSearchParams()
    if (params.search) searchParams.append('search', params.search)
    if (params.page !== undefined) searchParams.append('page', params.page.toString())
    if (params.size !== undefined) searchParams.append('size', params.size.toString())
    
    return this.request<PaginatedResponse<any>>(
      `/parking/members?${searchParams}`
    )
  }

  async getMember(id: number) {
    return this.request(`/parking/members/${id}`)
  }

  async createMember(data: any) {
    return this.request('/parking/members', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateMember(id: number, data: any) {
    return this.request(`/parking/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteMember(id: number) {
    return this.request(`/parking/members/${id}`, {
      method: 'DELETE',
    })
  }

  async topUpBalance(id: number, amount: number) {
    return this.request(`/parking/members/${id}/topup`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    })
  }

  // Voucher endpoints
  async getVouchers(params: { activeOnly?: boolean; page?: number; size?: number }) {
    const searchParams = new URLSearchParams()
    if (params.activeOnly) searchParams.append('activeOnly', 'true')
    if (params.page !== undefined) searchParams.append('page', params.page.toString())
    if (params.size !== undefined) searchParams.append('size', params.size.toString())
    
    return this.request<PaginatedResponse<any>>(
      `/parking/vouchers?${searchParams}`
    )
  }

  async createVoucher(data: any) {
    return this.request('/parking/vouchers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async terminateVoucher(id: number) {
    return this.request(`/parking/vouchers/${id}/terminate`, {
      method: 'POST',
    })
  }

  // Dashboard endpoints
  async getDashboardStats(startDate?: string, endDate?: string) {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    
    return this.request(
      `/parking/dashboard/statistics${params.toString() ? `?${params}` : ''}`
    )
  }

  async getVehicleActivities(params: {
    plateNumber?: string;
    date?: string;
    status?: string;
    page?: number;
    size?: number;
  }) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.append(key, value.toString())
    })
    
    return this.request<PaginatedResponse<any>>(
      `/parking/admin/vehicles?${searchParams}`
    )
  }

  async exportReport(startDate: string, endDate: string, format: 'PDF' | 'EXCEL' = 'PDF') {
    const params = new URLSearchParams({
      startDate,
      endDate,
      format,
    })
    
    const token = this.getAccessToken()
    const response = await fetch(
      `${this.baseURL}/parking/admin/reports/export?${params}`,
      {
        method: 'GET',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      }
    )
    
    if (!response.ok) {
      throw new Error('Export failed')
    }
    
    return response.blob()
  }

  // Utilities
  async getPaymentMethods() {
    return this.request('/parking/payment-methods')
  }

  async healthCheck() {
    return this.request('/parking/health')
  }
}

export const apiClient = new ApiClient()