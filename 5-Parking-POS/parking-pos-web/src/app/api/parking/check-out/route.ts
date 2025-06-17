import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateDuration, calculateParkingFee, generateInvoiceNumber } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const data = JSON.parse(formData.get('data') as string)
    const photo = formData.get('photo') as File
    
    const { plateNumber, paymentMethod, voucherCode, gate, operatorName } = data
    
    // Find active parking
    const parking = await prisma.parkingTransaction.findFirst({
      where: {
        plateNumber,
        status: 'ACTIVE',
      },
      include: {
        voucher: true,
        member: true,
      },
    })
    
    if (!parking) {
      return NextResponse.json(
        {
          success: false,
          message: `Kendaraan dengan plat nomor ${plateNumber} tidak sedang parkir`,
          data: null,
        },
        { status: 404 }
      )
    }
    
    const checkOutTime = new Date()
    const duration = calculateDuration(parking.checkInTime, checkOutTime)
    const baseFee = calculateParkingFee(duration.totalMinutes)
    
    // Calculate discount
    let discount = 0
    if (voucherCode && parking.voucher) {
      if (parking.voucher.discountType === 'PERCENTAGE') {
        discount = (baseFee * Number(parking.voucher.discountValue)) / 100
      } else {
        discount = Number(parking.voucher.discountValue)
      }
    }
    
    const totalFee = baseFee - discount
    
    // TODO: Handle photo upload
    const photoUrl = '/placeholder-photo.jpg'
    
    // Update transaction
    const updated = await prisma.parkingTransaction.update({
      where: { id: parking.id },
      data: {
        checkOutTime,
        duration: duration.totalMinutes,
        baseFee,
        discount,
        totalFee,
        paymentMethod,
        paymentTime: checkOutTime,
        status: 'COMPLETED',
        checkOutPhoto: photoUrl,
        checkOutUserId: '1', // From auth
      },
    })
    
    const invoiceNumber = generateInvoiceNumber()
    
    return NextResponse.json({
      success: true,
      message: 'Check-out berhasil',
      data: {
        invoiceNumber,
        plateNumber: updated.plateNumber,
        checkInTime: updated.checkInTime,
        checkOutTime: updated.checkOutTime,
        duration: duration.formatted,
        totalFee: Number(updated.totalFee),
        paymentMethod: updated.paymentMethod,
        paymentStatus: 'PAID',
      },
    })
  } catch (error) {
    console.error('Check-out error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan sistem',
        data: null,
      },
      { status: 500 }
    )
  }
}