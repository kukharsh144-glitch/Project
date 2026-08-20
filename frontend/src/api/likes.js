import client from "./client.js";

export const toggleVideoLike = (videoId) => client.post(`/likes/toggle/v/${videoId}`);

export const toggleVideoDislike = (videoId) => client.post(`/likes/toggle/vd/${videoId}`);

export const toggleCommentLike = (commentId) => client.post(`/likes/toggle/c/${commentId}`);

export const toggleTweetLike = (tweetId) => client.post(`/likes/toggle/t/${tweetId}`);

export const getLikedVideos = (params) => client.get("/likes/videos", { params });
