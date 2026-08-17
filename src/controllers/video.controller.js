import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

//TODO: get all videos based on query, sort, pagination
const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query,
        sortBy = "createdAt",
        sortType = "desc",
        userId
    } = req.query

    // --- 1. Build match stage ---
    const matchStage = {
        isPublished: true
    }

    if (query) {
        matchStage.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ]
    }

    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid userId")
        }
        matchStage.owner = new mongoose.Types.ObjectId(userId)
    }

    // --- 2. Build sort stage ---
    const sortStage = {
        [sortBy]: sortType === "asc" ? 1 : -1
    }

    // --- 3. Aggregation pipeline ---
    const pipeline = [
        { $match: matchStage },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        { $addFields: { owner: { $first: "$owner" } } },
        {
            $project: {
                title: 1,
                description: 1,
                thumbnail: 1,
                videoFile: 1,
                duration: 1,
                views: 1,
                createdAt: 1,
                owner: 1
            }
        },
        { $sort: sortStage }
    ]

    // --- 4. Pagination options ---
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    }

    // --- 5. Execute aggregation with pagination ---
    const videoAggregate = Video.aggregate(pipeline)
    const result = await Video.aggregatePaginate(videoAggregate, options)

    // --- 6. Send response ---
    return res
        .status(200)
        .json(new ApiResponse(200, result, "Videos fetched successfully"))

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    const videoFile = req.files?.video?.[0];    // Get video from request
    if (!videoFile) {
        throw new ApiError(400, "Video file is required");
    }

    const uploadedVideo = await uploadOnCloudinary(videoFile, "video");
    if (!uploadedVideo) {     // Upload video to Cloudinary
        throw new ApiError(500, "Failed to upload video");
    }

    const thumbnailFile = req.files?.thumbnail?.[0];  // Get thumbnail from request

    if (!thumbnailFile) {
        throw new ApiError(400, "Thumbnail is required");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailFile, "image");
    if (!thumbnail) {     // Upload thumbnail to Cloudinary
        throw new ApiError(500, "Failed to upload thumbnail");
    }

    const owner = req.user._id; // Get owner
    if (!isValidObjectId(owner)) {
        throw new ApiError(400, "Invalid owner id");
    }

    const duration = uploadedVideo.duration || 0;  // Cloudinary provides video duration

    const video = await Video.create({         // Create video document
        title,
        description,
        videoFile: {
            url: uploadedVideo.url,
            publicId: uploadedVideo.publicId
        },
        thumbnail: {
            url: thumbnail.url,
            publicId: thumbnail.publicId
        },
        duration,
        views: 0,
        owner
    });

    if (!video) {
        throw new ApiError(500, "Failed to create video");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                video,
                "Video created successfully"
            )
        );
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    const video = await Video.findById(videoId).populate("owner", "username fullName avatar")
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } }, { new: true })

    return res.status(200).json(new ApiResponse(true, "Video fetched successfully", video))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    const { title, description } = req.body
    const thumbnailFile = req.files?.thumbnail?.[0]

    if (!(title || description || thumbnailFile)) {
        throw new ApiError(400, "At least one field (title or description) is required to update")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const updatedFields = {}
    if (title) updatedFields.title = title
    if (description) updatedFields.description = description

    const updatedVideo = await Video.findByIdAndUpdate(videoId, updatedFields, { new: true })

    const oldThumbnail = video.thumbnail.publicId


    const thumbnail = thumbnailFile ? await uploadOnCloudinary(thumbnailFile, "image") : null
    if (thumbnail) {
        updatedVideo.thumbnail = {
            url: thumbnail.url,
            publicId: thumbnail.publicId
        }
    }
    await updatedVideo.save()

    if (oldThumbnail) {
        try {
            await cloudinary.uploader.destroy(oldThumbnail)
        } catch (err) {
            console.error("Failed to delete old thumbnail from Cloudinary", err)
        }
    } else {
        throw new ApiError(400, "Old thumbnail not found")
    }

    return res.status(200).json(new ApiResponse(true, "Video updated successfully", updatedVideo))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    await cloudinary.uploader.destroy(video.videoFile.publicId)
    await cloudinary.uploader.destroy(video.thumbnail.publicId)

    // await video.remove()     // not an optimized way 
    video.isPublished = false;   // we do the soft delete instead of hard delete
    await video.save();

    return res.status(200).json(new ApiResponse(true, "Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    video.isPublished = !video.isPublished
    await video.save()

    return res.status(200).json(new ApiResponse(true, `Video ${video.isPublished ? "published" : "unpublished"} successfully`, video))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}