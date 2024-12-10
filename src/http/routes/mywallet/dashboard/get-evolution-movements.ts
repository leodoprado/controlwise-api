import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { auth } from "../../../middlewares/auth";
import { BadRequestError } from "../../_errors/bad-request-error";

export async function getEvolutionMovements(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().register(auth).get('/evolution-movements', {
        schema: {
            tags: ['Asset Movements'],
            summary: 'Get Aggregated Asset Movements',
            response: {
                200: z.array(
                    z.object({
                        month: z.string(),
                        aggregatedValue: z.string(), // Retornamos como string formatada
                    })
                ),
            },
        },
    }, async (request, reply) => {
        const userId = await request.getCurrentUserId();

        const parameter = await prisma.parameter.findFirst({
            where: { userId },
            select: { anoReferencia: true },
        });

        if (!parameter) {
            throw new BadRequestError("Ano de referência não encontrado.");
        }

        const anoReferencia = parameter.anoReferencia;

        // Inicializar estrutura de dados para todos os meses
        const monthlyData = Array.from({ length: 12 }, (_, index) => ({
            month: new Date(anoReferencia, index).toLocaleString('default', { month: 'long' }),
            aggregatedValue: 0, // Inicializado como número
        }));

        // Buscar todos os movimentos no ano
        const movements = await prisma.assetMovement.findMany({
            where: {
                userId,
                data: {
                    gte: new Date(anoReferencia, 0, 1), // Janeiro 1º
                    lt: new Date(anoReferencia + 1, 0, 1), // Janeiro 1º do próximo ano
                },
            },
            select: {
                tipoMovimento: true,
                valorUnitario: true,
                quantidade: true,
                data: true,
            },
        });

        // Ordenar os movimentos por data
        movements.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

        let aggregatedValue = 0; // Valor acumulado até o momento

        // Distribuir movimentos nos meses correspondentes
        movements.forEach(({ tipoMovimento, valorUnitario, quantidade, data }) => {
            const month = new Date(data).getMonth(); // Extrair o índice do mês (0-11)
            const value = valorUnitario.toNumber() * quantidade.toNumber();

            if (tipoMovimento === "COMPRA") {
                aggregatedValue += value;
            } else if (tipoMovimento === "VENDA") {
                aggregatedValue -= value;
            }

            monthlyData[month].aggregatedValue = aggregatedValue; // Atualizar valor acumulado
        });

        // Retornar todos os meses, formatando os valores
        const formattedMonthlyData = monthlyData.map((monthData) => ({
            month: monthData.month,
            aggregatedValue: monthData.aggregatedValue > 0
                ? monthData.aggregatedValue.toFixed(2) // Valor formatado
                : "0.00", // Meses sem movimentação mantêm valor 0
        }));

        return reply.send(formattedMonthlyData);
    });
}
