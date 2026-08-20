import client from "./client.js";

export const getVideoComments = (videoId, params) => client.get(`/comments/${videoId}`, { params });

export const addComment = (videoId, content) => client.post(`/comments/${videoId}`, { content });

export const deleteComment = (commentId) => client.delete(`/comments/c/${commentId}`);

export const updateComment = (commentId, content) => client.patch(`/comments/c/${commentId}`, { content });
