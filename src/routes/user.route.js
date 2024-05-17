import { Router } from "express";
import { register, login, logout, updateUserAvatar,updateCoverImage, refreshAccessToken, getCurrentUser, updateUserDetails, userChannelProfile, getWatchHistory} from "../controllers/users.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Users Routes

router.route("/register").post(upload.fields([{name:"avatar", maxCount: 1}, {name: "coverImage", maxCount: 1}]), register)
router.route("/login").post(login)
router.route("/logout").post(verifyJWT, logout)
router.route("/userAvatar").patch(verifyJWT,upload.single("avatar"), updateUserAvatar)
router.route("/coverImage").patch(verifyJWT,upload.single("coverImage"), updateCoverImage)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/get-user").get(verifyJWT, getCurrentUser)
router.route("/update-user").patch(verifyJWT, updateUserDetails)
router.route("/c/:username").get(verifyJWT, userChannelProfile)
router.route("/watchHistory").get(verifyJWT, getWatchHistory)

export default router;

