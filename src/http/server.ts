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
import { getProfile } from "./routes/config/profile/get-profile";
import { updateProfile } from "./routes/config/profile/update-profile";
import { getCategories } from "./routes/config/categories/get-categories";
import { createCategory } from "./routes/config/categories/post-categories";
import { getCategorieDetails } from "./routes/config/categories/get-categorie-details";
import { deleteCategorie } from "./routes/config/categories/delete-categorie";
import { getParameters } from "./routes/config/parameters/get-parameters";
import { updateParameters } from "./routes/config/parameters/update-parameters";
import { createTransaction } from "./routes/myexpenses/transactions/post-transaction";
import { createPlanning } from "./routes/myexpenses/plannings/post-planning";
import { createGoal } from "./routes/myexpenses/goals/post-goal";
import { getAssets } from "./routes/mywallet/dashboard/get-assets";
import { createMovement } from "./routes/mywallet/dashboard/post-movement";
import { getExpensesMonth } from "./routes/myexpenses/dashboard/get-dashboard-month";
import { getDashboardYears } from "./routes/myexpenses/dashboard/get-dashboard-year";
import { getCategorySummary } from "./routes/myexpenses/dashboard/get-categories-summary";
import { getTransactionsByMonth } from "./routes/myexpenses/transactions/get-transactions";
import { getPlanningsByMonth } from "./routes/myexpenses/plannings/get-plannings";
import { getPlanningsByCategory } from "./routes/myexpenses/plannings/get-plannings-bycategory";
import { getUnfinishedGoals } from "./routes/myexpenses/goals/get-goal";
import { updateGoalValueAdded } from "./routes/myexpenses/goals/put-goal-value";
import { getAssetMovements } from "./routes/mywallet/dashboard/get-movement-assets";
import { getEvolutionMovements } from "./routes/mywallet/dashboard/get-evolution-movements";
import { getAssetSummary } from "./routes/mywallet/dashboard/get-assets-summary";

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
app.register(createCategory)
app.register(getCategorieDetails)
app.register(deleteCategorie)
app.register(getParameters)
app.register(updateParameters)
app.register(createTransaction)
app.register(createPlanning)
app.register(createGoal)
app.register(getAssets)
app.register(createMovement)
app.register(getExpensesMonth)
app.register(getDashboardYears)
app.register(getCategorySummary)
app.register(getTransactionsByMonth)
app.register(getPlanningsByMonth)
app.register(getPlanningsByCategory)
app.register(getUnfinishedGoals)
app.register(updateGoalValueAdded)
app.register(getAssetMovements)
app.register(getEvolutionMovements)
app.register(getAssetSummary)

app.listen({ port: 3333 }).then(() => {
    console.log('HTTP server running!')
})
