import { compare } from "bcryptjs";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { BadRequestError } from "../_errors/bad-request-error";

export async function authenticateWithPassword(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post('/signin', {
        schema: {
            tags: ['🔒Authenticate'],
            summary: 'Authenticate with e-mail & password',
            body: z.object({
                email: z.string().email(),
                password: z.string(),
            }),
            response: {
                201: z.object({
                    accessToken: z.string(),
                }),
            },
        },
    }, async (request, reply) => {
        const { email, password } = request.body;

        // Busca do usuário pelo e-mail
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                passwordHash: true,
            },
        });

        // Verificação de existência do usuário
        if (!user) {
            throw new BadRequestError('Invalid credentials!');
        }

        // Verificação de existência do hash de senha
        if (!user.passwordHash) {
            throw new BadRequestError('User does not have a password. Please use social login!');
        }

        // Comparação da senha fornecida com o hash
        const isPasswordValid = await compare(password, user.passwordHash);

        if (!isPasswordValid) {
            throw new BadRequestError('Invalid credentials!');
        }

        // Geração do token JWT
        const accessToken = await reply.jwtSign(
            {
                sub: user.id,
            },
            {
                sign: {
                    expiresIn: '5d', // Token válido por 5 dias
                },
            }
        );

        return reply.status(201).send({ accessToken });
    });
}
