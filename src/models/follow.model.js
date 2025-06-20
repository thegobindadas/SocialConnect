import mongoose, { Schema } from "mongoose";



const followSchema = new Schema({
    // The one who follows
    followerId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    // The one who is being followed
    followingId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true })


followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

followSchema.pre("save", function (next) {
    if (this.followerId.equals(this.followingId)) {
        return next(new Error("Users cannot follow themselves."));
    }
    next();
});



export const Follow = mongoose.model("Follow", followSchema)