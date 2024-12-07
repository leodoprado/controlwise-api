import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { auth } from "../../../middlewares/auth";
import { number, z } from "zod";
import { prisma } from "../../../../lib/prisma";

export async function createMovement(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().register(auth).post(
        '/movement',
        {
            schema: {
                tags: ["Asset Movement"],
                summary: 'Create new Movement at Asset',
                body: z.object({
                    valorUnitario: z.number(),
                    quantidade: z.number(),
                    data: z.preprocess((val) => (typeof val === "string" ? new Date(val) : val), z.date()),
                    tipoMovimento: z.enum(['COMPRA', 'VENDA']),
                    assetId: z.string()
                })
            }
        },
        async (request, reply) => {
            const userId = await request.getCurrentUserId();
            const { valorUnitario, quantidade, data, tipoMovimento, assetId } = request.body;

            const movements = await prisma.assetMovement.findMany({
                where: { userId, assetId },
                select: {
                    quantidade: true,
                    tipoMovimento: true,
                },
            });

            const quantidadeDisponivel = movements.reduce((total, movement) => {
                if (movement.tipoMovimento === 'COMPRA') {
                    return total + movement.quantidade.toNumber();
                } else if (movement.tipoMovimento === 'VENDA') {
                    return total - movement.quantidade.toNumber();
                }
                return total;
            }, 0);

            if (tipoMovimento === 'VENDA') {
                if (quantidadeDisponivel <= 0) {
                    return reply.status(400).send({
                        message: "Não é possível realizar a venda. Nenhuma movimentação de compra encontrada para este ativo.",
                    });
                }

                if (quantidadeDisponivel < quantidade) {
                    return reply.status(400).send({
                        message: "Não é possível realizar a venda. Quantidade insuficiente disponível.",
                    });
                }
            }

            const movement = await prisma.assetMovement.create({
                data: {
                    valorUnitario,
                    quantidade,
                    data,
                    tipoMovimento,
                    assetId,
                    userId,
                },
            });

            return reply.status(201).send({
                message: "Movimentos de ativo registrado com sucesso.",
                movement,
            });
        }
    );
}
