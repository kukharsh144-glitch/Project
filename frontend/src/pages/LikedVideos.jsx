import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { ThumbsUp } from "lucide-react";
import { getLikedVideos } from "../api/likes.js";
import VideoGrid from "../components/VideoGrid.jsx";
import VideoCard from "../components/VideoCard.jsx";
import { SkeletonVideoGrid } from "../components/Skeleton.jsx";

export const LikedVideos = () => {
  const [likedList, setLikedList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLiked = async () => {
      try {
        const response = await getLikedVideos({ page: 1, limit: 30 });
        // The backend returns populated likes. Response format: { docs: [ { video: { ... } } ] }
        const docs = response.data?.likedVideos || response.data || [];
        // Map elements to strip out outer 'Like' wrappers
        const videos = docs
          .map((item) => item.video)
          .filter(Boolean); // filter null/broken entries
        setLikedList(videos);
      } catch (err) {
        toast.error(err.message || "Failed to load liked videos");
      } finally {
        setLoading(false);
      }
    };

    fetchLiked();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-extrabold mb-6">Liked Videos</h2>
        <SkeletonVideoGrid count={4} />
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
        <ThumbsUp className="h-6 w-6 text-purple-500 fill-current" />
        <span>Liked Videos ({likedList.length})</span>
      </h2>

      {likedList.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/50 dark:border-zinc-800">
          <p className="font-bold text-zinc-700 dark:text-zinc-350">No liked videos yet</p>
          <p className="text-xs text-zinc-500 mt-1">Videos you like will appear here.</p>
        </div>
      ) : (
        <VideoGrid>
          {likedList.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </VideoGrid>
      )}
    </div>
  );
};

export default LikedVideos;
