import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { auth } from "../../../middlewares/auth";
import { BadRequestError } from "../../_errors/bad-request-error";

export async function createPlanning(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().register(auth).post(
        "/planning",
        {
            schema: {
                tags: ["Planning"],
                summary: "Create new Planning",
                body: z.object({
                    titulo: z.string(),
                    valorTarget: z.number(),
                    tipo: z.enum(["RECEITA", "DESPESA"]),
                    categoryId: z.string(),
                }),
            },
        },
        async (request, reply) => {
            const userId = await request.getCurrentUserId();
            const { titulo, valorTarget, tipo, categoryId } = request.body;

            const existPlanning = await prisma.planning.findFirst({
                where: {
                    titulo,
                    tipo,
                    categoryId,
                    userId,
                },
            });

            if (existPlanning) {
                throw new BadRequestError("Já existe um planejamento com este título e categoria.");
            }

            const planning = await prisma.planning.create({
                data: {
                    titulo,
                    valorTarget,
                    tipo,
                    categoryId,
                    userId,
                },
            });

            return reply.status(201).send({
                message: "Planejamento criado com sucesso.",
                planning,
            });
        }
    );
}
