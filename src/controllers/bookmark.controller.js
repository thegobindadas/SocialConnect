import { isValidObjectId } from "mongoose";
import { Bookmark } from "../models/bookmark.model.js";



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
        return reply.createError(500, "Failed to bookmark/unbookmark post")
    }
}


export const getMyBookmarkPosts = async (request, reply) => {
    try {

        const userId = request.user._id
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 10;
        const skip = (page - 1) * limit;

        if (!userId) {
            return reply.unauthorized("Unauthorized to bookmark a post")
        }


        const bookmarks = await Bookmark.find({ authorId: userId })
            .populate({
                path: "postId",
                match: { isPublished: true },
                populate: {
                    path: "authorId",
                    select: "firstName lastName username profilePic"
                }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const validBookmarks = bookmarks.filter(b => b.postId);

        if (validBookmarks.length === 0) {
            return reply.send({
                data: [],
                message: "No bookmarks found",
                success: true
            })
            
        }

    

        return reply.send({
            data: validBookmarks,
            message: "Bookmarks fetched successfully",
            success: true
        })

    } catch (error) {
        console.log(error)
        return reply.createError(500, "Failed to get bookmarks")
    }
}