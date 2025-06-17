import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const voucher = await prisma.voucher.findUnique({
      where: { id: parseInt(id) },
    })

    if (!voucher) {
      return NextResponse.json(
        {
          success: false,
          message: `Voucher tidak ditemukan`,
          data: null,
        },
        { status: 404 }
      )
    }

    if (!voucher.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: 'Voucher sudah tidak aktif',
          data: null,
        },
        { status: 400 }
      )
    }

    const updated = await prisma.voucher.update({
      where: { id: parseInt(id) },
      data: {
        isActive: false,
        terminatedAt: new Date(),
        terminatedBy: 'admin', // From auth
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Voucher berhasil diterminasi',
      data: {
        voucherId: updated.id,
        voucherCode: updated.code,
        isActive: updated.isActive,
        terminatedAt: updated.terminatedAt,
        terminatedBy: updated.terminatedBy,
      },
    })
  } catch (error) {
    console.error('Terminate voucher error:', error)
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