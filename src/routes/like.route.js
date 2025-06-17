import {
    likeDislikePost,
    likeDislikeComment,
} from "../controllers/like.controller.js";





export default async function (fastify, opts) {

    fastify.register(async function (fastify) {

        fastify.addHook("preHandler", fastify.authenticate);



        fastify.post("/post/:postId", likeDislikePost);

        fastify.post("/comment/:commentId", likeDislikeComment);

    })
}