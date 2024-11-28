import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { auth } from "../../../middlewares/auth";

export async function createTransaction(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().register(auth).post(
        '/transaction',
        {
            schema: {
                tags: ['Transactions'],
                summary: 'Create new Transaction',
                body: z.object({
                    valor: z.number(),
                    descricao: z.string().nullable(),
                    tipo: z.enum(["RECEITA", "DESPESA"]),
                    data: z.preprocess((val) => (typeof val === "string" ? new Date(val) : val), z.date()),
                    categoryId: z.string(),
                    isRecurring: z.boolean().optional().default(false),
                    status: z.enum(['PENDENTE', 'EXECUTADO', 'CANCELADO']).optional().default('PENDENTE'),
                }),
            },
        },
        async (request, reply) => {
            const userId = await request.getCurrentUserId()
            const { valor, descricao, tipo, data, categoryId, isRecurring, status } = request.body;

            const nextRecurrence = isRecurring
                ? (() => {
                    const nextDate = new Date(data);
                    nextDate.setMonth(nextDate.getMonth() + 1);
                    return nextDate;
                })()
                : null;

            const transaction = await prisma.transaction.create({
                data: {
                    valor,
                    descricao,
                    data,
                    categoryId,
                    isRecurring,
                    nextRecurrence,
                    tipo,
                    status,
                    userId: userId
                },
            });

            return reply.status(201).send(transaction);
        }
    );
}
