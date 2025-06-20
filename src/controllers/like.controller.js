import { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";



export const likeDislikePost = async (request, reply) => {
    try {

        const userId = request.user._id

        if (!userId) {
            return reply.unauthorized("Unauthorized to like a post")
        }


        const postId = request.params.postId

        if (!postId) {
            return reply.badRequest("Post id is required")
        }

        if (!isValidObjectId(postId)) {
            return reply.badRequest("Invalid post id")
        }


        const isAlreadyLiked = await Like.findOne({
            postId,
            authorId: userId
        })


        if (isAlreadyLiked) {

            const isDeleted = await Like.findOneAndDelete({
                postId,
                authorId: userId
            })

            if (!isDeleted) {
                return reply.badRequest("Failed to unlike post")
            }



            return reply.send({
                isLiked: false,
                message: "Post unliked successfully",
                success: true
            })

        } else {

            const like = await Like.create({
                postId,
                authorId: userId
            })

            if (!like) {
                return reply.badRequest("Failed to like post")
            }


            
            return reply.send({
                isLiked: true,
                message: "Post liked successfully",
                success: true
            })
        }

    } catch (error) {
        return reply.createError(error)
    }
}


export const likeDislikeComment = async (request, reply) => {
    try {

        const userId = request.user._id

        if (!userId) {
            return reply.unauthorized("Unauthorized to like a comment")
        }


        const commentId = request.params.commentId

        if (!commentId) {
            return reply.badRequest("Comment id is required")
        }

        if (!isValidObjectId(commentId)) {
            return reply.badRequest("Invalid comment id")
        }


        const isAlreadyLiked = await Like.findOne({
            commentId,
            authorId: userId
        })


        if (isAlreadyLiked) {
            
            const isDeleted = await Like.findOneAndDelete({
                commentId,
                authorId: userId
            })

            if (!isDeleted) {
                return reply.badRequest("Failed to unlike comment")
            }



            return reply.send({
                isLiked: false,
                message: "Comment unliked successfully",
                success: true
            })

        } else {

            const like = await Like.create({
                commentId,
                authorId: userId
            })

            if (!like) {
                return reply.badRequest("Failed to like comment")
            }



            return reply.send({
                isLiked: true,
                message: "Comment liked successfully",
                success: true
            })
        }

    } catch (error) {
        return reply.createError(error)
    }
}