import client from "./client.js";

export const getChannelStats = () => client.get("/dashboard/stats");

export const getChannelVideos = (params) => client.get("/dashboard/videos", { params });
