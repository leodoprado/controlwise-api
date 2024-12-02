import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { BadRequestError } from "../../_errors/bad-request-error";
import { auth } from "../../../middlewares/auth";

export async function getExpensesMonth(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().register(auth).get('/expenses/month', {
        schema: {
            tags: ['🔒Authenticate'],
            summary: 'Get expenses for a specific month and percentage variation',
            querystring: z.object({
                month: z.preprocess(
                    (value) => parseInt(value as string, 10),
                    z.number().min(1).max(12)
                ),
            }),
            response: {
                200: z.object({
                    totalExpenses: z.string(),
                    percentageChange: z.string(),
                }),
            },
        },
    }, async (request, reply) => {
        const userId = await request.getCurrentUserId();
        const { month } = request.query;

        const parameter = await prisma.parameter.findFirst({
            where: { userId },
            select: { anoReferencia: true },
        });

        if (!parameter) {
            throw new BadRequestError("Ano de referência não encontrado.");
        }

        const anoReferencia = parameter.anoReferencia;

        const currentMonthExpenses = await prisma.transaction.aggregate({
            _sum: {
                valor: true,
            },
            where: {
                tipo: "DESPESA", 
                status: "EXECUTADO", 
                userId,
                data: {
                    gte: new Date(anoReferencia, month - 1, 1), 
                    lt: new Date(anoReferencia, month, 1), 
                },
            },
        });

        const previousMonthExpenses = await prisma.transaction.aggregate({
            _sum: {
                valor: true,
            },
            where: {
                tipo: "DESPESA",
                status: "EXECUTADO", 
                userId,
                data: {
                    gte: new Date(anoReferencia, month - 2, 1), // Início do mês anterior
                    lt: new Date(anoReferencia, month - 1, 1), // Início do mês atual
                },
            },
        });

        const totalCurrentMonthExpenses = currentMonthExpenses._sum.valor ? currentMonthExpenses._sum.valor.toNumber() : 0;
        const totalPreviousMonthExpenses = previousMonthExpenses._sum.valor ? previousMonthExpenses._sum.valor.toNumber() : 0;

        const percentageChange = totalPreviousMonthExpenses > 0
            ? ((totalCurrentMonthExpenses - totalPreviousMonthExpenses) / totalPreviousMonthExpenses * 100).toFixed(2)
            : "0.00";

        // Retorna os resultados
        return reply.send({
            totalExpenses: totalCurrentMonthExpenses.toFixed(2),
            percentageChange: `${percentageChange}%`,
        });
    });
}
