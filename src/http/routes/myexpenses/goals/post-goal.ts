import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { auth } from "../../../middlewares/auth";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { BadRequestError } from "../../_errors/bad-request-error";

export async function createGoal(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().register(auth).post(
        '/goal',
        {
            schema: {
                tags: ['Goals'],
                summary: 'Create new Goal',
                body: z.object({
                    titulo: z.string(),
                    dataLimite: z.preprocess((val) => (typeof val === "string" ? new Date(val) : val), z.date()),
                    valorTotal: z.number(),
                    valorAdicionado: z.number(),
                    descricao: z.string()
                })
            }
        },
        async (request, reply) => {
            const userId = await request.getCurrentUserId()
            const { titulo, dataLimite, valorTotal, valorAdicionado, descricao } = request.body

            const existGoal = await prisma.goal.findFirst({
                where: {
                    titulo,
                    userId
                }
            })

            if (existGoal) {
                throw new BadRequestError("Já existe um Objetivo com este título.")
            }

            const goal = await prisma.goal.create({
                data: {
                    titulo,
                    dataLimite,
                    valorTotal,
                    valorAdicionado,
                    descricao,
                    userId
                }
            })

            return reply.status(201).send({
                message: "Objetivo criado com sucesso!",
                goal
            })
        }
    )

}