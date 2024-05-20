import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/Likes.models.js"
import {Comment} from "../models/Comment.models.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {Video} from "../models/Videos.models.js"
import { Tweet } from "../models/Tweet.models.js"


const toggleVideoLike = asyncHandler(async (req, res)=>{
    //TODO: toggle like on video
    const {videoId} = req.params;

    if(!videoId && !isValidObjectId(videoId)){
        throw new ApiError(401, "Invalid Video Id")
    }
    
    const video = await Video.findById(videoId)
    if(!video) throw new ApiError(401, "Video Not Found")

    if(!req.user?._id) throw new ApiError(401, "Unathorized Access")

    // check if video already liked or not
    const videoAlreadyLiked = await Like.findOne(
        {video: mongoose.Types.ObjectId.createFromHexString(videoId)},
        {likedBy: req.user?._id}
    )

    if(!videoAlreadyLiked){
        const likeVideo = await Like.create({
            video: mongoose.Types.ObjectId.createFromHexString(videoId),
            likedBy: req.user?._id
        })

        if(!likeVideo) throw new ApiError(402, "Something went Wrong, Try Again")
            
        return res.status(200)
        .json(new ApiResponse(200, likeVideo, "Video Liked Successfully"))
    }else{
        const unlikeVideo = await Like.findByIdAndDelete(videoAlreadyLiked?._id)
        if(!unlikeVideo) throw new ApiError(402, "Something went Wrong, Try Again")

        return res.status(200)
        .json(new ApiResponse(200, {}, "Video Unliked Successfully"))
    }
})


const toggleCommentLikes = asyncHandler(async (req, res)=>{
    //TODO: toggle like on comment
    const {commentId} = req.params;

    if(!req.user?._id) throw new ApiError(401, "Unauthorized Access")

    if(!commentId && isValidObjectId(commentId)){
        throw new ApiError(401, "Invalid Comment Id")
    }

    // To check if the comment exists

    const comment = await Comment.findById(commentId)

    if(!comment) throw new ApiError(401, "Comment not Found")

    // To check if the comment is already liked

    const likeComment = await Like.findOne(
        {comment: mongoose.Types.ObjectId.createFromHexString(commentId)},
        {likedBy: req.user?._id}
    )

    if(likeComment){
        await Like.findByIdAndDelete(likeComment._id)
        return res.status(200)
        .json(new ApiResponse(200, {}, "Unliked Commment Successfully"))
    }else{
        const likedComment = await Like.create({
            comment: commentId,
            likedBy: req.user?._id
        })
        .json(new ApiResponse(200, likedComment, "Unliked Commment Successfully"))
    }
})

const toggleTweetLike = asyncHandler(async (req, res)=>{
    //TODO: toggle like on tweet
    const {tweetId} = req.params;

    if(!req.user?._id) throw new ApiError(402, "Unauthorized Access")
    
    if(!tweetId && !isValidObjectId(tweetId)) throw new ApiError(401, "Invalid Tweet Id")

    const tweet = await Tweet.findById(tweetId)

    if(!tweet) throw new ApiError(401, "No Tweet found")
    
    const likeTweet = await Like.findOne(
        {tweet: mongoose.Types.ObjectId.createFromHexString(tweetId)},
        {likedBy: req.user?._id}
    )

    if(likeTweet){
        await Like.findByIdAndDelete(likeTweet?._id)
        return res.status(200)
        .json(new ApiResponse(200, {}, "Unliked Tweet Successfully"))
    }else{
        const likedTweet = await Like.create({
            tweet: mongoose.Types.ObjectId.createFromHexString(tweetId),
            likedBy: req.user?._id
        })
        return res.status(200)
        .json(new ApiResponse(200, likedTweet, "Liked Tweet Successfully"))
    }
})

const getLikedVideos = asyncHandler(async (req, res)=>{
    //TODO: get all liked videos
    const userId = req.user?._id;

    if(!userId) throw new ApiError(401, "Unauthorized Access")
    
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: userId
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideosList",
                pipeline:[
                    {
                        $project: {
                            videoFile: 1,
                            thumbnail: 1,
                            title: 1,
                            description: 1,
                            duaration: 1,
                            views: 1
                        }
                    }
                ]
            }
        },
        {
            $project:{
                likedVideosList: 1
            }
        }
    ])


    if(!likedVideos) throw new ApiError(401, "Something Went Wrong")

    return res.status(200)
    .json(new ApiResponse(200, likedVideos, "All Liked Videos fetched Successfully"))

})



export {toggleVideoLike, toggleCommentLikes, toggleTweetLike, getLikedVideos}








