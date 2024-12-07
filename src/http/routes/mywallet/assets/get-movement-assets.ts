import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { auth } from "../../../middlewares/auth";

export async function getAssetMovements(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().register(auth).get('/asset-movements', {
        schema: {
            tags: ['Asset Movements'],
            summary: 'Get Aggregated Asset Movements',
            response: {
                200: z.object({
                    assets: z.array(
                        z.object({
                            assetId: z.string(),
                            tipo: z.enum(['ACAO', 'FII', 'CRIPTOMOEDA', 'STOCK', 'BDR']),
                            quantidade: z.number(),
                            valorMedio: z.number(),
                            nome: z.string(),
                            ticker: z.string(),
                        })
                    ).optional(),
                }),
            },
        },
    }, async (request, reply) => {
        const userId = await request.getCurrentUserId();

        const rawMovements = await prisma.assetMovement.findMany({
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
        });

        const aggregatedAssets = rawMovements.reduce((acc, movement) => {
            const { assetId, tipoMovimento, quantidade, valorUnitario, asset } = movement;

            if (!acc[assetId]) {
                acc[assetId] = {
                    quantidade: 0,
                    valorTotal: 0,
                    nome: asset.nome,
                    ticker: asset.ticker,
                    tipo: asset.tipo as 'ACAO' | 'FII' | 'CRIPTOMOEDA' | 'STOCK' | 'BDR', // Garantindo o tipo literal
                };
            }

            const assetData = acc[assetId];

            if (tipoMovimento === 'COMPRA') {
                const novaQuantidade = assetData.quantidade + quantidade.toNumber();
                const novoValorTotal = assetData.valorTotal + valorUnitario.toNumber() * quantidade.toNumber();

                assetData.quantidade = novaQuantidade;
                assetData.valorTotal = novoValorTotal;
            } else if (tipoMovimento === 'VENDA') {
                assetData.quantidade -= quantidade.toNumber();
            }

            return acc;
        }, {} as Record<string, { quantidade: number; valorTotal: number; nome: string; ticker: string; tipo: 'ACAO' | 'FII' | 'CRIPTOMOEDA' | 'STOCK' | 'BDR' }>);

        const assets = Object.entries(aggregatedAssets)
            .filter(([_, assetData]) => assetData.quantidade > 0)
            .map(([assetId, assetData]) => ({
                assetId,
                tipo: assetData.tipo,
                quantidade: assetData.quantidade,
                valorMedio: +(assetData.valorTotal / assetData.quantidade).toFixed(2),
                nome: assetData.nome,
                ticker: assetData.ticker,
            }));

        return reply.send({ assets });
    });
}
