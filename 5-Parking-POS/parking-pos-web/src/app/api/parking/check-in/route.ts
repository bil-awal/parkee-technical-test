import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateTicketNumber } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const data = JSON.parse(formData.get('data') as string)
    const photo = formData.get('photo') as File
    
    const { plateNumber, vehicleType, gate, operatorName } = data
    
    // Check if vehicle is already parked
    const existingParking = await prisma.parkingTransaction.findFirst({
      where: {
        plateNumber,
        status: 'ACTIVE',
      },
    })
    
    if (existingParking) {
      return NextResponse.json(
        {
          success: false,
          message: `Kendaraan dengan plat nomor ${plateNumber} sedang parkir`,
          data: null,
        },
        { status: 400 }
      )
    }
    
    // Create parking transaction
    const ticketNumber = generateTicketNumber()
    
    // TODO: Handle photo upload to storage
    const photoUrl = '/placeholder-photo.jpg'
    
    const transaction = await prisma.parkingTransaction.create({
      data: {
        ticketNumber,
        plateNumber,
        vehicleType,
        gate,
        checkInPhoto: photoUrl,
        checkInUserId: '1', // From auth
      },
    })
    
    return NextResponse.json({
      success: true,
      message: 'Check-in berhasil',
      data: {
        ticketNumber: transaction.ticketNumber,
        plateNumber: transaction.plateNumber,
        vehicleType: transaction.vehicleType,
        checkInTime: transaction.checkInTime,
        location: gate,
      },
    })
  } catch (error) {
    console.error('Check-in error:', error)
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