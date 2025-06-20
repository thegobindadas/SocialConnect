import mongoose, { Schema } from "mongoose";



const bookmarkSchema = new Schema({
    postId: {
        type: Schema.Types.ObjectId,
        ref: "Post",
        required: true
    },
    authorId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true })


bookmarkSchema.index({ authorId: 1, postId: 1 }, { unique: true });



export const Bookmark = mongoose.model("Bookmark", bookmarkSchema)