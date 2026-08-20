import client from "./client.js";

export const getAllVideos = (params) => client.get("/videos", { params });

export const publishAVideo = (formData) => client.post("/videos", formData, {
  headers: { "Content-Type": "multipart/form-data" }
});

export const getVideoById = (videoId) => client.get(`/videos/${videoId}`);

export const updateVideo = (videoId, formData) => client.patch(`/videos/${videoId}`, formData, {
  headers: { "Content-Type": "multipart/form-data" }
});

export const deleteVideo = (videoId) => client.delete(`/videos/${videoId}`);

export const togglePublishStatus = (videoId) => client.patch(`/videos/toggle/publish/${videoId}`);
