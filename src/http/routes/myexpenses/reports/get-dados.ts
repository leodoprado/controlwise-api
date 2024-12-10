import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { auth } from "../../../middlewares/auth";

export async function getReportByParameters(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().register(auth).get('/reports', {
        schema: {
            tags: ['🔒Authenticate'],
            summary: 'Generate a financial report based on provided parameters',
            querystring: z.object({
                categoria: z.enum(["RECEITA", "DESPESA"]), 
                ano: z.preprocess((val) => Number(val), z.number().int().min(1900).max(new Date().getFullYear())), // Ano de referência obrigatório
                mes: z.preprocess(
                    (val) => val ? Number(val) : undefined,
                    z.number().int().min(1).max(12).optional() 
                ),
            }),
            response: {
                200: z.object({
                    dados: z.array(z.object({
                        id: z.string(),
                        valor: z.string(),
                        descricao: z.string().nullable(),
                        tipo: z.enum(["RECEITA", "DESPESA"]),
                        data: z.string(),
                        categoria: z.object({
                            nome: z.string(),
                            codIcone: z.number(),
                            codColor: z.number(),
                        }),
                    })),
                }),
            },
        },
    }, async (request, reply) => {
        const userId = await request.getCurrentUserId();
        const { categoria, ano, mes } = request.query;

        const startDate = new Date(ano, mes ? mes - 1 : 0, 1);
        const endDate = mes
            ? new Date(ano, mes, 1) 
            : new Date(ano + 1, 0, 1); 

        const dados = await prisma.transaction.findMany({
            where: {
                userId,
                tipo: categoria,
                data: {
                    gte: startDate,
                    lt: endDate,
                },
            },
            include: {
                category: {
                    select: {
                        nome: true,
                        codIcone: true,
                        codColor: true,
                    },
                },
            },
        });

        return reply.send({
            dados: dados.map((dado) => ({
                id: dado.id,
                valor: dado.valor.toFixed(2),
                descricao: dado.descricao,
                tipo: dado.tipo,
                data: dado.data.toISOString().split("T")[0],
                categoria: dado.category,
            })),
        });
    });
}
