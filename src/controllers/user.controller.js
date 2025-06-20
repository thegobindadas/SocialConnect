import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Post } from "../models/post.model.js";
import { Follow } from "../models/follow.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { CLOUD_FOLDERS } from "../constants.js";
import hashToken from "../utils/hashToken.js";



const generateAccessAndRefreshToken = async (reply, user) => {
    try {
        
        const accessToken = await reply.accessJwtSign(
            {
                _id: user._id,
                username: user.username,
                email: user.email
            }, 
            {
                secret: process.env.ACCESS_TOKEN_SECRET,
                expiresIn: "1d"
            }
        )

        const refreshToken = await reply.refreshJwtSign(
            {
                _id: user._id,
            }, 
            {
                secret: process.env.REFRESH_TOKEN_SECRET,
                expiresIn: "7d"
            }
        )



        return { accessToken, refreshToken }

    } catch (error) {
        return reply.createError(500, "Failed to generate access and refresh token")
    }
}



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


export const registerUser = async (request, reply) => {
    try {

        const parts = request.parts();
        let fields = {};
        let profilePic = {};
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


        const userId = new mongoose.Types.ObjectId().toHexString();
        const folder = `${CLOUD_FOLDERS.MAIN}/${userId}/@profile`;


        const uploadResult = await uploadOnCloudinary(request.server, filePart, folder);

        if (!uploadResult) {
            return reply.badRequest("Failed to upload profile picture");
        } else {
            profilePic["url"] = uploadResult.url
            profilePic["publicId"] = uploadResult.public_id
            profilePic["type"] = uploadResult.resource_type
        }


        const user = await User.create({
            _id: userId,
            firstName: fields.firstName,
            lastName: fields.lastName,
            email: fields.email,
            username: fields.username,
            profilePic: profilePic || null,
            password: fields.password,
        })

        if(!user) {
            return reply.badRequest("Failed to register user")
        }


        
        return reply.code(201).send({
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                username: user.username,
                profilePic: user.profilePic || null
            },
            message: "User registered successfully",
            success: true
        })

    } catch (err) {
        console.log(err)
        return reply.internalServerError(err.message || "Failed to register user")
    }
}


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


        // Generate JWT token
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(reply, user)


        user.refreshToken = hashToken(refreshToken)
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
                message: "User logged in successfully",
                success: true
            })

    } catch (err) {
        console.error(err)
        return reply.internalServerError(err.message || "Failed to login user")
    }
}


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
            .send(
                { 
                    message: "Logged out successfully",
                    success: true
                }
            );

    } catch (err) {
        return reply.createError(500, "Faild to logout user")
    }
}


export const updateCurrentPassword = async (request, reply) => {
    try {
        
        const userId = request.user._id
        const { password, newPassword, confirmNewPassword } = request.body

        if (!userId) {
            return reply.unauthorized("Unauthorized request")
        }

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
            message: "Password updated successfully",
            success: true
        })

    } catch (err) {
        return reply.createError(500, err.message || "Faild to update password")
    }
}


export const updateUserProfilePic = async (request, reply) => {
    try {
        
        const userId = request.user._id

        if (!userId) {
            return reply.unauthorized("Unauthorized request")
        }


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


        const user = await User.findById(userId)

        if (!user) {
            return reply.notFound("User not found")
        }


        let profilePic = {};

        const folder = `${CLOUD_FOLDERS.MAIN}/${userId}/@profile`;

        const uploadResult = await uploadOnCloudinary(request.server, filePart, folder);

        if (!uploadResult) {
            return reply.badRequest("Failed to upload profile picture");
        } else {
            profilePic["url"] = uploadResult.url
            profilePic["publicId"] = uploadResult.public_id
            profilePic["type"] = uploadResult.resource_type
        }


        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            {
                $set: {
                    profilePic: profilePic
                }
            }, 
            {
                new: true
            }
        )


        let deletePhotoResult;
        if (user.profilePic.publicId && user.profilePic.type) {
            deletePhotoResult = await deleteFromCloudinary(request.server, user.profilePic.publicId, user.profilePic.type)
        }

        if (deletePhotoResult.result !== "ok") {
            throw new Error(`Failed to delete previous profile picture from cloudinary: ${deletePhotoResult.result}`);
        }



        return reply.send({ 
            user: {
                _id: updatedUser._id,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                username: updatedUser.username,
                tagline: updatedUser.tagline  || null,
                bio: updatedUser.bio || null,
                profilePic: updatedUser.profilePic,
                portfolioUrl: updatedUser.portfolioUrl || null,
            },
            message: "Profile picture updated successfully",
            success: true
        })

    } catch (err) {
        reply.createError(500, err.message || "Faild to update profile picture")
    }
}


