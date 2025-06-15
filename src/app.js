import path from "path";
import { fileURLToPath } from 'url';
import Fastify from "fastify";
import fastifyEnv from "@fastify/env";
import cors from "@fastify/cors";
import fastifySensible from "@fastify/sensible";
import fastifyCookie from "@fastify/cookie";
import fastifyMultipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import cloudinary from "fastify-cloudinary";

import mongodbPlugin from "./plugin/mongodb.js";
import authPlugin from "./plugin/auth.js"


// import routes
import authRoute from "./routes/user.route.js"



const fastify = Fastify({
  logger: true
})

// Convert import.meta.url to __dirname (ESM-compatible)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);





await fastify.register(fastifyEnv, {
    confKey: "config",
    schema: {
        type: "object",
        required: [ 
            "PORT", 
            "MONGODB_URI", 
            // "JWT_SECRET",
            "ACCESS_TOKEN_SECRET",
            "REFRESH_TOKEN_SECRET",
            "CLOUDINARY_CLOUD_NAME", 
            "CLOUDINARY_API_KEY", 
            "CLOUDINARY_API_SECRET",
        ],
        properties: {
            PORT: {
                type: "string",
                default: 3000
            },
            MONGODB_URI: { type: "string" },
            // JWT_SECRET: { type: "string" },
            ACCESS_TOKEN_SECRET: { type: "string" },
            REFRESH_TOKEN_SECRET: { type: "string" },
            CLOUDINARY_CLOUD_NAME: { type: "string" },
            CLOUDINARY_API_KEY: { type: "string" },
            CLOUDINARY_API_SECRET: { type: "string" },
        }
    },
    dotenv: true,
    data: process.env,
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
await fastify.register(fastifyCookie, {
  secret: fastify.config.JWT_SECRET,
})
await fastify.register(fastifyMultipart, {
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 5,
    }
})

await fastify.register(fastifyStatic, {
  root: path.join(__dirname, "public"),
  prefix: "/public/",
  //constraints: { host: "example.com" }
})
await fastify.register(cloudinary, { url: `cloudinary://${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}@${process.env.CLOUDINARY_CLOUD_NAME}` });


fastify.register(mongodbPlugin)
fastify.register(authPlugin)


// Use Routes
fastify.register(authRoute, { prefix: "/api/v1/users" });










export { fastify }