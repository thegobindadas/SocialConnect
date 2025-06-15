import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { CLOUD_FOLDERS } from "../constants.js";



/*
import path from "path";
import fs from "fs";
import { pipeline } from "stream";
import util from "util";
import { fileURLToPath } from "url";


export const registerUser = async (request, reply) => {
    try {
        
        // Define __dirname in ES module
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);


        const pipelineAsync = util.promisify(pipeline);

        const parts = request.parts();
        let fields = {};
        let filename;


        for await (const part of parts) {
            if (part.file) {
                //console.log(part)
                filename = `${Date.now()}-${part.filename}`;
                const saveTo = path.join(
                __dirname,
                "..",
                "..",
                "public",
                "temp",
                filename
                );
                await pipelineAsync(part.file, fs.createWriteStream(saveTo));
            } else {
                fields[part.fieldname] = part.value;
            }
        }

        

        return reply.send({ message: "User registered successfully" })

    } catch (err) {
        return reply.internalServerError({ message: err.message || "Error occurred while registering user" })
    }
}
*/



// Registers a new user
export const registerUser = async (request, reply) => {
    try {

        const parts = request.parts();
        let fields = {};
        let filePart = null;
        
        
        for await (const part of parts) {
            if (part.file) {
               
                filePart = part;
                break;

            } else {

                fields[part.fieldname] = part.value;
            }
        }


        // Validate required fields
        const requiredFields = ["firstName", "lastName", "email", "username", "password"];

        for (const field of requiredFields) {
            if (!fields[field]) {
                return reply.badRequest(`${field} is required`);
            }
        }
     

        const exsistingUser = await User.findOne({ 
            $or: [{ email: fields.email }, { username: fields.username }] 
        })

        if (exsistingUser) {
            return reply.badRequest("User already exists" )
        }
      

        if (!filePart) {
            return reply.badRequest("Profile picture is required");
        }

        if (!filePart.mimetype.includes("image")) {
            return reply.badRequest("Only image files are allowed");
        }


        const uploadResult = await uploadOnCloudinary(filePart, "fastify-social");

        if (!uploadResult) {
            return reply.badRequest("Failed to upload profile picture");
        } else {
            fields["profilePic"] = uploadResult.url
        }


        const user = await User.create(fields)

        if(!user) {
            return reply.badRequest("Failed to create user")
        }


        
        return reply.code(201).send({
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                username: user.username,
                profilePic: user.profilePic
            },
            message: "User registered successfully" 
        })

    } catch (err) {
        console.log(err)
        return reply.internalServerError(err.message || "Error occurred while registering user")
    }
}


// Login user
export const loginUser = async (request, reply) => {
    try {
        
        const { usernameOrEmail, password } = request.body;

        if (!usernameOrEmail) {
            return reply.badRequest("Email or username is required");
        }

        if (!password) {
            return reply.badRequest("Password is required");
        }


        const user = await User.findOne({
            $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }]
        })

        if (!user) {
            return reply.notFound("User not found");
        }


        const isPasswordValid = await user.isPasswordCorrect(password)

        if (!isPasswordValid) {
            return reply.unauthorized("Invalid password");
        }


        const accessToken = await reply.jwtSign({
            _id: user._id,
            username: user.username,
            email: user.email
        }, {expiresIn: "1d"})

        const refreshToken = await reply.jwtSign({
            _id: user._id,
        }, {expiresIn: "7d"})


        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })



        reply
            .setCookie("accessToken", accessToken, {
                path: "/",
                secure: false,
                httpOnly: true,
                maxAge: 60 * 60 * 24 * 1,
            })
            .setCookie("refreshToken", refreshToken, {
                //domain: 'your.domain',
                path: "/",
                secure: false, // Set to true in production
                httpOnly: true,
                //sameSite: true
                maxAge: 60 * 60 * 24 * 7,
            })
            .send({
                user: {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    username: user.username,
                    tagline: user.tagline  || null,
                    bio: user.bio || null,
                    profilePic: user.profilePic,
                    portfolioUrl: user.portfolioUrl || null,
                },
                accessToken,
                refreshToken,
                message: "User logged in successfully"
            })

    } catch (err) {
        console.error(err)
        return reply.internalServerError(err.message || "Error occurred while logging in user ")
    }
}


// Logout user
export const logoutUser = async (request, reply) => {
    try {
        
        const userId = request.user._id
        
        const user = await User.findByIdAndUpdate(
            userId, 
            {
                $unset: {
                    refreshToken: 1
                }
            },
            {
                new: true
            }
        )

        if (!user) {
            return reply.notFound("Failed to logout user")
        }



        reply
            .clearCookie("accessToken", {
                path: "/",
                secure: false,
                httpOnly: true,
            })
            .clearCookie("refreshToken", {
                path: "/",
                secure: false,
                httpOnly: true,
            })
            .send({ message: "Logged out successfully" });

    } catch (err) {
        return reply.createError(500, "Faild to logout user")
    }
}


