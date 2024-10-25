import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { BadRequestError } from "../_errors/bad-request-error";
import { auth } from "../../middlewares/auth"; // Middleware de autenticação
import { hash } from "bcryptjs";

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
                    telefone: z.string().optional().nullable(),
                    senha: z.string().min(6).optional().nullable(),
                })
            }
        },
        async (request, reply) => {
            try {
                const { nome, email, telefone, senha } = request.body;
                const userId = await request.getCurrentUserId();

                // Verificar se o e-mail já está em uso por outro usuário
                const emailTaken = await prisma.user.findFirst({
                    where: {
                        email,
                        id: { not: userId }
                    }
                });

                if (emailTaken) {
                    throw new BadRequestError('E-mail já está em uso por outro usuário.');
                }

                const updateData: {
                    nome: string;
                    email: string;
                    telefone?: string | null;
                    passwordHash?: string;
                } = {
                    nome,
                    email,
                };

                // Atualizar telefone, se fornecido
                if (telefone !== undefined) {
                    updateData.telefone = telefone;
                }

                // Atualizar senha, se fornecida
                if (senha) {
                    try {
                        updateData.passwordHash = await hash(senha, 6);
                    } catch (error) {
                        console.error("Erro ao gerar hash da senha:", error);
                        return reply.status(500).send({ message: 'Erro ao processar a senha.' });
                    }
                }

                // Atualizar dados no banco de dados
                await prisma.user.update({
                    where: { id: userId },
                    data: updateData,
                });

                return reply.status(200).send({ message: 'Perfil atualizado com sucesso!' });
            } catch (error) {
                console.error("Erro ao atualizar perfil:", error);
                return reply.status(500).send({ message: 'Erro ao atualizar perfil.' });
            }
        }
    );
}
