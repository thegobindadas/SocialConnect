import { 
    registerUser,
    loginUser,
    resendEmailVerification,
    verifyEmail,
    logoutUser,
    updateCurrentPassword,
    updateUserProfilePic,
    getCurrentUser,
    updateUserProfile,
    refreshAccessToken,
    getUserProfile,
} from "../controllers/user.controller.js";




export default async function (fastify, opts) {

    fastify.post("/register", registerUser);

    fastify.post("/login", loginUser);

    fastify.post("/resend-email-verification", {preHandler: [fastify.authenticate]}, resendEmailVerification);

    fastify.post("/verify-email/:verificationToken", verifyEmail);

    fastify.post("/logout", {preHandler: [fastify.authenticate]}, logoutUser);

    fastify.post("/update/password", {preHandler: [fastify.authenticate]}, updateCurrentPassword);

    fastify.post("/update/profile-pic", {preHandler: [fastify.authenticate]}, updateUserProfilePic);

    fastify.get("/me", {preHandler: [fastify.authenticate]}, getCurrentUser);

    fastify.post("/update/profile", {preHandler: [fastify.authenticate]}, updateUserProfile);

    fastify.post("/refresh", {preHandler: [fastify.authenticate]}, refreshAccessToken);

    fastify.get("/:username/profile", getUserProfile);
}