// Update password
export const updateCurrentPassword = async (request, reply) => {
    try {
        
        const userId = request.user._id

        const { password, newPassword, confirmNewPassword } = request.body

        if (!password || !newPassword || !confirmNewPassword) {
            return reply.badRequest("All fields are required")
        }

        if (newPassword !== confirmNewPassword) {
            return reply.badRequest("New password and confirm new password do not match")
        }


        const user = await User.findById(userId)

        if (!user) {
            return reply.notFound("User not found")
        }


        const isPasswordValid = await user.isPasswordCorrect(password)

        if (!isPasswordValid) {
            return reply.unauthorized("Invalid password")
        }

        user.password = newPassword
        await user.save()



        return reply.send({ 
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                username: user.username,
                tagline: user.tagline  || null,
                bio: user.bio || null,
                profilePic: user.profilePic,
                portfolioUrl: user.portfolioUrl || null,
            },
            message: "Password updated successfully" 
        })

    } catch (err) {
        return reply.createError(500, "Faild to update password")
    }
}


// Updates the profile picture of a user
export const updateUserProfilePic = async (request, reply) => {
    try {
        
        const userId = request.user._id


        if (!request.isMultipart()) {
            return reply.badRequest("No file found");
        }


        const parts = request.parts?.();

        let filePart = null;

        for await (const part of parts) {
            
            if (part.file && part.mimetype.includes("image")) {
               
                filePart = part;
                break;
            } else {
                return reply.badRequest("No file found")
            }
        }


        if (!filePart) {
            return reply.badRequest("Profile picture is required");
        }

        if (!filePart.mimetype.includes("image")) {
            return reply.badRequest("Only image files are allowed");
        }



        const uploadResult = await uploadOnCloudinary(filePart, `fastify-social/${userId}/profile`);

        if (!uploadResult) {
            return reply.badRequest("Failed to upload profile picture");
        }


        const user = await User.findByIdAndUpdate(
            userId,
            {
                profilePic: uploadResult.url,
            },
            {
                new: true,
            }
        )

        if (!user) {
            return reply.notFound("User not found")
        }



        return reply.send({ 
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                username: user.username,
                tagline: user.tagline  || null,
                bio: user.bio || null,
                profilePic: user.profilePic,
                portfolioUrl: user.portfolioUrl || null,
            },
            message: "Profile picture updated successfully" 
        })

    } catch (err) {
        reply.createError(500, "Faild to update profile picture")
    }
}


// Returns the current user
export const getCurrentUser = async (request, reply) => {
    try {

        const userId = request.user._id


        const user = await User.findById(userId)

        if (!user) {
            return reply.notFound("User not found")
        }
        


        return reply.send({
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                username: user.username,
                tagline: user.tagline  || null,
                bio: user.bio || null,
                profilePic: user.profilePic,
                portfolioUrl: user.portfolioUrl || null,
            },
            message: "User found successfully"
        })

    } catch (err) {
        return reply.createError(500, "Failed to get user.")
    }
}


// Updates user information based on the provided request data. --> TODO
export const updateUserProfile = async (request, reply) => {
    try {
        
        const userId = request.user._id

        if (!userId) {
            return reply.unauthorized("Unauthorized to update profile")
        }


        const { firstName, lastName, username, tagline, bio, portfolioUrl } = request.body


        const user = await User.findById(userId)

        if (!user) {
            return reply.notFound("User not found")
        }


        if (firstName) {
            user.firstName = firstName
        }

        if (lastName) {
            user.lastName = lastName
        }

        if (tagline !== undefined) user.tagline = tagline;
        if (bio !== undefined) user.bio = bio;
        if (portfolioUrl !== undefined) user.portfolioUrl = portfolioUrl;


        if (username && username !== user.username) {

            const existingUser = await User.findOne({ username })

            if (existingUser && existingUser._id.toString() !== userId) {
                return reply.badRequest("Username already exists")
            }
            
            user.username = username
        }


        await user.save()



        return reply.send({
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                username: user.username,
                tagline: user.tagline  || null,
                bio: user.bio || null,
                profilePic: user.profilePic,
                portfolioUrl: user.portfolioUrl || null,
            },
            message: "User updated successfully"
        })

    } catch (err) {
        return reply.createError(500, "Failed to update user.")
    }
}

















export const verifyEmail = async (request, reply) => {

}

export const resendEmailVerification = async (request, reply) => {

}



export const forgotPasswordRequest = async (request, reply) => {

}

export const resetForgottenPassword = async (request, reply) => {

}


export const refreshAccessToken = async (request, reply) => {

}


export const getUserProfile = async (request, reply) => {
    try {
        
        

    } catch (err) {
        
    }
}