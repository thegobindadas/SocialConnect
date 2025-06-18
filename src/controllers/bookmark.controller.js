import mongoose, { isValidObjectId } from "mongoose";
import { Bookmark } from "../models/bookmark.model";





/**
 * Toggles the bookmark status of a post for the current user.
 * 
 * @function bookmarkUnBookmarkPost
 * @param {FastifyRequest} request - The Fastify request object containing the user and post IDs.
 * @param {FastifyReply} reply - The Fastify reply object for sending responses.
 * 
 * @returns {Promise<void>} - Sends a response with a success message and status indicating whether 
 * the post was bookmarked or unbookmarked. If an error occurs, sends an appropriate error message.
 */
export const bookmarkUnBookmarkPost = async (request, reply) => {
    try {
        
        const userId = request.user._id

        if (!userId) {
            return reply.unauthorized("Unauthorized to bookmark a post")
        }


        const postId = request.params.postId

        if (!postId) {
            return reply.badRequest("Post id is required")
        }

        if (!isValidObjectId(postId)) {
            return reply.badRequest("Invalid post id")
        }


        const isAlreadyBookmarked = await Bookmark.findOne({
            postId,
            authorId: userId
        })


        if (isAlreadyBookmarked) {

            const bookmark = await Bookmark.findOneAndDelete({
                postId,
                authorId: userId
            })

            if (!bookmark) {
                return reply.badRequest("Failed to unbookmark post")
            }



            return reply.send({
                message: "Post unbookmarked successfully",
                success: true
            })

        } else {

            const bookmark = await Bookmark.create({
                postId,
                authorId: userId
            })

            if (!bookmark) {
                return reply.badRequest("Failed to bookmark post")
            }



            return reply.send({
                message: "Post bookmarked successfully",
                success: true
            })
        }

    } catch (error) {
        return reply.createError("Failed to bookmark/unbookmark post")
    }
}



/**
 * Returns an array of posts bookmarked by the current user
 * @param {FastifyRequest} request
 * @param {FastifyReply} reply
 * @returns {Promise<import("http").ServerResponse>} response
 */
const getMyBookmarkPosts = async (request, reply) => {
    try {
        
    } catch (error) {
        return reply.createError("")
    }
}