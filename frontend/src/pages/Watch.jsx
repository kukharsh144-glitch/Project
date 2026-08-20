import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { Eye, Calendar, Share2, Play, ListPlus } from "lucide-react";
import { getVideoById, getAllVideos } from "../api/videos.js";
import { getUserChannelSubscribers } from "../api/subscriptions.js";
import { toggleVideoLike } from "../api/likes.js";
import { getUserPlaylists, addVideoToPlaylist, createPlaylist } from "../api/playlists.js";
import Avatar from "../components/Avatar.jsx";
import Modal from "../components/Modal.jsx";
import LikeDislikeButton from "../components/LikeDislikeButton.jsx";
import CustomVideoPlayer from "../components/CustomVideoPlayer.jsx";
import SubscribeButton from "../components/SubscribeButton.jsx";
import CommentSection from "../components/CommentSection.jsx";
import { Skeleton } from "../components/Skeleton.jsx";
import { formatDuration, formatRelativeTime } from "../components/VideoCard.jsx";

export const Watch = () => {
  const { videoId } = useParams();
  const { user } = useSelector((state) => state.auth);
  const [video, setVideo] = useState(null);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [playlistCreating, setPlaylistCreating] = useState(false);

  const handleOpenPlaylistModal = async () => {
    if (!user?._id) {
      toast.error("Please login to save videos to playlists");
      return;
    }
    setPlaylistModalOpen(true);
    try {
      const response = await getUserPlaylists(user._id, { page: 1, limit: 50 });
      const list = response.data?.playlists || response.data || [];
      setPlaylists(list);
    } catch (err) {
      toast.error(err.message || "Failed to load playlists");
    }
  };

  const handleAddVideo = async (playlistId) => {
    try {
      await addVideoToPlaylist(video._id, playlistId);
      toast.success("Video added to playlist successfully");
      setPlaylistModalOpen(false);
    } catch (err) {
      toast.error(err.message || "Failed to add video to playlist");
    }
  };

  const handleCreateAndAddPlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    setPlaylistCreating(true);
    try {
      const response = await createPlaylist({
        name: newPlaylistName.trim(),
        description: newPlaylistDesc.trim()
      });
      const newPlaylist = response.data || response;
      await addVideoToPlaylist(video._id, newPlaylist._id);
      toast.success("Playlist created and video added!");
      setNewPlaylistName("");
      setNewPlaylistDesc("");
      setPlaylistModalOpen(false);
    } catch (err) {
      toast.error(err.message || "Failed to create and add video to playlist");
    } finally {
      setPlaylistCreating(false);
    }
  };

  useEffect(() => {
    const fetchVideoDetails = async () => {
      setLoading(true);
      try {
        const response = await getVideoById(videoId);
        // Backend returns: { statusCode: 200, data: video_object, message: "..." }
        const videoData = response.data || response;
        setVideo(videoData);

        // Fetch subscribers count for creator channel
        if (videoData.owner?._id) {
          const subRes = await getUserChannelSubscribers(videoData.owner._id);
          const subCount = Array.isArray(subRes.data) ? subRes.data.length : 0;
          setSubscribersCount(subCount);
        }

        // Fetch related videos
        const relatedRes = await getAllVideos({ page: 1, limit: 8 });
        const relatedDocs = relatedRes.data?.docs || relatedRes.data || [];
        setRelatedVideos(relatedDocs.filter((vid) => vid._id !== videoId));
      } catch (err) {
        toast.error(err.message || "Failed to load video details");
      } finally {
        setLoading(false);
      }
    };

    fetchVideoDetails();
  }, [videoId]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Watch link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Skeleton className="w-full aspect-video rounded-2xl" />
          <Skeleton className="h-6 w-3/4" />
          <div className="flex gap-3 mt-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-5 w-40" />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="flex gap-2">
              <Skeleton className="w-28 h-16 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-2 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="text-center p-12">
        <h3 className="text-lg font-bold">Video not found</h3>
        <Link to="/" className="text-purple-600 hover:underline mt-2 inline-block">Go Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Player & Meta details */}
      <div className="lg:col-span-2 flex flex-col gap-5">
        {/* Video Player */}
        <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-lg relative border border-zinc-200/20 dark:border-zinc-800/20">
          <CustomVideoPlayer
            src={video.videoFile?.url}
            poster={video.thumbnail?.url || video.thumbnail}
          />
        </div>

        {/* Video Title */}
        <h1 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-zinc-50 leading-tight">
          {video.title}
        </h1>

        {/* Top actions bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800/80">
          {/* Channel Info */}
          <div className="flex items-center gap-3">
            <Link to={`/channel/${video.owner?.userName || video.owner?.username}`}>
              <Avatar src={video.owner?.avatar} name={video.owner?.fullName} size="md" />
            </Link>
            <div className="flex flex-col">
              <Link to={`/channel/${video.owner?.userName || video.owner?.username}`} className="font-extrabold text-sm hover:text-purple-600 dark:hover:text-purple-400">
                {video.owner?.fullName}
              </Link>
              <span className="text-xs text-zinc-500">{subscribersCount} subscribers</span>
            </div>
            
            <div className="ml-4">
              <SubscribeButton
                channelId={video.owner?._id}
                initialIsSubscribed={false} // Will dynamically load in real setups if supported
                onToggleSuccess={(isSubbed) => {
                  setSubscribersCount((prev) => (isSubbed ? prev + 1 : Math.max(0, prev - 1)));
                }}
              />
            </div>
          </div>

          {/* Video Controls (Likes/Share/Save) */}
          <div className="flex items-center gap-2.5">
            <LikeDislikeButton
              targetId={video._id}
              initialLiked={video.isLiked}
              initialCount={video.likesCount || 0}
              initialDisliked={video.isDisliked}
              initialDislikesCount={video.dislikesCount || 0}
            />
            <button
              onClick={handleShare}
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-50/70 dark:bg-zinc-900/85 backdrop-blur-sm border border-zinc-200/60 dark:border-zinc-800/80 rounded-full text-sm font-semibold text-zinc-600 dark:text-zinc-300 transition-all hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 active:scale-95 shadow-sm"
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </button>
            <button
              onClick={handleOpenPlaylistModal}
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-50/70 dark:bg-zinc-900/85 backdrop-blur-sm border border-zinc-200/60 dark:border-zinc-800/80 rounded-full text-sm font-semibold text-zinc-600 dark:text-zinc-300 transition-all hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 active:scale-95 shadow-sm"
            >
              <ListPlus className="h-4 w-4" />
              <span>Save</span>
            </button>
          </div>
        </div>

        {/* Description Box */}
        <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800 p-4 rounded-2xl flex flex-col gap-2">
          <div className="flex items-center gap-4 text-xs font-bold text-zinc-500">
            <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {video.views} views</span>
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(video.createdAt).toLocaleDateString()}</span>
          </div>
          
          <p className={`text-xs text-zinc-750 dark:text-zinc-350 leading-relaxed ${descExpanded ? "" : "line-clamp-3"}`}>
            {video.description || "No description provided."}
          </p>
          
          <button
            onClick={() => setDescExpanded((prev) => !prev)}
            type="button"
            className="text-xs font-extrabold text-purple-650 dark:text-purple-400 self-start hover:underline mt-1"
          >
            {descExpanded ? "Show Less" : "Show More"}
          </button>
        </div>

        {/* Comment Section */}
        <div className="mt-4">
          <CommentSection videoId={video._id} />
        </div>
      </div>

      {/* Right Column: Related Videos */}
      <div className="flex flex-col gap-4">
        <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-250">Up Next</h3>
        
        {relatedVideos.length === 0 ? (
          <p className="text-xs text-zinc-400">No related videos found.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {relatedVideos.map((item) => (
              <div key={item._id} className="flex gap-3 group relative">
                {/* Thumbnail */}
                <Link
                  to={`/watch/${item._id}`}
                  className="relative w-36 h-20 aspect-video rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex-shrink-0"
                >
                  <img src={item.thumbnail?.url} alt={item.title} className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 right-1 px-1 py-0.5 text-[8px] font-bold bg-zinc-900/90 text-white rounded">
                    {formatDuration(item.duration)}
                  </span>
                </Link>

                {/* Details */}
                <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
                  <Link
                    to={`/watch/${item._id}`}
                    className="font-bold text-xs leading-tight text-zinc-900 dark:text-zinc-100 hover:text-purple-600 dark:hover:text-purple-400 line-clamp-2"
                  >
                    {item.title}
                  </Link>
                  <Link
                    to={`/channel/${item.owner?.userName || item.owner?.username}`}
                    className="text-[10px] text-zinc-450 hover:text-zinc-600 truncate block mt-0.5"
                  >
                    {item.owner?.fullName}
                  </Link>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                    <span>{item.views} views</span>
                    <span className="h-0.5 w-0.5 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
                    <span>{formatRelativeTime(item.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save to Playlist Modal */}
      <Modal isOpen={playlistModalOpen} onClose={() => setPlaylistModalOpen(false)} title="Save Video to Playlist">
        <div className="flex flex-col gap-4">
          {/* List of existing playlists */}
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
            {playlists.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-2">No playlists found.</p>
            ) : (
              playlists.map((playlist) => (
                <button
                  key={playlist._id}
                  onClick={() => handleAddVideo(playlist._id)}
                  className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold flex items-center justify-between transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                >
                  <span>{playlist.name}</span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                    {playlist.videos?.length || 0} vids
                  </span>
                </button>
              ))
            )}
          </div>

          {/* Create Playlist Form Inline */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 flex flex-col gap-3">
            <h4 className="text-xs font-extrabold text-zinc-800 dark:text-zinc-300">Create new playlist</h4>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="Playlist name..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <textarea
                placeholder="Description (optional)..."
                rows={2}
                value={newPlaylistDesc}
                onChange={(e) => setNewPlaylistDesc(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
              />
              <button
                onClick={handleCreateAndAddPlaylist}
                disabled={!newPlaylistName.trim() || playlistCreating}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-xl text-xs font-bold self-end transition-colors disabled:opacity-50"
              >
                {playlistCreating ? "Creating..." : "Create & Save"}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Watch;
