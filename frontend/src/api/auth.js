import client from "./client.js";

export const registerUser = (formData) => client.post("/users/register", formData, {
  headers: { "Content-Type": "multipart/form-data" }
});

export const loginUser = (credentials) => client.post("/users/login", credentials);

export const logoutUser = () => client.post("/users/logout");

export const getCurrentUser = () => client.get("/users/currentUser");

export const updateAccountDetails = (data) => client.post("/users/updateAccountDetails", data);

export const changeCurrentPassword = (data) => client.post("/users/changePassword", data);

export const updateAvatar = (formData) => client.post("/users/updateAvatar", formData, {
  headers: { "Content-Type": "multipart/form-data" }
});

export const updateCoverImage = (formData) => client.post("/users/updateCoverImage", formData, {
  headers: { "Content-Type": "multipart/form-data" }
});

export const getUserChannelProfile = (username) => client.get(`/users/c/${username}`);

export const getWatchHistory = () => client.get("/users/history");
