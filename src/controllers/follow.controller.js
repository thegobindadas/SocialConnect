import { User } from "../models/user.model.js";
import { Follow } from "../models/follow.model.js";



export const followUnFollowUser = async (request, reply) => {
    try {

        const userId = request.user._id

        if (!userId) {
            return reply.unauthorized("Unauthorized to follow/unfollow a user")
        }


        const { followingId } = request.params

        if (!followingId) {
            return reply.badRequest("Following id is required")
        }


        const toBeFollowed = await User.findById(followingId)

        if (!toBeFollowed) {
            return reply.notFound("User not found")
        }


        if (toBeFollowed._id.toString() === userId.toString()) {
            return reply.badRequest("You cannot follow yourself")
        }


        const isAlreadyFollowing = await Follow.findOne({
            followerId: userId,
            followingId: toBeFollowed._id
        })


        if (isAlreadyFollowing) {
            
            const unfollow = await Follow.deleteOne({
                followerId: userId,
                followingId: toBeFollowed._id
            })

            if (!unfollow) {
                return reply.badRequest("Failed to unfollow user")
            }


            return reply.send({
                following: false,
                message: "Unfollowed successfully",
                sucess: true
            })

        } else {

            const follow = await Follow.create({
                followerId: userId,
                followingId: toBeFollowed._id
            })

            if (!follow) {
                return reply.badRequest("Failed to follow user")
            }
                

            return reply.send({
                following: true,
                message: "followed successfully",
                sucess: true
            })
        }

    } catch (error) {
        return reply.createError(500, error.message)
    }
}


export const getUserFollowers = async (request, reply) => {
    try {
        
        const { username } = request.params
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 10;


        const user = await User.findOne({ username }).select("_id");

        if (!user) {
            return reply.notFound("User not found")
        }


        const followers = await Follow.find({ followingId: user._id })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate("followerId", "firstName lastName username profilePic");

        const totalFollowers = await Follow.countDocuments({ followingId: user._id });


        if (followers.length === 0 && totalFollowers === 0) {
            return reply.send({
                data: {
                    followers: [],
                    totalFollowers,
                },
                message: "No followers found",
                sucess: true
            })
        }



        return reply.send({
            data: {
                followers: followers.map(f => f.followerId),
                totalFollowers,
                currentPage: page,
                totalPages: Math.ceil(totalFollowers / limit),
            },
            message: "Followers fetched successfully",
            sucess: true
        })
        
    } catch (error) {
        return reply.createError(500, error.message)
    }
}


export const getUserFollowings = async (request, reply) => {
    try {

        const { username } = request.params;
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 10;


        const user = await User.findOne({ username }).select("_id");

        if (!user) return reply.notFound("User not found.");


        const followings = await Follow.find({ followerId: user._id })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate("followingId", "firstName lastName username profilePic");

        const totalFollowings = await Follow.countDocuments({ followerId: user._id });


        if (followings.length === 0 && totalFollowings === 0) {
            return reply.send({
                data: {
                    followings: [],
                    totalFollowings,
                },
                message: "No followings found",
                sucess: true
            })
        }



        return reply.send({
            data: {
                followings: followings.map(f => f.followingId),
                totalFollowings,
                currentPage: page,
                totalPages: Math.ceil(totalFollowings / limit),
            },
            message: "Followings fetched successfully",
            sucess: true
        });
        
    } catch (error) {
        return reply.createError(500, error.message)
    }
}