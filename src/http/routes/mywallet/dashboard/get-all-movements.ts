import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { auth } from "../../../middlewares/auth";

export async function getAllMovements(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().register(auth).get('/all-movements', {
        schema: {
            tags: ['Asset Movements'],
            summary: 'Get All Asset Movements with Total Value Ordered by Date',
            response: {
                200: z.array(
                    z.object({
                        movementId: z.string(),
                        tipoMovimento: z.enum(['COMPRA', 'VENDA']),
                        quantidade: z.number(),
                        valorUnitario: z.number(),
                        valorTotal: z.number(),
                        data: z.string(),
                        nome: z.string(),
                        ticker: z.string(),
                        tipo: z.enum(['ACAO', 'FII', 'CRIPTOMOEDA', 'STOCK', 'BDR']),
                    })
                ),
            },
        },
    }, async (request, reply) => {
        const userId = await request.getCurrentUserId();

        const movements = await prisma.assetMovement.findMany({
            where: { userId },
            include: {
                asset: {
                    select: {
                        nome: true,
                        ticker: true,
                        tipo: true,
                    },
                },
            },
            orderBy: {
                data: 'desc', // Ordena pela data, mais recentes primeiro
            },
        });

        const detailedMovements = movements.map((movement) => ({
            movementId: movement.id,
            tipoMovimento: movement.tipoMovimento,
            quantidade: movement.quantidade.toNumber(),
            valorUnitario: movement.valorUnitario.toNumber(),
            valorTotal: movement.quantidade.toNumber() * movement.valorUnitario.toNumber(),
            data: movement.data.toISOString(), // Retorna a data como string ISO
            nome: movement.asset.nome,
            ticker: movement.asset.ticker,
            tipo: movement.asset.tipo as 'ACAO' | 'FII' | 'CRIPTOMOEDA' | 'STOCK' | 'BDR',
        }));

        return reply.send(detailedMovements);
    });
}
