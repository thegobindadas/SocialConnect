import mongoose, { Schema } from "mongoose";



const postSchema = new Schema({
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    tags: {
        type: String,
        lowercase: true,
        trim: true,
    },
    link: {
        type: String,
        trim: true,
        match: /^https?:\/\/.+/i
    },
    mediaUrls: [{
        url: {
            type: String,
            required: true
        },
        publicId: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ["image", "video"],
            required: true
        }
    }],
    isPublished: {
        type: Boolean,
        default: true
    },
    authorId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true })


postSchema.index({ authorId: 1 });
postSchema.index({ createdAt: -1 });



export const Post = mongoose.model("Post", postSchema)