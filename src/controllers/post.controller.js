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
        })

    } catch (error) {
        return reply.createError(500, "Failed to create a new post")
    }
}











