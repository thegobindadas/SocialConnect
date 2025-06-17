import mongoose, { isValidObjectId } from "mongoose";
import { Bookmark } from "../models/bookmark.model";



export const bookmarkUnBookmarkPost = async (request, reply) => {
    try {
        
        const userId = request.user._id

        if (!userId) {
            return reply.unauthorized("Unauthorized to create a post")
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


const getMyBookmarkPosts = async (request, reply) => {
    try {
        
    } catch (error) {
        return reply.createError("")
    }
}