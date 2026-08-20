import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { getAllVideos } from "../api/videos.js";
import VideoGrid from "../components/VideoGrid.jsx";
import VideoCard from "../components/VideoCard.jsx";
import { SkeletonVideoGrid } from "../components/Skeleton.jsx";

export const Home = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await getAllVideos({ page: 1, limit: 20 });
        // Response format: { statusCode: 200, data: { docs, totalDocs, limit, page, totalPages, ... } }
        const docs = response.data?.docs || response.data || [];
        setVideos(docs);
      } catch (err) {
        toast.error(err.message || "Failed to load video feed");
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-extrabold mb-6">Recommended</h2>
        <SkeletonVideoGrid count={8} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-extrabold mb-6 text-zinc-900 dark:text-zinc-50">Recommended</h2>

      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/50 dark:border-zinc-800">
          <p className="font-bold text-zinc-700 dark:text-zinc-300">No videos available</p>
          <p className="text-sm text-zinc-450 dark:text-zinc-400 mt-1">Be the first to publish a new video!</p>
        </div>
      ) : (
        <VideoGrid>
          {videos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </VideoGrid>
      )}
    </div>
  );
};

export default Home;
