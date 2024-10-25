import { hash } from "bcryptjs";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { BadRequestError } from "../_errors/bad-request-error";

export async function createAccount(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post(
        '/signup',
        {
            schema: {
                tags: ['🔒Authenticate'],
                summary: 'Create a new account',
                body: z.object({
                    nome: z.string(),
                    email: z.string().email(),
                    password: z.string().min(6)
                })
            },
        },
        async (request, reply) => {
            const { nome, email, password } = request.body;

            // Verifica se já existe um usuário com o mesmo email
            const userWithSameEmail = await prisma.user.findUnique({
                where: { email }
            });

            if (userWithSameEmail) {
                throw new BadRequestError('User with same e-mail already exists.');
            }

            const passwordHash = await hash(password, 6);

            // Cria o usuário
            const user = await prisma.user.create({
                data: {
                    nome,
                    email,
                    passwordHash,
                },
            });

            // Cria categorias padrão para o novo usuário
            const defaultCategories = [
                { codigo: 1, nome: 'Casa', tipo: 'Despesa', codIcone: 1, codColor: 1, descricao: '', userId: user.id },
                { codigo: 2, nome: 'Carro', tipo: 'Despesa', codIcone: 2, codColor: 2, descricao: '', userId: user.id },
                { codigo: 3, nome: 'Educação', tipo: 'Despesa', codIcone: 3, codColor: 3, descricao: '', userId: user.id },
                { codigo: 4, nome: 'Eletrônico', tipo: 'Despesa', codIcone: 4, codColor: 4, descricao: '', userId: user.id },
                { codigo: 5, nome: 'Lazer', tipo: 'Despesa', codIcone: 5, codColor: 5, descricao: '', userId: user.id },
                { codigo: 6, nome: 'Outros', tipo: 'Despesa', codIcone: 6, codColor: 6, descricao: '', userId: user.id },
            ];

            await prisma.categorie.createMany({
                data: defaultCategories,
            });

            return reply.status(201).send({ user, message: 'Account created with default categories' });
        }
    );
}
