import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { BadRequestError } from "../../_errors/bad-request-error";
import { auth } from "../../../middlewares/auth";

export async function getProfile(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().register(auth).get('/me', {
        schema: {
            tags: ['🔒Authenticate'],
            summary: 'Get authenticated user profile',
            response: {
                200: z.object({
                    user: z.object({
                        id: z.string().uuid(),
                        nome: z.string(),
                        email: z.string().email(),
                        telefone: z.string().nullable()
                    })
                })
            }
        }
    }, async (request, reply) => {
        const userId = await request.getCurrentUserId()

        const user = await prisma.user.findUnique({
            select: {
                id: true,
                nome: true,
                email: true,
                telefone: true,
            },
            where: {
                id: userId,
            }
        })

        if (!user) {
            throw new BadRequestError('User not found!')
        }

        return reply.send({ user })
    })
}