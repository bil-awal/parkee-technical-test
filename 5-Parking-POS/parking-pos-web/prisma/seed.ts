// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 10)
  
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@parkee.com',
        password: hashedPassword,
        name: 'Admin Parkee',
        role: 'admin',
      },
    }),
    prisma.user.create({
      data: {
        email: 'operator1@parkee.com',
        password: hashedPassword,
        name: 'Operator Gate A',
        role: 'operator',
      },
    }),
    prisma.user.create({
      data: {
        email: 'operator2@parkee.com',
        password: hashedPassword,
        name: 'Operator Gate B',
        role: 'operator',
      },
    }),
  ])

  console.log('✅ Users created')

  // Create members
  const members = await Promise.all([
    prisma.member.create({
      data: {
        memberCode: 'MBR-0001',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '081234567890',
        balance: 150000,
        memberType: 'GOLD',
        vehicles: {
          create: [
            { plateNumber: 'B1234ABC' },
            { plateNumber: 'B5678DEF' },
          ],
        },
      },
    }),
    prisma.member.create({
      data: {
        memberCode: 'MBR-0002',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '081234567891',
        balance: 50000,
        memberType: 'REGULAR',
        vehicles: {
          create: [{ plateNumber: 'B9876ZYX' }],
        },
      },
    }),
  ])

  console.log('✅ Members created')

  // Create vouchers
  const vouchers = await Promise.all([
    prisma.voucher.create({
      data: {
        code: 'DISC20',
        description: 'Diskon 20% untuk semua kendaraan',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        minPurchase: 10000,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        usageLimit: 100,
      },
    }),
    prisma.voucher.create({
      data: {
        code: 'FLAT5K',
        description: 'Potongan Rp 5.000',
        discountType: 'FIXED_AMOUNT',
        discountValue: 5000,
        minPurchase: 15000,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        usageLimit: 50,
      },
    }),
  ])

  console.log('✅ Vouchers created')

  // Create some parking transactions
  const now = new Date()
  const transactions = await Promise.all([
    // Active parking
    prisma.parkingTransaction.create({
      data: {
        ticketNumber: 'TKT-20250116-001',
        plateNumber: 'B1111AAA',
        vehicleType: 'CAR',
        gate: 'GATE_A',
        checkInTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        checkInUserId: users[1].id,
        status: 'ACTIVE',
      },
    }),
    prisma.parkingTransaction.create({
      data: {
        ticketNumber: 'TKT-20250116-002',
        plateNumber: 'B2222BBB',
        vehicleType: 'MOTORCYCLE',
        gate: 'GATE_A',
        checkInTime: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
        checkInUserId: users[1].id,
        status: 'ACTIVE',
      },
    }),
    // Completed transactions
    prisma.parkingTransaction.create({
      data: {
        ticketNumber: 'TKT-20250116-003',
        plateNumber: 'B3333CCC',
        vehicleType: 'CAR',
        gate: 'GATE_A',
        checkInTime: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
        checkOutTime: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
        duration: 180, // 3 hours
        baseFee: 9000,
        discount: 0,
        totalFee: 9000,
        paymentMethod: 'CASH',
        paymentTime: new Date(now.getTime() - 1 * 60 * 60 * 1000),
        checkInUserId: users[1].id,
        checkOutUserId: users[2].id,
        status: 'COMPLETED',
      },
    }),
  ])

  console.log('✅ Parking transactions created')

  console.log('🎉 Seed completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })