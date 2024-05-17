import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/Videos.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { deleteFromCloudinary, uploadToCloudinary } from "../utils/cloudinary.js"





const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    // let { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    let options = {
        page: isNaN(page) ? 1 : Number(page),
        limit: isNaN(limit) ? 10 : Number(limit),
    }

    const matchStage = {}
    if(userId && mongoose.isValidObjectId(userId)){
        matchStage["$match"] = {
            owner: mongoose.Types.ObjectId.createFromHexString(userId)
        }
    }else if(query){
        matchStage["$match"]= {
            $and:[
                {$text: {$search: query}},
                {isPublished: {$eq: true}},
            ]
        }
    }

    if((userId && mongoose.isValidObjectId(userId)) && query){
        matchStage["$match"] = {
            $and:[
                {owner: mongoose.Types.ObjectId.createFromHexString(userId)},
                {$text: {$search: query}}
            ]
        }
    }

    const filterAggregation = [
        matchStage,
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
                            fullName: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: { $arrayElemAt: ["$owner", 0] },
            }
        },
        {
            $sort: {
                score: { $meta: "textScore" }
            }
        }
        
    ]

    // sortBy: title
    // sortType: asc/desc

    // {
    //     $addFields: {
    //       owner: {
    //         $first: "$owner",
    //       },
    //     },
    //   },
    //   {
    //     $sort: {
    //       score: -1,
    //       views: -1,
    //     },
    //   },
    // ];

    const result = await Video.aggregatePaginate(Video.aggregate(filterAggregation), options)

    console.log(result)
    return res.status(200)
    .json(new ApiResponse(200, result, "All Videos Fetched Successfully"))

})

const publishAVideo = asyncHandler(async (req, res) => {
    // TODO: get video, upload to cloudinary, create video
    const { title, description } = req.body

    // Upload video to local file
    const localVideoFile = req.files?.videoFile[0]?.path;
    if (!localVideoFile) {
        throw new ApiError(401, "Video is Required")
    }

    // Upload thumnail to local file
    const thumbnailLocalFile = req.files?.thumbnail[0]?.path
    if (!thumbnailLocalFile) {
        throw new ApiError(401, "Thumbnail is Required")
    }

    // upload to Cloudinary

    const videoFile = await uploadToCloudinary(localVideoFile)
    const thumbnail = await uploadToCloudinary(thumbnailLocalFile)

    if (!videoFile) {
        throw new ApiError(401, "Video File is Required")
    }

    if (!thumbnail) {
        throw new ApiError(401, "Thumbnail is Required")
    }

    // create a video Object and save it to DB

    const video = await Video.create({
        title: title,
        description: description,
        videoFile: videoFile?.url,
        thumbnail: thumbnail?.url,
        duration: videoFile?.duration,
        // isPublished: true,
        owner: req.user?._id
    })

    const videoCreated = await Video.findById(video?._id).select("-owner")

    if (!videoCreated) {
        throw new ApiError(401, "Something went wrong while uploading the video.")
    }

    return res.status(200)
        .json(new ApiResponse(200, videoCreated, "Video Uploaded Successfully"))

})

// {
//     asset_id: '06ffe941dc1c2dce30d64b56115841f4',
//     public_id: 'yasmtwjvtl0hsl51uhuy',
//     version: 1715579279,
//     version_id: '7856cb95a2d5314468554dc43058f58a',
//     signature: '9dacefec5a5b55485495679ea2bf48b252981e25',
//     width: 1920,
//     height: 1080,
//     format: 'mp4',
//     resource_type: 'video',
//     created_at: '2024-05-13T05:47:59Z',
//     tags: [],
//     pages: 0,
//     bytes: 80752143,
//     type: 'upload',
//     etag: 'e384e72e6dc35077abfc289ce0c98c52',
//     placeholder: false,
//     url: 'http://res.cloudinary.com/dtbhudwf0/video/upload/v1715579279/yasmtwjvtl0hsl51uhuy.mp4',
//     secure_url: 'https://res.cloudinary.com/dtbhudwf0/video/upload/v1715579279/yasmtwjvtl0hsl51uhuy.mp4',
//     playback_url: 'https://res.cloudinary.com/dtbhudwf0/video/upload/sp_auto/v1715579279/yasmtwjvtl0hsl51uhuy.m3u8',
//     folder: '',
//     audio: {
//       codec: 'aac',
//       bit_rate: '317375',
//       frequency: 48000,
//       channels: 2,
//       channel_layout: 'stereo'
//     },
//     video: {
//       pix_format: 'yuv420p',
//       codec: 'h264',
//       level: 42,
//       profile: 'Main',
//       bit_rate: '9394005',
//       dar: '16:9',
//       time_base: '1/60000'
//     },
//     is_audio: false,
//     frame_rate: 60,
//     bit_rate: 9755816,
//     duration: 66.183333,
//     rotation: 0,
//     original_filename: 'Obys-Showreel-2022',
//     nb_frames: 3971,
//     api_key: '796353737385299'
//   }

