import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../../lib/prisma";
import { auth } from "../../../middlewares/auth";
import { z } from "zod";
import { BadRequestError } from "../../_errors/bad-request-error";

export async function getCategorySummary(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().register(auth).get('/categories/summary', {
        schema: {
            tags: ['🔒Authenticate'],
            summary: 'Get the sum of values for each category of income and expense for a specific month',
            querystring: z.object({
                month: z.preprocess(
                    (value) => parseInt(value as string, 10),
                    z.number().min(1).max(12)
                ),
            }),
            response: {
                200: z.object({
                    expenses: z.array(
                        z.object({
                            categorie: z.string(),
                            totalValue: z.number(),
                            color: z.number(), // Define `color` como number
                        })
                    ),
                    revenues: z.array(
                        z.object({
                            categorie: z.string(),
                            totalValue: z.number(),
                            color: z.number(), // Define `color` como number
                        })
                    ),
                }),
            },
        },
    }, async (request, reply) => {
        const userId = await request.getCurrentUserId();
        const { month } = request.query;

        // Recuperar o ano de referência do usuário
        const parameter = await prisma.parameter.findFirst({
            where: { userId },
            select: { anoReferencia: true },
        });

        if (!parameter) {
            throw new BadRequestError("Ano de referência não encontrado.");
        }

        const anoReferencia = parameter.anoReferencia;

        const startDate = new Date(anoReferencia, month - 1, 1);
        const endDate = new Date(anoReferencia, month, 1);

        // Agregando os valores por categorias de despesas
        const expenses = await prisma.transaction.groupBy({
            by: ['categoryId'],
            _sum: { valor: true },
            where: {
                tipo: "DESPESA",
                status: "EXECUTADO",
                userId,
                data: {
                    gte: startDate,
                    lt: endDate,
                },
            },
            orderBy: { _sum: { valor: 'desc' } },
        });

        // Agregando os valores por categorias de receitas
        const revenues = await prisma.transaction.groupBy({
            by: ['categoryId'],
            _sum: { valor: true },
            where: {
                tipo: "RECEITA",
                status: "EXECUTADO",
                userId,
                data: {
                    gte: startDate,
                    lt: endDate,
                },
            },
            orderBy: { _sum: { valor: 'desc' } },
        });

        // Adicionar nomes e cores das categorias às respostas
        const expenseCategories = await Promise.all(
            expenses.map(async (expense) => {
                const category = await prisma.categorie.findUnique({
                    where: { id: expense.categoryId },
                    select: { nome: true, codColor: true }, // Seleciona o nome e o índice da cor
                });
                return {
                    categorie: category?.nome || "Sem Categoria",
                    totalValue: expense._sum.valor?.toNumber() || 0,
                    color: category?.codColor || 0, // Valor padrão para índice de cor
                };
            })
        );

        const revenueCategories = await Promise.all(
            revenues.map(async (revenue) => {
                const category = await prisma.categorie.findUnique({
                    where: { id: revenue.categoryId },
                    select: { nome: true, codColor: true }, // Seleciona o nome e o índice da cor
                });
                return {
                    categorie: category?.nome || "Sem Categoria",
                    totalValue: revenue._sum.valor?.toNumber() || 0,
                    color: category?.codColor || 0, // Valor padrão para índice de cor
                };
            })
        );

        return reply.send({
            expenses: expenseCategories,
            revenues: revenueCategories,
        });
    });
}
