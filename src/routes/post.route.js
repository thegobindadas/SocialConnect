import { 
    createANewPost,
} from "../controllers/post.controller.js";




export default async function (fastify, opts) {

    fastify.register(async function (fastify) {

        fastify.addHook("preHandler", fastify.authenticate);



        fastify.post("/", createANewPost);

    })
}