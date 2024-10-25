import { compare } from "bcryptjs";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { sign } from "crypto";
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
                })
            }

        }
    }, async (request, reply) => {
        const { email, password } = request.body

        const userFromEmail = await prisma.user.findUnique({
            where: { email }
        })

        if (!userFromEmail) {
            throw new BadRequestError('Invalid credentials!')
        }

        if (userFromEmail.passwordHash == null) {
            throw new BadRequestError('User does not have password, use social login!')
        }

        const isPasswordValid = await compare(
            password,
            userFromEmail.passwordHash,
        )

        if (!isPasswordValid) {
            throw new BadRequestError('Invalid credentials!')
        }

        const accessToken = await reply.jwtSign(
            {
                sub: userFromEmail.id,
            },
            {
                sign: {
                    expiresIn: '5d'
                }
            }
        )

        return reply.status(201).send({ accessToken })
    })
}