export const getCurrentUser = async (request, reply) => {
    try {

        const userId = request.user._id

        if (!userId) {
            return reply.unauthorized("Unauthorized request")
        }


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
            message: "User found successfully",
            success: true
        })

    } catch (err) {
        return reply.createError(500, err.message || "Failed to get user.")
    }
}


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
            message: "User updated successfully",
            success: true
        })

    } catch (err) {
        return reply.createError(500, err.message || "Failed to update user.")
    }
}


export const refreshAccessToken = async (request, reply) => {
    try {
        
        const incomingRefreshToken = request.cookies?.refreshToken || request.body?.refreshToken || request.header("Authorization")?.replace("Bearer ", "")

        if (!incomingRefreshToken) {
            return reply.unauthorized("Unauthorized request. Refresh token is required")
        }


        const decodedToken = await request.refreshJwtVerify(incomingRefreshToken)

        if (!decodedToken) {
            return reply.unauthorized("Invalid or expired refresh token. Please log in again.")
        }


        const user = await User.findById(decodedToken._id)

        if (!user) {
            return reply.notFound("No user found associated with the provided refresh token.")
        }


        if (user.refreshToken !== hashToken(incomingRefreshToken)) {
            return reply.unauthorized("Invalid or expired refresh token. Please log in again.")
        }


        // Generate JWT token
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(reply, user)


        user.refreshToken = hashToken(refreshToken)
        await user.save({ validateBeforeSave: false })



        reply
            .setCookie("accessToken", accessToken, {
                path: "/",
                secure: false,
                httpOnly: true,
                maxAge: 60 * 60 * 24 * 1,
            })
            .setCookie("refreshToken", refreshToken, {
                // domain: 'your.domain',
                // sameSite: true,
                path: "/",
                secure: false, // Set to true in production
                httpOnly: true,
                maxAge: 60 * 60 * 24 * 7,
            })
            .send({
                accessToken,
                refreshToken,
                message: "Access token refreshed successfully",
                success: true
            })

    } catch (error) {
        return reply.createError(500, error.message || "Failed to refresh access token")
    }
}



// Todo: testing required
export const getUserProfile = async (request, reply) => {
    try {
        
        const { username } = request.params

        if (!username) {
            return reply.badRequest("Username is required")
        }


        const user = await User.findOne({ username })
            .select("firstName lastName username tagline bio profilePic portfolioUrl")
            .lean();

        if (!user) {
            return reply.notFound("User not found")
        }


        // Count total posts by the user
        const [totalPosts, totalFollowers, totalFollowing] = await Promise.all([
            Post.countDocuments({ authorId: user._id }),
            Follow.countDocuments({ followingId: user._id }),
            Follow.countDocuments({ followerId: user._id }),
        ]);


        // Determine if this is the currently logged-in user's profile
        const loggedInUserId = request.user?._id || request.user?.id || null;

        const isThisMyProfile = loggedInUserId && new mongoose.Types.ObjectId(loggedInUserId).equals(user._id);

        

        return reply.send({
            data: {
                user,
                stats: {
                    totalPosts,
                    totalFollowers,
                    totalFollowing,
                },
                isThisMyProfile,
            },
            message: "User profile fetched successfully",
            success: true
        });

    } catch (err) {
        return reply.createError(500, err.message || "Failed to get user profile")
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