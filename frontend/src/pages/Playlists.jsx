import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ListVideo, Plus, Folder, Trash2 } from "lucide-react";
import { getUserPlaylists, createPlaylist, deletePlaylist, getPlaylistById, removeVideoFromPlaylist } from "../api/playlists.js";
import Modal from "../components/Modal.jsx";
import { Skeleton } from "../components/Skeleton.jsx";
import { formatDuration } from "../components/VideoCard.jsx";

export const Playlists = () => {
  const { user } = useSelector((state) => state.auth);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistVideos, setPlaylistVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(false);

  const handlePlaylistClick = async (playlist) => {
    setSelectedPlaylist(playlist);
    setVideosLoading(true);
    try {
      const response = await getPlaylistById(playlist._id);
      const fullPlaylist = response.data || response;
      setPlaylistVideos(fullPlaylist.videos || []);
    } catch (err) {
      toast.error(err.message || "Failed to load playlist videos");
    } finally {
      setVideosLoading(false);
    }
  };

  const handleRemoveVideo = async (videoId) => {
    if (!selectedPlaylist) return;
    try {
      await removeVideoFromPlaylist(videoId, selectedPlaylist._id);
      toast.success("Video removed from playlist");
      setPlaylistVideos((prev) => prev.filter((v) => v._id !== videoId));
      fetchPlaylists(); // Refresh count on card
    } catch (err) {
      toast.error(err.message || "Failed to remove video");
    }
  };

  const { register, handleSubmit, reset } = useForm();

  const fetchPlaylists = async () => {
    if (!user?._id) return;
    try {
      const response = await getUserPlaylists(user._id, { page: 1, limit: 100 });
      // Backend returns doc list in response.data.playlists or response.data
      const list = response.data?.playlists || response.data || [];
      setPlaylists(list);
    } catch (err) {
      toast.error(err.message || "Failed to load playlists");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, [user]);

  const onSubmit = async (data) => {
    setCreateLoading(true);
    try {
      await createPlaylist({
        name: data.name.trim(),
        description: data.description.trim(),
      });
      toast.success("Playlist created successfully");
      setIsModalOpen(false);
      reset();
      fetchPlaylists();
    } catch (err) {
      toast.error(err.message || "Failed to create playlist");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async (playlistId, e) => {
    e.preventDefault();
    e.stopPropagation();

    const confirm = window.confirm("Are you sure you want to delete this playlist?");
    if (!confirm) return;

    try {
      await deletePlaylist(playlistId);
      toast.success("Playlist deleted");
      fetchPlaylists();
    } catch (err) {
      toast.error(err.message || "Failed to delete playlist");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-36 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <ListVideo className="h-6 w-6 text-purple-500" />
          <span>My Playlists ({playlists.length})</span>
        </h2>
        
        <button
          onClick={() => setIsModalOpen(true)}
          type="button"
          className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-semibold active:scale-95 transition-transform"
        >
          <Plus className="h-4 w-4" />
          <span>Create Playlist</span>
        </button>
      </div>

      {playlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/50 dark:border-zinc-800">
          <p className="font-bold text-zinc-700 dark:text-zinc-350">No playlists found</p>
          <p className="text-xs text-zinc-500 mt-1">Group your favorite videos together.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {playlists.map((playlist) => (
            <div
              key={playlist._id}
              onClick={() => handlePlaylistClick(playlist)}
              className="group bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 hover:border-purple-500/50 p-5 rounded-2xl flex flex-col justify-between hover:shadow-md transition-all duration-200 cursor-pointer relative"
            >
              <div className="flex flex-col gap-2">
                <div className="p-3 bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 rounded-xl self-start">
                  <Folder className="h-5 w-5" />
                </div>
                <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50 group-hover:text-purple-650 truncate mt-1">
                  {playlist.name}
                </h4>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 line-clamp-2">
                  {playlist.description || "No description provided."}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3 mt-4 text-[10px] text-zinc-500 font-bold">
                <span>{playlist.videos?.length || 0} Videos</span>
                <button
                  onClick={(e) => handleDelete(playlist._id, e)}
                  className="p-1 text-zinc-400 hover:text-red-650 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                  title="Delete playlist"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Playlist Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Playlist">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-zinc-500">Playlist Name</label>
            <input
              type="text"
              placeholder="e.g. My Favorites"
              {...register("name", { required: true })}
              className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-zinc-500">Playlist Description</label>
            <textarea
              placeholder="What this collection is about"
              rows={4}
              {...register("description")}
              className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>

          <div className="flex justify-end gap-2.5 mt-2">
            <button
              onClick={() => setIsModalOpen(false)}
              type="button"
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              {createLoading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Playlist Videos Modal */}
      <Modal
        isOpen={!!selectedPlaylist}
        onClose={() => setSelectedPlaylist(null)}
        title={selectedPlaylist?.name || "Playlist Detail"}
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs text-zinc-555 leading-relaxed">{selectedPlaylist?.description || "No description provided."}</p>
          
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 flex flex-col gap-3">
            {videosLoading ? (
              <div className="flex justify-center py-6">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-650 border-t-transparent" />
              </div>
            ) : playlistVideos.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-6">No videos in this playlist yet.</p>
            ) : (
              playlistVideos.map((video) => (
                 <div key={video._id} className="flex gap-3 items-center group/item relative border-b border-zinc-100 dark:border-zinc-800/60 pb-3 last:border-b-0 last:pb-0">
                  <Link
                    to={`/watch/${video._id}`}
                    className="flex-1 flex gap-3 items-center overflow-hidden hover:opacity-90"
                  >
                    <img
                      src={video.thumbnail?.url || video.thumbnail}
                      alt={video.title}
                      className="w-16 h-10 object-cover rounded-md flex-shrink-0 bg-zinc-100"
                    />
                    <div className="flex-grow min-w-0 flex flex-col gap-0.5">
                      <span className="font-bold text-xs text-zinc-900 dark:text-zinc-150 truncate block group-hover/item:text-purple-600">
                        {video.title}
                      </span>
                      <span className="text-[10px] text-zinc-400">{formatDuration(video.duration)}</span>
                    </div>
                  </Link>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveVideo(video._id);
                    }}
                    className="p-1.5 text-zinc-405 hover:text-red-650 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full flex-shrink-0 transition-colors"
                    title="Remove from playlist"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Playlists;
