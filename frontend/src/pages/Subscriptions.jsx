import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Compass, Folder, Trash2 } from "lucide-react";
import { getSubscribedChannels } from "../api/subscriptions.js";
import { getAllVideos } from "../api/videos.js";
import { getUserPlaylists, getPlaylistById } from "../api/playlists.js";
import VideoGrid from "../components/VideoGrid.jsx";
import VideoCard from "../components/VideoCard.jsx";
import { SkeletonVideoGrid } from "../components/Skeleton.jsx";
import Avatar from "../components/Avatar.jsx";
import Modal from "../components/Modal.jsx";
import { formatDuration } from "../components/VideoCard.jsx";

export const Subscriptions = () => {
  const { user } = useSelector((state) => state.auth);
  const [videos, setVideos] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [creatorPlaylists, setCreatorPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistVideos, setPlaylistVideos] = useState([]);
  const [playlistLoading, setPlaylistLoading] = useState(false);

  useEffect(() => {
    const fetchSubscriptionFeed = async () => {
      if (!user?._id) return;
      try {
        // 1. Get all subscribed channels
        const subRes = await getSubscribedChannels(user._id);
        const subList = subRes.data || [];
        setChannels(subList);

        // 2. Fetch videos in parallel from all sub channel owners
        if (subList.length > 0) {
          const promises = subList.map((sub) =>
            getAllVideos({ userId: sub.channel?._id, limit: 10 })
          );
          const results = await Promise.all(promises);
          
          // Flatten doc lists and sort by createdAt desc
          const allVids = results
            .flatMap((res) => res.data?.docs || res.data || [])
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          
          setVideos(allVids);
        }
      } catch (err) {
        toast.error(err.message || "Failed to load subscriptions");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionFeed();
  }, [user]);

  // Fetch creator's playlists when a specific channel is selected
  useEffect(() => {
    const fetchCreatorPlaylists = async () => {
      if (!selectedChannelId) {
        setCreatorPlaylists([]);
        return;
      }
      try {
        const res = await getUserPlaylists(selectedChannelId);
        const list = res.data?.playlists || res.data || [];
        setCreatorPlaylists(list);
      } catch (err) {
        console.error("Failed to load creator playlists", err);
      }
    };
    fetchCreatorPlaylists();
  }, [selectedChannelId]);

  const handlePlaylistClick = async (playlist) => {
    setSelectedPlaylist(playlist);
    setPlaylistLoading(true);
    try {
      const response = await getPlaylistById(playlist._id);
      const fullPlaylist = response.data || response;
      setPlaylistVideos(fullPlaylist.videos || []);
    } catch (err) {
      toast.error(err.message || "Failed to load playlist videos");
    } finally {
      setPlaylistLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-extrabold mb-6">Subscriptions</h2>
        <SkeletonVideoGrid count={4} />
      </div>
    );
  }

  // Filter videos dynamically based on selection state
  const displayedVideos = selectedChannelId
    ? videos.filter((vid) => {
        const ownerId = vid.owner?._id || vid.owner;
        return ownerId === selectedChannelId;
      })
    : videos;

  const activeChannelName = selectedChannelId
    ? channels.find((sub) => sub.channel?._id === selectedChannelId)?.channel?.fullName
    : null;

  return (
    <div className="p-6 flex flex-col gap-8">
      {/* Subscribed channels mini header bar */}
      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <Compass className="h-6 w-6 text-purple-500" />
          <span>Subscribed Channels ({channels.length})</span>
        </h2>
        {channels.length > 0 && (
          <div className="flex gap-4 overflow-x-auto py-2 pr-4 border-b border-zinc-100 dark:border-zinc-800 items-center">
            {/* View All Button */}
            <button
              onClick={() => setSelectedChannelId(null)}
              type="button"
              className={`flex flex-col items-center gap-1.5 flex-shrink-0 p-1.5 rounded-2xl transition-all cursor-pointer ${
                selectedChannelId === null
                  ? "ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-950/20"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
              }`}
            >
              <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black text-[10px] border border-zinc-200 dark:border-zinc-800">
                ALL
              </div>
              <span className="text-[10px] font-semibold text-zinc-650 dark:text-zinc-400">
                View All
              </span>
            </button>

            {channels.map((sub) => {
              const channel = sub.channel || {};
              const isSelected = selectedChannelId === channel._id;
              return (
                <button
                  key={sub._id}
                  onClick={() => setSelectedChannelId((prev) => (prev === channel._id ? null : channel._id))}
                  type="button"
                  className={`flex flex-col items-center gap-1.5 flex-shrink-0 p-1.5 rounded-2xl transition-all cursor-pointer ${
                    isSelected
                      ? "ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-950/20"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  }`}
                >
                  <Avatar src={channel.avatar} name={channel.fullName} size="md" />
                  <span className="text-[10px] max-w-[68px] truncate font-semibold text-zinc-600 dark:text-zinc-400">
                    {channel.fullName}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Creator Playlists Section (Only visible when creator is selected & has playlists) */}
      {selectedChannelId && creatorPlaylists.length > 0 && (
        <div className="flex flex-col gap-4">
          <h3 className="font-extrabold text-sm text-zinc-650 dark:text-zinc-400">
            Playlists by {activeChannelName}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {creatorPlaylists.map((playlist) => (
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
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subscription Feed Grid */}
      <div className="flex flex-col gap-4">
        <h3 className="font-extrabold text-sm text-zinc-650 dark:text-zinc-400">
          {activeChannelName ? `Latest Uploads from ${activeChannelName}` : "Latest Uploads"}
        </h3>
        {displayedVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[30vh] text-center p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/50 dark:border-zinc-800">
            <p className="font-bold text-zinc-700 dark:text-zinc-350">No uploads found</p>
            <p className="text-xs text-zinc-500 mt-1">Videos published by this creator will show up here.</p>
          </div>
        ) : (
          <VideoGrid>
            {displayedVideos.map((video) => (
              <VideoCard key={video._id} video={video} />
            ))}
          </VideoGrid>
        )}
      </div>

      {/* View Playlist Videos Modal */}
      <Modal
        isOpen={!!selectedPlaylist}
        onClose={() => setSelectedPlaylist(null)}
        title={selectedPlaylist?.name || "Playlist Detail"}
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs text-zinc-500 leading-relaxed">{selectedPlaylist?.description || "No description provided."}</p>
          
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 flex flex-col gap-3">
            {playlistLoading ? (
              <div className="flex justify-center py-6">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
              </div>
            ) : playlistVideos.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-6">No videos in this playlist yet.</p>
            ) : (
              playlistVideos.map((video) => (
                 <div key={video._id} className="flex gap-3 items-center group/item relative border-b border-zinc-100 dark:border-zinc-800/60 pb-3 last:border-b-0 last:pb-0">
                  <Link
                    to={`/watch/${video._id}`}
                    onClick={() => setSelectedPlaylist(null)}
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
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Subscriptions;
