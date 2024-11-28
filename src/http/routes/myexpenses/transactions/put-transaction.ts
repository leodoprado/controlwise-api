import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";

export async function updateTransaction(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().put(
        '/transaction/:id',
        {
            schema: {
                tags: ['Transactions'],
                summary: 'Update a Transaction',
                params: z.object({
                    id: z.string(), // ID da transação a ser editada
                }),
                body: z.object({
                    valor: z.number().optional(),
                    descricao: z.string().nullable().optional(),
                    data: z.date().optional(),
                    isRecurring: z.boolean().optional(),
                }),
            },
        },
        async (request, reply) => {
            const { id } = request.params;
            const { valor, descricao, data, isRecurring } = request.body;

            const updateData: any = {
                valor,
                descricao,
                data,
                isRecurring,
            };

            // Se isRecurring for falso, remova o nextRecurrence
            if (isRecurring === false) {
                updateData.nextRecurrence = null;
            }

            const updatedTransaction = await prisma.transaction.update({
                where: { id },
                data: updateData,
            });

            return reply.status(200).send(updatedTransaction);
        }
    );
}
