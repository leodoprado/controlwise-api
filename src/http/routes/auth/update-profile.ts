import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { BadRequestError } from "../_errors/bad-request-error";
import { auth } from "../../middlewares/auth"; // Middleware de autenticação

export async function updateProfile(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().register(auth).put(
        '/profile',
        {
            schema: {
                tags: ['🔒Authenticate'],
                summary: 'Update user profile',
                body: z.object({
                    nome: z.string(),
                    email: z.string().email(),
                })
            }
        },
        async (request, reply) => {
            const { nome, email } = request.body;
            const userId = await request.getCurrentUserId();


            const emailTaken = await prisma.user.findFirst({
                where: {
                    email,
                    id: { not: userId }
                }
            });

            if (emailTaken) {
                throw new BadRequestError('E-mail já está em uso por outro usuário.');
            }

            await prisma.user.update({
                where: { id: userId },
                data: {
                    nome,
                    email,
                }
            });

            return reply.status(200).send({ message: 'Perfil atualizado com sucesso!' });
        }
    );
}
