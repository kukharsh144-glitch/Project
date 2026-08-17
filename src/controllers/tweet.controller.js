import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body
    if(!content || content.trim() === ""){
        throw new ApiError(400, "Content is required")
    }

    const owner = req.user._id
    const tweet = await Tweet.create({
        content,
        owner
    })
    return res.status(201).json(new ApiResponse(201, tweet, "Tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id")
    }

    const pageNum = Math.max(parseInt(page, 10), 1)
    const limitNum = Math.max(parseInt(limit, 10), 1)
    const skip = (pageNum - 1) * limitNum

    const [tweets, totalTweets] = await Promise.all([
        Tweet.find({ owner: userId })
            .select("content owner createdAt updatedAt")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate("owner", "username email")
            .lean(),
        Tweet.countDocuments({ owner: userId })
    ])

    const totalPages = Math.ceil(totalTweets / limitNum)

    return res.status(200).json(
        new ApiResponse(200, {
            tweets,
            pagination: {
                currentPage: pageNum,
                limit: limitNum,
                totalTweets,
                totalPages,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        }, "User tweets fetched successfully")
    )
})


const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params
    const loggedInUserId = req.user._id

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id")
    }   
    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    if(tweet.owner.toString() === loggedInUserId.toString()) {

        const { content } = req.body
        if(!content || content.trim() === ""){
            throw new ApiError(400, "Content is required")
        }
        const updatedTweet = await Tweet.findByIdAndUpdate(
            tweetId,
            { content },
            { new: true }
        )
        return res
        .status(200)
        .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"))
    } else {
        throw new ApiError(403, "You are not allowed to update this tweet")
    }
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params
    const loggedInUserId = req.user._id 
    const tweet = await Tweet.findById(tweetId) 
    if(!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    if(tweet.owner.toString() === loggedInUserId.toString()) {
        await Tweet.findByIdAndDelete(tweetId)
        return res
        .status(200)
        .json(new ApiResponse(200, null, "Tweet deleted successfully"))
    } else {
        throw new ApiError(403, "You are not allowed to delete this tweet")
    }
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}