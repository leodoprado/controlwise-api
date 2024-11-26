import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { BadRequestError } from "../../_errors/bad-request-error";
import { auth } from "../../../middlewares/auth";

export async function getCategorieDetails(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().register(auth).get('/categorie/:id', {
        schema: {
            tags: ['🔒Authenticate'],
            summary: 'Get details of a specific category by ID',
            params: z.object({
                id: z.string().uuid(),
            }),
            response: {
                200: z.object({
                    id: z.string(),
                    nome: z.string(),
                    tipo: z.enum(['DESPESA', 'RECEITA']),
                    codIcone: z.number(),
                    codColor: z.number(),
                }),
            },
        },
    }, async (request, reply) => {
        const userId = await request.getCurrentUserId();
        const { id } = request.params;

        const category = await prisma.categorie.findFirst({
            where: {
                id: id,
                userId: userId,
            },
            select: {
                id: true,
                nome: true,
                tipo: true,
                codIcone: true,
                codColor: true,
            },
        });

        if (!category) {
            throw new BadRequestError('Category not found or does not belong to the authenticated user.');
        }

        return reply.send(category);
    });
}
