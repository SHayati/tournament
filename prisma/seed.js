const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const adminEmail = 'irangreenpaper@gmail.com'

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
