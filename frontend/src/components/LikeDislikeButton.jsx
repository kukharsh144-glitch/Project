import React, { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";
import { toggleVideoLike, toggleVideoDislike } from "../api/likes.js";

export const LikeDislikeButton = ({ targetId, initialLiked = false, initialCount = 0, initialDisliked = false, initialDislikesCount = 0 }) => {
  const [liked, setLiked] = useState(initialLiked);
  const [disliked, setDisliked] = useState(initialDisliked);
  const [likesCount, setLikesCount] = useState(initialCount);
  const [dislikesCount, setDislikesCount] = useState(initialDislikesCount);
  const [loading, setLoading] = useState(false);

  const handleLike = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await toggleVideoLike(targetId);
      
      const nextLiked = !liked;
      setLiked(nextLiked);
      setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
      
      if (disliked) {
        setDisliked(false);
        setDislikesCount((prev) => Math.max(0, prev - 1));
      }
      
      toast.success(nextLiked ? "Added to liked items" : "Removed from liked items");
    } catch (err) {
      toast.error(err.message || "Failed to update like");
    } finally {
      setLoading(false);
    }
  };

  const handleDislike = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await toggleVideoDislike(targetId);
      
      const nextDisliked = !disliked;
      setDisliked(nextDisliked);
      setDislikesCount((prev) => (nextDisliked ? prev + 1 : Math.max(0, prev - 1)));
      
      if (liked) {
        setLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
      }
      
      toast.success(nextDisliked ? "Added to disliked items" : "Removed from disliked items");
    } catch (err) {
      toast.error(err.message || "Failed to update dislike");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex items-center bg-zinc-50/70 dark:bg-zinc-900/85 backdrop-blur-sm rounded-full overflow-hidden shadow-sm border border-zinc-200/60 dark:border-zinc-800/80">
      {/* Like Button */}
      <button
        onClick={handleLike}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 transition-all active:scale-95 border-r border-zinc-200/50 dark:border-zinc-800/60 ${
          liked ? "text-purple-600 dark:text-purple-400 font-extrabold" : "text-zinc-600 dark:text-zinc-300"
        }`}
      >
        <ThumbsUp className={`h-4 w-4 transition-transform hover:scale-110 ${liked ? "fill-current" : ""}`} />
        <span>{likesCount}</span>
      </button>

      {/* Dislike Button */}
      <button
        onClick={handleDislike}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 transition-all active:scale-95 ${
          disliked ? "text-red-500 dark:text-red-400 font-extrabold" : "text-zinc-600 dark:text-zinc-300"
        }`}
      >
        <ThumbsDown className={`h-4 w-4 transition-transform hover:scale-110 ${disliked ? "fill-current" : ""}`} />
        <span>{dislikesCount}</span>
      </button>
    </div>
  );
};

export default LikeDislikeButton;
