import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { amount } = body

    if (!amount || amount < 10000) {
      return NextResponse.json(
        {
          success: false,
          message: 'Minimal top up adalah Rp 10.000',
          data: null,
        },
        { status: 400 }
      )
    }

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

    const previousBalance = Number(member.balance)
    const currentBalance = previousBalance + amount

    // Update balance and create transaction
    const [updatedMember, topUpTransaction] = await prisma.$transaction([
      prisma.member.update({
        where: { id: parseInt(params.id) },
        data: {
          balance: currentBalance,
        },
      }),
      prisma.topUpTransaction.create({
        data: {
          memberId: parseInt(params.id),
          amount,
          previousBalance,
          currentBalance,
          operatorId: '1', // From auth
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: 'Top up berhasil',
      data: {
        memberId: updatedMember.id,
        memberCode: updatedMember.memberCode,
        name: updatedMember.name,
        previousBalance,
        topUpAmount: amount,
        currentBalance,
        transactionDate: topUpTransaction.transactionDate,
      },
    })
  } catch (error) {
    console.error('Top up error:', error)
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

