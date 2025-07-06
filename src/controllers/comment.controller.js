import { isValidObjectId } from "mongoose";
import { Post } from "../models/post.model.js";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";



export const createComment = async (request, reply) => {
    try {
        
        const userId = request.user._id
        const { postId, parentCommentId } = request.query;
        const { content } = request.body;

        if (!userId) {
            return reply.unauthorized("Unauthorized to comment on a post")
        }

        if (!content?.trim()) {
            return reply.badRequest("Content are required")
        }


        const post = await Post.findById(postId)

        if (!post) {
            return reply.notFound("Post not found")
        }


        let validParentComment = null;
        if (parentCommentId) {

            if (!isValidObjectId(parentCommentId)) {
                return reply.badRequest("Invalid parent comment id")
            }

            validParentComment = await Comment.findById(parentCommentId)

            if (!validParentComment || validParentComment.postId.toString() !== postId) {
                return reply.badRequest("Invalid parent comment or mismatched postId")
            }
        }


        const comment = await Comment.create({
            postId,
            parentCommentId: validParentComment ? validParentComment._id : null,
            content,
            authorId: userId
        })

        if (!comment) {
            return reply.badRequest("Failed to create a comment")
        }



        return reply.send({
            data: comment,
            message: "Comment created successfully",
            success: true
        })

    } catch (error) {
        return reply.createError(500, "Failed to create a comment")
    }
}


export const updateComment = async (request, reply) => {
    try {
        
        const userId = request.user._id
        const { commentId } = request.params
        const { content } = request.body

        if (!userId) {
            return reply.unauthorized("Unauthorized to update a comment")
        }

        if (!commentId || !content) {
            return reply.badRequest("All fields are required")
        }

        if (!isValidObjectId(commentId)) {
            return reply.badRequest("Invalid comment id")
        }


        const comment = await Comment.findById(commentId)

        if (!comment) {
            return reply.notFound("Comment not found")
        }

        if (comment.authorId.toString() !== userId.toString()) {
            return reply.unauthorized("Unauthorized to update this comment")
        }


        comment.content = content || comment.content
        await comment.save()



        return reply.send({
            comment,
            message: "Comment updated successfully",
            success: true
        })

    } catch (error) {
        reply.createError(500, "Failed to update a comment")
    }
}


export const updateReply = async (request, reply) => {
    try {
        
        const userId = request.user._id
        const { commentId, parentCommentId } = request.params;
        const { content } = request.body

        if (!userId) {
            return reply.unauthorized("Unauthorized to update a comment")
        }

        if (!commentId || !content || !parentCommentId) {
            return reply.badRequest("All fields are required")
        }

        if (!isValidObjectId(commentId) || !isValidObjectId(parentCommentId)) {
            return reply.badRequest("Invalid comment id or parent comment id")
        }


        const comment = await Comment.findOne({
            _id: commentId,
            parentCommentId: parentCommentId
        })

        if (!comment) {
            return reply.notFound("Comment not found")
        }

        if (comment.authorId.toString() !== userId.toString()) {
            return reply.unauthorized("Unauthorized to update this reply")
        }


        comment.content = content || comment.content
        await comment.save()



        return reply.send({
            comment,
            message: "Updated reply successfully",
            success: true
        })

    } catch (error) {
        reply.createError(500, "Failed to update a comment")
    }
}


export const deleteComment = async (request, reply) => {
    try {
    
        const userId = request.user._id
        const { commentId } = request.params

        if (!userId) {
            return reply.unauthorized("Unauthorized to delete a comment")
        }

        if (!commentId) {
            return reply.badRequest("Comment id is required")
        }

        if (!isValidObjectId(commentId)) {
            return reply.badRequest("Invalid comment id")
        }


        const comment = await Comment.findById(commentId)

        if (!comment) {
            return reply.notFound("Comment not found")
        }

        if (comment.authorId.toString() !== userId.toString()) {
            return reply.unauthorized("Unauthorized to delete this comment")
        }


        if (comment.parentCommentId === null) {

            await comment.deleteOne()

            return reply.send({
                message: "Comment deleted with replies successfully",
                success: true
            })
        }
        

        await Comment.deleteOne({ _id: commentId });



        return reply.send({
            message: "Comment deleted successfully",
            success: true
        })

    } catch (error) {
        return reply.createError(500, "Failed to delete a comment")
    }
}









export const getCommentsByPostId = async (request, reply) => {
    try {
        
        const userId = request.user._id
        const { postId } = request.params
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 10;
        const skip = (page - 1) * limit;


        if (!postId) {
            return reply.badRequest("Post id is required")
        }

        
        const comments = await Comment.find({ postId, parentCommentId: null })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("authorId", "firstName lastName username profilePic");

        const commentIds = comments.map(c => c._id);


        const likes = await Like.aggregate([
            { $match: { commentId: { $in: commentIds } } },
            { $group: { _id: "$commentId", count: { $sum: 1 } } }
        ]);


        const likeMap = {};
        likes.forEach(l => {
            likeMap[l._id.toString()] = l.count;
        });


        const subCounts = await Comment.aggregate([
            { $match: { parentCommentId: { $in: commentIds } } },
            { $group: { _id: "$parentCommentId", count: { $sum: 1 } } }
        ]);


        const subMap = {};
        subCounts.forEach(e => {
            subMap[e._id.toString()] = e.count > 0;
        });


        const likedByUser = userId
            ? await Like.find({ commentId: { $in: commentIds }, authorId: userId }).select("commentId")
            : [];

        const likedMap = {};
        likedByUser.forEach(like => {
            likedMap[like.commentId.toString()] = true;
        });

        
        const result = comments.map(c => ({
            _id: c._id,
            content: c.content,
            createdAt: c.createdAt,
            author: c.authorId,
            likeCount: likeMap[c._id.toString()] || 0,
            isSubComment: subMap[c._id.toString()] || false,
            isLikedByMe: likedMap[c._id.toString()] || false 
        }));

        const total = await Comment.countDocuments({ postId, parentCommentId: null });



        return reply.send({
            data: {
                data: result,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalComments: total,
            },
            message: "Comments fetched successfully",
            success: true
        })

    } catch (error) {
        reply.createError(500, "Failed to get comments by post id")
    }
}


export const getRepliesByCommentId = async (request, reply) => {
    try {

        const { commentId } = request.params;

        if (!commentId) {
            return reply.badRequest("Comment id is required")
        }

        if (!isValidObjectId(commentId)) {
            return reply.badRequest("Invalid comment id")
        }

  
        const replies = await Comment.find({ parentCommentId: commentId })
            .sort({ createdAt: 1 })
            .populate("authorId", "firstName lastName username profilePic");
  
        const replyIds = replies.map(r => r._id);
  

        const likes = await Like.aggregate([
            { $match: { commentId: { $in: replyIds } } },
            { $group: { _id: "$commentId", count: { $sum: 1 } } }
        ]);
  
        const likeMap = {};
        likes.forEach(l => {
            likeMap[l._id.toString()] = l.count;
        });
  

        const result = replies.map(r => ({
            _id: r._id,
            content: r.content,
            createdAt: r.createdAt,
            author: r.authorId,
            likeCount: likeMap[r._id.toString()] || 0,
            isSubComment: false // no nested subreplies in this design
        }));
  


        return reply.send({
            data: result,
            message: "Replies fetched successfully",
            success: true,
        })

    } catch (error) {
      return reply.createError(500, "Failed to get replies of a comment")
    }
};