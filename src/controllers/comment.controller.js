import { isValidObjectId } from "mongoose";
import { Post } from "../models/post.model";
import { Comment } from "../models/comment.model";
import { Like } from "../models/like.model";



export const createComment = async (request, reply) => {
    try {
        
        const userId = request.user._id
        const { postId, parentCommentId, content } = req.body;

        if (!userId) {
            return reply.unauthorized("Unauthorized to follow/unfollow a user")
        }

        if (!postId || !content) {
            return reply.badRequest("All fields are required")
        }

        if (!isValidObjectId(postId)) {
            return reply.badRequest("Invalid post id")
        }


        const post = await Post.findById(postId)

        if (!post) {
            return reply.notFound("Post not found")
        }


        if (parentCommentId) {

            if (!isValidObjectId(parentCommentId)) {
                return reply.badRequest("Invalid parent comment id")
            }

            const parentComment = await Comment.findById(parentCommentId)

            if (!parentComment || parentComment.postId.toString() !== postId) {
                return reply.badRequest("Invalid parent comment or mismatched postId")
            }
        }


        const comment = await Comment.create({
            postId,
            parentCommentId: parentCommentId || null,
            content,
            authorId: userId
        })

        if (!comment) {
            return reply.badRequest("Failed to create a comment")
        }



        return reply.send({
            comment,
            message: "Comment created successfully",
            success: true
        })

    } catch (error) {
        reply.createError(500, "Failed to create a comment")
    }
}

 
export const getCommentsByPostId = async (request, reply) => {
    try {
        
        const { postId } = request.params
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 10;
        const skip = (page - 1) * limit;


        if (!postId) {
            return reply.badRequest("Post id is required")
        }

        if (!isValidObjectId(postId)) {
            return reply.badRequest("Invalid post id")
        }

        
        const comments = await Comment.find({ postId, parentCommentId: null })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("authorId", "username avatar");

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

        
        const result = comments.map(c => ({
            _id: c._id,
            content: c.content,
            createdAt: c.createdAt,
            author: c.authorId,
            likeCount: likeMap[c._id.toString()] || 0,
            isSubComment: subMap[c._id.toString()] || false
        }));

        const total = await Comment.countDocuments({ postId, parentCommentId: null });



        return reply.send({
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalComments: total,
            data: result,
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
            .populate("authorId", "username avatar");
  
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


export const updateComment = async (request, reply) => {
    try {
        
        const userId = request.user._id
        const { commentId, content } = request.body

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


export const deleteComment = async (request, reply) => {
    try {
     
        const userId = request.user._id
        const { commentId } = request.body

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


        await comment.deleteOne()



        return reply.send({
            message: "Comment deleted successfully",
            success: true
        })

    } catch (error) {
        reply.createError(500, "Failed to delete a comment")
    }
}