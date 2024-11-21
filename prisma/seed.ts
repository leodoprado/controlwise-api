import { faker } from '@faker-js/faker'
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
const prisma = new PrismaClient()
async function seed() {
  await prisma.user.deleteMany()
  const passwordHash = await hash('senha123', 1)
  
  const user = await prisma.user.create({
    data: {
      nome: 'Leonardo do Prado',
      email: 'leonardodoprado@gmail.com',
      passwordHash,
    },
  })
  
}
seed().then(() => {
  console.log('Database seeded!')
})