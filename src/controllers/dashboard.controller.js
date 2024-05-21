import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/Videos.models.js"




const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel status like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user?._id;

    if (!userId) return new ApiError(402, "Unauthorized Access")

    const channelStatus = Video.aggregate([
        {
            $match: {
                owner: ObjectId('66406018c4794d848647c4ba')
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "owner",
                foreignField: "likedBy",
                as: "totalLikes"
            }
        },
        {
            $addFields: {
                totalLikes: { $size: "$totalLikes" }
            }
        },
        {
            $group: {
                _id: null,
                totalVideos: {
                    $sum: 1
                },
                totalLikes: {
                    $sum: "$totalLikes"
                },
                totalViews: {
                    $sum: "$views"
                }
            }
        },
        {
            $addFields: {
                owner: ObjectId('66406018c4794d848647c4ba')
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "owner",
                foreignField: "channel",
                as: "totalSubscribers"
            }
        },
        {
            $addFields: {
                totalSubscribers: { $size: "$totalSubscribers" }
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
                            username: 1,
                            avatar: 1,
                            fullName: 1,
                        }
                    }
                ]
            }
        },
        {
            $unwind: {
                path: "$owner",
            }
        }


    ])

    if(!channelStatus) throw new ApiError(401, "Something went Wrong")

    return res.status(200)
    .json(new ApiResponse(200, channelStatus, "Channel Status Fetched Successfully"))

})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    let {limit=10, page=1, sortType, sortBy} = req.query;
    const userId = req.user?._id;
    if (!userId) return new ApiError(402, "Unauthorized Access")

    limit = isNaN(limit)? 10: Number(limit)
    page = isNaN(page) ? 1: Number(page)

    if(limit < 5){
        limit = 10
    }else if(page<1){
        page = 1
    }

    sortType = sortType.trim()?.toLowerCase()
    
    const sortStage = {};
    sortStage["$sort"] = {
        [sortBy]: sortType == "asc" ? 1: -1
    }

    const getUserVideos = await Video.aggregate([
        {
            $match:{
                owner: userId,
                isPublished: true
            }
        },
        {
            $project: {
                videoFile: 1,
                title: 1,
                description: 1,
                duration: 1,
                isPublished: 1
            }
        },
        sortStage,
        {
            $skip: (page - 1) * 10
        },
        {
            $limit: limit
        }
    ])

    return res.status(200)
    .json(new ApiResponse(200, getUserVideos, "All Videos fetched Successfully"))
})





export { getChannelStats, getChannelVideos }



