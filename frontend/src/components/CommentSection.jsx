import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { MessageSquare, Edit2, Trash2, Check, X } from "lucide-react";
import { getVideoComments, addComment, updateComment, deleteComment } from "../api/comments.js";
import Avatar from "./Avatar.jsx";
import { formatRelativeTime } from "./VideoCard.jsx";

export const CommentSection = ({ videoId }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [comments, setComments] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editInput, setEditInput] = useState("");

  const fetchComments = async () => {
    try {
      const response = await getVideoComments(videoId, { page: 1, limit: 100 });
      // The backend response is paginated: docs contains the list
      const docs = response.data?.docs || response.data || [];
      setComments(docs);
    } catch (err) {
      toast.error(err.message || "Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [videoId]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setSubmitting(true);
    try {
      await addComment(videoId, input);
      setInput("");
      toast.success("Comment added");
      await fetchComments();
    } catch (err) {
      toast.error(err.message || "Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (comment) => {
    setEditingId(comment._id);
    setEditInput(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditInput("");
  };

  const handleUpdateComment = async (commentId) => {
    if (!editInput.trim()) return;
    try {
      await updateComment(commentId, editInput);
      setEditingId(null);
      toast.success("Comment updated");
      await fetchComments();
    } catch (err) {
      toast.error(err.message || "Failed to update comment");
    }
  };

  const handleDeleteComment = async (commentId) => {
    const confirm = window.confirm("Are you sure you want to delete this comment?");
    if (!confirm) return;

    try {
      await deleteComment(commentId);
      toast.success("Comment deleted");
      await fetchComments();
    } catch (err) {
      toast.error(err.message || "Failed to delete comment");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h3 className="font-extrabold text-base flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-zinc-400" />
        <span>Comments ({comments.length})</span>
      </h3>

      {/* Write comment */}
      {isAuthenticated ? (
        <form onSubmit={handlePostComment} className="flex gap-3">
          <Avatar src={user?.avatar} name={user?.fullName} size="sm" />
          <div className="flex-1 flex flex-col gap-2">
            <input
              type="text"
              placeholder="Add a public comment..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 py-1.5 text-sm focus:outline-none focus:border-purple-500"
            />
            {input.trim() && (
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInput("")}
                  className="px-3.5 py-1 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3.5 py-1 text-xs font-semibold bg-purple-600 hover:bg-purple-750 text-white rounded-full disabled:opacity-50"
                >
                  {submitting ? "Commenting..." : "Comment"}
                </button>
              </div>
            )}
          </div>
        </form>
      ) : (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl text-center text-xs text-zinc-500">
          Please login to leave comments on this video.
        </div>
      )}

      {/* Comment List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="flex gap-3 animate-pulse">
              <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="py-6 text-center text-zinc-400 dark:text-zinc-550 text-xs">
          No comments yet. Start the conversation!
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {comments.map((comment) => {
            const commentOwner = comment.owner;
            const isMyComment = user?._id === commentOwner?._id;
            const isEditing = editingId === comment._id;

            return (
              <div key={comment._id} className="flex gap-3 items-start group">
                <Avatar src={commentOwner?.avatar} name={commentOwner?.fullName} size="sm" />
                
                <div className="flex-1 flex flex-col gap-0.5">
                  {/* Metadata Header */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{commentOwner?.fullName}</span>
                    <span className="text-[10px] text-zinc-450">{formatRelativeTime(comment.createdAt)}</span>
                  </div>

                  {/* Comment Content or Edit Box */}
                  {isEditing ? (
                    <div className="flex items-center gap-2 mt-1 w-full">
                      <input
                        type="text"
                        value={editInput}
                        onChange={(e) => setEditInput(e.target.value)}
                        className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                      <button
                        onClick={() => handleUpdateComment(comment._id)}
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
                    <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 mt-1 pr-8">
                      {comment.content}
                    </p>
                  )}
                </div>

                {/* Edit/Delete Tools for Owners */}
                {isMyComment && !isEditing && (
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                    <button
                      onClick={() => handleStartEdit(comment)}
                      className="p-1 rounded-full text-zinc-400 hover:bg-zinc-150 hover:text-zinc-600 dark:hover:bg-zinc-800"
                      title="Edit comment"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteComment(comment._id)}
                      className="p-1 rounded-full text-zinc-400 hover:bg-red-50 hover:text-red-650 dark:hover:bg-zinc-800"
                      title="Delete comment"
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
  );
};

export default CommentSection;
