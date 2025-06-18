import mongoose, { Schema } from "mongoose";


const commentSchema = new Schema({
    postId: {
        type: Schema.Types.ObjectId,
        ref: "Post",
        required: true,
        index: true
    },
    parentCommentId: {
        type: Schema.Types.ObjectId,
        ref: "Comment",
        default: null, // null means it's a root comment
        index: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    authorId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true })


commentSchema.index({ postId: 1 });



export const Comment = mongoose.model("Comment", commentSchema)