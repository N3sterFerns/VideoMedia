import mongoose, {isValidObjectId} from "mongoose"
import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import {Video} from "../models/Videos.models.js"
import { Comment } from "../models/Comment.models.js";

const getVideoComments = asyncHandler(async (req, res)=>{
    const {videoId} = req.params;
    let {page = 1, limit = 10} = req.query;

    if(isNaN(page) && isNaN(limit)) throw new ApiError(401, "Fill the page and limit correctly")

    // page = isNaN(page) ? 1 : Number(page);
    // limit = isNaN(page) ? 10 : Number(limit);
        
    if(page <= 0){
        page = 1
    }if(limit<=0){
        limit = 10
    }

    const options = {
        page: isNaN(page) ? 1 : Number(page),
        limit: isNaN(page) ? 10 : Number(limit)
    }
    
    if(!videoId && isValidObjectId(videoId)) throw new ApiError(401, "Invalid Video Id")
        
    const video = await Video.findById(videoId)
    if(!video) throw new ApiError(401, "Video not Found")
    
    const videoComments = [
        {
            $match:{
                video: mongoose.Types.ObjectId.createFromHexString(videoId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline:[
                    {
                        $project:{
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
           $lookup:{
            from: "likes",
            localField: "_id",
            foreignField: "comment",
            as: "likesCount"
           } 
        },
        {
            $addFields:{
                likesCount:{
                    $size: "$likesCount"
                }
            }
        },
        // {
        //     $skip: (page - 1)* limit
        // },
        // {
        //     $limit: limit
        // },
        {
            $project:{
                content: 1,
                createdAt: 1,
                owner: {$arrayElemAt: ["$owner", 0]},
                likesCount: 1
            }
        }
    ]
 

    const result = await Comment.aggregatePaginate(Comment.aggregate(videoComments), options)

    if(result.length == 0){
        throw new ApiError(401, "No comments for this video")
    }

    return res.status(200)
    .json(new ApiResponse(200, result, "Comments Fetched Successfully"))

})


const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params;
    const {content} = req.body;

    if(!videoId && !isValidObjectId(videoId)){
        throw new ApiError(401, "Invalid Video Id")
    }

    if(!req.user?._id){
        throw new ApiError("Unauthorized Request")
    }

    if(!content){
        throw new ApiError(401, "Field is Empty")
    }


    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(401, "No Such Video Found")
    }

    const createComment = await Comment.create({
        content: content,
        video: mongoose.Types.ObjectId.createFromHexString(videoId),
        owner: req.user?._id
    })
    
    if(!createComment){
        throw new ApiError(401, "Something went wrong, while creating a comment")
    }

    return res.status(200)
    .json(new ApiResponse(200, createComment, "Comment added Successfully"))
})

const updateComment = asyncHandler(async (req, res)=>{
    const {commentId} = req.params;
    const {content} = req.body;

    if(!commentId && !isValidObjectId(commentId)){
        throw new ApiError(401, "Invalid Comment Id")
    }

    const comment = await Comment.findById(commentId)
    if(!comment) throw new ApiError(401, "Comment Not Found")

    const updateComment = await Comment.findByIdAndUpdate(commentId, {
        $set:{
            content: content || comment.content
        }
    }, {new: true})

    if(!updateComment) throw new ApiError(401, "Something went wrong while updating the comment")

    return res.status(200)
    .json(new ApiResponse(200, updateComment, "Comment Updated Successfully"))
})


const deleteComment = asyncHandler(async (req, res)=>{
    const {commentId} = req.params;

    if(!commentId && !isValidObjectId(commentId)){
        throw new ApiError(401, "Invalid Comment Id")
    }

    const comment = await Comment.findById(commentId)
    if(!comment) throw new ApiError(401, "Comment Not Found")
    
    const deleteComment = await Comment.findByIdAndDelete(commentId)

    if(!deleteComment) throw new ApiError(401, "Something went wrong while deleting the comment")
    

    return res.status(200)
    .json(new ApiResponse(200, {}, "Comment deleted Successfully"))
})



export {getVideoComments, addComment, updateComment, deleteComment}


