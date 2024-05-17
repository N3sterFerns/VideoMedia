import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/users.models.js"
import {upload} from "../middlewares/multer.middleware.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {uploadToCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"


// Register Controller
const register = asyncHandler(async (req, res)=>{
    // get input data like (username, email etc.)
    const {username, fullName, email, password} = req.body;

    // check if the fields are empty
    const emptyField = [username, fullName, email, password].some((field)=> field.trim() === "")
    if(emptyField){
        throw new ApiError(401, "Input's are Empty")
    }
    
    // check if user already exists (username, email)

    const Existuser = await User.findOne({
        $or:[
            {username: username},
            {email: email}
        ]
    })

    if(Existuser){
        throw new ApiError(401, "User Already Exists")
    }

    // check for avatar/coverImage image files
    const localAvatarImage = req.files?.avatar[0]?.path;
    
    if(!localAvatarImage){
        throw new ApiError(401, "Avatar is required")
    }
    
    let localCoverImage;
    if(req.files.coverImage && Array.isArray(req.files.coverImage) && req.files.coverImage[0].path){
        localCoverImage = req.files?.coverImage[0]?.path;
    }


    // upload images to cloudinary
    const avatar = await uploadToCloudinary(localAvatarImage)
    const coverImage = await uploadToCloudinary(localCoverImage)

    if(!avatar){
        throw new ApiError(401, "Avatar is Required")
    }

    // then create a user Object and save to database

    const user = await User.create({
        username: username.toLowerCase().replace(/\s/g, ""),
        email: email,
        fullName: fullName,
        password: password,
        avatar: avatar?.url,
        coverImage: coverImage?.url || "",
    })

    const userCreated = await User.findById(user._id).select("-password -refreshToken")

    if(!userCreated){
        throw new ApiError(500, "Something went wrong while registering")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, userCreated, "User Successfully Registered"))
}) 

// Login In Controller

const generateAccessRefreshToken = async (userId)=>{
    try {
        const user = await User.findById(userId);
        // console.log(user)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false})
        return {accessToken, refreshToken}
    } catch (error) {
        console.log(error)
    }
}

const login = asyncHandler(async (req, res)=>{
    // take username, email, password
    const {username, email, password} = req.body;
    // check if user is exist either from username or email in the DB
    const user = await User.findOne({
        $or:[
            {
                username: username
            },
            {
                email: email
            }
        ]
    })

    if(!user){
        throw new ApiError(401, "User Don't Exists")
    }

    // compare user password with db password
    const correctPassword = await user.isPasswordCorrect(password)

    if(!correctPassword){
        throw new ApiError(401, "Password is Incorrect. Try Again")
    }
    // create Access Token and Refresh Token. Create an external function.
    const {accessToken, refreshToken} = await generateAccessRefreshToken(user._id)

    // remove password and refresh token for the loggedInUser
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // send cookies in the response
    let options = {
        httpOnly: true,
        secure: true
    }

    // console.log(req.headers)
    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, {user: loggedInUser, accessToken, refreshToken}, "User Successfully LoggedIn"))
})

// Logout Controller
const logout = asyncHandler(async (req, res)=>{
    // take the user id from the cookie
    const userId = req.user?._id;
    // then try to make the refreshToken to empty string
    await User.findByIdAndUpdate(userId, {
        $unset:{
            refreshToken: ""
        }
    }, {new: true})

    // then clear all the cookies and send the response
    let options = {
        secure: true,
        httpOnly: true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Logged Out Successfully"))
})

// New Refresh and Access Token Controller

const refreshAccessToken = asyncHandler(async (req, res)=>{
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized Request")
    }

    try {
        const decodeRefreshToken = await jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN)
    
        const user = await User.findById(decodeRefreshToken._id)
    
        if(!user){
            throw new ApiError(401, "Invalid Refresh Token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "RefreshToken Expired or already used")
        }

        const {accessToken, refreshToken} = generateAccessRefreshToken(user._id)

        return res.status(200)
        .cookie("accessToken", accessToken)
        .cookie("refreshToken", refreshToken)
        .json(new ApiResponse(200, {accessToken, refreshToken: refreshToken}, "Access Token Refreshed Successfully"))

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
    }
})


// update Avatar Image

