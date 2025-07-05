import mongoose from "mongoose";
import { Post } from "../models/post.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { CLOUD_FOLDERS } from "../constants.js";



export const createANewPost = async (request, reply) => {
    try {

        const userId = request.user._id

        if (!userId) {
            return reply.unauthorized("Unauthorized to create a post")
        }


        const parts = request.parts();
        const fields = {};
        const mediaUrls = [];

        const videoId = new mongoose.Types.ObjectId().toHexString();
        const postFolder = `${CLOUD_FOLDERS.MAIN}/${userId}/${videoId}`;


        for await (const part of parts) {
            if (part.file) {
                
                if (!["image", "video"].some(type => part.mimetype.includes(type))) {
                    return reply.badRequest("Only image and video files are allowed");
                }


                const uploadResult = await uploadOnCloudinary(request.server, part, postFolder)

                if (!uploadResult) {
                    return reply.createError(500, "Failed to upload the file")
                }

                
                mediaUrls.push({
                    url: uploadResult.url,
                    publicId: uploadResult.public_id,
                    type: uploadResult.resource_type,
                });

            } else {
                fields[part.fieldname] = part.value;
            }
        }


        if (!fields["content"]) {
            return reply.badRequest(`content is required`);
        }


        const newPost = await Post.create({
            _id: videoId,
            content: fields["content"],
            tags: fields["tags"] || null,
            link: fields["link"] || null,
            mediaUrls: mediaUrls.length > 0 ? mediaUrls : null,
            authorId: userId
        })

        if (!newPost) {
            return reply.badRequest("Failed to create a new post")
        }

        

        return reply.send({
            post: newPost,
            message: "Post created successfully",
            success: true
        })

    } catch (error) {
        return reply.createError(500, "Failed to create a new post")
    }
}


export const togglePostPublishStatus = async (request, reply) => {
    try {

        const userId = request.user._id

        if (!userId) {
            return reply.unauthorized("Unauthorized to create a post")
        }


        const postId = request.params.postId

        if (!postId) {
            return reply.badRequest("Post id is required")
        }


        const post = await Post.findById(postId)

        if (!post) {
            return reply.notFound("Post not found")
        }

        if(post.authorId.toString() !== userId) {
            return reply.unauthorized("Unauthorized to update this post")
        }


        post.isPublished = !(post.isPublished)

        await post.save()



        return reply.send({
            data: post,
            message: "Post updated published status successfully",
            success: true
        })

    } catch (error) {
        return reply.createError(500, "Failed to toggle publish status of a new post")
    }
}


export const updatePost = async (request, reply) => {
    try {
        
        const { content, tags, link } = request.body
        const userId = request.user._id

        if (!userId) {
            return reply.unauthorized("Unauthorized to create a post")
        }


        const postId = request.params.postId

        if (!postId) {
            return reply.badRequest("Post id is required")
        }


        const post = await Post.findById(postId)

        if (!post) {
            return reply.notFound("Post not found")            
        }

        if(post.authorId.toString() !== userId) {
            return reply.unauthorized("Unauthorized to update this post")
        }


        post.content = content || post.content
        if (tags !== undefined) post.tags = tags
        if (link !== undefined) post.link = link

        await post.save()



        return reply.send({
            data: post,
            message: "Post updated successfully",
            success: true
        });
        
    } catch (error) {
        return reply.createError(500, "Failed to update a post")
    }
}


// isLikedByMe totalComments totalLikes
export const getPostById = async (request, reply) => {
    try {
        
        const postId = request.params.postId

        if (!postId) {
            return reply.badRequest("Post id is required")
        }

        const loggedInUserId = request.user?._id || request.user?.id || null


        const pipeline = [
            {
                $match: { 
                    _id: new mongoose.Types.ObjectId(postId) 
                } 
            },

            // Lookup author
            {
                $lookup: {
                    from: "users",
                    localField: "authorId",
                    foreignField: "_id",
                    as: "author"
                }
            },
            { $unwind: "$author" },

            // Lookup total likes
            {
            $lookup: {
                    from: "likes",
                    let: { postId: "$_id" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$postId", "$$postId"] } } }
                    ],
                    as: "likes"
                }
            },

            // Lookup total comments
            {
            $lookup: {
                    from: "comments",
                    let: { postId: "$_id" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$postId", "$$postId"] } } }
                    ],
                    as: "comments"
                }
            }
        ];


        // Conditionally add isLikedByMe if loggedInUserId exists
        if (loggedInUserId) {
            pipeline.push(
                {
                    $lookup: {
                        from: "likes",
                        let: { postId: "$_id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$postId", "$$postId"] },
                                            { $eq: ["$authorId", new mongoose.Types.ObjectId(loggedInUserId)] }
                                        ]
                                    }
                                }
                            }
                        ],
                        as: "isLikedByMe"
                    }
                },
                {
                    $lookup: {
                        from: "bookmarks",
                        let: { postId: "$_id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$postId", "$$postId"] },
                                            { $eq: ["$authorId", new mongoose.Types.ObjectId(loggedInUserId)] }
                                        ]
                                    }
                                }
                            }
                        ],
                        as: "isBookmarkedByMe"
                    }
                }
            );
        }


        // Final projection
        pipeline.push({
            $project: {
                _id: 1,
                content: 1,
                tags: 1,
                link: 1,
                mediaUrls: 1,
                isPublished: 1,
                createdAt: 1,
                updatedAt: 1,

                author: {
                    _id: "$author._id",
                    firstName: "$author.firstName",
                    lastName: "$author.lastName",
                    username: "$author.username",
                    profilePic: "$author.profilePic"
                },

                totalLikes: { $size: "$likes" },
                totalComments: { $size: "$comments" },
                isLikedByMe: loggedInUserId ? { $gt: [{ $size: "$isLikedByMe" }, 0] } : false,
                isBookmarkedByMe: loggedInUserId ? { $gt: [{ $size: "$isBookmarkedByMe" }, 0] } : false
            }
        });


        const postDetails = await Post.aggregate(pipeline);
        const post = postDetails?.[0] || null;     

        if (!post) {
            return reply.notFound("Post not found")
        }

        
        let isThisMyPost = false;
        if (loggedInUserId) {
            isThisMyPost = post?.author?._id?.toString() === loggedInUserId?.toString();
        }



        return reply.send({
            post: {
                ...post,
                isThisMyPost
            },
            message: "Post fetched successfully",
            success: true
        });

    } catch (error) {
        return reply.createError(500, "Failed to get a post")
    }
}









// GET	/user/:username
export const getUserPosts = async (request, reply) => {
    try {
        
        const { username } = request.params
        const limit = parseInt(request.query.limit) || 10;
        const page = parseInt(request.query.page) || 1;
        const skip = (page - 1) * limit;


        const user = await User.findOne({ username: username.toString() }).select("_id");

        if (!user) {
            return reply.notFound("User not found")
        }


        await Post.find({ authorId: user._id})
            .populate({
                path: "authorId",
                select: "firstName lastName username profilePic"
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)




    } catch (error) {
        return reply.createError(500, "Failed to get user posts")
    }
}


// GET /feed
export const getAllPosts = async (request, reply) => {
    try {
        
    } catch (error) {
        return reply.createError(500, "Failed to get all posts")
    }
}

// DELETE	/:postId
export const deletePost = async (request, reply) => {}
export const updatePostMedia = async (request, reply) => {}
export const deletePostMedia = async (request, reply) => {}