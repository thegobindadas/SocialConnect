import {
    bookmarkUnBookmarkPost,
} from "../controllers/bookmark.controller.js";





export default async function (fastify, opts) {

    fastify.register(async function (fastify) {

        fastify.addHook("preHandler", fastify.authenticate);



        fastify.post("/:postId", bookmarkUnBookmarkPost);
    })
}