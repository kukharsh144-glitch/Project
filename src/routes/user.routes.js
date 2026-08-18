import { Router } from "express";
import { registerUser, 
    loginUser, 
    logoutUser ,
    updateUserCoverImage,
    updateUserAvatar, 
    updateAccountDetails,
    getCurrentUser,
    changeCurrentPassword,
    getUserChannelProfile,
    getWatchHistory,} from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js"
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
    )

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT,  logoutUser)

router.route("/changePassword").post(verifyJWT,  changeCurrentPassword)
router.route("/currentUser").get(verifyJWT, getCurrentUser)
router.route("/updateAccountDetails").post(verifyJWT, updateAccountDetails)

router.route("/updateAvatar").post(
    verifyJWT,
    upload.single("avatar"), 
    updateUserAvatar)

router.route("/updateCoverImage").post(
    verifyJWT,
    upload.single("coverImage"), 
    updateUserCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)


export default router;