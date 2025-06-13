import Fastify from "fastify";
import fastifyEnv from "@fastify/env";
import cors from "@fastify/cors";
import fastifySensible from "@fastify/sensible";
import fastifyCookie from "@fastify/cookie";
import mongodbPlugin from "./plugin/mongodb.js";
import authPlugin from "./plugin/auth.js"


const fastify = Fastify({
  logger: true
})





await fastify.register(fastifyEnv, {
    dotenv: true,
    schema: {
        type: "object",
        required: [ "PORT", "MONGODB_URI", "JWT_SECRET" ],
        properties: {
            PORT: {
                type: "string",
                default: 3000
            },
            MONGODB_URI: {
                type: "string",
            },
            JWT_SECRET: {
                type: "string",
            }
        }
    }
}).after((err) => {
    if (err) {
        console.error(`ENV load failed: ${err.message}`)
        process.exit(1)
    }
})

await fastify.register(cors, { 
    origin: "*" 
})
await fastify.register(fastifySensible)
await fastify.register(fastifyCookie)


fastify.register(mongodbPlugin)
fastify.register(authPlugin)










export { fastify }