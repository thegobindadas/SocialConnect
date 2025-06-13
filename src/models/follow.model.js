import mongoose, { Schema } from "mongoose";


const followSchema = new Schema({
    followerId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
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