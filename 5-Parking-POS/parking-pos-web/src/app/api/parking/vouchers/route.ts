import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const activeOnly = searchParams.get('activeOnly') === 'true'
    const page = parseInt(searchParams.get('page') || '0')
    const size = parseInt(searchParams.get('size') || '10')

    const where = activeOnly ? { isActive: true } : {}

    const [vouchers, total] = await Promise.all([
      prisma.voucher.findMany({
        where,
        skip: page * size,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.voucher.count({ where }),
    ])

    const formattedVouchers = vouchers.map((voucher) => ({
      voucherId: voucher.id,
      voucherCode: voucher.code,
      description: voucher.description,
      discountType: voucher.discountType,
      discountValue: Number(voucher.discountValue),
      validUntil: voucher.validUntil,
      remainingUsage: voucher.usageLimit
        ? voucher.usageLimit - voucher.usageCount
        : null,
      isActive: voucher.isActive,
    }))

    return NextResponse.json({
      success: true,
      message: 'Data voucher berhasil diambil',
      data: {
        content: formattedVouchers,
        totalElements: total,
        totalPages: Math.ceil(total / size),
        number: page,
        size,
      },
    })
  } catch (error) {
    console.error('Get vouchers error:', error)
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Check if voucher code already exists
    const existing = await prisma.voucher.findUnique({
      where: { code: body.code },
    })

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: `Kode voucher ${body.code} sudah digunakan`,
          data: null,
        },
        { status: 400 }
      )
    }

    const voucher = await prisma.voucher.create({
      data: {
        code: body.code,
        description: body.description,
        discountType: body.discountType,
        discountValue: body.discountValue,
        minPurchase: body.minimumAmount || 0,
        maxDiscount: body.maxDiscount,
        validFrom: new Date(body.validFrom),
        validUntil: new Date(body.validUntil),
        usageLimit: body.usageLimit,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Voucher berhasil dibuat',
      data: {
        voucherId: voucher.id,
        voucherCode: voucher.code,
        description: voucher.description,
        discountType: voucher.discountType,
        discountValue: Number(voucher.discountValue),
        maxDiscount: voucher.maxDiscount ? Number(voucher.maxDiscount) : null,
        minPurchase: Number(voucher.minPurchase),
        validFrom: voucher.validFrom,
        validUntil: voucher.validUntil,
        usageLimit: voucher.usageLimit,
        usageCount: 0,
        isActive: true,
      },
    })
  } catch (error) {
    console.error('Create voucher error:', error)
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