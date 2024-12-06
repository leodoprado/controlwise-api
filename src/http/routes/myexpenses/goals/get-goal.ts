import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { auth } from "../../../middlewares/auth";
import { BadRequestError } from "../../_errors/bad-request-error";

export async function getUnfinishedGoals(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().register(auth).get(
        '/goals',
        {
            schema: {
                tags: ['Goals'],
                summary: 'Get all unfinished goals of the authenticated user',
                response: {
                    200: z.array(
                        z.object({
                            id: z.string(),
                            titulo: z.string(),
                            dataLimite: z.date().nullable(),
                            valorTotal: z.number(),
                            valorInicial: z.number().nullable(),
                            valorAdicionado: z.number(),
                            descricao: z.string().nullable(),
                        })
                    )
                }
            }
        },
        async (request, reply) => {
            const userId = await request.getCurrentUserId();

            const goals = await prisma.goal.findMany({
                where: {
                    userId: userId,
                    valorAdicionado: {
                        lt: prisma.goal.fields.valorTotal
                    }
                },
                select: {
                    id: true,
                    titulo: true,
                    dataLimite: true,
                    valorTotal: true,
                    valorInicial: true,
                    valorAdicionado: true,
                    descricao: true,
                }
            });

            if (!goals || goals.length === 0) {
                throw new BadRequestError("Nenhum objetivo não concluído encontrado para este usuário.");
            }

            const formattedGoals = goals.map(goal => ({
                ...goal,
                valorTotal: goal.valorTotal.toNumber(),
                valorInicial: goal.valorInicial?.toNumber() || null,
                valorAdicionado: goal.valorAdicionado.toNumber(),
            }));

            return reply.send(formattedGoals);
        }
    );
}
