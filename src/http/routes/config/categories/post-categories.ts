import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { BadRequestError } from "../../_errors/bad-request-error";
import { auth } from "../../../middlewares/auth";

export async function createCategory(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().register(auth).post(
        "/categories",
        {
            schema: {
                tags: ["Categories"],
                summary: "Create a new Category",
                body: z.object({
                    nome: z.string().min(1, "O nome da categoria é obrigatório."),
                    tipo: z.enum(["RECEITA", "DESPESA"]),
                    codIcone: z.number(),
                    codColor: z.number(),
                }),
                response: {
                    201: z.object({
                        id: z.string().uuid()
                    })
                }
            },
        },
        async (request, reply) => {
            const userId = await request.getCurrentUserId()

            const { nome, tipo, codIcone, codColor } = request.body;

            const categorie = await prisma.categorie.create({
                data: {
                    nome,
                    tipo,
                    codIcone,
                    codColor,
                    userId: userId,
                }
            })

            return reply.status(201).send({
                id: categorie.id
            })
        }
    );
}
