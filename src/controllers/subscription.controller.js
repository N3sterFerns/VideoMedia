import mongoose, {isValidObjectId} from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Subscription } from "../models/Subscriptions.models.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    // TODO: toggle subscription
    const {channelId} = req.params
    const userId = req.user?._id

    // Check if the channel Id is valid or not
    if(!mongoose.isValidObjectId(channelId)){
        throw new ApiError(401, "Channel Id is not Valid")
    }

    try {
        // check if the user is subscribed or nor
        const isSubscribed = await Subscription.findOne({
            subscriber: userId,
            channel: channelId,
        })
    
        if(isSubscribed){ // if already subscribed then delete the subscription document
            const unSubscribed = await Subscription.findOneAndDelete({
                subscriber: userId,
                channel: channelId
            })
            return res.status(200)
            .json(new ApiResponse(200, unSubscribed, "Unsubscribed Successfully"))
        }else{ // if not subscribed then create a new subscription document
            const subscribed = await Subscription.create({
                subscriber: userId,
                channel: channelId
            })
            return res.status(200)
            .json(new ApiResponse(200, subscribed, "Subscribed Successfully"))
        }
    } catch (error) {
        console.log(error)
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {subscriberId} = req.params;

    try {
        const channelSubscribers = await Subscription.find({channel: subscriberId}) // to fetch that how many user are subscribed to my channel using my channel Id.
    
        return res.status(200)
        .json(new ApiResponse(200, channelSubscribers, "Channel Subscribers are fetched"))
    } catch (error) {
        console.log(error)
    }

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params; // userId


    try {
        // const userSubscribedTo = await Subscription.find({subscriber: channelId}).populate("channel", "username avatar fullName")

        const subscribedToChannels = await Subscription.aggregate([
            {
                $match:{
                    subscriber: mongoose.Types.ObjectId.createFromHexString(channelId)
                }
            },
            {
                $lookup:{
                    from:"users",
                    localField: "channel",
                    foreignField: "_id",
                    as: "channel"
                }
            },
            {
               $unwind: { // the $lookup creates a array so we use $unwind to make it as an object
                path: "$channel"
               } 
            },
            {
                $project:{
                    subscriber: 1,
                    "channel._id": 1,
                    "channel.username": 1,
                    "channel.avatar": 1,
                    "channel.fullName": 1,
                }
            }
        ])


        return res.status(200)
        .json(new ApiResponse(200, subscribedToChannels, "Channel Subscribers are fetched"))
    } catch (error) {
        console.log(error)
    }
})




export {toggleSubscription, getUserChannelSubscribers, getSubscribedChannels}

