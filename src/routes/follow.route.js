import {
    followUnFollowUser,
    getUserFollowers,
    getUserFollowings,
} from "../controllers/follow.controller.js";





export default async function (fastify, opts) {

    fastify.register(async function (fastify) {

        fastify.addHook("preHandler", fastify.authenticate);



        fastify.post("/:followingId", followUnFollowUser);

        fastify.get("/users/:username/followers", getUserFollowers);
        
        fastify.get("/users/:username/followings", getUserFollowings);

    })
}