import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { BadRequestError } from "../../_errors/bad-request-error";
import { auth } from "../../../middlewares/auth"; // Middleware de autenticação

export async function updateParameters(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().register(auth).put(
        '/parameters',
        {
            schema: {
                tags: ['🔒Authenticate'],
                summary: 'Update user parameters',
                body: z.object({
                    anoReferencia: z.number(),
                }),
            },
        },
        async (request, reply) => {
            try {
                const { anoReferencia } = request.body;
                const userId = await request.getCurrentUserId(); // Recupera o ID do usuário autenticado

                if (!userId) {
                    throw new BadRequestError("Usuário não autenticado.");
                }

                const updatedParameter = await prisma.parameter.updateMany({
                    where: { userId },
                    data: { anoReferencia },
                });

                if (updatedParameter.count === 0) {
                    return reply.status(404).send({ message: 'Parâmetro não encontrado para o usuário.' });
                }

                return reply.status(200).send({ message: 'Parâmetro atualizado com sucesso!' });
            } catch (error) {
                console.error("Erro ao atualizar parâmetro:", error);
                return reply.status(500).send({ message: 'Erro ao atualizar parâmetro.' });
            }
        }
    );
}
