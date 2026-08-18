import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {apiError} from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

// = = = = = = == toggle the subscription of a user to a channel == = = = =  == 
const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!isValidObjectId(channelId)) {
        throw new apiError(400, "Invalid channelId")
    }

    const subscriberId = req.user._id
    if(!isValidObjectId(subscriberId)) {
        throw new apiError(400, "Invalid subscriberId")
    }

    if(channelId === subscriberId.toString()) {
        throw new apiError(400, "You cannot subscribe to yourself")
    }

    const existingSubscription = await Subscription.findOne({subscriber: subscriberId, channel: channelId})
    if(existingSubscription) {
        await existingSubscription.deleteOne()
        return res.status(200).json(new apiResponse(200, {}, "Unsubscribed successfully"))
    }

    const newSubscription = new Subscription({
        subscriber: subscriberId,
        channel: channelId
    })
    await newSubscription.save()
    return res.status(200).json(new apiResponse(200, {}, "Subscribed successfully"))
 
})

//== = = = =  controller to return subscriber list of a channel = == = = = = = 
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!isValidObjectId(channelId)) {
        throw new apiError(400, "Invalid channelId")
    }

    const existingSubscriptions = await Subscription.find({channel: channelId}).populate("subscriber", "userName fullName avatar")
    return res.status(200).json(new apiResponse(200, existingSubscriptions, "Subscriber list fetched successfully"))

})

// ====  == controller to return channel list to which user has subscribed === = = = = 
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if(!isValidObjectId(subscriberId)) {
        throw new apiError(400, "Invalid subscriberId")
    }

    const existingSubscriptions = await Subscription.find({subscriber: subscriberId}).populate("channel", "userName fullName avatar")
    return res.status(200).json(new apiResponse(200, existingSubscriptions, "Subscribed channels fetched successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}