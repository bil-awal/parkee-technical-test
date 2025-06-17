export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  timestamp?: string;
  errorCode?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface CheckInRequest {
  plateNumber: string;
  vehicleType: 'CAR' | 'MOTORCYCLE' | 'TRUCK' | 'BUS';
  gate: string;
  operatorName: string;
  photo?: File;
}

export interface CheckOutRequest {
  plateNumber: string;
  paymentMethod: 'CASH' | 'QRIS' | 'EMONEY' | 'FLAZZ' | 'BRIZZI' | 'MEMBER_BALANCE';
  voucherCode?: string;
  gate: string;
  operatorName: string;
  photo?: File;
}

export interface ParkingStatus {
  ticketNumber: string;
  plateNumber: string;
  vehicleType: string;
  checkInTime: string;
  duration: string;
  currentFee: number;
}

export interface Member {
  memberId: number;
  memberCode: string;
  name: string;
  email: string;
  phone?: string;
  balance: number;
  memberType: 'REGULAR' | 'SILVER' | 'GOLD' | 'PLATINUM';
  isActive: boolean;
  joinDate?: string;
  plateNumbers?: string[];
}

export interface Voucher {
  voucherId: number;
  voucherCode: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  maxDiscount?: number;
  minPurchase?: number;
  validFrom: string;
  validUntil: string;
  usageLimit?: number;
  usageCount?: number;
  remainingUsage?: number;
  isActive: boolean;
}

export interface DashboardStatistics {
  period: {
    startDate: string;
    endDate: string;
  };
  totalVehicles: number;
  totalRevenue: number;
  averageDuration: string;
  peakHours: string[];
  vehicleTypeBreakdown: Record<string, number>;
  paymentMethodBreakdown: Record<string, number>;
}

export interface Invoice {
  invoiceNumber: string;
  ticketNumber: string;
  plateNumber: string;
  vehicleType: string;
  checkInTime: string;
  checkOutTime: string;
  duration: string;
  baseFee: number;
  discount: number;
  totalFee: number;
  paymentMethod: string;
  paymentTime: string;
  cashierName: string;
}

export interface VehicleActivity {
  ticketNumber: string;
  plateNumber: string;
  vehicleType: string;
  checkInTime: string;
  checkOutTime?: string;
  duration?: string;
  totalFee?: number;
  status: 'ACTIVE' | 'COMPLETED';
}