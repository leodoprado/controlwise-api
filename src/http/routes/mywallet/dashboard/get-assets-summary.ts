import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../../lib/prisma";
import { auth } from "../../../middlewares/auth";
import { z } from "zod";

export async function getAssetSummary(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().register(auth).get('/assets/summary', {
        schema: {
            tags: ['🔒Authenticate'],
            summary: 'Get the total accumulated equity for each type of asset',
            response: {
                200: z.array(
                    z.object({
                        assetType: z.string(),
                        totalEquity: z.number(),
                    })
                ),
            },
        },
    }, async (request, reply) => {
        const userId = await request.getCurrentUserId();

        // Recuperar os ativos e movimentos associados
        const assets = await prisma.asset.findMany({
            where: { userId },
            include: {
                movements: {
                    select: {
                        quantidade: true,
                        valorUnitario: true,
                        tipoMovimento: true,
                    },
                },
            },
        });

        // Calcular o patrimônio acumulado por tipo de ativo
        const assetSummary = assets.reduce((summary, asset) => {
            const totalEquity = asset.movements.reduce((total, movement) => {
                const movementValue = movement.quantidade.toNumber() * movement.valorUnitario.toNumber();
                return movement.tipoMovimento === 'COMPRA'
                    ? total + movementValue
                    : total - movementValue;
            }, 0);

            const existing = summary.find((s) => s.assetType === asset.tipo);
            if (existing) {
                existing.totalEquity += totalEquity;
            } else {
                summary.push({
                    assetType: asset.tipo,
                    totalEquity,
                });
            }

            return summary;
        }, [] as { assetType: string; totalEquity: number }[]);

        return reply.send(assetSummary);
    });
}
