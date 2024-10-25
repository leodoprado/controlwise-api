import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { BadRequestError } from "../_errors/bad-request-error";
import { auth } from "../../middlewares/auth";

export async function getCategories(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().register(auth).get('/categories', {
        schema: {
            tags: ['🔒Authenticate'],
            summary: 'Get categories of the authenticated user',
            response: {
                200: z.object({
                    categories: z.array(
                        z.object({
                            id: z.string().uuid(),
                            codigo: z.number(),
                            nome: z.string(),
                            tipo: z.string(),
                            codIcone: z.number(),
                            codColor: z.number(),
                            descricao: z.string(),
                        })
                    )
                })
            }
        }
    }, async (request, reply) => {
        const userId = await request.getCurrentUserId();

        const categories = await prisma.categorie.findMany({
            where: {
                userId: userId,
            },
            select: {
                id: true,
                codigo: true,
                nome: true,
                tipo: true,
                codIcone: true,
                codColor: true,
                descricao: true,
            }
        });

        if (!categories) {
            throw new BadRequestError('No categories found for this user.');
        }

        return reply.send({ categories });
    });
}
