import { fastify } from "../app.js";
import stream from "stream";
import util from "util";


const pipeline = util.promisify(stream.pipeline);



export const uploadOnCloudinary = async (part, folder) => {
    const result = await new Promise((resolve, reject) => {
        const uploadStream = fastify.cloudinary.uploader.upload_stream(
            { folder: "fastify-social", resource_type: "auto" },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        part.file.pipe(uploadStream);
    });


    return result
}