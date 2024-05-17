import mongoose, {isValidObjectId} from "mongoose"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Playlist } from "../models/Playlist.models.js"
import {Video} from "../models/Videos.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    //TODO: create playlist

    if(!req.user?._id){
        throw new ApiError(401, "User is not Logged In")
    }

    if(!(name && description)){
        throw new ApiError(401, "Fields are Empty")
    }

    const createPlaylist = await Playlist.create({
        name: name,
        description: description,
        owner: req.user?._id
    })

    return res.status(200)
    .json(new ApiResponse(200, createPlaylist, "New Playlist Created"))

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if(!mongoose.isValidObjectId(userId)){
        throw new ApiError(401, "Unauthorized Request")
    }

    const playlists = await Playlist.find({
        owner: mongoose.Types.ObjectId.createFromHexString(userId)
    })

    if(!playlists){
        throw new ApiError(401, "Playlists not found")
    }

    const userPlaylists = await Playlist.aggregate([
        {
            $match: {
                owner: mongoose.Types.ObjectId.createFromHexString(userId)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videosPlaylist",
                pipeline:[
                    {
                        $project: {
                            videoFile: 1,
                            thumbnail: 1,
                            title: 1,
                            description: 1,
                            duration: 1,
                            views: 1
                        }
                    }
                ]
            }
        },
        {
            $project:{
                name: 1,
                description: 1,
                videosPlaylist: 1
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        }
    ])

    if(userPlaylists.length < 0){
        throw new ApiError(401, "No Such Playlist Found")
    }


    return res.status(200)
    .json(new ApiResponse(200, userPlaylists, "All User Playlists Fetched"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!mongoose.isValidObjectId(playlistId)){
        throw new ApiError(401, "Invalid Playlist Id")
    }

    const getSpecificPlaylist = await Playlist.findById({
        _id: mongoose.Types.ObjectId.createFromHexString(playlistId)
    })

    if(!getSpecificPlaylist){
        throw new ApiError(401, "No Such PlayList")
    }

    const playlist = await Playlist.aggregate([
        {
            $match:{
                _id: mongoose.Types.ObjectId.createFromHexString(playlistId)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videoPlaylist",
                pipeline:[
                    {
                        $project: {
                            videoFile: 1,
                            thumbnail: 1,
                            title: 1,
                            description: 1,
                            duration: 1,
                            views: 1
                        }
                    }
                ]
            }
        },
        {
            $project:{
                name: 1,
                description: 1,
                videoPlaylist: 1
            }
        }
    ])

    if(playlist.length === 0){
        throw new ApiError(401, "No Such PlayList Found")
    }



    return res.status(200)
    .json(new ApiResponse(200, playlist[0], "Playlist fetched by Id"))

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    console.log(playlistId, videoId)

    if(!isValidObjectId(playlistId) && !isValidObjectId(videoId)){
        throw new ApiError(401, "Invalid playlistId and videoId")
    }

    if(!(playlistId.trim("") && videoId.trim(""))){
        throw new ApiError(401, "Invalid playlistId and videoId")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(401, "Video Not Found")
    }

    const playlist = await Playlist.findById(playlistId)

    if(playlist.videos.includes(mongoose.Types.ObjectId.createFromHexString(videoId))){
        throw new ApiError(401, "Video Is already Present in the Playlist")
    }

    const addVideo = await Playlist.findByIdAndUpdate(playlistId, {
        $push:{
            videos: mongoose.Types.ObjectId.createFromHexString(videoId)
        }
    }, {new: true})

    if(!addVideo){
        throw new ApiError(401, "Failed to add video to the playlist. Try Again")
    }

    const videoAdded = await Playlist.findById(playlistId).select("-owner")

    return res.status(200)
    .json(new ApiResponse(200, videoAdded, "Video added to the playlist Successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(!isValidObjectId(playlistId) && !isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid playlistId and videoId")
    }

    if(!(playlistId.trim() && videoId.trim())){
        throw new ApiError(401, "Invalid playlistId and videoId")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist.videos.includes(mongoose.Types.ObjectId.createFromHexString(videoId))){
        throw new ApiError(401, "Video doesn't exists in the playlist")
    }

    const removeVideoFromPlaylist = await Playlist.findByIdAndUpdate(playlistId, {
        $pull:{
            videos: mongoose.Types.ObjectId.createFromHexString(videoId)
        }
    }, {new: true})

    if(!removeVideoFromPlaylist){
        throw new ApiError(401, "Failed to remove the Video from the playlist. Try Again")
    }

    const videoRemoved = await Playlist.findById(playlistId).select("-owner")

    return res.status(200)
    .json(new ApiResponse(200, videoRemoved, "Video removed from the playlist successfully"))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!playlistId.trim() || !isValidObjectId(playlistId)){
        throw new ApiError(401, "Invalid Playlist Id")
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(401, "No Such Playlist")
    }

    const deletePlaylist = await Playlist.findByIdAndDelete(playlistId)

    if(!deletePlaylist){
        throw new ApiError(401, "Something Went Wrong, while deleting the playlist.")
    }

    return res.status(200)
    .json(new ApiResponse(200, deletePlaylist, "Playlist deleted Successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if(!playlistId.trim() || !isValidObjectId(playlistId)){
        throw new ApiError(401, "Invalid Playlist Id")
    }

    if(!(name || description)){
        throw new ApiResponse(200, "Please fill the fields")
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(401, "Playlist not found")
    }

    const updatePlaylist = await Playlist.findByIdAndUpdate(playlistId, {
        $set:{
            name: name || playlist.name,
            description: description || playlist.description
        }
    }, {new: true})

    return res.status(200)
    .json(new ApiResponse(200, updatePlaylist, "Playlist fields updated Successfully"))
})

export {createPlaylist, getUserPlaylists, getPlaylistById, addVideoToPlaylist, removeVideoFromPlaylist, deletePlaylist, updatePlaylist}