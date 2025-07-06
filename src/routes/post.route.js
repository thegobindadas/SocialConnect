import { 
    createANewPost,
    togglePostPublishStatus,
    updatePost,
    getPostById,
    getUserPosts,
    getAllPosts,
    updatePostMedia,
    deletePostMedia,
    deletePost,
} from "../controllers/post.controller.js";




export default async function (fastify, opts) {

    fastify.register(async function (fastify) {

        fastify.addHook("preHandler", fastify.authenticate);



        fastify.post("/", createANewPost);

        fastify.patch("/:postId/publish-toggle", togglePostPublishStatus);

        fastify.patch("/:postId/update", updatePost);

        fastify.get("/:postId", getPostById);

        fastify.get("/user/:username", getUserPosts);

        fastify.get("/feed", getAllPosts);

        fastify.patch("/:postId/add/media", updatePostMedia);

        fastify.patch("/:postId/delete/media", deletePostMedia);

        fastify.delete("/:postId", deletePost);
    })
}