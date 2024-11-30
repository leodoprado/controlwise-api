import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { auth } from "../../../middlewares/auth";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { BadRequestError } from "../../_errors/bad-request-error";

export async function updateGoal(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().register(auth).put(
        '/goal/:goalId',
        {
            schema: {
                tags: ['Goals'],
                summary: 'Update an existing Goal',
                params: z.object({
                    goalId: z.string().uuid("O ID do objetivo deve ser um UUID válido"),
                }),
                body: z.object({
                    titulo: z.string().optional(),
                    dataLimite: z.preprocess((val) => (typeof val === "string" ? new Date(val) : val), z.date().optional()),
                    valorTotal: z.number().optional(),
                    valorInicial: z.number().optional(),
                    descricao: z.string().optional()
                })
            }
        },
        async (request, reply) => {
            const userId = await request.getCurrentUserId();
            const { goalId } = request.params;
            const { titulo, dataLimite, valorTotal, valorInicial, descricao } = request.body;

            // Verifica se o objetivo existe e pertence ao usuário autenticado
            const existingGoal = await prisma.goal.findFirst({
                where: {
                    id: goalId,
                    userId
                }
            });

            if (!existingGoal) {
                throw new BadRequestError("O objetivo não existe ou você não tem permissão para editá-lo.");
            }

            // Se o título for alterado, verifica se já existe um objetivo com o mesmo título
            if (titulo && titulo !== existingGoal.titulo) {
                const goalWithSameTitle = await prisma.goal.findFirst({
                    where: {
                        titulo,
                        userId,
                        id: { not: goalId } // Garante que não verifica o mesmo objetivo
                    }
                });

                if (goalWithSameTitle) {
                    throw new BadRequestError("Já existe um Objetivo com este título.");
                }
            }

            // Atualiza os campos do objetivo
            const updatedGoal = await prisma.goal.update({
                where: { id: goalId },
                data: {
                    titulo,
                    dataLimite,
                    valorTotal,
                    valorInicial,
                    descricao
                }
            });

            return reply.status(200).send({
                message: "Objetivo atualizado com sucesso!",
                updatedGoal
            });
        }
    );
}
