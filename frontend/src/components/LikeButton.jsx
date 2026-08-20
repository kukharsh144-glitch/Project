import React, { useState } from "react";
import { ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { toggleVideoLike, toggleCommentLike, toggleTweetLike } from "../api/likes.js";

export const LikeButton = ({ type = "video", targetId, initialLiked = false, initialCount = 0 }) => {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    setLoading(true);
    try {
      let response;
      if (type === "video") {
        response = await toggleVideoLike(targetId);
      } else if (type === "comment") {
        response = await toggleCommentLike(targetId);
      } else if (type === "tweet") {
        response = await toggleTweetLike(targetId);
      }

      // Check if action unliked or liked (response.data contains the new state if provided)
      const nextLiked = !liked;
      setLiked(nextLiked);
      setCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
      toast.success(nextLiked ? "Added to liked items" : "Removed from liked items");
    } catch (err) {
      toast.error(err.message || "Failed to update like status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      type="button"
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
        liked
          ? "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400"
          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
      } disabled:opacity-50`}
    >
      <ThumbsUp className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
      <span>{count}</span>
    </button>
  );
};

export default LikeButton;
