import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { BadRequestError } from "../../_errors/bad-request-error";
import { auth } from "../../../middlewares/auth";

export async function getTransactionsByMonth(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().register(auth).get('/transactions', {
        schema: {
            tags: ['🔒Authenticate'],
            summary: 'Get transactions separated by status for a specific month',
            querystring: z.object({
                month: z.preprocess(
                    (value) => parseInt(value as string, 10),
                    z.number().min(1).max(12)
                ),
            }),
            response: {
                200: z.object({
                    scheduledTransactions: z.array(z.object({
                        id: z.string(),
                        valor: z.string(),
                        descricao: z.string().nullable(),
                        tipo: z.enum(["RECEITA", "DESPESA"]),
                        data: z.string(), // Alterado para aceitar string (YYYY-MM-DD)
                        status: z.literal("PENDENTE"), // Garantir que é PENDENTE
                        categoria: z.object({
                            nome: z.string(),
                            codIcone: z.number(),
                            codColor: z.number(),
                        }),
                    })),
                    transactionHistory: z.array(z.object({
                        id: z.string(),
                        valor: z.string(),
                        descricao: z.string().nullable(),
                        tipo: z.enum(["RECEITA", "DESPESA"]),
                        data: z.string(), // Alterado para aceitar string (YYYY-MM-DD)
                        status: z.enum(["EXECUTADO", "CANCELADO"]), // Garantir EXECUTADO ou CANCELADO
                        categoria: z.object({
                            nome: z.string(),
                            codIcone: z.number(),
                            codColor: z.number(),
                        }),
                    })),
                }),
            },
        },
    }, async (request, reply) => {
        const userId = await request.getCurrentUserId();
        const { month } = request.query;

        // Buscar o ano de referência
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

        // Buscar transações pendentes
        const scheduledTransactions = await prisma.transaction.findMany({
            where: {
                userId,
                status: "PENDENTE", // Apenas PENDENTE
                data: {
                    gte: startDate,
                    lt: endDate,
                },
            },
            include: {
                category: {
                    select: {
                        nome: true,
                        codIcone: true,
                        codColor: true
                    },
                },
            },
        });

        // Buscar transações executadas e canceladas
        const transactionHistory = await prisma.transaction.findMany({
            where: {
                userId,
                status: { in: ["EXECUTADO", "CANCELADO"] }, // Apenas EXECUTADO ou CANCELADO
                data: {
                    gte: startDate,
                    lt: endDate,
                },
            },
            include: {
                category: {
                    select: {
                        nome: true,
                        codIcone: true,
                        codColor: true
                    },
                },
            },
        });

        function formatDateToPTBR(date: Date): string {
            return new Intl.DateTimeFormat("pt-BR").format(date);
        }


        // Garantir o status correto no tipo
        return reply.send({
            scheduledTransactions: scheduledTransactions.map((transaction) => ({
                id: transaction.id,
                valor: transaction.valor.toFixed(2),
                descricao: transaction.descricao,
                tipo: transaction.tipo,
                data: formatDateToPTBR(transaction.data), // Formatando a data para DD/MM/AAAA
                status: "PENDENTE",
                categoria: transaction.category,
            })),
            transactionHistory: transactionHistory.map((transaction) => ({
                id: transaction.id,
                valor: transaction.valor.toFixed(2),
                descricao: transaction.descricao,
                tipo: transaction.tipo,
                data: formatDateToPTBR(transaction.data), // Formatando a data para DD/MM/AAAA
                status: transaction.status as "EXECUTADO" | "CANCELADO",
                categoria: transaction.category,
            })),
        });

    });
}
