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
        let result;
        

        for await (const part of parts) {
            if (part.type = "field") {
                fields[part.fieldname] = part.value;
            }
        }

        if (!fields.firstName || !fields.lastName || !fields.email || !fields.username || !fields.password) {
            return reply.badRequest("All fields are required")
        }
        

        const exsistingUser = await User.findOne({ 
            $or: [{ email: fields.email }, { username: fields.username }] 
        })

        if (exsistingUser) {
            return reply.badRequest("User already exists" )
        }
console.log("hello 1")        

        for await (const part of parts) {
            
            if (part.file) {
                console.log(part) // logs the file object
                result = await uploadOnCloudinary(part, "folder");

                if (result) {
                    fields.profilePic = "none"
                }
            } else {
                return reply.badRequest("Profile photo is required")
            }
        }



        console.log("Fields : ", fields)
        console.log("photo : ", result)

        
        

        
        
        return reply.send({ message: "User registered successfully" })

    } catch (err) {
        console.log(err)
        return reply.internalServerError(err.message || "Error occurred while registering user")
    }
}