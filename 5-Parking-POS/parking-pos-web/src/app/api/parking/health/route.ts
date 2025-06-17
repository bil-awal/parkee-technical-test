import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    
    return NextResponse.json({
      status: 'UP',
      service: 'Parking POS API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'DOWN',
        service: 'Parking POS API',
        version: '1.0.0',
        error: 'Database connection failed',
      },
      { status: 503 }
    )
  }
}