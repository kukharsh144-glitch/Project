import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Film, ListVideo, MessageSquare, Info } from "lucide-react";
import { getUserChannelProfile } from "../api/auth.js";
import { getAllVideos } from "../api/videos.js";
import { getUserPlaylists } from "../api/playlists.js";
import { getUserTweets } from "../api/tweets.js";
import Avatar from "../components/Avatar.jsx";
import SubscribeButton from "../components/SubscribeButton.jsx";
import VideoGrid from "../components/VideoGrid.jsx";
import VideoCard from "../components/VideoCard.jsx";
import { SkeletonVideoGrid } from "../components/Skeleton.jsx";

export const Channel = () => {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("videos");
  
  // Tab states
  const [videos, setVideos] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [tweets, setTweets] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);

  useEffect(() => {
    const fetchChannelProfile = async () => {
      setLoading(true);
      try {
        const response = await getUserChannelProfile(username);
        // Backend returns channel profile details
        setProfile(response.data || response);
      } catch (err) {
        toast.error(err.message || "Failed to load channel profile");
      } finally {
        setLoading(false);
      }
    };

    fetchChannelProfile();
  }, [username]);

  // Handle fetching tab-specific datasets when tab changes
  useEffect(() => {
    if (!profile?._id) return;

    const fetchTabData = async () => {
      setTabLoading(true);
      try {
        if (activeTab === "videos") {
          const res = await getAllVideos({ userId: profile._id, limit: 30 });
          setVideos(res.data?.docs || res.data || []);
        } else if (activeTab === "playlists") {
          const res = await getUserPlaylists(profile._id, { page: 1, limit: 30 });
          setPlaylists(res.data?.playlists || res.data || []);
        } else if (activeTab === "tweets") {
          const res = await getUserTweets(profile._id, { page: 1, limit: 30 });
          setTweets(res.data?.tweets || (Array.isArray(res.data) ? res.data : []));
        }
      } catch (err) {
        toast.error(err.message || `Failed to load ${activeTab}`);
      } finally {
        setTabLoading(false);
      }
    };

    fetchTabData();
  }, [profile, activeTab]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 animate-pulse flex flex-col gap-6">
        <div className="h-40 w-full bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
        <div className="flex gap-4 items-center">
          <div className="h-16 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-1/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-3 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center p-12">
        <h3 className="text-lg font-bold">Channel profile not found</h3>
      </div>
    );
  }

  const tabs = [
    { id: "videos", label: "Videos", icon: Film },
    { id: "playlists", label: "Playlists", icon: ListVideo },
    { id: "tweets", label: "Tweets", icon: MessageSquare },
    { id: "about", label: "About", icon: Info },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 flex flex-col gap-6">
      {/* Cover Image Banner */}
      <div className="h-40 w-full bg-zinc-200 dark:bg-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        {profile.coverImage ? (
          <img src={profile.coverImage} alt="Channel Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-purple-500/20 to-purple-800/10" />
        )}
      </div>

      {/* Header Profile Details */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <Avatar src={profile.avatar} name={profile.fullName} size="xl" className="border-2 border-white dark:border-zinc-950 shadow-md" />
          <div className="flex flex-col">
            <h2 className="text-xl md:text-2xl font-black text-zinc-950 dark:text-zinc-50 leading-tight">
              {profile.fullName}
            </h2>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">@{profile.userName}</span>
            <div className="flex items-center gap-2 text-xs text-zinc-500 mt-2 font-medium">
              <span>{profile.subscribersCount || 0} Subscribers</span>
              <span>•</span>
              <span>{profile.channelsSubscribedToCount || 0} Subscribed</span>
            </div>
          </div>
        </div>

        <div className="sm:self-center">
          <SubscribeButton
            channelId={profile._id}
            initialIsSubscribed={profile.isSubscribed}
            onToggleSuccess={(isSubbed) => {
              setProfile((prev) => ({
                ...prev,
                subscribersCount: isSubbed ? prev.subscribersCount + 1 : Math.max(0, prev.subscribersCount - 1),
              }));
            }}
          />
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-colors border-b-2 ${
                isActive
                  ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400 font-black"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-350"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="mt-4">
        {tabLoading ? (
          <SkeletonVideoGrid count={4} />
        ) : (
          <>
            {/* Videos Tab */}
            {activeTab === "videos" && (
              videos.length === 0 ? (
                <p className="text-center text-xs text-zinc-400 py-12">No videos published on this channel.</p>
              ) : (
                <VideoGrid>
                  {videos.map((video) => (
                    <VideoCard key={video._id} video={video} />
                  ))}
                </VideoGrid>
              )
            )}

            {/* Playlists Tab */}
            {activeTab === "playlists" && (
              playlists.length === 0 ? (
                <p className="text-center text-xs text-zinc-400 py-12">No playlists created on this channel.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {playlists.map((playlist) => (
                    <div key={playlist._id} className="p-5 border border-zinc-200/50 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 flex flex-col gap-2 shadow-sm">
                      <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">{playlist.name}</h4>
                      <p className="text-xs text-zinc-400 dark:text-zinc-550 line-clamp-2">{playlist.description}</p>
                      <span className="text-[10px] font-bold text-zinc-400 mt-2">{playlist.videos?.length || 0} Videos</span>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Tweets Tab */}
            {activeTab === "tweets" && (
              tweets.length === 0 ? (
                <p className="text-center text-xs text-zinc-400 py-12">No creator tweets posted on this channel.</p>
              ) : (
                <div className="flex flex-col gap-4 max-w-2xl">
                  {tweets.map((tweet) => (
                    <div key={tweet._id} className="p-5 border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm">
                      <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">{tweet.content}</p>
                      <span className="text-[10px] text-zinc-400 block mt-3">{new Date(tweet.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* About Tab */}
            {activeTab === "about" && (
              <div className="max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 p-6 rounded-2xl flex flex-col gap-4 shadow-sm">
                <div>
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Channel Description</h4>
                  <p className="text-xs text-zinc-750 dark:text-zinc-300 leading-relaxed mt-1">
                    {profile.description || "This channel does not have a custom description."}
                  </p>
                </div>
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 flex flex-col gap-2">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Contact Info</h4>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-350">{profile.email}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Channel;
