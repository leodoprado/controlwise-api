import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { BadRequestError } from "../../_errors/bad-request-error";
import { auth } from "../../../middlewares/auth";

export async function getAssets(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().register(auth).get('/assets', {
        schema: {
            tags: ['Assets'],
            summary: 'Get Assets',
            response: {
                200: z.object({
                    assets: z.array(
                        z.object({
                            ticker: z.string(),
                            nome: z.string(),
                            tipo: z.string(),
                            userId: z.string(),
                        })
                    )
                })
            }
        }
    }, async (request, reply) => {
        const userId = await request.getCurrentUserId();

        const assets = await prisma.asset.findMany({
            where: {
                userId: userId,
            },
            select: {
                ticker: true,
                nome: true,
                tipo: true,
                userId: true,
            }
        });

        if (assets.length === 0) {
            throw new BadRequestError('No assets found for this user.');
        }

        return reply.send({ assets });
    });
}
