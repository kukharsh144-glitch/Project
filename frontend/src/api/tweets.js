import client from "./client.js";

export const createTweet = (content) => client.post("/tweets", { content });

export const getUserTweets = (userId, params) => client.get(`/tweets/user/${userId}`, { params });

export const getAllTweets = (params) => client.get("/tweets", { params });

export const updateTweet = (tweetId, content) => client.patch(`/tweets/${tweetId}`, { content });

export const deleteTweet = (tweetId) => client.delete(`/tweets/${tweetId}`);
