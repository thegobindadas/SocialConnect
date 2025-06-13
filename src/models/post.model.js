import mongoose, { Schema } from "mongoose";


const postSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    tags: String,
    link: String,
    mediaUrls: [String],
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