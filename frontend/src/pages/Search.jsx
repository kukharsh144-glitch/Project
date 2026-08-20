import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { Search as SearchIcon, ArrowUpDown } from "lucide-react";
import { getAllVideos } from "../api/videos.js";
import Avatar from "../components/Avatar.jsx";
import { formatDuration, formatRelativeTime } from "../components/VideoCard.jsx";
import { Skeleton } from "../components/Skeleton.jsx";

export const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortType, setSortType] = useState("desc");

  useEffect(() => {
    const fetchSearchResults = async () => {
      setLoading(true);
      try {
        const response = await getAllVideos({
          query,
          sortBy,
          sortType,
          page: 1,
          limit: 30,
        });
        const docs = response.data?.docs || response.data || [];
        setVideos(docs);
      } catch (err) {
        toast.error(err.message || "Failed to search videos");
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query, sortBy, sortType]);

  const toggleSort = () => {
    if (sortBy === "createdAt") {
      setSortBy("views");
    } else {
      setSortBy("createdAt");
    }
  };

  const toggleSortDirection = () => {
    setSortType((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 md:p-8 flex flex-col gap-6">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="flex flex-col sm:flex-row gap-4">
            <Skeleton className="w-full sm:w-80 aspect-video rounded-xl" />
            <div className="flex-1 flex flex-col gap-2.5">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-8 w-1/2 mt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 flex flex-col gap-6">
      {/* Header controls */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <h3 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <SearchIcon className="h-5 w-5 text-zinc-400" />
          <span>Results for "{query}"</span>
        </h3>
        
        {/* Sort triggers */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleSort}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span>Sort: {sortBy === "createdAt" ? "Latest" : "Most Viewed"}</span>
          </button>
          <button
            onClick={toggleSortDirection}
            type="button"
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
          >
            {sortType === "desc" ? "Descending" : "Ascending"}
          </button>
        </div>
      </div>

      {/* Video search rows list */}
      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/50 dark:border-zinc-800">
          <p className="font-bold text-zinc-700 dark:text-zinc-300">No results found</p>
          <p className="text-sm text-zinc-450 dark:text-zinc-400 mt-1">Try check spelling or use another keyword.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {videos.map((video) => (
            <div key={video._id} className="group flex flex-col sm:flex-row gap-4 relative">
              {/* Thumbnail */}
              <Link
                to={`/watch/${video._id}`}
                className="relative w-full sm:w-80 aspect-video rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex-shrink-0"
              >
                <img
                  src={video.thumbnail?.url}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-200"
                />
                <span className="absolute bottom-2 right-2 px-1.5 py-0.5 text-[10px] font-bold bg-zinc-900/90 text-white rounded">
                  {formatDuration(video.duration)}
                </span>
              </Link>

              {/* Meta */}
              <div className="flex-1 flex flex-col gap-1 pr-1 overflow-hidden">
                <Link
                  to={`/watch/${video._id}`}
                  className="font-extrabold text-base leading-snug text-zinc-900 dark:text-zinc-100 hover:text-purple-600 dark:hover:text-purple-400 line-clamp-2"
                >
                  {video.title}
                </Link>
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1">
                  <span>{video.views} views</span>
                  <span className="h-1 w-1 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
                  <span>{formatRelativeTime(video.createdAt)}</span>
                </div>
                
                {/* Creator Avatar & Name */}
                <div className="flex items-center gap-2 mt-3 mb-2">
                  <Avatar src={video.owner?.avatar} name={video.owner?.fullName} size="xs" />
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{video.owner?.fullName}</span>
                </div>

                <p className="text-xs text-zinc-400 dark:text-zinc-500 line-clamp-2 leading-relaxed">
                  {video.description || "No description provided."}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Search;
