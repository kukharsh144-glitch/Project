import client from "./client.js";

export const createPlaylist = (data) => client.post("/playlists", data);

export const getPlaylistById = (playlistId) => client.get(`/playlists/${playlistId}`);

export const updatePlaylist = (playlistId, data) => client.patch(`/playlists/${playlistId}`, data);

export const deletePlaylist = (playlistId) => client.delete(`/playlists/${playlistId}`);

export const addVideoToPlaylist = (videoId, playlistId) => client.patch(`/playlists/add/${videoId}/${playlistId}`);

export const removeVideoFromPlaylist = (videoId, playlistId) => client.patch(`/playlists/remove/${videoId}/${playlistId}`);

export const getUserPlaylists = (userId, params) => client.get(`/playlists/user/${userId}`, { params });