const getVideoById = asyncHandler(async (req, res) => {
    //TODO: get video by id
    const { videoId } = req.params

    // check if VideoId is valid or not
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(401, "Video ID Not Valid")
    }

    // Get the Video
    const video = await Video.findById(videoId).select("-owner")

    return res.status(200)
        .json(new ApiResponse(200, video, "Video Fetched Successfully"))

})

const updateVideo = asyncHandler(async (req, res) => {
    //TODO: update video details like title, description, thumbnail
    const { videoId } = req.params

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(401, "Invalid Video Id")
    }


    const { title, description } = req.body;
    const thumbnailLocalFile = req.file?.path;

    // if thumbnail file exists than upload on cloudinary
    let thumbnailFile;
    if (thumbnailLocalFile) {
        thumbnailFile = await uploadToCloudinary(thumbnailLocalFile)
        if (!thumbnailFile) {
            throw new ApiError(401, "Thumbnail is required")
        }
    }

    const prevVideo = await Video.findById(videoId) // get the previous video data

    // update the new data to the previous video data
    const video = await Video.findByIdAndUpdate(videoId, {
        $set: {
            title: title || prevVideo?.title,
            description: description || prevVideo?.description,
            thumbnail: thumbnailFile?.url || prevVideo?.thumbnail
        }
    })

    // if new file is uploaded then try to remove the old file
    if (thumbnailFile) {
        await deleteFromCloudinary(prevVideo?.thumbnail)
    }

    // Save the updated Changes
    await video.save({ validateBeforeSave: false })

    const updatedVideo = await Video.findById(videoId).select("-owner")

    return res.status(200)
        .json(new ApiResponse(200, updatedVideo, "Videos data updated Successfully"))
})


const deleteVideo = asyncHandler(async (req, res) => {
    //TODO: delete video
    const { videoId } = req.params

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(401, "Invalid Video Id")
    }

    const deleteVideo = await Video.findByIdAndDelete(videoId).select("-owner")

    return res.status(200)
        .json(new ApiResponse(200, deleteVideo, "Video Deleted SuccessFully"))

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    try {
        if (!mongoose.isValidObjectId(videoId)) {
            throw new ApiError(401, "Invaild Video Id")
        }

        const video = await Video.findById(videoId)
        video.isPublished = !video.isPublished
        const videoStatus = await Video.findById(videoId)

        return res.status(200)
            .json(new ApiResponse(200, videoStatus, `${video.isPublished ? "Video Published Successfully" : "Video Unpublished Successfully"}`))
    } catch (error) {
        console.log(error.message)
    }

})


export { publishAVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus, getAllVideos }





// // Ensure page and limit are within valid range
// page = isNaN(page) ? 1 : Number(page);
// limit = isNaN(limit) ? 10 : Number(limit);

// if (page < 0) {
//     page = 1;
// }

// if (limit <= 0) {
//     limit = 10;
// }

// // Define match stage
// let matchStage = {};
// if (userId && mongoose.isValidObjectId(userId)) {
//     matchStage = {
//         $match: {
//             owner: mongoose.Types.ObjectId.createFromHexString(userId)
//         }
//     };
// } else if (query) {
//     matchStage = {
//         $match: {
//             $or: [
//                 { title: { $regex: query, $options: "i" } },
//                 { description: { $regex: query, $options: "i" } }
//             ]
//         }
//     };
// }

// // Combine userId and query conditions
// if (userId && query) {
//     matchStage = {
//         $match: {
//             $and: [
//                 { owner: mongoose.Types.ObjectId.createFromHexString(userId) },
//                 {
//                     $or: [
//                         { title: { $regex: query, $options: "i" } },
//                         { description: { $regex: query, $options: "i" } }
//                     ]
//                 }
//             ]
//         }
//     };
// }

// // Define sort stage
// let sortStage = {};
// if (sortBy && sortType) {
//     sortStage = {
//         $sort: {
//             [sortBy]: sortType === "asc" ? 1 : -1
//         }
//     };
// } else {
//     sortStage = {
//         $sort: {
//             createdAt: -1,
//         }
//     };
// }

// // Define pipeline
// const filterAggregation = await Video.aggregate([
//     matchStage,
//     {
//         $lookup: {
//             from: "users",
//             localField: "owner",
//             foreignField: "_id",
//             as: "owner"
//         },
//         pipeline: [
//             {
//                 $project: {
//                     username: 1,
//                     avatar: 1,
//                     fullName: 1,
//                 }
//             }
//         ]
//     },
//     {
//         $lookup: {
//             from: "likes",
//             localField: "_id",
//             foreignField: "video",
//             as: "likes"
//         }
//     },
//     sortStage,
//     { $skip: (page - 1) * limit },
//     { $limit: limit },
//     {
//         $addFields: {
//             owner: {
//                 $first: "$owner"
//             },
//             likes: {
//                 $size: "$likes"
//             }
//         }
//     }
// ]);