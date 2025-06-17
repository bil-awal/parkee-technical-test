import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date))
}

export function calculateDuration(checkIn: Date, checkOut: Date): {
  hours: number;
  minutes: number;
  totalMinutes: number;
  formatted: string;
} {
  const diff = checkOut.getTime() - checkIn.getTime()
  const totalMinutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  
  let formatted = ''
  if (hours > 0) {
    formatted += `${hours} jam`
  }
  if (minutes > 0) {
    if (hours > 0) formatted += ' '
    formatted += `${minutes} menit`
  }
  
  return { hours, minutes, totalMinutes, formatted }
}

export function calculateParkingFee(minutes: number, ratePerHour: number = 3000): number {
  const hours = Math.ceil(minutes / 60)
  return hours * ratePerHour
}

export function generateTicketNumber(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `TKT-${dateStr}-${random}`
}

export function generateInvoiceNumber(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `INV-${dateStr}-${random}`
}

export function generateMemberCode(id: number): string {
  return `MBR-${id.toString().padStart(4, '0')}`
}

export function validatePlateNumber(plate: string): boolean {
  // Indonesian plate number format: 1-2 letters, 1-4 digits, 1-3 letters
  const pattern = /^[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{1,3}$/
  return pattern.test(plate.toUpperCase().replace(/\s/g, ''))
}

export function formatPlateNumber(plate: string): string {
  return plate.toUpperCase().replace(/\s/g, '')
}