import { 
    registerUser,
    loginUser,
    logoutUser,
    updatePassword,
} from "../controllers/user.controller.js";




export default async function (fastify, opts) {

    fastify.post("/register", registerUser);

    fastify.post("/login", loginUser);

    fastify.post("/logout", {preHandler: [fastify.authenticate]}, logoutUser);

    fastify.post("/update/password", {preHandler: [fastify.authenticate]}, updatePassword);

}