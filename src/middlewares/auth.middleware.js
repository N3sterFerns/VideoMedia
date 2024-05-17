import jwt from "jsonwebtoken"
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/users.models.js";


const verifyJWT = async (req, res, next)=>{
    try {
        // get the access token from the user
        const token = req.cookies.accessToken || req.header("Authorization").replace("Bearer ", "");
        if(!token){
            throw new ApiError(401, "Unathorized Request")
        }
        
        // try to verify the token
        const decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN)
    
        // find the user after verify
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if(!user){
            throw new ApiError(401, "Invalid Access Token")
        }

        // send the user as request from the middleware
        req.user = user;
        next()

    } catch (error) {
        throw new ApiError(500, error?.message || "Invalid Access Token")
    }
}

export {verifyJWT}