import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { BadRequestError } from "../../_errors/bad-request-error";
import { auth } from "../../../middlewares/auth";

export async function getPlanningsByMonth(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().register(auth).get('/plannings', {
        schema: {
            tags: ['🔒Authenticate'],
            summary: 'Get plannings for a specific month and year, including executed amounts for each category',
            querystring: z.object({
                month: z.preprocess(
                    (value) => parseInt(value as string, 10),
                    z.number().min(1).max(12)
                ),
            }),
            response: {
                200: z.array(z.object({
                    id: z.string(),
                    titulo: z.string(),
                    valorTarget: z.string(),
                    tipo: z.enum(["RECEITA", "DESPESA"]),
                    valorMovimentado: z.string(), // Valor já movimentado (somente EXECUTADO)
                    categoria: z.object({
                        nome: z.string(),
                        codIcone: z.number(),
                        codColor: z.number(),
                    }),
                })),
            },
        },
    }, async (request, reply) => {
        const userId = await request.getCurrentUserId();
        const { month } = request.query;

        // Buscar o ano de referência
        const parameter = await prisma.parameter.findFirst({
            where: { userId },
            select: { anoReferencia: true },
        });

        if (!parameter) {
            throw new BadRequestError("Ano de referência não encontrado.");
        }

        const anoReferencia = parameter.anoReferencia;
        const startDate = new Date(anoReferencia, month - 1, 1);
        const endDate = new Date(anoReferencia, month, 1);

        // Buscar planejamentos
        const plannings = await prisma.planning.findMany({
            where: {
                userId,
                createdAt: {
                    gte: startDate,
                    lt: endDate,
                },
            },
            include: {
                category: {
                    select: {
                        id: true,
                        nome: true,
                        codIcone: true,
                        codColor: true,
                    },
                },
            },
        });

        // Adicionar valor movimentado para cada categoria
        const results = await Promise.all(plannings.map(async (planning) => {
            const totalMovimentado = await prisma.transaction.aggregate({
                where: {
                    userId,
                    planningId: planning.id,
                    status: "EXECUTADO",
                    data: {
                        gte: startDate,
                        lt: endDate,
                    },
                },
                _sum: {
                    valor: true,
                },
            });


            return {
                id: planning.id,
                titulo: planning.titulo,
                valorTarget: planning.valorTarget.toFixed(2),
                tipo: planning.tipo,
                valorMovimentado: totalMovimentado._sum.valor?.toFixed(2) || "0.00", // Total movimentado ou 0 caso não haja
                categoria: planning.category,
            };
        }));

        return reply.send(results);
    });
}
