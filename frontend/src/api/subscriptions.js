import client from "./client.js";

export const toggleSubscription = (channelId) => client.post(`/subscriptions/c/${channelId}`);

export const getUserChannelSubscribers = (channelId) => client.get(`/subscriptions/c/${channelId}`);

export const getSubscribedChannels = (subscriberId) => client.get(`/subscriptions/u/${subscriberId}`);
