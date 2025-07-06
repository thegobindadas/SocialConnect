import { 
    registerUser,
    loginUser,
    logoutUser,
    updateCurrentPassword,
    forgotPasswordRequest,
    resetForgottenPassword,
    updateUserProfilePic,
    getCurrentUser,
    updateUserProfile,
    refreshAccessToken,
    getUserProfile,
    searchUsers,
} from "../controllers/user.controller.js";





export default async function (fastify, opts) {

    fastify.post("/register", registerUser);

    fastify.post("/login", loginUser);

    fastify.post("/logout", {preHandler: [fastify.authenticate]}, logoutUser);

    fastify.post("/refresh-token", {preHandler: [fastify.authenticate]}, refreshAccessToken);

    fastify.post("/forgot-password", forgotPasswordRequest);

    fastify.post("/reset-password/:resetToken", resetForgottenPassword);

    fastify.patch("/update/password", {preHandler: [fastify.authenticate]}, updateCurrentPassword);

    fastify.patch("/update/profile-pic", {preHandler: [fastify.authenticate]}, updateUserProfilePic);

    fastify.get("/me", {preHandler: [fastify.authenticate]}, getCurrentUser);

    fastify.patch("/update/profile", {preHandler: [fastify.authenticate]}, updateUserProfile);

    fastify.get("/:username/profile", {preHandler: [fastify.authenticate]}, getUserProfile);

    fastify.get("/search", searchUsers);
}