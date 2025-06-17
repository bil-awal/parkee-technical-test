import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const member = await prisma.member.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        vehicles: true,
      },
    })

    if (!member) {
      return NextResponse.json(
        {
          success: false,
          message: `Member dengan ID ${params.id} tidak ditemukan`,
          data: null,
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Data member ditemukan',
      data: {
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
      },
    })
  } catch (error) {
    console.error('Get member error:', error)
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, email, phoneNumber } = body

    const member = await prisma.member.findUnique({
      where: { id: parseInt(params.id) },
    })

    if (!member) {
      return NextResponse.json(
        {
          success: false,
          message: `Member dengan ID ${params.id} tidak ditemukan`,
          data: null,
        },
        { status: 404 }
      )
    }

    // Check email uniqueness
    if (email && email !== member.email) {
      const existingEmail = await prisma.member.findUnique({
        where: { email },
      })
      if (existingEmail) {
        return NextResponse.json(
          {
            success: false,
            message: 'Email sudah digunakan member lain',
            data: null,
          },
          { status: 400 }
        )
      }
    }

    // Update member
    const updated = await prisma.member.update({
      where: { id: parseInt(params.id) },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phoneNumber !== undefined && { phone: phoneNumber || null }),
      },
      include: {
        vehicles: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Member berhasil diperbarui',
      data: {
        memberId: updated.id,
        memberCode: updated.memberCode,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        balance: Number(updated.balance),
        memberType: updated.memberType,
        isActive: updated.isActive,
        plateNumbers: updated.vehicles.map((v) => v.plateNumber),
      },
    })
  } catch (error) {
    console.error('Update member error:', error)
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const member = await prisma.member.findUnique({
      where: { id: parseInt(params.id) },
    })

    if (!member) {
      return NextResponse.json(
        {
          success: false,
          message: `Member dengan ID ${params.id} tidak ditemukan`,
          data: null,
        },
        { status: 404 }
      )
    }

    // Soft delete
    await prisma.member.update({
      where: { id: parseInt(params.id) },
      data: {
        isActive: false,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Member berhasil dinonaktifkan',
      data: null,
    })
  } catch (error) {
    console.error('Delete member error:', error)
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

