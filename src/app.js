import Fastify from "fastify";
import fastifyEnv from "@fastify/env";
import cors from "@fastify/cors";
import fastifySensible from "@fastify/sensible";
import mongodbPlugin from "./plugin/mongodb.js";


const fastify = Fastify({
  logger: true
})



await fastify.register(cors, { 
    origin: "*" 
})
await fastify.register(fastifySensible)

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

fastify.register(mongodbPlugin)










export { fastify }