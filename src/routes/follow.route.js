import {
    followUnFollowUser,
    getUserFollowers,
    getUserFollowings,
} from "../controllers/follow.controller.js";





export default async function (fastify, opts) {

    fastify.register(async function (fastify) {

        fastify.addHook("preHandler", fastify.authenticate);



        fastify.post("/u/:followingId", followUnFollowUser);

        fastify.get("/u/:username/followers", getUserFollowers);
        
        fastify.get("/u/:username/followings", getUserFollowings);
    })
}