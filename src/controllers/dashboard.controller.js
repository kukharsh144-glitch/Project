import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const channelId = req.user?._id
    if (!channelId) {
        throw new ApiError(401, "User must be logged in to view channel stats")
    }

    const videoStats = await Video.aggregate([       // Total videos + total views for this channel
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$views" }
            }
        }
    ])

    const totalSubscribers = await Subscription.countDocuments({  // Total subscribers for this channel
        channel: channelId
    })

    const likeStats = await Video.aggregate([   // Total likes across all videos owned by this channel
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $group: {
                _id: null,
                totalLikes: { $sum: { $size: "$likes" } }
            }
        }
    ])

    const stats = {
        totalVideos: videoStats[0]?.totalVideos || 0,
        totalViews: videoStats[0]?.totalViews || 0,
        totalSubscribers,
        totalLikes: likeStats[0]?.totalLikes || 0
    }

    return res
        .status(200)
        .json(new ApiResponse(200, stats, "Channel stats fetched successfully"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    const channelId = req.user?._id
    if (!channelId) {
        throw new ApiError(401, "User must be logged in to view channel videos")
    }

    const { page = 1, limit = 10 } = req.query
    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)

    const videos = await Video.find({ owner: channelId })
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)

    const totalVideos = await Video.countDocuments({ owner: channelId })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    videos,
                    totalVideos,
                    totalPages: Math.ceil(totalVideos / limitNum),
                    currentPage: pageNum
                },
                "Channel videos fetched successfully"
            )
        )
})

export {
    getChannelStats, 
    getChannelVideos
    }