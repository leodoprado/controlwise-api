import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { BadRequestError } from "../../_errors/bad-request-error";
import { auth } from "../../../middlewares/auth";

export async function getParameters(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().register(auth).get('/parameters', {
        schema: {
            tags: ['🔒Authenticate'],
            summary: 'Get parameters of the authenticated user',
            response: {
                200: z.object({
                    anoReferencia: z.number(),
                }),
            },
        },
    }, async (request, reply) => {
        const userId = await request.getCurrentUserId();

        const parameter = await prisma.parameter.findFirst({
            where: {
                userId: userId,
            },
            select: {
                anoReferencia: true,
            },
        });

        if (!parameter) {
            return reply.send({ anoReferencia: new Date().getFullYear() });
        }

        return reply.send(parameter);
    });
}

