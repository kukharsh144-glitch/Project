import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {apiError } from "../utils/apiError.js"
import {apiResponse } from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new apiError(400, "Invalid videoId")
    }
    
    const userId = req.user._id
    if (!userId) {
        throw new apiError(401, "User must be logged in to like a video")
    }

    // try to remove an existing like first
    const existingLike = await Like.findOneAndDelete({
        video: videoId,
        likedBy: userId,
        isDislike: false
    })

    if (existingLike) {
        return res
            .status(200)
            .json(new apiResponse(200, { liked: false }, "Video unliked successfully"))
    }

    // remove existing dislike if present
    await Like.findOneAndDelete({
        video: videoId,
        likedBy: userId,
        isDislike: true
    })

    // create new like
    const newLike = await Like.create({ video: videoId, likedBy: userId, isDislike: false })

    return res
        .status(201)
        .json(new apiResponse(201, { liked: true, like: newLike }, "Video liked successfully"))
})

const toggleVideoDislike = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new apiError(400, "Invalid videoId")
    }
    
    const userId = req.user._id
    if (!userId) {
        throw new apiError(401, "User must be logged in to dislike a video")
    }

    // try to remove an existing dislike first
    const existingDislike = await Like.findOneAndDelete({
        video: videoId,
        likedBy: userId,
        isDislike: true
    })

    if (existingDislike) {
        return res
            .status(200)
            .json(new apiResponse(200, { disliked: false }, "Video undisliked successfully"))
    }

    // remove existing like if present
    await Like.findOneAndDelete({
        video: videoId,
        likedBy: userId,
        isDislike: false
    })

    // create new dislike
    const newDislike = await Like.create({ video: videoId, likedBy: userId, isDislike: true })

    return res
        .status(201)
        .json(new apiResponse(201, { disliked: true, dislike: newDislike }, "Video disliked successfully"))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if (!isValidObjectId(commentId)) {
        throw new apiError(400, "Invalid commentId")
    }   
    
    const userId = req.user._id
    if(!userId) {
        throw new apiError(401, "User must be logged in to like a comment")
    }

    const existingLike = await Like.findOneAndDelete({
        comment: commentId,
        likedBy: userId
    })  

    if (existingLike) {
        return res
            .status(200)
            .json(new apiResponse(200, { liked: false }, "Comment unliked successfully"))
    }

    const newLike = await Like.create({ comment: commentId, likedBy: userId })

    return res
        .status(201)
        .json(new apiResponse(201, { liked: true, like: newLike }, "Comment liked successfully"))

    //TODO: toggle like on comment

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if (!isValidObjectId(tweetId)) {
        throw new apiError(400, "Invalid tweetId")
    }
    const userId = req.user._id
    if(!userId) {
        throw new apiError(401, "User must be logged in to like a tweet")
    }

    const existingLike = await Like.findOneAndDelete({
        tweet: tweetId,
        likedBy: userId
    })

    if (existingLike) {
        return res
            .status(200)
            .json(new apiResponse(200, { liked: false }, "Tweet unliked successfully"))
    }

    const newLike = await Like.create({ tweet: tweetId, likedBy: userId })

    return res
        .status(201)
        .json(new apiResponse(201, { liked: true, like: newLike }, "Tweet liked successfully"))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    if (!req.user?._id) {
        throw new apiError(401, "User must be logged in to get liked videos")
    }
    const userId = req.user._id

    const { page = 1, limit = 10 } = req.query
    const pageNum = Math.max(parseInt(page, 10), 1)
    const limitNum = Math.max(parseInt(limit, 10), 1)
    const skip = (pageNum - 1) * limitNum

    const [likedVideos, totalLikedVideos] = await Promise.all([
        Like.find({ likedBy: userId, video: { $exists: true } })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate({
                path: "video",
                select: "title thumbnail duration views createdAt owner",
                populate: {
                    path: "owner",
                    select: "userName fullName avatar email"
                }
            })
            .lean(),
        Like.countDocuments({ likedBy: userId, video: { $exists: true } })
    ])

    const totalPages = Math.ceil(totalLikedVideos / limitNum)

    return res.status(200).json(
        new apiResponse(200, {
            likedVideos,
            pagination: {
                currentPage: pageNum,
                limit: limitNum,
                totalLikedVideos,
                totalPages,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        }, "Liked videos retrieved successfully")
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    toggleVideoDislike,
    getLikedVideos
}