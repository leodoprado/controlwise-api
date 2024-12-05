import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { auth } from "../../../middlewares/auth";

export async function getPlanningsByCategory(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().register(auth).get('/plannings/categorie', {
        schema: {
            querystring: z.object({
                categoryId: z.string(),
                type: z.enum(['RECEITA', 'DESPESA']),
            }),
        },
    }, async (request, reply) => {
        const { categoryId, type } = request.query

        const plannings = await prisma.planning.findMany({
            where: {
                categoryId,
                tipo: type,
            },
            select: {
                id: true,
                titulo: true,
                valorTarget: true,
            },
        })

        return reply.send(plannings)
    })
}
