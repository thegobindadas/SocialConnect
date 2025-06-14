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



        reply
            .setCookie("accessToken", accessToken, {
                secure: false,
                httpOnly: true,
                maxAge: 60 * 60 * 24 * 1,
            })
            .setCookie("refreshToken", refreshToken, {
                //domain: 'your.domain',
                //path: '/',
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
                    profilePic: user.profilePic
                },
                accessToken,
                refreshToken,
                message: "User logged in successfully"
            })

    } catch (err) {
        console.log(err)
        return reply.internalServerError(err.message || "Error occurred while logging in user ")
    }
}


export const logoutUser = async (request, reply) => {
    try {
        
        

    } catch (err) {
        
    }
}


export const updateProfilePic = async (request, reply) => {
    try {
        
        

    } catch (err) {
        
    }
}


export const updateUser = async (request, reply) => {
    try {
        
        

    } catch (err) {
        
    }
}


export const updatePassword = async (request, reply) => {
    try {
        
        

    } catch (err) {
        
    }
}


export const forgotPassword = async (request, reply) => {
    try {
        
        

    } catch (err) {
        
    }
}


export const resetPassword = async (request, reply) => {
    try {
        
        

    } catch (err) {
        
    }
}


export const getUserProfile = async (request, reply) => {
    try {
        
        

    } catch (err) {
        
    }
}