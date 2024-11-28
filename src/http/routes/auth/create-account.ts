import { hash } from "bcryptjs";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { BadRequestError } from "../_errors/bad-request-error";

export async function createAccount(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post(
        '/signup',
        {
            schema: {
                tags: ['🔒Authenticate'],
                summary: 'Create a new account',
                body: z.object({
                    nome: z.string(),
                    email: z.string().email(),
                    password: z.string().min(6),
                }),
            },
        },
        async (request, reply) => {
            const { nome, email, password } = request.body;

            // Verifica se já existe um usuário com o mesmo email
            const userWithSameEmail = await prisma.user.findUnique({
                where: { email },
            });

            if (userWithSameEmail) {
                throw new BadRequestError('User with same e-mail already exists.');
            }

            const passwordHash = await hash(password, 6);

            const currentYear = new Date().getFullYear();

            // Cria o usuário e o parâmetro relacionado
            const user = await prisma.user.create({
                data: {
                    nome,
                    email,
                    passwordHash,
                    Parameter: {
                        create: {
                            anoReferencia: currentYear,
                        },
                    },
                },
                include: {
                    Parameter: true, // Inclui os parâmetros criados no retorno
                },
            });

            return reply.status(201).send({ user, message: 'Account created with default parameters' });
        }
    );
}
