import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { auth } from "../../../middlewares/auth";
import { BadRequestError } from "../../_errors/bad-request-error";

export async function updatePlanning(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().register(auth).put(
        "/planning/:id",
        {
            schema: {
                tags: ["Planning"],
                summary: "Update existing Planning",
                params: z.object({
                    id: z.string().uuid(),
                }),
                body: z.object({
                    titulo: z.string(),
                    valorTarget: z.number(),
                    categoryId: z.string(),
                }),
            },
        },
        async (request, reply) => {
            const { id } = request.params;
            const { titulo, valorTarget, categoryId } = request.body;

            const planningToUpdate = await prisma.planning.findUnique({
                where: { id },
            });

            if (!planningToUpdate) {
                throw new BadRequestError("Planejamento não encontrado.");
            }

            const updatedPlanning = await prisma.planning.update({
                where: { id },
                data: {
                    titulo,
                    valorTarget,
                    categoryId,
                },
            });

            return reply.status(200).send({
                message: "Planejamento atualizado com sucesso.",
                planning: updatedPlanning,
            });
        }
    );
}
