import fastifyPlugin from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";



export default fastifyPlugin(async (fastify, opts) => {

    fastify.register(fastifyJwt, {
        secret: fastify.config.JWT_SECRET,
        cookie: {
            cookieName: "accessToken",
        },
        sign: { expiresIn: "1d" }
    })

    
    fastify.decorate("authenticate", async function(request, reply) {
        try {
            await request.jwtVerify({onlyCookie: true})
        } catch (err) {
            reply.send(err)
        }
    })
})