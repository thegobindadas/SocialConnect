import mongoose from "mongoose";
import { Post } from "../models/post.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { Bookmark } from "../models/bookmark.model.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
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


export const getUserPosts = async (request, reply) => {
    try {
        
        const { username } = request.params
        const limit = parseInt(request.query.limit) || 10;
        const page = parseInt(request.query.page) || 1;
        const skip = (page - 1) * limit;
        const currentUserId = request.user._id;


        // 1. Get the user by username
        const user = await User.findOne({ username }).select('_id firstName lastName username profilePic');

        if (!user) {
            return reply.notFound("User not found")
        }


        // 2. Fetch posts authored by this user with pagination
        const posts = await Post.find({ authorId: user._id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();  // lean() for plain JS objects

        // 3. Collect post IDs for bulk operations
        const postIds = posts.map(post => post._id);


        // 4. Get likes, comments, bookmarks for all these posts in bulk
        const [likesData, commentsData, bookmarksData, myLikes] = await Promise.all([
            Like.aggregate([
                { $match: { postId: { $in: postIds } } },
                { $group: { _id: '$postId', totalLikes: { $sum: 1 } } }
            ]),
            Comment.aggregate([
                { $match: { postId: { $in: postIds } } },
                { $group: { _id: '$postId', totalComments: { $sum: 1 } } }
            ]),
            Bookmark.find({ postId: { $in: postIds }, authorId: currentUserId }).lean(),
            Like.find({ postId: { $in: postIds }, authorId: currentUserId }).lean()
        ]);


        const likesMap = new Map(likesData.map(item => [item._id.toString(), item.totalLikes]));
        const commentsMap = new Map(commentsData.map(item => [item._id.toString(), item.totalComments]));
        const bookmarkedPostIds = new Set(bookmarksData.map(b => b.postId.toString()));
        const likedPostIds = new Set(myLikes.map(l => l.postId.toString()));


        // 5. Format the posts
        const formattedPosts = posts.map(post => ({
            ...post,
            author: {
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                profilePic: user.profilePic
            },
            totalLikes: likesMap.get(post._id.toString()) || 0,
            totalComments: commentsMap.get(post._id.toString()) || 0,
            isLikedByMe: likedPostIds.has(post._id.toString()),
            isBookmarkedByMe: bookmarkedPostIds.has(post._id.toString()),
            isMyPost: post.authorId.toString() === currentUserId.toString()
        }));



        return reply.send({
            data: {
                posts: formattedPosts,
                currentPage: page,
                totalPosts: formattedPosts.length
            },
            message: "User posts fetched successfully",
            success: true
        });

    } catch (error) {
        return reply.createError(500, "Failed to get user posts")
    }
}


export const getAllPosts = async (request, reply) => {
    try {

        const loggedInUserId = request.user._id;

        // Pagination parameters
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 10;
        const skip = (page - 1) * limit;

        
        // Fetch paginated posts
        const posts = await Post.find({ isPublished: true })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate({
                path: 'authorId',
                select: 'firstName lastName username profilePic',
                model: User
            })
            .lean();

        const postIds = posts.map(post => post._id);


        // Parallel fetching likes, comments, bookmarks
        const [likes, comments, bookmarks, totalPosts] = await Promise.all([
            Like.aggregate([
                { $match: { postId: { $in: postIds } } },
                { $group: { _id: "$postId", totalLikes: { $sum: 1 }, userLikes: { $addToSet: "$authorId" } } }
            ]),
            Comment.aggregate([
                { $match: { postId: { $in: postIds } } },
                { $group: { _id: "$postId", totalComments: { $sum: 1 } } }
            ]),
            Bookmark.find({ postId: { $in: postIds }, authorId: loggedInUserId }).lean(),
            Post.countDocuments({ isPublished: true }) // Total posts for pagination metadata
        ]);


        // Maps for quick lookup
        const likesMap = {};
        likes.forEach(item => {
            likesMap[item._id.toString()] = {
                totalLikes: item.totalLikes,
                likedUserIds: item.userLikes.map(id => id.toString())
            };
        });


        const commentsMap = {};
        comments.forEach(item => {
            commentsMap[item._id.toString()] = item.totalComments;
        });


        const bookmarkedPostIds = new Set(bookmarks.map(b => b.postId.toString()));


        // Build enriched posts
        const enrichedPosts = posts.map(post => {
            const postIdStr = post._id.toString();
            const likeInfo = likesMap[postIdStr] || { totalLikes: 0, likedUserIds: [] };
            const commentCount = commentsMap[postIdStr] || 0;

            return {
                ...post,
                author: post.authorId,
                totalLikes: likeInfo.totalLikes,
                isLikedByMe: likeInfo.likedUserIds.includes(loggedInUserId.toString()),
                totalComments: commentCount,
                isMyPost: post.authorId._id.toString() === loggedInUserId.toString(),
                isBookmarkedByMe: bookmarkedPostIds.has(postIdStr)
            };
        });



        return reply.send({
            data: {
                posts: enrichedPosts,
                pagination: {
                    page,
                    limit,
                    totalPosts,
                    totalPages: Math.ceil(totalPosts / limit),
                    hasNextPage: page * limit < totalPosts,
                    hasPrevPage: page > 1
                }
            },
            message: "All posts fetched successfully",
            success: true
        });

    } catch (error) {
        return reply.createError(500, "Failed to get all posts")
    }
}


export const updatePostMedia = async (request, reply) => {
    try {
        
        const userId = request.user._id
        const { postId } = request.params

        const parts = request.parts();
        const mediaUrls = [];


        if (!postId) {
            return reply.badRequest("Post id is required")
        }

        if (!userId) {
            return reply.unauthorized("Unauthorized to update this post")
        }


        const post = await Post.findById(postId)

        if (!post) {
            return reply.notFound("Post not found")
        }

        if(post.authorId.toString() !== userId) {
            return reply.unauthorized("Unauthorized to update this post")
        }
        

        const postFolder = `${CLOUD_FOLDERS.MAIN}/${userId}/${postId}`;

        for await (const part of parts) {
            if (part.file) {
                
                if (!["image", "video"].some(type => part.mimetype.includes(type))) {
                    return reply.badRequest("Only image and video files are allowed");
                }


                const uploadResult = await uploadOnCloudinary(request.server, part, postFolder)

                if (!uploadResult) {
                    return reply.createError(500, "Failed to upload the media file")
                }

                
                mediaUrls.push({
                    url: uploadResult.url,
                    publicId: uploadResult.public_id,
                    type: uploadResult.resource_type,
                });

            }
        }


        post.mediaUrls = mediaUrls.length > 0 ? [...post.mediaUrls, ...mediaUrls] : [...post.mediaUrls];
        await post.save();



        return reply.send({
            data: post,
            message: "Post media updated successfully",
            success: true
        });

    } catch (error) {
        return reply.createError(500, "Failed to update post media")        
    }
}


export const deletePostMedia = async (request, reply) => {
    try {
        
        const userId = request.user._id
        const { postId } = request.params
        const { publicId } = request.body;

        if (!postId) {
            return reply.badRequest("Post id is required")
        }

        if (!userId) {
            return reply.unauthorized("Unauthorized to create a post")
        }

        if (!publicId) {
            return reply.badRequest("Public id is required")
        }


        const post = await Post.findById(postId)

        if (!post) {
            return reply.notFound("Post not found")
        }

        if(post.authorId.toString() !== userId.toString()) {
            return reply.unauthorized("Unauthorized to delete the post media")
        }

        
        const mediaIndex = post.mediaUrls.findIndex(media => media.publicId === publicId);

        if (mediaIndex === -1) {
            return reply.notFound("Media not found in this post.");
        }


        const mediaToDelete = post.mediaUrls[mediaIndex];

        await deleteFromCloudinary(request.server, mediaToDelete.publicId, mediaToDelete.type);

        post.mediaUrls.splice(mediaIndex, 1);
        await post.save();



        return reply.send({
            data: post,
            message: "Post media deleted successfully",
            success: true
        });

    } catch (error) {
        return reply.createError(500, "Failed to delete post media")
    }
}


// DELETE	/:postId
export const deletePost = async (request, reply) => {}

