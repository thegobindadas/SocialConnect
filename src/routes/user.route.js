import { 
    registerUser,
    loginUser,
    logoutUser,
    updateCurrentPassword,
    updateUserProfilePic,
    getCurrentUser,
} from "../controllers/user.controller.js";




export default async function (fastify, opts) {

    fastify.post("/register", registerUser);

    fastify.post("/login", loginUser);

    fastify.post("/logout", {preHandler: [fastify.authenticate]}, logoutUser);

    fastify.post("/update/password", {preHandler: [fastify.authenticate]}, updateCurrentPassword);

    fastify.post("/update/profile-pic", {preHandler: [fastify.authenticate]}, updateUserProfilePic);

    fastify.get("/me", {preHandler: [fastify.authenticate]}, getCurrentUser);

}