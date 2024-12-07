import { PrismaClient, TransactionType, TransactionStatus } from '@prisma/client'; // Importa os enums necessários
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('Starting seeding process...');

  // Limpa os dados existentes
  await prisma.assetMovement.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.planning.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.categorie.deleteMany();
  await prisma.parameter.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hash('senha123', 10);

  // Cria um usuário
  const user = await prisma.user.create({
    data: {
      nome: 'Leonardo do Prado',
      email: 'leonardodoprado@gmail.com',
      telefone: '11999999999',
      passwordHash,
    },
  });

  console.log('User created:', user);

  // Cria o registro de ano de referência na tabela Parameter
  const parameter = await prisma.parameter.create({
    data: {
      anoReferencia: 2024,
      userId: user.id,
    },
  });

  console.log('Parameter created:', parameter);

  // Categorias úteis para o dia a dia
  const categoriesData = [
    { nome: 'Aluguel', tipo: TransactionType.DESPESA, codIcone: 3, codColor: 6, descricao: 'Pagamento do aluguel' },
    { nome: 'Mercado', tipo: TransactionType.DESPESA, codIcone: 0, codColor: 10, descricao: 'Compras de supermercado' },
    { nome: 'Transporte', tipo: TransactionType.DESPESA, codIcone: 2, codColor: 9, descricao: 'Gastos com transporte público ou combustível' },
    { nome: 'Lazer', tipo: TransactionType.DESPESA, codIcone: 5, codColor: 3, descricao: 'Gastos com lazer e entretenimento' },
    { nome: 'Educação', tipo: TransactionType.DESPESA, codIcone: 7, codColor: 8, descricao: 'Gastos com cursos e mensalidades' },
    { nome: 'Saúde', tipo: TransactionType.DESPESA, codIcone: 4, codColor: 4, descricao: 'Gastos com médicos e medicamentos' },
    { nome: 'Salário', tipo: TransactionType.RECEITA, codIcone: 16, codColor: 1, descricao: 'Receita de salário mensal' },
    { nome: 'Investimentos', tipo: TransactionType.RECEITA, codIcone: 18, codColor: 5, descricao: 'Rendimentos de investimentos' },
  ];

  // Cria as categorias
  await prisma.categorie.createMany({
    data: categoriesData.map((category) => ({
      ...category,
      userId: user.id,
    })),
  });

  console.log('Categories created:', categoriesData.map((c) => c.nome));

  const categoriesList = await prisma.categorie.findMany();

  // Transações manuais para o ano de 2024
  const transactions = [
    // Aluguel
    ...Array.from({ length: 12 }, (_, month) => ({
      valor: 1500,
      status: TransactionStatus.EXECUTADO,
      descricao: `Pagamento do aluguel - mês ${month + 1}`,
      tipo: TransactionType.DESPESA,
      data: new Date(2024, month, 5),
      categoryId: categoriesList.find((c) => c.nome === 'Aluguel')?.id!,
      userId: user.id,
    })),

    // Mercado
    ...Array.from({ length: 12 }, (_, month) => ({
      valor: 800 + Math.random() * 300,
      status: TransactionStatus.EXECUTADO,
      descricao: `Compra de supermercado - mês ${month + 1}`,
      tipo: TransactionType.DESPESA,
      data: new Date(2024, month, 10),
      categoryId: categoriesList.find((c) => c.nome === 'Mercado')?.id!,
      userId: user.id,
    })),

    // Transporte
    ...Array.from({ length: 12 }, (_, month) => ({
      valor: 200 + Math.random() * 150,
      status: TransactionStatus.EXECUTADO,
      descricao: `Gastos com transporte - mês ${month + 1}`,
      tipo: TransactionType.DESPESA,
      data: new Date(2024, month, 15),
      categoryId: categoriesList.find((c) => c.nome === 'Transporte')?.id!,
      userId: user.id,
    })),

    // Lazer
    ...Array.from({ length: 12 }, (_, month) => ({
      valor: 300 + Math.random() * 200,
      status: TransactionStatus.EXECUTADO,
      descricao: `Gastos com lazer - mês ${month + 1}`,
      tipo: TransactionType.DESPESA,
      data: new Date(2024, month, 20),
      categoryId: categoriesList.find((c) => c.nome === 'Lazer')?.id!,
      userId: user.id,
    })),

    // Educação
    ...Array.from({ length: 12 }, (_, month) => ({
      valor: 500 + Math.random() * 250,
      status: TransactionStatus.EXECUTADO,
      descricao: `Gastos com educação - mês ${month + 1}`,
      tipo: TransactionType.DESPESA,
      data: new Date(2024, month, 25),
      categoryId: categoriesList.find((c) => c.nome === 'Educação')?.id!,
      userId: user.id,
    })),

    // Saúde
    ...Array.from({ length: 12 }, (_, month) => ({
      valor: 200 + Math.random() * 300,
      status: TransactionStatus.EXECUTADO,
      descricao: `Gastos com saúde - mês ${month + 1}`,
      tipo: TransactionType.DESPESA,
      data: new Date(2024, month, 30),
      categoryId: categoriesList.find((c) => c.nome === 'Saúde')?.id!,
      userId: user.id,
    })),

    // Salário
    ...Array.from({ length: 12 }, (_, month) => ({
      valor: 5000,
      status: TransactionStatus.EXECUTADO,
      descricao: `Recebimento de salário - mês ${month + 1}`,
      tipo: TransactionType.RECEITA,
      data: new Date(2024, month, 1),
      categoryId: categoriesList.find((c) => c.nome === 'Salário')?.id!,
      userId: user.id,
    })),

    // Investimentos
    ...Array.from({ length: 12 }, (_, month) => ({
      valor: 700 + Math.random() * 500,
      status: TransactionStatus.EXECUTADO,
      descricao: `Rendimentos de investimentos - mês ${month + 1}`,
      tipo: TransactionType.RECEITA,
      data: new Date(2024, month, 28),
      categoryId: categoriesList.find((c) => c.nome === 'Investimentos')?.id!,
      userId: user.id,
    })),
  ];

  // Cria todas as transações
  for (const transaction of transactions) {
    await prisma.transaction.create({ data: transaction });
  }

  console.log('Transactions created for all months of 2024.');

  console.log('Seeding completed successfully!');
}

seed()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
