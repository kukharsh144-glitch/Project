import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { History } from "lucide-react";
import { getWatchHistory } from "../api/auth.js";
import VideoGrid from "../components/VideoGrid.jsx";
import VideoCard from "../components/VideoCard.jsx";
import { SkeletonVideoGrid } from "../components/Skeleton.jsx";

export const WatchHistory = () => {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await getWatchHistory();
        // The backend returns: { statusCode: 200, data: [video_objects], message: "..." }
        const docs = response.data || response || [];
        setHistoryList([...docs].reverse());
      } catch (err) {
        toast.error(err.message || "Failed to load watch history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-extrabold mb-6">Watch History</h2>
        <SkeletonVideoGrid count={4} />
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
        <History className="h-6 w-6 text-purple-500" />
        <span>Watch History ({historyList.length})</span>
      </h2>

      {historyList.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/50 dark:border-zinc-800">
          <p className="font-bold text-zinc-700 dark:text-zinc-350">Your watch history is empty</p>
          <p className="text-xs text-zinc-500 mt-1">Videos you watch will appear here.</p>
        </div>
      ) : (
        <VideoGrid>
          {historyList.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </VideoGrid>
      )}
    </div>
  );
};

export default WatchHistory;
