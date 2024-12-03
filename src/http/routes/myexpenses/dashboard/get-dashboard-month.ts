import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { BadRequestError } from "../../_errors/bad-request-error";
import { auth } from "../../../middlewares/auth";

export async function getExpensesMonth(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().register(auth).get('/dashboard', {
        schema: {
            tags: ['🔒Authenticate'],
            summary: 'Get expenses, revenues, and their difference for a specific month',
            querystring: z.object({
                month: z.preprocess(
                    (value) => parseInt(value as string, 10),
                    z.number().min(1).max(12)
                ),
            }),
            response: {
                200: z.object({
                    totalExpenses: z.string(),
                    percentageExpenses: z.string(),
                    totalRevenues: z.string(),
                    percentageRevenues: z.string(),
                    netDifference: z.string(),
                    percentageDifference: z.string(),
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
            _sum: { valor: true },
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
            _sum: { valor: true },
            where: {
                tipo: "DESPESA",
                status: "EXECUTADO",
                userId,
                data: {
                    gte: new Date(anoReferencia, month - 2, 1),
                    lt: new Date(anoReferencia, month - 1, 1),
                },
            },
        });

        const currentMonthRevenues = await prisma.transaction.aggregate({
            _sum: { valor: true },
            where: {
                tipo: "RECEITA",
                status: "EXECUTADO",
                userId,
                data: {
                    gte: new Date(anoReferencia, month - 1, 1),
                    lt: new Date(anoReferencia, month, 1),
                },
            },
        });

        const previousMonthRevenues = await prisma.transaction.aggregate({
            _sum: { valor: true },
            where: {
                tipo: "RECEITA",
                status: "EXECUTADO",
                userId,
                data: {
                    gte: new Date(anoReferencia, month - 2, 1),
                    lt: new Date(anoReferencia, month - 1, 1),
                },
            },
        });

        const totalCurrentMonthExpenses = currentMonthExpenses._sum.valor?.toNumber() || 0;
        const totalPreviousMonthExpenses = previousMonthExpenses._sum.valor?.toNumber() || 0;

        const totalCurrentMonthRevenues = currentMonthRevenues._sum.valor?.toNumber() || 0;
        const totalPreviousMonthRevenues = previousMonthRevenues._sum.valor?.toNumber() || 0;

        const percentageChangeExpenses = totalPreviousMonthExpenses > 0
            ? ((totalCurrentMonthExpenses - totalPreviousMonthExpenses) / totalPreviousMonthExpenses * 100).toFixed(2)
            : "0.00";

        const percentageChangeRevenues = totalPreviousMonthRevenues > 0
            ? ((totalCurrentMonthRevenues - totalPreviousMonthRevenues) / totalPreviousMonthRevenues * 100).toFixed(2)
            : "0.00";

        const totalBalance = totalCurrentMonthRevenues - totalCurrentMonthExpenses;
        const previousNetDifference = totalPreviousMonthRevenues - totalPreviousMonthExpenses;

        const percentageDifference = previousNetDifference > 0
            ? ((totalBalance - previousNetDifference) / previousNetDifference * 100).toFixed(2)
            : "0.00";

        return reply.send({
            totalExpenses: totalCurrentMonthExpenses.toFixed(2),
            percentageExpenses: `${percentageChangeExpenses}%`,
            totalRevenues: totalCurrentMonthRevenues.toFixed(2),
            percentageRevenues: `${percentageChangeRevenues}%`,
            netDifference: totalBalance.toFixed(2),
            percentageDifference: `${percentageDifference}%`,
        });
    });
}

