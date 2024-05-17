import { Router } from "express";
import {publishAVideo, getVideoById, updateVideo, getAllVideos} from "../controllers/videos.controller.js"
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()

router.use(verifyJWT)

router.route("/").get(getAllVideos).post(upload.fields([{name: "videoFile", maxCount: 1}, {name: "thumbnail", maxCount: 1}]), publishAVideo)

router.route("/:videoId").get(getVideoById).patch(upload.single("thumbnail"), updateVideo)


export default router