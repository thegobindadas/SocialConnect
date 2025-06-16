


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