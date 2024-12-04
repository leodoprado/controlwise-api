import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { BadRequestError } from "../../_errors/bad-request-error";
import { auth } from "../../../middlewares/auth";

export async function getDashboardYears(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().register(auth).get('/dashboard/year', {
        schema: {
            tags: ['🔒Authenticate'],
            summary: 'Get monthly expenses and revenues for all months in the year',
            response: {
                200: z.array(
                    z.object({
                        month: z.string(),
                        totalExpenses: z.string(),
                        totalRevenues: z.string()
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
            totalExpenses: 0,
            totalRevenues: 0,
            netDifference: 0,
        }));

        // Buscar todas as transações no ano
        const transactions = await prisma.transaction.findMany({
            where: {
                status: "EXECUTADO",
                userId,
                data: {
                    gte: new Date(anoReferencia, 0, 1), // Janeiro 1º
                    lt: new Date(anoReferencia + 1, 0, 1), // Janeiro 1º do próximo ano
                },
            },
            select: {
                tipo: true,
                valor: true,
                data: true,
            },
        });

        // Distribuir transações nos meses correspondentes
        transactions.forEach(({ tipo, valor, data }) => {
            const month = new Date(data).getMonth(); // Extrair o mês (0-11)
            if (tipo === "DESPESA") {
                monthlyData[month].totalExpenses += valor.toNumber();
            } else if (tipo === "RECEITA") {
                monthlyData[month].totalRevenues += valor.toNumber();
            }
        });

        // Calcular o balanço líquido por mês
        monthlyData.forEach((monthData) => {
            monthData.totalExpenses = parseFloat(monthData.totalExpenses.toFixed(2));
            monthData.totalRevenues = parseFloat(monthData.totalRevenues.toFixed(2));
        });

        return reply.send(monthlyData.map((monthData) => ({
            month: monthData.month,
            totalExpenses: monthData.totalExpenses.toString(),
            totalRevenues: monthData.totalRevenues.toString(),
        })));
    })
}
