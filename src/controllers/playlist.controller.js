import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {Video} from "../models/video.model.js"
import {apiError } from "../utils/apiError.js"
import {apiResponse } from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    // name = name oof the playlist, description = description of the playlist  
    if(!name || name.trim() === ""){
        throw new apiError(400, "Playlist name is required")
    }

    const owner = req.user._id
    if(!owner){
        throw new apiError(400, "for creating playlist user must be logged in")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner
    })
    return res
    .status(201)
    .json(new apiResponse(201, playlist, "Playlist created successfully"))
    //TODO: create playlist
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!isValidObjectId(userId)) {
        throw new apiError(400, "Invalid user id")
    }

    const pageNum = Math.max(parseInt(page, 10), 1)
    const limitNum = Math.max(parseInt(limit, 10), 1)
    const skip = (pageNum - 1) * limitNum

    const [playlists, totalPlaylists] = await Promise.all([
        Playlist.find({ owner: userId })
            .select("name description videos owner createdAt")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate("owner", "fullName userName email")
            .populate({
                path: "videos",
                select: "title thumbnail duration views",
                options: { limit: 5 } // avoid pulling every video in every playlist
            })
            .lean(),
        Playlist.countDocuments({ owner: userId })
    ])

    const totalPages = Math.ceil(totalPlaylists / limitNum)

    return res.status(200).json(
        new apiResponse(200, {
            playlists,
            pagination: {
                currentPage: pageNum,
                limit: limitNum,
                totalPlaylists,
                totalPages,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        }, "User playlists fetched successfully")
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId)) {
        throw new apiError(400, "Invalid playlist id")
    }

    const playlist = await Playlist.findById(playlistId).populate("videos").populate("owner", "fullName userName email")
    if(!playlist) {
        throw new apiError(404, "Playlist not found")
    }

    return res
    .status(200)
    .json(new apiResponse(200, playlist, "Playlist fetched successfully"))
    //TODO: get playlist by id
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new apiError(400, "Invalid playlist id or video id")
    }

    // req.user should already be guaranteed by the `verifyJWT` middleware,
    // but keep a defensive check in case this route is ever used without it
    if (!req.user?._id) {
        throw new apiError(401, "Unauthorized request")
    }
    const userId = req.user._id

    // --- fetch playlist & video in parallel instead of sequentially ---
    const [playlist, video] = await Promise.all([
        Playlist.findById(playlistId),
        Video.findById(videoId).select("_id")
    ])

    if (!playlist) {
        throw new apiError(404, "Playlist not found")
    }
    if (!video) {
        throw new apiError(404, "Video not found")
    }
    // const videoExists = playlist.videos.includes(videoId)
    // if(videoExists) {
    //     throw new apiError(400, "Video already exists in the playlist")
    // }
    // we use '$addtoset' instead of '$push' to avoid duplicate videos in the playlist
    if (playlist.owner.toString() !== userId.toString()) {
        throw new apiError(403, "You are not authorized to add video to this playlist")
    }

    // $addToSet avoids duplicate videos without needing a separate "includes" check
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $addToSet: { videos: videoId } },
        { returnDocument: 'after' }
    )
        .populate({
            path: "videos",
            select: "title thumbnail duration views"
        })
        .populate("owner", "fullName userName email")
        .lean()

    return res
        .status(200)
        .json(new apiResponse(200, updatedPlaylist, "Video added to playlist successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new apiError(400, "Invalid playlist id or video id")
    }

    if (!req.user?._id) {
        throw new apiError(401, "Unauthorized request")
    }

    // combine existence + ownership check + update into a single atomic query
    const updatedPlaylist = await Playlist.findOneAndUpdate(
        { _id: playlistId, owner: req.user._id },
        { $pull: { videos: videoId } },
        { returnDocument: 'after' }
    )
        .populate({
            path: "videos",
            select: "title thumbnail duration views"
        })
        .populate("owner", "fullName userName email")
        .lean()

    if (!updatedPlaylist) {
        // could be: playlist doesn't exist, OR user isn't the owner
        // if you need to tell these apart for a more precise error, fall back
        // to a separate findById() + ownership check before this update
        throw new apiError(404, "Playlist not found or you're not authorized to modify it")
    }

    return res
        .status(200)
        .json(new apiResponse(200, updatedPlaylist, "Video removed from playlist successfully"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new apiError(400, "Invalid playlist id")
    }

    if (!req.user?._id) {
        throw new apiError(401, "Unauthorized request")
    }

    // combine existence + ownership check + delete into a single atomic query
    const deletedPlaylist = await Playlist.findOneAndDelete({
        _id: playlistId,
        owner: req.user._id
    })

    if (!deletedPlaylist) {
        // could be: playlist doesn't exist, OR user isn't the owner
        throw new apiError(404, "Playlist not found or you're not authorized to delete it")
    }

    return res
        .status(200)
        .json(new apiResponse(200, null, "Playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body

    if (!isValidObjectId(playlistId)) {
        throw new apiError(400, "Invalid playlist id")
    }

    // at least one field must be provided
    if (name === undefined && description === undefined) {
        throw new apiError(400, "At least one of name or description is required")
    }

    // build update object dynamically, only including fields that were sent
    const updateFields = {}

    if (name !== undefined) {
        if (!name.trim()) {
            throw new apiError(400, "Playlist name cannot be empty")
        }
        updateFields.name = name.trim()
    }

    if (description !== undefined) {
        if (!description.trim()) {
            throw new apiError(400, "Playlist description cannot be empty")
        }
        updateFields.description = description.trim()
    }

    if (!req.user?._id) {
        throw new apiError(401, "Unauthorized request")
    }

    const updatedPlaylist = await Playlist.findOneAndUpdate(
        { _id: playlistId, owner: req.user._id },
        { $set: updateFields },
        { returnDocument: 'after', runValidators: true }
    ).lean()

    if (!updatedPlaylist) {
        throw new apiError(404, "Playlist not found or you're not authorized to modify it")
    }

    return res
        .status(200)
        .json(new apiResponse(200, updatedPlaylist, "Playlist updated successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}