const updateUserAvatar = asyncHandler(async (req, res)=>{
    // get the user id 
    const userId = req.user?._id

    // get the req avatar file uploaded by user
    let localAvatarImg = req.file?.path;

    if(!localAvatarImg){
        throw new ApiError(401, "Something went wrong. Try to upload the image again.")
    }

    // upload it to cloudinary
    const avatar = await uploadToCloudinary(localAvatarImg);

    const updateUser = await User.findByIdAndUpdate(userId, {
        $set:{
            avatar: avatar?.url
        }
    })

    await deleteFromCloudinary(updateUser.avatar)

    await updateUser.save({validateBeforeSave: false})

    const userResponse = await User.findById(userId).select("-password -refreshToken")

    return res.status(200)
    .json(new ApiResponse(200, {userResponse}, "Avatar Image Successfully Updated"))
})


// update CoverImage Image

const updateCoverImage = asyncHandler(async (req, res)=>{
    const userId = req.user._id;
    
    const localCoverImage = req.file?.path;

    if(!localCoverImage){
        throw new ApiError(401, "Something went wrong, Try to upload again")
    }

    const user = await User.findById(userId)

    if(user.coverImage === ""){ // if coverImage is an empty string or you are uploading it for the first time
        const coverImage = await uploadToCloudinary(localCoverImage)
        const updateUserCoverImage = await User.findByIdAndUpdate(userId, {
            $set:{
                coverImage: coverImage?.url
            }
        }, {new: true}).select("-password -refreshToken")
        return res.status(200)
        .json(new ApiResponse(200, {updateUserCoverImage}, "CoverImage Added SuccessFully"))
    }else{ // if coverImage is not an empty string and the image url already exists 
        const coverImage = await uploadToCloudinary(localCoverImage)
        const updateUserCoverImage = await User.findByIdAndUpdate(userId, {
            $set:{
                coverImage: coverImage?.url
            }
        }).select("-password -refreshToken")

        await deleteFromCloudinary(updateUserCoverImage.coverImage)
        await updateUserCoverImage.save({validateBeforeSave: false})
        const userResponse = await User.findById(userId).select("-password -refreshToken")

        return res.status(200)
        .json(new ApiResponse(200, {userResponse}, "CoverImage Updated SuccessFully"))
    }
})

// get current User details
const getCurrentUser = asyncHandler(async (req, res)=>{
    return res.status(200).json(new ApiResponse(200, req.user, "User Found Successfully"))
})

// update User details

const updateUserDetails = asyncHandler(async (req, res)=>{
    const userId = req.user?._id;
    const {email, fullName} = req.body;

    if(!(email || fullName)){
        throw new ApiError(401, "The fields are not filled")
    }

    const updateOpertion = {}

    if(email){
        updateOpertion.email = email
    }else{
        updateOpertion.fullName = fullName
    }

    const user = await User.findByIdAndUpdate(userId, {
        $set: updateOpertion
    }, {new: true}).select("-password")

    console.log(user)

    return res.status(200)
    .json(new ApiResponse(200, {user}, "Credentials Updated Successfully"))
})


// User Channel Profile

const userChannelProfile = asyncHandler(async (req, res)=>{
    const {username} = req.params;

    if(!username.trim("")){
        throw new ApiError(401, "Username not Found")
    }

    const channel = await User.aggregate([
        {
            $match: {username: username}
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCount:{
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond:{
                        if:{
                            $in:[req.user?._id, "$subscribers.subscriber"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                username: 1,
                fullName: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(401, "Channel Not Found")
    }

    return res.status(200)
    .json(new ApiResponse(200, channel[0], "User Channel Profile"))
})

// Get WatchHistory

const getWatchHistory = asyncHandler(async (req, res)=>{
    const userId = req.user._id;
    console.log(userId)
    const user = await User.aggregate([
        {
            $match: {_id: userId}
        },
        {
            $lookup:{
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline:[
                                {
                                    $project:{
                                        avatar: 1,
                                        username: 1,
                                        fullName: 1
                                    }
                                },
                            ]        
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    },
                ]
            }
        },
        
    ])

    return res.status(200)
    .json(new ApiResponse(200, user[0].watchHistory, "WatchHistory Fetched Successfully"))
})



export {register, login, logout, updateUserAvatar,updateCoverImage, refreshAccessToken, getCurrentUser, updateUserDetails, userChannelProfile, getWatchHistory}