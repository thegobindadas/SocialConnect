import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";
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
        unique: true,
        //match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ // Email format validation
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
    tagline: { 
        type: String, 
        maxlength: 160, 
        trim: true 
    },
    bio: { 
        type: String, 
        maxlength: 1000, 
        trim: true 
    },
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
    portfolioUrl: { 
        type: String, 
        trim: true, 
        match: /^https?:\/\/.+/i 
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters long"],
    },
    refreshToken: String,
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date,
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


userSchema.methods.generateTemporaryToken = function () {
  // This token should be client facing
  // for example: for email verification unHashedToken should go into the user's mail
  const unHashedToken = crypto.randomBytes(20).toString("hex");

  // This should stay in the DB to compare at the time of verification
  const hashedToken = crypto.createHash("sha256").update(unHashedToken).digest("hex");

  // This is the expiry time for the token (20 minutes)
  const expiryMinutes = parseInt(process.env.TEMPORARY_TOKEN_EXPIRY || "20", 10);
  const tokenExpiry = Date.now() + expiryMinutes * 60 * 1000;



  return { unHashedToken, hashedToken, tokenExpiry };
};



export const User = mongoose.model("User", userSchema)