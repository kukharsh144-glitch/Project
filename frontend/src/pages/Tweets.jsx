import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { MessageSquare, Send, Trash2, Edit2, Check, X } from "lucide-react";
import { getAllTweets, createTweet, updateTweet, deleteTweet } from "../api/tweets.js";
import Avatar from "../components/Avatar.jsx";
import { formatRelativeTime } from "../components/VideoCard.jsx";
import LikeButton from "../components/LikeButton.jsx";
import { Skeleton } from "../components/Skeleton.jsx";

export const Tweets = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");

  const { register, handleSubmit, reset } = useForm();

  const fetchTweets = async () => {
    if (!user?._id) return;
    try {
      const response = await getAllTweets({ page: 1, limit: 100 });
      // Backend returns doc list in response.data.docs or response.data
      const docs = response.data?.tweets || (Array.isArray(response.data) ? response.data : []);
      setTweets(docs);
    } catch (err) {
      toast.error(err.message || "Failed to load tweets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTweets();
  }, [user]);

  const onSubmit = async (data) => {
    if (!data.content?.trim()) return;
    
    setSubmitting(true);
    try {
      await createTweet(data.content.trim());
      toast.success("Tweet posted!");
      reset();
      fetchTweets();
    } catch (err) {
      toast.error(err.message || "Failed to post tweet");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (tweet) => {
    setEditingId(tweet._id);
    setEditContent(tweet.content);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const handleSaveEdit = async (tweetId) => {
    if (!editContent.trim()) return;
    try {
      await updateTweet(tweetId, editContent.trim());
      setEditingId(null);
      toast.success("Tweet updated");
      fetchTweets();
    } catch (err) {
      toast.error(err.message || "Failed to update tweet");
    }
  };

  const handleDelete = async (tweetId) => {
    const confirm = window.confirm("Are you sure you want to delete this tweet?");
    if (!confirm) return;

    try {
      await deleteTweet(tweetId);
      toast.success("Tweet deleted");
      fetchTweets();
    } catch (err) {
      toast.error(err.message || "Failed to delete tweet");
    }
  };

  if (loading && isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-8 flex flex-col gap-6">
        <Skeleton className="h-28 rounded-2xl w-full" />
        <Skeleton className="h-40 rounded-2xl w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 flex flex-col gap-8">
      {/* Create Tweet Form */}
      {isAuthenticated ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 p-5 rounded-2xl flex gap-3.5 shadow-sm"
        >
          <Avatar src={user?.avatar} name={user?.fullName} size="sm" />
          <div className="flex-1 flex flex-col gap-3">
            <textarea
              placeholder="What's on your mind as a creator?"
              rows={3}
              {...register("content", { required: true })}
              className="w-full bg-zinc-50/50 dark:bg-zinc-950/20 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-transform active:scale-95 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{submitting ? "Posting..." : "Post Tweet"}</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl text-center text-zinc-500 text-sm">
          Please login to view or publish tweets.
        </div>
      )}

      {/* Tweets Feed */}
      <div className="flex flex-col gap-5">
        <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
          <MessageSquare className="h-4 w-4 text-purple-500" />
          <span>Public Feed ({tweets.length})</span>
        </h3>

        {tweets.length === 0 ? (
          <div className="py-12 text-center text-zinc-400 dark:text-zinc-500 text-xs">
            No tweets published yet. Write something above!
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {tweets.map((tweet) => {
              const isEditing = editingId === tweet._id;
              const isOwner = tweet.owner?._id === user?._id || tweet.owner === user?._id;
              return (
                <div
                  key={tweet._id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 p-5 rounded-2xl flex gap-3.5 hover:shadow-sm transition-shadow relative group"
                >
                  <Avatar src={tweet.owner?.avatar} name={tweet.owner?.fullName} size="sm" />
                  
                  <div className="flex-1 flex flex-col gap-1 pr-8">
                    {/* Header */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-150">{tweet.owner?.fullName}</span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">@{tweet.owner?.userName}</span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold">•</span>
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-500">{formatRelativeTime(tweet.createdAt)}</span>
                    </div>

                    {/* Content or Edit Form */}
                    {isEditing ? (
                      <div className="flex items-center gap-2 mt-2 w-full">
                        <input
                          type="text"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="flex-1 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                        <button
                          onClick={() => handleSaveEdit(tweet._id)}
                          className="p-1.5 bg-green-50 text-green-600 rounded-full hover:bg-green-100"
                          title="Save"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1.5 bg-red-50 text-red-600 rounded-full hover:bg-red-100"
                          title="Cancel"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 mt-1">
                        {tweet.content}
                      </p>
                    )}

                    {/* Like button footer */}
                    <div className="mt-3 flex items-center gap-4">
                      <LikeButton type="tweet" targetId={tweet._id} initialLiked={tweet.isLiked} initialCount={tweet.likesCount || 0} />
                    </div>
                  </div>

                  {/* Actions for creator */}
                  {!isEditing && isOwner && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 absolute right-4 top-4 transition-opacity">
                      <button
                        onClick={() => handleStartEdit(tweet)}
                        className="p-1.5 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-650"
                        title="Edit tweet"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(tweet._id)}
                        className="p-1.5 rounded-full text-zinc-400 hover:bg-red-550 hover:text-red-650 dark:hover:bg-zinc-800"
                        title="Delete tweet"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tweets;
