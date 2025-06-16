import mongoose, { Schema, Types } from "mongoose";
import bcrypt from "bcrypt";
import { SECURITY } from "../constants.js";


const userSchema  = new Schema ({
    firstName: {
        type: String,
        required: true,
        maxlength: 50,
        trim: true,
        index: true
    },
    lastName: {
        type: String,
        required: true,
        maxlength: 50,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        maxlength: 250,
        trim: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        lowercase: true,
        maxlength: 50,
        trim: true,
        unique: true,
        index: true
    },
    tagline: String,
    bio: String,
    profilePic: {
        url: { // cloudinary url of profile pic
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
        },
    },
    portfolioUrl: String,
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: String,
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date,
    emailVerificationToken: String,
    emailVerificationExpiry: Date,
}, { timestamps: true })


userSchema.pre("save", async function(next) {

    if (!this.isModified("password")) {
        return next()
    }

    this.password = await bcrypt.hash(this.password, SECURITY.SALT_ROUNDS)
    next()
})


userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password)
}



export const User = mongoose.model("User", userSchema)