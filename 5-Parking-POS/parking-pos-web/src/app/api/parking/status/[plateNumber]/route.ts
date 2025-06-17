import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateDuration, calculateParkingFee } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ plateNumber: string }> }
) {
  try {
    const { plateNumber } = await params
    const parking = await prisma.parkingTransaction.findFirst({
      where: {
        plateNumber: plateNumber,
        status: 'ACTIVE',
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
    
    const now = new Date()
    const duration = calculateDuration(parking.checkInTime, now)
    const currentFee = calculateParkingFee(duration.totalMinutes)
    
    return NextResponse.json({
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
    })
  } catch (error) {
    console.error('Status check error:', error)
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