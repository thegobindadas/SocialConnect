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



        fastify.post("/", createComment); // POST /api/v1/comments

        fastify.get("/post/:postId", getCommentsByPostId); // GET /api/v1/comments/post/:postId?page=1&limit=10

        fastify.get("/:commentId/replies", getRepliesByCommentId); // GET /api/v1/comments/:commentId/replies

        fastify.put("/:commentId", updateComment); // PUT /api/v1/comments/:commentId

        fastify.put("/:commentId/:parentCommentId", updateReply); // PUT /api/v1/comments/:commentId/:parentCommentId
        
        fastify.delete("/:commentId", deleteComment); // DELETE /api/v1/comments/:commentId

    })
}