import fastifyPlugin from "fastify-plugin";
import mongoose from "mongoose";
import { DB } from "../constants.js";



export default fastifyPlugin(async (fastify, opts) => {
    try {
        const connectionInstance =  await mongoose.connect(`${process.env.MONGODB_URI}/${DB.NAME}`);
        fastify.decorate("mongoose", mongoose);
        fastify.log.info(`MongoDB connected: ${connectionInstance.connection.host}`)
    } catch (err) {
        fastify.log.error(`MongoDB connection failed: ${err}`) 
        process.exit(1)
    }
});