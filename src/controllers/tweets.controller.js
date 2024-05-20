import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/Tweet.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body;

    if (!req.user?._id) throw new ApiError(402, "Unauthorized Access")
    if (!content.trim()) throw new ApiError(401, "Please fill the field Correctly")

    const createTweet = await Tweet.create({
        content: content,
        owner: req.user?._id
    })

    return res.status(200)
        .json(new ApiResponse(200, createTweet, "Tweet Successfully Created"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const userId = req.user?._id;

    if (!userId) throw new ApiError(402, "Unauthorized Access")

    const userTweet = await Tweet.aggregate([
        {
            $match: {
                owner: ObjectId('66406018c4794d848647c4ba')
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            avatar: 1,
                            username: 1,
                            email: 1,
                            fullName: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: 'likes'
            }
        },
        {
            $addFields: {
                owner: { $first: "$owner" }
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ])

    if(!userTweet) throw new ApiError(401, "No Tweet Found")

    return res.status(200)
    .json(new ApiResponse(200, userTweet, "Fetched All User Tweets"))

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params;
    const {content} = req.body;

    if(!req.user?._id) throw new ApiError(402, "Unathorized Access")
    if(!tweetId && isValidObjectId(tweetId)) throw new ApiError(401, "Invalid Tweet Id")
    if(!content.trim()) throw new ApiError(401, "Field is Empty") 

    try {
        const findTweet = await Tweet.findById(tweetId)
    
        if(!findTweet) throw new ApiError(401, "No Such Tweet")
        
        const updateTweet = await Tweet.findByIdAndUpdate(tweetId, {
            $set:{
                content: content || findTweet.content
            }
        }, {new: true})
    
        if(!updateTweet) throw new ApiError(401, "Something Went Wrong, While updating the tweet")
    
        return res.status(200)
        .json(new ApiResponse(200, updateTweet, "Tweet Updated Successfully"))
    } catch (error) {
        console.log(error.message)
    }
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params;

    if(!req.user._id) throw new ApiError(402, "Unathorized Access")
    
    if(!tweetId && isValidObjectId(tweetId)) throw new ApiError(401, "Invalid Tweet Id")

    const deleteTweet = await Tweet.findByIdAndUpdate(tweetId)

    if(!deleteTweet) throw new ApiError(401, "Something went wrong, while deleting the tweet")

    return res.status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted Successfully"))
}) 


export { createTweet, getUserTweets, updateTweet, deleteTweet }