import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { BadRequestError } from "../_errors/bad-request-error";
import { auth } from "../../middlewares/auth";

export async function requestPasswordRecover(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post(
        '/forgotpass',
        {
            schema: {
                tags: ['🔒Authenticate'],
                summary: 'Get authenticated user profile',
                body: z.object({
                    email: z.string().email(),
                })
            
        }, 
        async (request, reply) => {
        
            const { email } = request.body
            
            const userFromEmail = await prisma
        })
}