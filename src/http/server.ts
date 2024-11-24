import fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import fastifyJwt from "@fastify/jwt";
import {
    jsonSchemaTransform,
    serializerCompiler,
    validatorCompiler,
    ZodTypeProvider
} from 'fastify-type-provider-zod'
import { createAccount } from "./routes/auth/create-account";
import { authenticateWithPassword } from "./routes/auth/authenticate";
import { getProfile } from "./routes/profile/get-profile";
import { updateProfile } from "./routes/profile/update-profile";
import { getCategories } from "./routes/categories/get-categories";

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.register(fastifySwagger, {
    openapi: {
        info: {
            title: 'Control Wise',
            description: 'Controle de Finanças Pessoais',
            version: '1.0.0',
        },
        servers: [],
    },
    transform: jsonSchemaTransform,
});

app.register(fastifySwaggerUI, {
    routePrefix: '/docs'
})

app.register(fastifyJwt, {
    secret: 'my-jwt-secret',
})

app.register(fastifyCors, {
    origin: 'http://localhost:5173',
    credentials: true
});

// register routes
app.register(createAccount)
app.register(authenticateWithPassword)
app.register(getProfile)
app.register(updateProfile)
app.register(getCategories)

app.listen({ port: 3333 }).then(() => {
    console.log('HTTP server running!')
})
