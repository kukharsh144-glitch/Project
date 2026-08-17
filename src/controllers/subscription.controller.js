import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

// = = = = = = == toggle the subscription of a user to a channel == = = = =  == 
const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId")
    }

    const subscriberId = req.user._id
    if(!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriberId")
    }

    if(channelId === subscriberId.toString()) {
        throw new ApiError(400, "You cannot subscribe to yourself")
    }

    const existingSubscription = await Subscription.findOne({subscriber: subscriberId, channel: channelId})
    if(existingSubscription) {
        await existingSubscription.remove()
        return res.status(200).json(new ApiResponse(true, "Unsubscribed successfully"))
    }

    const newSubscription = new Subscription({
        subscriber: subscriberId,
        channel: channelId
    })
    await newSubscription.save()
    return res.status(200).json(new ApiResponse(true, "Subscribed successfully"))
 
})

//== = = = =  controller to return subscriber list of a channel = == = = = = = 
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId")
    }

    const existingSubscriptions = await Subscription.find({channel: channelId}).populate("subscriber", "username fullName avatar")
    return res.status(200).json(new ApiResponse(true, "Subscriber list fetched successfully", existingSubscriptions))

})

// ====  == controller to return channel list to which user has subscribed === = = = = 
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if(!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriberId")
    }

    const existingSubscriptions = await Subscription.find({subscriber: subscriberId}).populate("channel", "username fullName avatar")
    return res.status(200).json(new ApiResponse(true, "Subscribed channels fetched successfully", existingSubscriptions))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}