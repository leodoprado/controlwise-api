import { PrismaClient } from "@prisma/client";
import { faker } from '@faker-js/faker'
import { hash } from "bcryptjs";

const prisma = new PrismaClient()

async function seed() {
    await prisma.user.deleteMany()

    const passwordHash = await hash('123456', 1)

    const user = await prisma.user.create({
        data: {
            name: 'Leonardo do Prado',
            email: 'leonardo@gmail.com',
            passwordHash,
        },
    })

}

seed().then(() => {
    console.log('Database seeded!')
})