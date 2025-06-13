import mongoose, { Schema } from "mongoose";


const likeSchema = new Schema({
    postId: {
        type: Schema.Types.ObjectId,
        ref: "Post",
    },
    commentId: {
        type: Schema.Types.ObjectId,
        ref: "Comment",
    },
    authorId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true })


likeSchema.index({ authorId: 1, postId: 1 }, { unique: true, sparse: true });
likeSchema.index({ authorId: 1, commentId: 1 }, { unique: true, sparse: true });



export const Like = mongoose.model("Like", likeSchema)