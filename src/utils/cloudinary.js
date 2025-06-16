// public_id: 'fastify-social/684efc6d38e4d7c4538b1ddb/@profile/daltfnnuvxajq4hqz9nh',
// folder: 'fastify-social/684efc6d38e4d7c4538b1ddb/@profile',


export const uploadOnCloudinary = async (fastify, part, folder) => {
    const result = await new Promise((resolve, reject) => {
        const uploadStream = fastify.cloudinary.uploader.upload_stream(
            { folder: folder, resource_type: "auto" },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        part.file.pipe(uploadStream);
    });


    return result
}


export const deleteFromCloudinary = async (fastify, publicId, resourceType = "image") => {
    try {

        const result = await fastify.cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType, // "image", "video", or "raw"
        });

        

        return result;

    } catch (error) {
        throw new Error(`Cloudinary deletion error: ${error.message}`);
    }
};