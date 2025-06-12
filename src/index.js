import { fastify } from "./app.js";






const start = async () => {
    try {
        await fastify.ready()
        await fastify.listen({ port: process.env.PORT })
        fastify.log.info(`server listening on - http://localhost:${process.env.PORT}`)
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}



start()