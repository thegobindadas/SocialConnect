import {
    createComment,
    getCommentsByPostId,
    getRepliesByCommentId,
    updateComment,
    updateReply,
    deleteComment,
} from "../controllers/comment.controller.js";





export default async function (fastify, opts) {

    fastify.register(async function (fastify) {

        fastify.addHook("preHandler", fastify.authenticate);



        fastify.post("/:postId", createComment);

        fastify.patch("/:commentId", updateComment);

        fastify.patch("/:commentId/:parentCommentId", updateReply);

        fastify.get("/p/:postId", getCommentsByPostId);

        fastify.get("/:commentId/replies", getRepliesByCommentId);

        fastify.delete("/:commentId", deleteComment);
    })
}