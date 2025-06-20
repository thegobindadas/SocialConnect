import mongoose, { isValidObjectId } from "mongoose";
import { Post } from "../models/post.model.js";
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

        if (!isValidObjectId(postId)) {
            return reply.badRequest("Invalid post id")
        }


        const post = await Post.findOne({
            _id: postId,
            authorId: userId
        })

        if (!post) {
            return reply.notFound("Post not found")
        }


        post.isPublished = !(post.isPublished)

        await post.save()



        return reply.send({
            post,
            message: "Post updated published status successfully",
            success: true
        })

    } catch (error) {
        return reply.createError(500, "Failed to toggle publish status of a new post")
    }
}


export const updatePost = async (request, reply) => {
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


        const post = await Post.findById(postId)

        if (!post) {
            return reply.notFound("Post not found")            
        }

        if(post.authorId.toString() !== userId) {
            return reply.unauthorized("Unauthorized to update this post")
        }


        const { content, tags, link } = request.body


        post.content = content || post.content
        if (tags !== undefined) post.tags = tags
        if (link !== undefined) post.link = link

        await post.save()



        return reply.send({
            post,
            message: "Post updated successfully",
            success: true
        });
        
    } catch (error) {
        return reply.createError(500, "Failed to update a post")
    }
}


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



        return reply.send({
            post,
            message: "Post fetched successfully",
            success: true
        });

    } catch (error) {
        return reply.createError(500, "Failed to get a post")
    }
}



// TODO: testing required
export const getAllPosts = async (request, reply) => {
    try {
        
    } catch (error) {
        return reply.createError(500, "Failed to get all posts")
    }
}









export const deletePost = async (request, reply) => {}
export const updatePostMedia = async (request, reply) => {}
export const deletePostMedia = async (request, reply) => {}