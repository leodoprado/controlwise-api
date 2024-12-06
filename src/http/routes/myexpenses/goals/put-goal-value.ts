import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { auth } from "../../../middlewares/auth";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { BadRequestError } from "../../_errors/bad-request-error";

export async function updateGoalValueAdded(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().register(auth).put(
        '/goal/:goalId/valorAdicionado',
        {
            schema: {
                tags: ['Goals'],
                summary: 'Update the valorAdicionado of a Goal',
                params: z.object({
                    goalId: z.string().uuid("O ID do objetivo deve ser um UUID válido"),
                }),
                body: z.object({
                    valorAdicionado: z.number().min(0, "O valor deve ser maior ou igual a zero"),
                }),
            },
        },
        async (request, reply) => {
            const userId = await request.getCurrentUserId();
            const { goalId } = request.params;
            const { valorAdicionado } = request.body;

            const existingGoal = await prisma.goal.findFirst({
                where: {
                    id: goalId,
                    userId,
                },
            });

            if (!existingGoal) {
                throw new BadRequestError(
                    "O objetivo não existe ou você não tem permissão para editá-lo."
                );
            }

            const updatedGoal = await prisma.goal.update({
                where: { id: goalId },
                data: {
                    valorAdicionado: {
                        increment: valorAdicionado,
                    },
                },
            });

            return reply.status(200).send({
                message: "Valor adicionado atualizado com sucesso!",
                updatedGoal,
            });
        }
    );
}