import { asyncHandler } from "../utils/asyncHandler.js"
import { apiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { v2 as cloudinary } from "cloudinary";
import JWT from "jsonwebtoken"


// in this i want to teell you about the difference b/w 'user' & 'User'   "user" the current user and the accessaries from the module and "User" is all the users that were in the database
// So you need any detail from thee database

const generateAccessAndRefreshToken = async (userId) => {
    //we have to generate the access and refresh token for the login user
    try {

        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        // this are the metthods that we introduce in the user module 

        user.refreshToken = refreshToken;
        // for save it in the user detail
        await user.save({ validateBeforeSave: false })
        // updatee the refresh token in the user in data base without taking any password again or authentication 

        return { accessToken, refreshToken }
    } catch (error) {
        throw new apiError(500, error?.message || " Something went wrong while generating refresh & access token ")
    }
}

// ===================== = == REGISTER USER = == ==============

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend  
    // validation - notemptty  
    // check is user already exixts : username, email   
    // check for imaages , check for avatar   
    // create user object - create entry in db    
    // remove password and refresh token field from the response   
    // check for user creation  
    // return res  

    const { fullName, email, password, userName } = req.body;

    if ([fullName, email, password, userName].some((field) => field.trim() === "")) {
        throw new apiError(400, "All fields are required ")
    }

    const existedUser = await User.findOne({
        $or: [{ userName }, { email }]
    })
    if (existedUser) {
        throw new apiError(409, "User is already exist ")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files?.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    let coverImage = null;
    if (coverImageLocalPath) {
        coverImage = await uploadOnCloudinary(coverImageLocalPath);
    }

    console.log(avatar);


    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        userName: userName.toLowerCase(),
        email,
        public_id: {
            avatarPublicId: avatar.public_id,
            coverImagePublicId: coverImage?.public_id || "",
        },
        password,
        coverImage: coverImage?.url || "",
    })

    const createdUser = await User.findById(user._id).select(" -password -refreshToken ")
    if (!createdUser) {
        throw new apiError(500, " something wwwent wrong while registering the user ");
    }

    return res.status(201).json(
        new apiResponse(200, createdUser, " user registered successfully ")
    )
}
);


// ==================== == = LOGIN USER = == ====================

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data 
    // username, email, password
    // find the user 
    // password
    // access and refresh token 
    // send cookies

    const { email, password, userName } = req.body;
    console.log(email);

    if (!(userName || email)) {
        throw new apiError(400, " username or email is must required ");
    }

    const user = await User.findOne({
        $or: [{ userName }, { email }]
    })
    if (!user) {
        throw new apiError(404, "user is not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new apiError(401, " password doesn't match ");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new apiResponse(200, { User: loggedInUser, accessToken, refreshToken }, "logged in successfully "));

})


// ====================== === = LOGOUT USER = === ====================

const logoutUser = asyncHandler(async (req, res) => {
    // for logout  the we have to fnd the user that was done by the middleware 'auth.middleware.js'
    await User.findByIdAndUpdate(
        req.user._id,
        { $unset: { refreshToken: 1 } },  // this remove the field from the document 
        { new: true }
    )

    const options = {
        httpOnly: true,
        secure: true,
    }  // this make that the any change in that will done by the server not applicable from the frontend 

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new apiResponse(200, {}, " User loggeed out successfully "))
})


// ========================== == = REFRESH  ACCESS TOKEN = == ====================== 

const refreshAccessToken = asyncHandler(async (req, res) => {
    const inComingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!inComingRefreshToken) {
        throw new apiError(401, " unauthorized request ")
    }
    try {
        const decodedToken = JWT.verify(inComingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new apiError(401, " invalid refresh token ")
        }
        if (inComingRefreshToken !== user?.refreshToken) {
            throw new apiError(401, " refresh token is expired or user is not found ")
        }

        const options = {
            httpOnly: true,
            secure: true,
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)
        return res
            .status(200)
            .cookie("accesToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new apiResponse(200, { accessToken, refreshToken: newRefreshToken }, "acceess tokeen refreshed "))
    } catch (error) {
        throw new apiError(401, error?.message || " Invalid refresh token ")
    }
})


// ======================== === = CHANGE PASSWORD = === ===================

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);
    // console.log(user)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new apiError(400, "Invalid old password")
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new apiResponse(200, {}, "password updated successfully"))
})


// ===================== == GETTING CURRENT USER == ================ 

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new apiResponse(200, req.user, "user fetched successfully"))
})


// ====================== === UPDATE ACCOUNT DETAILS == =======================

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body

    if (!(fullName || email) ) {
        throw new apiError(400, "At least one field is required")
    }

    const user = await User.findById(req.user?._id)

    const updateUser = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { fullName : fullName || user.fullName, email : email || user?.email } },
        { new: true },
    ).select("-password")

    return res
        .status(200)
        .json(new apiResponse(200, updateUser, "Acount detail is updated successfully"))
})


// ==================== = = = UPDATE AVATAR = = = =============================== 

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar file is missing")
    }

    // taking the public_id for deleting the image that was present in the cloudinary

    // firstly we find the user 
    const user = await User.findById(req.user?._id)
    if (!user) { throw new apiError(400, "their is something problem in fetching the user from the id ") }
    const old_publicId = user?.public_id.avatarPublicId

    //now take the input of the new image that you are uploading 
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url) {
        throw new apiError(400, " Error while uploading the image ")
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:
            {
                avatar: avatar.url,
                "public_id.avatarPublicId": avatar.public_id
            }
        },
        { new: true },
    ).select("-password")

    // i got this ( we get the public_id of the old image we can remove it from the cloudinary)
    if (old_publicId) {
        try {
            await cloudinary.uploader.destroy(old_publicId);
        } catch (error) {
            console.error("Failed to delete old cover image:", error);
        }
    } else { throw new apiError(400, "unable to get the public_id from db") }

    return res
        .status(200)
        .json(new apiResponse(200, updatedUser, "Avatar image updated successfully "))

})


// ================== = = = UPDATE COVER IMAGE = = ===========================

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
        throw new apiError(400, "CoverImage file is missing")
    }

    // taking the public_id for deleting the image that was present in the cloudinary

    // firstly we find the user 
    const user = await User.findById(req.user?._id)
    if (!user) { throw new apiError(400, "their is something problem in fetching the user from the id ") }
    const old_publicId = user?.public_id.coverImagePublicId

    //now take the input of the new image that you are uploading 
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage?.url) {
        throw new apiError(400, " Error while uploading the image ")
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:
            {
                coverImage: coverImage.url,
                "public_id.coverImagePublicId": coverImage.public_id
            }
        },
        { new: true },
    ).select("-password")

    // i got this ( we get the public_id of the old image we can remove it from the cloudinary)
    if (old_publicId) {
        try {
            await cloudinary.uploader.destroy(old_publicId);
        } catch (error) {
            console.error("Failed to delete old cover image:", error);
        }
    }

    return res
        .status(200)
        .json(new apiResponse(200, updatedUser, "coverImage image updated successfully "))

})


// ================= = = = GETTING CHANNEL PROFILE  = = = ===================

const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {userName} = req.params

    if (!userName?.trim()) {
        throw new ApiError(400, "userName is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                userName: userName?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
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
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                userName: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})


// ========================= = = = GETTING WATCH HISTORY = = = ===================

const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        userName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})

export { 
    registerUser,
    loginUser, 
    logoutUser,
    updateUserCoverImage,
    updateUserAvatar,
    updateAccountDetails,
    getCurrentUser,
    changeCurrentPassword,
    getWatchHistory,
    getUserChannelProfile,
    refreshAccessToken
 };