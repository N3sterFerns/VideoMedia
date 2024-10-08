import { Router } from "express";
import {toggleVideoLike, toggleCommentLikes,toggleTweetLike, getLikedVideos} from "../controllers/likes.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()
router.use(verifyJWT)

router.route("/toggle/v/:videoId").post(toggleVideoLike)
router.route("/toggle/c/:commentId").post(toggleCommentLikes)
router.route("/toggle/t/:tweetId").post(toggleTweetLike)
router.route("/videos").get(getLikedVideos)


export default router


