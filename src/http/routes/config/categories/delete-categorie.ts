import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { BadRequestError } from "../../_errors/bad-request-error";
import { auth } from "../../../middlewares/auth";

export async function deleteCategorie(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().register(auth).delete('/categorie/:id', {
        schema: {
            tags: ['🔒Authenticate'],
            summary: 'Delete a specific category by ID',
            params: z.object({
                id: z.string().uuid(),
            }),
            response: {
                200: z.object({
                    message: z.string(),
                }),
            },
        },
    }, async (request, reply) => {
        const userId = await request.getCurrentUserId();
        const { id } = request.params;

        // Check if the category exists and belongs to the user
        const category = await prisma.categorie.findFirst({
            where: {
                id: id,
                userId: userId,
            },
        });

        if (!category) {
            throw new BadRequestError('Category not found or does not belong to the authenticated user.');
        }

        // Delete the category
        await prisma.categorie.delete({
            where: {
                id: id,
            },
        });

        return reply.send({ message: 'Category deleted successfully.' });
    });
}
