import React from "react";
import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import Avatar from "./Avatar.jsx";

// Helper to format duration in seconds to MM:SS or HH:MM:SS
export const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const secs = Math.floor(seconds);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  
  const formattedSecs = s < 10 ? `0${s}` : s;
  
  if (h > 0) {
    const formattedMins = m < 10 ? `0${m}` : m;
    return `${h}:${formattedMins}:${formattedSecs}`;
  }
  return `${m}:${formattedSecs}`;
};

// Helper to convert date to relative time
export const formatRelativeTime = (dateString) => {
  if (!dateString) return "";
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
};

export const VideoCard = ({ video }) => {
  const { _id, title, thumbnail, duration, views, createdAt, owner } = video;

  return (
    <div className="group flex flex-col gap-3 relative">
      {/* Thumbnail block */}
      <Link to={`/watch/${_id}`} className="relative aspect-video w-full rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800">
        <img
          src={thumbnail?.url || "/fallback-thumbnail.jpg"}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <div className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white scale-90 group-hover:scale-100 transition-transform">
            <Play className="h-6 w-6 fill-current" />
          </div>
        </div>
        
        {/* Duration badge */}
        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 text-[10px] font-bold bg-zinc-900/90 text-white rounded">
          {formatDuration(duration)}
        </span>
      </Link>

      {/* Info details */}
      <div className="flex gap-3">
        <Link to={`/channel/${owner?.userName || owner?.username}`} className="flex-shrink-0">
          <Avatar src={owner?.avatar} name={owner?.fullName} size="sm" />
        </Link>
        <div className="flex flex-col gap-1 pr-1 overflow-hidden">
          <Link
            to={`/watch/${_id}`}
            className="font-bold text-sm leading-tight text-zinc-900 dark:text-zinc-100 line-clamp-2 hover:text-purple-600 dark:hover:text-purple-400"
          >
            {title}
          </Link>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            <Link to={`/channel/${owner?.userName || owner?.username}`} className="hover:text-zinc-700 dark:hover:text-zinc-200 truncate block">
              {owner?.fullName}
            </Link>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span>{views} views</span>
              <span className="h-1 w-1 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
              <span>{formatRelativeTime(createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
