import {
    bookmarkUnBookmarkPost,
    getMyBookmarkPosts,
} from "../controllers/bookmark.controller.js";





export default async function (fastify, opts) {

    fastify.register(async function (fastify) {

        fastify.addHook("preHandler", fastify.authenticate);



        fastify.post("/p/:postId", bookmarkUnBookmarkPost);

        fastify.get("/me", getMyBookmarkPosts);
    })
}