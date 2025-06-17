import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateMemberCode } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '0')
    const size = parseInt(searchParams.get('size') || '10')

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { memberCode: { contains: search, mode: 'insensitive' as const } },
            {
              vehicles: {
                some: {
                  plateNumber: { contains: search, mode: 'insensitive' as const },
                },
              },
            },
          ],
        }
      : {}

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        include: {
          vehicles: true,
        },
        skip: page * size,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.member.count({ where }),
    ])

    const formattedMembers = members.map((member) => ({
      memberId: member.id,
      memberCode: member.memberCode,
      name: member.name,
      email: member.email,
      phone: member.phone,
      balance: Number(member.balance),
      memberType: member.memberType,
      isActive: member.isActive,
      joinDate: member.joinDate,
      plateNumbers: member.vehicles.map((v) => v.plateNumber),
    }))

    return NextResponse.json({
      success: true,
      message: 'Data member berhasil diambil',
      data: {
        content: formattedMembers,
        totalElements: total,
        totalPages: Math.ceil(total / size),
        number: page,
        size,
      },
    })
  } catch (error) {
    console.error('Get members error:', error)
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
    const { name, email, phoneNumber, vehiclePlateNumber } = body

    // Check if email already exists
    const existingMember = await prisma.member.findFirst({
      where: {
        OR: [
          { email },
          ...(phoneNumber ? [{ phone: phoneNumber }] : []),
        ],
      },
    })

    if (existingMember) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email atau nomor HP sudah terdaftar',
          data: null,
        },
        { status: 400 }
      )
    }

    // Check if plate number already registered
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { plateNumber: vehiclePlateNumber },
    })

    if (existingVehicle) {
      return NextResponse.json(
        {
          success: false,
          message: 'Nomor plat sudah terdaftar',
          data: null,
        },
        { status: 400 }
      )
    }

    // Create member
    const member = await prisma.member.create({
      data: {
        memberCode: '', // Will be updated
        name,
        email,
        phone: phoneNumber || null,
        vehicles: {
          create: {
            plateNumber: vehiclePlateNumber,
          },
        },
      },
      include: {
        vehicles: true,
      },
    })

    // Update member code
    await prisma.member.update({
      where: { id: member.id },
      data: {
        memberCode: generateMemberCode(member.id),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Registrasi member berhasil',
      data: {
        memberId: member.id,
        memberCode: generateMemberCode(member.id),
        name: member.name,
        email: member.email,
        phone: member.phone,
        plateNumbers: member.vehicles.map((v) => v.plateNumber),
        balance: 0,
        memberType: member.memberType,
        joinDate: member.joinDate,
      },
    })
  } catch (error) {
    console.error('Create member error:', error)
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