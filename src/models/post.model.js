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
    author: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
})



export const Post = mongoose.model("Post", postSchema)