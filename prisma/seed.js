const { PrismaClient } = require('@prisma/client')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
const prisma = new PrismaClient()

async function main() {
    const adminEmail = process.env.SUPER_USER
    if (!adminEmail) {
        throw new Error('Missing SUPER_USER in environment (.env)')
    }

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            isAdmin: true,
            name: 'Saeed'
        },
        create: {
            email: adminEmail,
            name: 'Saeed',
            isAdmin: true,
        },
    })

    console.log({ admin })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
