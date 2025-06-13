import mongoose, { Schema } from "mongoose";


const commentSchema = new Schema({
    postId: {
        type: Schema.Types.ObjectId,
        ref: "Post",
        required: true
    },
    parentCommentId: {
        type: Schema.Types.ObjectId,
        ref: "Comment",
    },
    content: {
        type: String,
        required: true
    },
    authorId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true })


commentSchema.index({ postId: 1 });



export const Comment = mongoose.model("Comment", commentSchema)