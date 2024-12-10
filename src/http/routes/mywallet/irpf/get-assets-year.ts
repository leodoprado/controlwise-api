import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../../lib/prisma";
import { auth } from "../../../middlewares/auth";
import { z } from "zod";

export async function getAssetSummaryByYear(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().register(auth).get('/assetsyear', {
        schema: {
            tags: ['🔒Authenticate'],
            summary: 'Get asset summary for a specific year, grouped by asset type',
            querystring: z.object({
                year: z.preprocess(
                    (value) => parseInt(value as string, 10),
                    z.number().min(1900).max(2100)
                ),
            }),
            response: {
                200: z.array(
                    z.object({
                        assetType: z.string(),
                        assets: z.array(
                            z.object({
                                name: z.string(),
                                ticker: z.string(),
                                totalQuantity: z.number(),
                                totalValue: z.number(),
                            })
                        ),
                    })
                ),
            },
        },
    }, async (request, reply) => {
        const userId = await request.getCurrentUserId();
        const { year } = request.query;

        const assets = await prisma.asset.findMany({
            where: { userId },
            include: {
                movements: {
                    where: {
                        data: {
                            gte: new Date(`${year}-01-01`),
                            lt: new Date(`${year + 1}-01-01`),
                        },
                    },
                },
            },
        });

        const groupedAssets = assets.reduce((summary, asset) => {
            const totalQuantity = asset.movements.reduce(
                (quantity, movement) =>
                    movement.tipoMovimento === 'COMPRA'
                        ? quantity + movement.quantidade.toNumber()
                        : quantity - movement.quantidade.toNumber(),
                0
            );

            const totalValue = asset.movements.reduce((value, movement) => {
                const movementValue =
                    movement.quantidade.toNumber() * movement.valorUnitario.toNumber();
                return movement.tipoMovimento === 'COMPRA'
                    ? value + movementValue
                    : value - movementValue;
            }, 0);

            if (totalQuantity <= 0) return summary;

            const existingGroup = summary.find((group) => group.assetType === asset.tipo);
            if (existingGroup) {
                existingGroup.assets.push({
                    name: asset.nome,
                    ticker: asset.ticker,
                    totalQuantity,
                    totalValue,
                });
            } else {
                summary.push({
                    assetType: asset.tipo,
                    assets: [
                        {
                            name: asset.nome,
                            ticker: asset.ticker,
                            totalQuantity,
                            totalValue,
                        },
                    ],
                });
            }

            return summary;
        }, [] as {
            assetType: string;
            assets: { name: string; ticker: string; totalQuantity: number; totalValue: number }[];
        }[]);

        return reply.send(groupedAssets);
    });
}

