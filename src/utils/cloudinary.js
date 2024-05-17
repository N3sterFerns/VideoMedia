import {v2 as cloudinary} from 'cloudinary';
import fs from "fs"
import { User } from '../models/users.models.js';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY,
})

const uploadToCloudinary = async(localFile)=>{
    try {
        if(!localFile) return null
        // upload the file on cloudinary
        const cloudinaryResponse = await cloudinary.uploader.upload(localFile, {
            resource_type: 'auto'
        })

        // File uploaded Successfully
        console.log("File Uploaded Successfully on Cloudinary "+ cloudinaryResponse.url)
        fs.unlinkSync(localFile)
        return cloudinaryResponse;
    } catch (error) {
        fs.unlinkSync(localFile)
        return null
    }
}

const deleteFromCloudinary = async (url)=>{
    if(!url) return null
    let splitAvatarUrl = url.split("/") 
    let splitUrl = splitAvatarUrl[splitAvatarUrl.length - 1]
    let splitImgUrl = splitUrl.split(".")
    let prevAvatarUrl = splitImgUrl[0]
    await cloudinary.uploader.destroy(prevAvatarUrl)    
}


export {uploadToCloudinary, deleteFromCloudinary}

// {
//     "asset_id": "b5e6d2b39ba3e0869d67141ba7dba6cf",
//     "public_id": "eneivicys42bq5f2jpn2",
//     "api_key": "349963819116147",
//     "version": 1570979139,
//     "version_id": "98f52566f43d8e516a486958a45c1eb9",
//     "signature": "abcdefghijklmnopqrstuvwxyz12345",
//     "width": 1000,
//     "height": 672,
//     "format": "jpg",
//     "resource_type": "image",
//     "created_at": "2023-03-11T12:24:32Z",
//     "tags": [],
//     "pages": 1,
//     "bytes": 350749,
//     "type": "upload",
//     "etag": "5297bd123ad4ddad723483c176e35f6e",
//     "placeholder": false,
//     "url": "http://res.cloudinary.com/demo/image/upload/v1570979139/eneivicys42bq5f2jpn2.jpg",
//     "secure_url": "https://res.cloudinary.com/demo/image/upload/v1570979139/eneivicys42bq5f2jpn2.jpg",
//     "folder": "",
//     "access_mode": "public",
//     "existing": false,
//     "original_filename": "sample"
//  }
